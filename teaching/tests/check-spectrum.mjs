import assert from 'node:assert/strict';
import {spectrumState, correlation, spectralPower} from '../shared/coherence-spectrum.js';

// Independently integrate a frequency-Gaussian power spectrum. ν is in THz,
// τ in fs: 2πντ/1000 is dimensionless. No analytic Fourier formula is used here.
function integratedCorrelation(fwhmTHz, delayFs) {
  const sigma = fwhmTHz / Math.sqrt(8 * Math.log(2));
  let total = 0, real = 0, imag = 0;
  const n = 24000, low = -8 * sigma, step = 16 * sigma / n;
  for (let i = 0; i < n; i++) {
    const frequency = low + (i + 0.5) * step;
    const power = Math.exp(-0.5 * (frequency / sigma) ** 2);
    const phase = 2 * Math.PI * frequency * delayFs / 1000;
    total += power; real += power * Math.cos(phase); imag += power * Math.sin(phase);
  }
  return Math.hypot(real, imag) / total;
}
let comparisons = 0;
for (const width of [3, 15, 30, 45]) {
  const state = spectrumState(width, 0);
  assert.equal(state.visibility, 1);
  assert.ok(Math.abs(spectralPower(state.frequencyFwhmTHz / 2, width) - 0.5) < 1e-14);
  assert.ok(Math.abs(correlation(state.coherenceLengthUm, width).envelope - 1 / Math.E) < 1e-14);
  for (const path of [0, 1, 5, 10, state.coherenceLengthUm]) {
    const numeric = integratedCorrelation(state.frequencyFwhmTHz, path / 0.299792458);
    assert.ok(Math.abs(numeric - spectrumState(width, path).visibility) < 2e-12, `independent Fourier integral, width=${width}, path=${path}`);
    comparisons++;
  }
  const doubled = spectrumState(width * 2, 0);
  assert.ok(Math.abs(state.coherenceLengthUm - 2 * doubled.coherenceLengthUm) < 1e-13);
}
const example = spectrumState(30, 5);
assert.equal(example.roughLengthUm.toFixed(2), '10.08');
assert.equal(example.coherenceLengthUm.toFixed(2), '5.34');
assert.equal(example.visibility.toFixed(3), '0.417');
console.log(`PASS spectrum/coherence: ${comparisons} independent Fourier-integral comparisons, FWHM and 1/e conventions, and the worked example.`);
