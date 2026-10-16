// Small deterministic numerical primitives. FFT: forward unnormalised, inverse / N.
export function fft(re, im, inverse = false) {
  const n = re.length;
  if (n !== im.length || n < 1 || (n & (n - 1))) throw new Error('FFT length must be a power of two.');
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let size = 2; size <= n; size *= 2) {
    const theta = (inverse ? 2 : -2) * Math.PI / size;
    const wr = Math.cos(theta), wi = Math.sin(theta);
    for (let start = 0; start < n; start += size) {
      let ar = 1, ai = 0;
      for (let j = 0; j < size / 2; j++) {
        const p = start + j, q = p + size / 2;
        const tr = ar * re[q] - ai * im[q], ti = ar * im[q] + ai * re[q];
        re[q] = re[p] - tr; im[q] = im[p] - ti; re[p] += tr; im[p] += ti;
        [ar, ai] = [ar * wr - ai * wi, ar * wi + ai * wr];
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  return {re, im};
}
export function transform(re, im = new Float64Array(re.length), inverse = false) {
  return fft(Float64Array.from(re), Float64Array.from(im), inverse);
}
export function fft2(re, im, n, inverse = false) {
  re = Float64Array.from(re); im = Float64Array.from(im);
  if (re.length !== n*n || im.length !== n*n) throw new Error('Square FFT shape mismatch.');
  for (let y = 0; y < n; y++) fft(re.subarray(y*n,(y+1)*n),im.subarray(y*n,(y+1)*n),inverse);
  for (let x = 0; x < n; x++) {
    const r = new Float64Array(n), j = new Float64Array(n);
    for (let y = 0; y < n; y++) { r[y] = re[y*n+x]; j[y] = im[y*n+x]; }
    fft(r,j,inverse);
    for (let y = 0; y < n; y++) { re[y*n+x] = r[y]; im[y*n+x] = j[y]; }
  }
  return {re, im};
}
export const linspace = (a,b,n) => Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
export const frequencies = (n,dx=1) => Float64Array.from({length:n},(_,i)=>(i<n/2?i:i-n)/(n*dx));
export const intensity = ({re,im}) => Float64Array.from(re,(v,i)=>v*v+im[i]*im[i]);
export const phase = ({re,im}) => Float64Array.from(re,(v,i)=>Math.atan2(im[i],v));
export const sum = a => a.reduce((s,v)=>s+v,0);
export const peak = a => a.reduce((s,v)=>Math.max(s,v),-Infinity);
export const mean = a => sum(a)/a.length;
export const sinc = x => Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);
export const normalize = a => { const m=peak(a)||1; return Float64Array.from(a,v=>v/m); };
export const shift = a => Float64Array.from(a,(_,i)=>a[(i+a.length/2)%a.length]);
export function shift2(a,n) { return Float64Array.from(a,(_,i)=>a[((Math.floor(i/n)+n/2)%n)*n+(i%n+n/2)%n]); }
export function rng(seed=20261017) {
  let s=Number(seed)>>>0;
  return ()=>{s+=0x6D2B79F5; let t=s; t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
}
export function gaussian(random) {return Math.sqrt(-2*Math.log(Math.max(1e-15,random())))*Math.cos(2*Math.PI*random());}
export function propagate1(re, im, dx, wavelength, z, fresnel=false) {
  const out=transform(re,im), k=2*Math.PI/wavelength;
  frequencies(re.length,dx).forEach((f,i)=>{
    const q=k*k-(2*Math.PI*f)**2;
    let angle,decay=1;
    if(fresnel) angle=z*(k-(2*Math.PI*f)**2/(2*k));
    else if(q>=0) angle=z*Math.sqrt(q);
    else {angle=0;decay=Math.exp(-Math.sqrt(-q)*Math.max(0,z));}
    const c=Math.cos(angle)*decay,s=Math.sin(angle)*decay,r=out.re[i],j=out.im[i];
    out.re[i]=r*c-j*s;out.im[i]=r*s+j*c;
  });
  return fft(out.re,out.im,true);
}
export const line = (title,xLabel,yLabel,series,extra={}) => ({kind:'line',title,xLabel,yLabel,series,...extra});
export const trace = (label,x,y,color='#267d85',extra={}) => ({label,x:Array.from(x),y:Array.from(y),color,...extra});
export const imagePlot = (title,values,n,palette='intensity',extra={}) => ({kind:'image',title,values:Array.from(values),width:n,height:n,palette,...extra});
export const tick = () => new Promise(resolve=>setTimeout(resolve,16));
