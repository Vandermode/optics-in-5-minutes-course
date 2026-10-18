// Frequency-Gaussian power spectrum; widths in nm, path differences in μm.
// Δλ is a narrowband conversion of the frequency FWHM, not a second Gaussian.
export const centreWavelengthNm = 550;
export const lightSpeedUmPerFs = 0.299792458;

export function spectrumState(widthNm, pathUm) {
  const wavelengthUm = centreWavelengthNm / 1000;
  const widthUm = widthNm / 1000;
  const frequencyFwhmTHz = lightSpeedUmPerFs * widthUm / wavelengthUm ** 2 * 1000;
  const roughLengthUm = wavelengthUm ** 2 / widthUm;
  const coherenceLengthUm = 2 * Math.sqrt(Math.log(2)) / Math.PI * roughLengthUm;
  return {
    frequencyFwhmTHz, roughLengthUm, coherenceLengthUm,
    visibility: Math.exp(-((pathUm / coherenceLengthUm) ** 2)),
  };
}

export function spectralPower(offsetTHz, widthNm) {
  const {frequencyFwhmTHz} = spectrumState(widthNm, 0);
  return Math.exp(-4 * Math.log(2) * (offsetTHz / frequencyFwhmTHz) ** 2);
}

export function correlation(pathUm, widthNm) {
  const {visibility} = spectrumState(widthNm, pathUm);
  return {envelope: visibility, real: visibility * Math.cos(2 * Math.PI * pathUm / (centreWavelengthNm / 1000))};
}
