import {terms, lessonTerms} from './glossary.js';
import {knowledge} from './knowledge-data.js';

// A term can belong to several core concepts. These are reading paths, not a
// prerequisite tree; keep detailed terms out of the twelve-node overview.
export const conceptTerms = {
  field: ['complexField', 'amplitude', 'phase', 'monochromatic'],
  fourier: ['fourier', 'spatialFrequency', 'planeWave', 'fft', 'fourF', 'convolution', 'unitary'],
  propagation: ['angularSpectrum', 'planeWave', 'helmholtz', 'evanescent', 'fresnel', 'monochromatic', 'snell', 'refractiveIndex'],
  coherence: ['coherent', 'crossTerm', 'visibility', 'temporalCoherence', 'spatialCoherence', 'speckle', 'mutualIntensity', 'coherentModes', 'hermitian', 'positiveSemidefinite'],
  imaging: ['pupil', 'psf', 'airy', 'na', 'rayleigh', 'otf', 'mtf', 'cutoff', 'convolution', 'coherent', 'phaseObject', 'deconvolution'],
  recovery: ['holography', 'carrier', 'sideband', 'phaseRetrieval', 'gerchberg', 'nonconvex'],
  phase: ['phase', 'thinElement', 'phaseWrapping', 'kinoform', 'quantization', 'dispersion', 'phaseObject', 'diffractionOrder', 'refractiveIndex'],
  periodic: ['diffractionOrder', 'bloch', 'bandGap', 'transferMatrix', 'rcwa', 'te', 'permittivity', 'snell', 'evanescent'],
  modes: ['eigenproblem', 'hermitian', 'totalInternalReflection', 'cladding', 'guidedMode', 'propagationConstant', 'effectiveIndex', 'supermode', 'resonator', 'criticalCoupling', 'coherentModes', 'bloch'],
  sampling: ['nyquist', 'padding', 'fft', 'courant', 'numericalDispersion', 'finiteDifference'],
  maxwell: ['maxwell', 'permittivity', 'fdtd', 'yee', 'courant', 'numericalDispersion', 'pml', 'cpml', 'impedance', 'te', 'helmholtz'],
  adjoint: ['objective', 'gradient', 'adjoint', 'finiteDifference', 'unitary', 'nonconvex', 'lineSearch', 'pupil', 'quantization'],
};

// Directly connected terms are curated separately from category membership.
// Sharing a broad concept alone does not make every pair a useful next step.
export const termRelations = [
  ['complexField', 'amplitude'], ['complexField', 'phase'], ['complexField', 'coherent'],
  ['phase', 'phaseWrapping'], ['phase', 'phaseObject'], ['phase', 'crossTerm'],
  ['monochromatic', 'temporalCoherence'], ['monochromatic', 'helmholtz'],
  ['refractiveIndex', 'permittivity'], ['refractiveIndex', 'snell'], ['refractiveIndex', 'dispersion'],
  ['helmholtz', 'maxwell'], ['helmholtz', 'angularSpectrum'], ['helmholtz', 'guidedMode'],
  ['planeWave', 'spatialFrequency'], ['planeWave', 'angularSpectrum'],
  ['fourier', 'spatialFrequency'], ['fourier', 'fft'], ['fourier', 'fourF'],
  ['fourier', 'convolution'], ['fourier', 'unitary'],
  ['angularSpectrum', 'fourier'], ['angularSpectrum', 'evanescent'], ['angularSpectrum', 'fresnel'],
  ['fft', 'nyquist'], ['fft', 'padding'], ['nyquist', 'spatialFrequency'],
  ['nyquist', 'cutoff'], ['fresnel', 'thinElement'], ['fourF', 'phaseObject'], ['fourF', 'pupil'],
  ['pupil', 'psf'], ['pupil', 'na'], ['pupil', 'otf'],
  ['psf', 'airy'], ['psf', 'convolution'], ['psf', 'otf'],
  ['airy', 'rayleigh'], ['na', 'rayleigh'], ['na', 'cutoff'],
  ['otf', 'mtf'], ['otf', 'cutoff'], ['otf', 'deconvolution'],
  ['mtf', 'spatialFrequency'], ['deconvolution', 'convolution'],
  ['coherent', 'crossTerm'], ['coherent', 'mutualIntensity'],
  ['crossTerm', 'visibility'], ['crossTerm', 'holography'],
  ['visibility', 'temporalCoherence'], ['visibility', 'spatialCoherence'],
  ['spatialCoherence', 'mutualIntensity'], ['speckle', 'coherent'], ['speckle', 'spatialCoherence'],
  ['mutualIntensity', 'coherentModes'], ['mutualIntensity', 'hermitian'], ['mutualIntensity', 'positiveSemidefinite'],
  ['coherentModes', 'eigenproblem'], ['hermitian', 'eigenproblem'], ['hermitian', 'adjoint'],
  ['positiveSemidefinite', 'eigenproblem'],
  ['holography', 'carrier'], ['holography', 'sideband'], ['holography', 'phaseRetrieval'],
  ['carrier', 'sideband'], ['carrier', 'nyquist'], ['sideband', 'fft'],
  ['phaseRetrieval', 'gerchberg'], ['phaseRetrieval', 'nonconvex'],
  ['gerchberg', 'fourier'], ['gerchberg', 'nonconvex'],
  ['thinElement', 'phaseWrapping'], ['phaseWrapping', 'kinoform'],
  ['kinoform', 'quantization'], ['quantization', 'diffractionOrder'],
  ['snell', 'totalInternalReflection'], ['snell', 'diffractionOrder'],
  ['totalInternalReflection', 'guidedMode'], ['cladding', 'guidedMode'], ['cladding', 'evanescent'],
  ['diffractionOrder', 'rcwa'], ['diffractionOrder', 'evanescent'],
  ['bloch', 'transferMatrix'], ['bloch', 'bandGap'], ['bloch', 'eigenproblem'],
  ['transferMatrix', 'bandGap'], ['rcwa', 'permittivity'], ['rcwa', 'te'],
  ['guidedMode', 'eigenproblem'], ['guidedMode', 'propagationConstant'],
  ['propagationConstant', 'effectiveIndex'], ['propagationConstant', 'supermode'],
  ['supermode', 'guidedMode'], ['supermode', 'phase'],
  ['resonator', 'phase'], ['resonator', 'criticalCoupling'],
  ['fdtd', 'maxwell'], ['fdtd', 'yee'], ['fdtd', 'numericalDispersion'],
  ['yee', 'courant'], ['yee', 'numericalDispersion'], ['courant', 'numericalDispersion'],
  ['pml', 'cpml'], ['pml', 'impedance'], ['cpml', 'fdtd'], ['impedance', 'permittivity'],
  ['objective', 'gradient'], ['objective', 'nonconvex'], ['gradient', 'adjoint'],
  ['gradient', 'finiteDifference'], ['gradient', 'lineSearch'], ['adjoint', 'unitary'],
  ['adjoint', 'evanescent'], ['lineSearch', 'nonconvex'],
];

export const concepts = Object.fromEntries(knowledge.concepts.map(node => [node.id, node]));
export const episodes = Object.fromEntries(knowledge.episodes.map(entry => [entry.id, entry]));
export const termConcepts = Object.fromEntries(Object.keys(terms).map(id =>
  [id, Object.keys(conceptTerms).filter(concept => conceptTerms[concept].includes(id))]));

export function episodesForTerm(id) {
  return Object.keys(lessonTerms).filter(episode => Object.hasOwn(lessonTerms[episode], id));
}

export function relatedTerms(id, episode) {
  return termRelations.filter(pair => pair.includes(id)).map(pair => pair.find(other => other !== id))
    .sort((a, b) => Number(Boolean(lessonTerms[episode]?.[b])) - Number(Boolean(lessonTerms[episode]?.[a])));
}

export function preferredConcept(id, episode) {
  const ids = termConcepts[id];
  return ids.includes(knowledge.focus[episode]) ? knowledge.focus[episode]
    : ids.find(key => concepts[key].episodes.includes(episode)) || ids[0];
}

export function preferredEpisode(id, concept) {
  const ids = episodesForTerm(id);
  return ids.find(episode => knowledge.focus[episode] === concept)
    || ids.find(episode => concepts[concept]?.episodes.includes(episode)) || ids[0];
}

export function termURL(id, episode, language, concept = preferredConcept(id, episode)) {
  const url = new URL(`../${episodes[episode].slug}/${language === 'zh' ? 'index.zh.html' : 'index.html'}`, import.meta.url);
  url.searchParams.set('concept', concept);
  url.searchParams.set('term', id);
  url.hash = 'idea';
  return url;
}
