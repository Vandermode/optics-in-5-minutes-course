import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {transform,fft2,propagate1,intensity,sum,sinc} from '../shared/math.js';
import {coherence,compute as coherenceCompute} from '../e04-coherence/model.js';
import {reconstruction,compute as hologramCompute} from '../e05-phase-problem/model.js';
import {lensFields} from '../e06-flat-optics/model.js';
import {stack} from '../e07-periodic-structures/model.js';
import {slabModes,ring} from '../e08-trapping-light/model.js';
import {simulate} from '../e09-maxwell-grid/model.js';
import {evaluate,compute as optimize} from '../e10-adjoint-design/model.js';

const root=new URL('../',import.meta.url),reference=JSON.parse(fs.readFileSync(new URL('tests/references.json',root)));
let assertions=0;
function close(actual,expected,tolerance,message){assert.ok(Math.abs(actual-expected)<=tolerance,`${message}: ${actual} vs ${expected}`);assertions++;}
function arrayClose(a,b,tolerance,message){assert.equal(a.length,b.length);a.forEach((v,i)=>close(v,b[i],tolerance,`${message} [${i}]`));}
const q=reference.fft,fft=transform(q.real,q.imag);
arrayClose(fft.re,q.expected_real,2e-13,'NumPy FFT real');arrayClose(fft.im,q.expected_imag,2e-13,'NumPy FFT imaginary');
const back=transform(fft.re,fft.im,true);arrayClose(back.re,q.real,2e-14,'FFT round trip');
const propagated=propagate1(q.real,q.imag,reference.asm.dx,reference.asm.wavelength,reference.asm.z);
arrayClose(propagated.re,reference.asm.real,2e-13,'NumPy ASM real');arrayClose(propagated.im,reference.asm.imag,2e-13,'NumPy ASM imaginary');
for(const m of [2,14]){
  const n=64,dx=.05,lam=.55,z=.2,f=m/(n*dx),k=2*Math.PI/lam,kx=2*Math.PI*f;
  const re=Float64Array.from({length:n},(_,i)=>Math.cos(2*Math.PI*m*i/n)),im=Float64Array.from(re,(_,i)=>Math.sin(2*Math.PI*m*i/n));
  const result=propagate1(re,im,dx,lam,z),decay=kx>k?Math.exp(-z*Math.sqrt(kx*kx-k*k)):1,angle=kx<=k?z*Math.sqrt(k*k-kx*kx):0;
  result.re.forEach((v,i)=>close(v,decay*Math.cos(2*Math.PI*m*i/n+angle),1e-13,'Analytic plane wave / evanescence'));
}
const n=16,field=Float64Array.from({length:n*n},(_,i)=>Math.sin(.31*i)),zero=new Float64Array(n*n),twice=fft2(...Object.values(fft2(field,zero,n)),n);
for(let y=0;y<n;y++)for(let x=0;x<n;x++)close(twice.re[y*n+x]/(n*n),field[((n-y)%n)*n+(n-x)%n],1e-13,'4f inversion');
close(sinc(1/2)**2,4/Math.PI**2,1e-14,'Two-level blaze efficiency');

const coherent={phase:0,jitter:0,bandwidth:5,delay:0,angle:0,baseline:30,balance:1,patterns:1,realizations:'independent'};
close(coherence(coherent).gamma,1,1e-14,'Perfect correlation');
close(coherence({...coherent,jitter:180}).gamma,0,1e-14,'Uniform full-circle phase average');
close(coherence({...coherent,angle:1000*.55/30}).gamma,0,1e-14,'Uniform source first zero');
const one=coherenceCompute(coherent).plots[3].values,same=coherenceCompute({...coherent,patterns:64,realizations:'same'}).plots[3].values,many=coherenceCompute({...coherent,patterns:64}).plots[3].values;
arrayClose(one,same,4e-14,'Repeating fixed speckle');
const contrast=a=>Math.sqrt(sum(a.map(v=>(v-1)**2))/a.length);
assert.ok(contrast(many)<.2&&contrast(one)>.8);assertions++;
assert.ok(reconstruction({carrier:32,radius:8}).relative<1e-12);assertions++;
assert.ok(reconstruction({carrier:60,radius:8}).relative>.1);assertions++;
assert.ok(hologramCompute({carrier:24,radius:10}).warning);assertions++;
const lens=lensFields({wavelength:550,levels:'0'});
arrayClose(lens.plain.re,lens.kino.re,1e-13,'Height wrapping real');arrayClose(lens.plain.im,lens.kino.im,1e-13,'Height wrapping imaginary');
for(const r of reference.stack){const value=stack(r.nu,r.n1,r.n2,r.pairs);for(const key of ['R','T','halftrace'])close(value[key],r[key],2e-12,'Complex stack reference '+key);close(value.R+value.T,1,2e-12,'Stack flux');}
for(const r of reference.slab){const modes=slabModes(r.width);arrayClose(modes.map(m=>m.neff),r.neff,1e-12,'SciPy slab roots');for(const m of modes)assert.ok(m.neff>1.45&&m.neff<1.5);}
for(const phi of [0,.03,.4,1.2]){const r=ring(phi,.87,.94);close(r.through+(1-.94**2)*r.circulating,1,2e-12,'Ring power balance');close(ring(phi,.87,1).through,1,1e-12,'Lossless all-pass ring');}
close(ring(0,.94,.94).through,0,1e-12,'Critical coupling');

const stable=await simulate({resolution:40,courant:.9,index:1,boundary:'pml'}),interfaceCase=await simulate({resolution:40,courant:.9,index:1.5,boundary:'pml'});
const time=stable.numerical.times,incident=sum(stable.numerical.probe.map((v,i)=>time[i]>1&&time[i]<6?v*v:0));
const reflected=sum(interfaceCase.numerical.probe.map((v,i)=>Math.abs(time[i]-10.5)<2?(v-stable.numerical.probe[i])**2:0))/incident;
close(reflected,.04,.002,'FDTD Fresnel reflection');
const unstable=await simulate({resolution:20,courant:1.05,index:1,boundary:'pml'});
assert.ok(unstable.numerical.unstable&&!stable.numerical.unstable);assertions++;
assert.ok(unstable.numerical.times.length<1000);assertions++;
const a=reference.adjoint,adj=evaluate(a.phi,a.amplitude,a.target,a.n);
close(adj.value,a.value,1e-12,'NumPy objective');arrayClose(adj.g,a.gradient,1e-12,'NumPy adjoint');
for(let i=0;i<a.phi.length;i++){const plus=[...a.phi],minus=[...a.phi],h=1e-5;plus[i]+=h;minus[i]-=h;const fd=(evaluate(plus,a.amplitude,a.target,a.n,false).value-evaluate(minus,a.amplitude,a.target,a.n,false).value)/(2*h);close(adj.g[i],fd,1e-8,'Independent central difference');}
const design=await optimize({seed:42,target:'two',step:.6,iterations:40});
assert.ok(design.numerical.history.at(-1)<design.numerical.history[0]*.2);assertions++;
design.numerical.history.slice(1).forEach((v,i)=>assert.ok(v<=design.numerical.history[i]+1e-13));

const catalog=JSON.parse(fs.readFileSync(new URL('course.json',root)));
for(const entry of catalog){
  if(entry.id==='E03')continue;
  const html=fs.readFileSync(new URL(entry.slug+'/index.html',root),'utf8');
  const config=JSON.parse(html.match(/<script id="lesson-config" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  const model=await import(new URL(entry.slug+'/model.js',root));
  const cases=[config.defaults,...config.presets.map(p=>({...config.defaults,...p.values}))];
  for(const state of cases){
    const result=await model.compute(state);
    for(const plot of result.plots){const values=plot.kind==='image'?plot.values:plot.series.flatMap(s=>s.y);assert.ok(values.length>0&&values.every(Number.isFinite),`${entry.id} nonfinite/empty plot`);assertions++;}
  }
  console.log(`PASS ${entry.id}: default and ${config.presets.length} presets produce finite computed plots`);
}
const regression=spawnSync(process.execPath,['tests/check-model.mjs'],{cwd:new URL('e03-diffraction/',root),encoding:'utf8'});
process.stdout.write(regression.stdout);process.stderr.write(regression.stderr);assert.equal(regression.status,0,'E03 regression');
console.log(`PASS ${assertions} numerical comparisons and invariants, including all ten lessons.`);
