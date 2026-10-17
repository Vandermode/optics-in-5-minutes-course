import {t} from '../../shared/language.js';
import {psf, pairIntensity, rayleighNm, cutoff, mtf, criterion} from './physics.js';

const $ = id => document.getElementById(id);
const defaults = {na:0.65, wavelength:550, separation:520, zoom:1, frequency:0.5};
const state = {...defaults};
const ranges = {na:[0.2,0.95],wavelength:[400,700],separation:[100,2400],zoom:[1,2.5],frequency:[0,1.3]};
const url = new URL(location.href);
for (const key of Object.keys(defaults)) {
  const raw = url.searchParams.get(key);
  const value = raw === null ? NaN : Number(raw);
  if (Number.isFinite(value)) state[key] = Math.max(ranges[key][0], Math.min(ranges[key][1], value));
  $(key).value = state[key];
  // Browser range controls may quantize externally supplied values to their step.
  state[key] = Number($(key).value);
}
if (url.searchParams.get('rings') === '0') $('rings').checked = false;

function surface(id, height) {
  const canvas = $(id), width = Math.max(1, canvas.clientWidth), dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.height = height + 'px';
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr); ctx.font = '14px Lato, Arial, sans-serif';
  return {canvas,ctx,w:width,h:height};
}
const palette = [[5,19,26],[15,61,74],[40,114,120],[110,177,163],[223,229,188],[255,249,222]];
function color(value) {
  const t = Math.max(0, Math.min(1, value)) * (palette.length - 1);
  const k = Math.min(palette.length - 2, Math.floor(t)), f = t-k;
  return palette[k].map((v,i) => Math.round(v*(1-f) + palette[k+1][i]*f));
}
const colors = Array.from({length:1025}, (_,i) => color(i/1024));
const offscreen = document.createElement('canvas');
function drawImage() {
  const width = $('image-canvas').clientWidth;
  const s = surface('image-canvas', Math.max(175, width / 2));
  const n = 480, m = Math.round(n*s.h/s.w), field = 5/state.zoom;
  offscreen.width=n; offscreen.height=m;
  const c = offscreen.getContext('2d'), data = c.createImageData(n,m), reveal = $('rings').checked;
  for (let y=0;y<m;y++) for (let x=0;x<n;x++) {
    const value = pairIntensity(((x+0.5)/n-0.5)*field, (y+0.5-m/2)/n*field, state)/2;
    const rgb = colors[Math.min(1024, Math.round((reveal ? Math.sqrt(value) : value)*1024))];
    const i=4*(y*n+x); data.data[i]=rgb[0];data.data[i+1]=rgb[1];data.data[i+2]=rgb[2];data.data[i+3]=255;
  }
  c.putImageData(data,0,0); s.ctx.drawImage(offscreen,0,0,s.w,s.h);
  s.ctx.strokeStyle='rgba(248,245,226,.65)'; s.ctx.fillStyle='#e8eddf';
  const length = state.zoom > 1.5 ? .5 : 1;
  s.ctx.beginPath();s.ctx.moveTo(18,s.h-22);s.ctx.lineTo(18+length/field*s.w,s.h-22);s.ctx.lineWidth=2;s.ctx.stroke();
  s.ctx.fillText(length+' μm',18,s.h-30);
  s.ctx.fillStyle='rgba(235,240,230,.75)';s.ctx.textAlign='right';s.ctx.fillText(t(reveal?'√ intensity display':'Linear intensity display'),s.w-15,20);
  const clipped = state.separation/1000 > field;
  $('field-caption').textContent = t('{field} μm field of view',{field:field.toFixed(2)})+(clipped?t(' · source centers outside crop'):'');
  $('image-canvas').setAttribute('aria-label',t('Computed intensity of two sources {separation} nm apart at NA {na} and wavelength {wavelength} nm.',{separation:state.separation,na:state.na.toFixed(2),wavelength:state.wavelength})+' '+t(criterion(state.separation/rayleighNm(state.na,state.wavelength)))+'.');
}
function axes(s, xmin, xmax, ymax, xlabel, ylabel) {
  const box={left:64,right:s.w-20,top:24,bottom:s.h-60};
  const X=v=>box.left+(v-xmin)/(xmax-xmin)*(box.right-box.left);
  const Y=v=>box.bottom-v/ymax*(box.bottom-box.top);
  s.ctx.fillStyle='#fdfcf7';s.ctx.fillRect(0,0,s.w,s.h);s.ctx.lineWidth=1;
  for(let i=0;i<=4;i++){
    const y=ymax*i/4;s.ctx.strokeStyle='#e1e5dc';s.ctx.beginPath();s.ctx.moveTo(box.left,Y(y));s.ctx.lineTo(box.right,Y(y));s.ctx.stroke();
    s.ctx.fillStyle='#536765';s.ctx.textAlign='right';s.ctx.fillText(y.toFixed(ymax===1?2:1),box.left-8,Y(y)+3);
  }
  const tickCount=box.right-box.left<280?3:5;
  s.ctx.textAlign='center';
  for(let i=0;i<tickCount;i++){
    const x=xmin+(xmax-xmin)*i/(tickCount-1);s.ctx.fillText(x.toFixed(1),X(x),box.bottom+22);
  }
  s.ctx.fillStyle='#536765';s.ctx.fillText(t(xlabel),s.w/2,s.h-12);
  s.ctx.save();s.ctx.translate(16,(box.top+box.bottom)/2);s.ctx.rotate(-Math.PI/2);s.ctx.fillText(t(ylabel),0,0);s.ctx.restore();
  return {X,Y,...box};
}
function line(ctx, a, xs, fn, color, width=2, dash=[]) {
  ctx.save();ctx.beginPath();ctx.rect(a.left,a.top,a.right-a.left,a.bottom-a.top);ctx.clip();
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();
  xs.forEach((x,i)=>{const y=fn(x);if(i===0)ctx.moveTo(a.X(x),a.Y(y));else ctx.lineTo(a.X(x),a.Y(y));});
  ctx.stroke();ctx.restore();
}
function drawProfile() {
  const s=surface('profile-canvas',260), span=2.5/state.zoom;
  const a=axes(s,-span,span,2,'Object-space position x (μm)','Relative intensity');
  const xs=Array.from({length:700},(_,i)=>-span+2*span*i/699);
  line(s.ctx,a,xs,x=>psf(x+state.separation/2000,state.na,state.wavelength/1000),'#237c8c',1.7,[5,3]);
  line(s.ctx,a,xs,x=>psf(x-state.separation/2000,state.na,state.wavelength/1000),'#b36e42',1.7,[3,3]);
  line(s.ctx,a,xs,x=>pairIntensity(x,0,state),'#172f32',2.6);
  for(const x of [-state.separation/2000,state.separation/2000]) if(Math.abs(x)<=span){
    s.ctx.strokeStyle='#849087';s.ctx.setLineDash([2,4]);s.ctx.beginPath();s.ctx.moveTo(a.X(x),a.top);s.ctx.lineTo(a.X(x),a.bottom);s.ctx.stroke();s.ctx.setLineDash([]);
  }
}
function drawMtf() {
  const s=surface('mtf-canvas',280), a=axes(s,0,1.3,1,'Spatial frequency / cutoff','Contrast transmitted');
  const xs=Array.from({length:450},(_,i)=>1.3*i/449);
  line(s.ctx,a,xs,mtf,'#135b60',2.8);
  s.ctx.setLineDash([4,4]);s.ctx.strokeStyle='#b36e42';s.ctx.beginPath();s.ctx.moveTo(a.X(1),a.top);s.ctx.lineTo(a.X(1),a.bottom);s.ctx.stroke();s.ctx.setLineDash([]);
  s.ctx.fillStyle='#92572f';s.ctx.textAlign='center';s.ctx.fillText(t('cutoff'),a.X(1),16);
  s.ctx.fillStyle='#172f32';s.ctx.beginPath();s.ctx.arc(a.X(state.frequency),a.Y(mtf(state.frequency)),4,0,2*Math.PI);s.ctx.fill();
  const f=state.frequency*cutoff(state.na,state.wavelength), H=mtf(state.frequency);
  for(const [id,modulation] of [['object-stripes',.8],['image-stripes',.8*H]]){
    const p=surface(id,68);
    for(let x=0;x<Math.ceil(p.w);x++){
      const value=(1+modulation*Math.cos(2*Math.PI*f*((x+.5)/p.w*4-2)))/2;
      const v=Math.round(value*255);p.ctx.fillStyle='rgb('+v+','+v+','+v+')';p.ctx.fillRect(x,0,1,p.h);
    }
  }
  $('frequency-value').textContent=state.frequency.toFixed(2);
  $('cutoff-value').textContent=cutoff(state.na,state.wavelength).toFixed(2)+' '+t('cycles/μm');
  $('selected-frequency').textContent=f.toFixed(2)+' '+t('cycles/μm');
  $('contrast-value').textContent=(H*100).toFixed(1)+'%';
  $('stripe-caption').textContent=t('Image · {contrast}% output contrast',{contrast:(H*80).toFixed(1)});
  $('frequency-description').textContent=state.frequency>=1?t('At and beyond the cutoff, this pattern has no image modulation.'):state.frequency===0?t('A uniform object passes unchanged: H(0) = 1.'):t('Only {contrast}% of this pattern’s contrast survives.',{contrast:(H*100).toFixed(1)});
}
function render() {
  try {
    $('na-value').textContent=state.na.toFixed(2);
    $('wavelength-value').textContent=state.wavelength+' nm';
    $('separation-value').textContent=state.separation+' nm';
    $('zoom-value').textContent=state.zoom.toFixed(2)+'×';
    const r=rayleighNm(state.na,state.wavelength), ratio=state.separation/r;
    $('rayleigh-value').innerHTML=Math.round(r)+' <small>nm</small>';
    $('ratio-value').innerHTML=ratio.toFixed(2)+'<small>×</small>';
    $('criterion-value').textContent=t(criterion(ratio));
    drawImage();drawProfile();drawMtf();$('load-error').hidden=true;
  } catch(error) { $('load-error').hidden=false; console.error(error); }
}
let pending=false;
function schedule(){if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;render();});}}
for (const key of Object.keys(defaults)) $(key).addEventListener('input',()=>{state[key]=Number($(key).value);schedule();});
$('rings').addEventListener('change',schedule);
function setState(values){Object.assign(state,values);for(const k of Object.keys(defaults))$(k).value=state[k];schedule();}
$('reset').addEventListener('click',()=>{setState(defaults);$('rings').checked=true;$('copy-status').textContent='';});
for(const b of document.querySelectorAll('[data-preset]'))b.addEventListener('click',()=>{
  const factor={below:.6,rayleigh:1,above:1.6}[b.dataset.preset];
  setState({...defaults,separation:Math.round(rayleighNm(defaults.na,defaults.wavelength)*factor)});
});
$('copy-link').addEventListener('click',async()=>{
  const share=new URL(location.href);share.search='';share.hash='lab';
  for(const [key,value] of Object.entries(state))share.searchParams.set(key,value);
  share.searchParams.set('rings',$('rings').checked?'1':'0');
  try{await navigator.clipboard.writeText(share.toString());$('copy-status').textContent=t('Experiment link copied.');}
  catch{const a=document.createElement('a');a.href=share;a.textContent=t('Open this experiment link, then copy the address.');$('copy-status').replaceChildren(a);}
});
$('download-plot').addEventListener('click',()=>{
  const original=$('profile-canvas'), c=document.createElement('canvas');c.width=original.width;c.height=original.height+80;
  const ctx=c.getContext('2d');ctx.fillStyle='#fdfcf7';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(original,0,0);
  ctx.fillStyle='#172f32';ctx.font='16px sans-serif';ctx.fillText('NA '+state.na.toFixed(2)+' | λ₀ '+state.wavelength+' nm | d '+state.separation+' nm',18,original.height+28);
  ctx.fillText(t('E03 · Equal incoherent points · Peak-normalized scalar model'),18,original.height+55);
  let a=$('profile-download-link');
  if(!a){a=document.createElement('a');a.id='profile-download-link';a.className='text-link';$('download-plot').after(a);}
  a.download='e03-two-point-profile.png';a.href=c.toDataURL('image/png');a.textContent=t('Download generated PNG ↓');
  // Keep a visible download link for embedded browsers that block automatic downloads.
  a.click();
});
const answers={q1:['half','d_R is proportional to 1/NA. Doubling NA halves this separation, within the same model.'],q2:['larger','Display zoom crops and enlarges the existing image. NA, the PSF, and the optical frequency cutoff stay fixed.'],q3:['missing','H = 0 removes that object coefficient from the measurement. Regularization can stabilize the measured band; extra assumptions or measurements are needed to constrain the missing band.']};
$('quiz').addEventListener('submit',event=>{
  event.preventDefault();let correct=0,answered=0;const data=new FormData(event.target);
  for(const [name,[expected,explanation]] of Object.entries(answers)){
    const selected=data.get(name),ok=selected===expected,feedback=$(name+'-feedback');
    if(selected)answered++;if(ok)correct++;
    feedback.textContent=selected?t(ok?'Correct.':'Try again.')+' '+t(explanation):t('Choose an answer, then check again.');
    feedback.classList.toggle('wrong',!ok);
  }
  $('quiz-status').textContent=answered<3?t('You answered {answered} of 3 questions.',{answered}):t('{correct} of 3 correct. Revisit the experiment and check again whenever you like.',{correct});
});
addEventListener('course:language-change',({detail})=>{for(const [key,value] of Object.entries(state))detail.url.searchParams.set(key,value);detail.url.searchParams.set('rings',$('rings').checked?'1':'0');});
new ResizeObserver(schedule).observe($('lab'));
document.fonts.ready.then(schedule);render();
