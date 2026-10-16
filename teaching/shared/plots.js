const colors={intensity:[[5,19,26],[15,61,74],[40,114,120],[110,177,163],[223,229,188],[255,249,222]],signed:[[34,77,135],[244,243,235],[176,57,43]],phase:[[221,85,76],[225,190,65],[61,166,108],[39,155,184],[94,93,193],[191,73,153],[221,85,76]]};
function color(t,palette) {const p=colors[palette]||colors.intensity;t=Math.max(0,Math.min(1,t))*(p.length-1);const k=Math.min(p.length-2,Math.floor(t)),f=t-k;return p[k].map((v,i)=>Math.round(v*(1-f)+p[k+1][i]*f));}
const number = x => Math.abs(x)>=1e4||Math.abs(x)>0&&Math.abs(x)<.001?x.toExponential(1):Number(x.toPrecision(3)).toString();
export function draw(canvas,p) {
  const w=Math.max(260,canvas.clientWidth),h=p.kind==='image'?300:270,dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.height=h+'px';
  const c=canvas.getContext('2d');c.scale(dpr,dpr);c.fillStyle='#fffdf8';c.fillRect(0,0,w,h);c.font='12px Lato, Arial, sans-serif';
  const box={x:65,y:18,w:w-87,h:h-70};
  if(p.kind==='image') {
    let lo=p.range?.[0]??Math.min(...p.values),hi=p.range?.[1]??Math.max(...p.values);if(hi===lo)hi=lo+1;
    const off=document.createElement('canvas');off.width=p.width;off.height=p.height;const q=off.getContext('2d'),out=q.createImageData(p.width,p.height);
    p.values.forEach((v,i)=>{const t=(v-lo)/(hi-lo);out.data.set([...color(p.sqrt?Math.sqrt(Math.max(0,t)):t,p.palette),255],4*i);});q.putImageData(out,0,0);
    const aspect=p.fill?box.w/box.h:p.width/p.height,bw=Math.min(box.w,box.h*aspect),bh=bw/aspect,left=box.x+(box.w-bw)/2;
    c.imageSmoothingEnabled=false;c.drawImage(off,left,box.y,bw,bh);c.fillStyle='#52616a';c.textAlign='center';c.fillText(p.xLabel||'Position / sample',left+bw/2,h-26);c.font='11px Lato, Arial, sans-serif';c.fillText(`Colour scale: ${number(lo)} to ${number(hi)}${p.sqrt?' · √ display':''}`,left+bw/2,h-8);
    return;
  }
  const xs=p.series.flatMap(s=>Array.from(s.x)),ys=p.series.flatMap(s=>Array.from(s.y)).filter(Number.isFinite);
  let xmin=p.xRange?.[0]??Math.min(...xs),xmax=p.xRange?.[1]??Math.max(...xs),ymin=p.yRange?.[0]??Math.min(0,...ys),ymax=p.yRange?.[1]??Math.max(...ys);
  if(xmin===xmax)xmax=xmin+1;if(ymin===ymax)ymax=ymin+1;if(!p.yRange)ymax+=(ymax-ymin)*.08;
  if(p.equalAspect){const scale=Math.min(box.w/(xmax-xmin),box.h/(ymax-ymin)),nw=(xmax-xmin)*scale,nh=(ymax-ymin)*scale;box.x+=(box.w-nw)/2;box.y+=(box.h-nh)/2;box.w=nw;box.h=nh;}
  const X=x=>box.x+box.w*(x-xmin)/(xmax-xmin),Y=y=>box.y+box.h*(1-(y-ymin)/(ymax-ymin));
  c.lineWidth=1;c.textAlign='right';
  for(let i=0;i<5;i++){const y=ymin+(ymax-ymin)*i/4;c.strokeStyle='#e3e4df';c.beginPath();c.moveTo(box.x,Y(y));c.lineTo(box.x+box.w,Y(y));c.stroke();c.fillStyle='#52616a';c.fillText(number(y),box.x-8,Y(y)+4);}
  c.textAlign='center';for(let i=0;i<5;i++){const x=xmin+(xmax-xmin)*i/4;c.fillText(number(x),X(x),box.y+box.h+19);}
  c.fillText(p.xLabel||'',box.x+box.w/2,h-9);c.save();c.translate(15,box.y+box.h/2);c.rotate(-Math.PI/2);c.fillText(p.yLabel||'',0,0);c.restore();
  c.save();c.beginPath();c.rect(box.x,box.y,box.w,box.h);c.clip();
  for(const s of p.series){c.strokeStyle=s.color||'#267d85';c.lineWidth=2;c.setLineDash(s.dash?[5,4]:[]);c.beginPath();let started=false;s.x.forEach((x,i)=>{if(!Number.isFinite(s.y[i])){started=false;return;}if(started)c.lineTo(X(x),Y(s.y[i]));else{c.moveTo(X(x),Y(s.y[i]));started=true;}});c.stroke();}
  c.restore();c.setLineDash([]);
}
export function renderPlots(container,result) {
  if(container.children.length!==result.plots.length)container.replaceChildren(...result.plots.map(()=>{const f=document.createElement('figure');f.innerHTML='<h3></h3><canvas role="img"></canvas><figcaption></figcaption>';return f;}));
  result.plots.forEach((p,i)=>{const f=container.children[i];f.querySelector('h3').textContent=p.title;const canvas=f.querySelector('canvas');canvas.setAttribute('aria-label',p.title+'. '+(p.caption||p.yLabel||''));draw(canvas,p);const cap=f.querySelector('figcaption');cap.replaceChildren();if(p.series)for(const s of p.series){const label=document.createElement('span');label.className='legend-item';label.style.setProperty('--line',s.color||'#267d85');label.textContent=s.label;cap.append(label);}if(p.caption){const note=document.createElement('p');note.textContent=p.caption;cap.append(note);}});
}
