import assert from 'node:assert/strict';
import fs from 'node:fs';
import {airyIntensity, psf, pairIntensity, rayleighNm, cutoff, mtf, criterion} from '../assets/physics.js';

const data=JSON.parse(fs.readFileSync(new URL('./reference-cases.json',import.meta.url),'utf8'));
const errors=data.v.map((v,i)=>Math.abs(airyIntensity(v)-data.airy[i]));
assert.ok(Math.max(...errors)<8e-6,'Browser interpolation must agree with direct SciPy Bessel evaluation.');
assert.equal(airyIntensity(0),1);
assert.ok(airyIntensity(3.8317059702075125)<1e-6);
assert.ok(Math.abs(2*airyIntensity(3.8317059702075125/2)-.735031662423275)<1e-5);
assert.equal(mtf(0),1);assert.equal(mtf(1),0);assert.equal(mtf(1.3),0);
assert.ok(Math.abs(mtf(.5)-.3910022189557706)<1e-12);
const h=Array.from({length:101},(_,i)=>mtf(i/100));
assert.ok(h.every((v,i)=>v>=0&&v<=1&&(i===0||v<=h[i-1])));
for (const na of [.2,.65,.95]) for(const wavelength of [400,550,700]){
  const s={na,wavelength,separation:520,zoom:1};
  const r=rayleighNm(na,wavelength);
  assert.ok(Number.isFinite(r)&&r>0);
  assert.ok(Math.abs(cutoff(na,wavelength)*r/1000-2*.6098349456332522)<1e-12);
  assert.ok(Math.abs(pairIntensity(.2,.1,s)-pairIntensity(-.2,.1,s))<1e-12);
  assert.equal(pairIntensity(.2,.1,s),pairIntensity(.2,.1,{...s,zoom:2}));
  assert.ok(Math.abs(pairIntensity(.2,0,{...s,separation:0})-2*psf(.2,na,wavelength/1000))<1e-12);
}
assert.equal(criterion(.6),'Below Rayleigh');assert.equal(criterion(1),'Near Rayleigh');assert.equal(criterion(1.6),'Above Rayleigh');
console.log('PASS: Airy origin/zero, Rayleigh dip, MTF, source addition, units, symmetry, and display-zoom invariance.');
console.log('Maximum browser Airy error versus SciPy:',Math.max(...errors));
