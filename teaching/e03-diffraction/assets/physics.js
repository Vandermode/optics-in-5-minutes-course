import { AIRY_STEP, AIRY_VALUES } from './airy-table.js';

// Scalar circular-pupil model. Lengths in micrometres, frequencies in cycles/µm.
// AIRY_VALUES samples [2 J1(v)/v]^2; generated with SciPy and verified independently.
export const RAYLEIGH_FACTOR = 0.6098349456332522;
export function airyIntensity(v) {
  const u = Math.abs(v) / AIRY_STEP;
  if (u < AIRY_VALUES.length - 1) {
    const i = Math.floor(u), t = u - i;
    return AIRY_VALUES[i] * (1 - t) + AIRY_VALUES[i + 1] * t;
  }
  // Outside the precomputed interval, evaluate the integer-order Bessel integral.
  const n = Math.max(128, Math.ceil(2 * Math.abs(v) + 64));
  let j = 0;
  for (let k = 0; k < n; k++) {
    const a = Math.PI * (k + 0.5) / n;
    j += Math.cos(a - Math.abs(v) * Math.sin(a));
  }
  return (2 * j / (n * Math.abs(v))) ** 2;
}
export function psf(r, na, lambdaUm) { return airyIntensity(2 * Math.PI * na * Math.abs(r) / lambdaUm); }
export function pairIntensity(x, y, state) {
  const {na, wavelength, separation} = state;
  return psf(Math.hypot(x - separation / 2000, y), na, wavelength / 1000)
    + psf(Math.hypot(x + separation / 2000, y), na, wavelength / 1000);
}
export function rayleighNm(na, wavelengthNm) { return RAYLEIGH_FACTOR * wavelengthNm / na; }
export function cutoff(na, wavelengthNm) { return 2 * na / (wavelengthNm / 1000); }
export function mtf(rho) {
  const x = Math.abs(rho);
  return x >= 1 ? 0 : 2 / Math.PI * (Math.acos(x) - x * Math.sqrt(1 - x * x));
}
export function criterion(ratio) { return ratio < 0.98 ? 'Below Rayleigh' : ratio > 1.02 ? 'Above Rayleigh' : 'Near Rayleigh'; }
