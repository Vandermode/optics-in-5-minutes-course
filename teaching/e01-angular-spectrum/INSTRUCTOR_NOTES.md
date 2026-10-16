# Instructor notes · E01 · The angular spectrum method

For learners with basic calculus and Python. Explain complex arrows and any needed matrix notation locally; do not assume a previous electromagnetics course.

## Outcomes

- Interpret a Fourier coefficient as a plane-wave amplitude.
- Predict how wavelength, aperture width, and distance change diffraction.
- Separate physical evanescent decay from numerical aliasing and wrap-around.

## Suggested 45–50-minute sequence

1. Predict (3 minutes): Keep the wavelength fixed. If you halve the slit width, will the distant central band become narrower or wider? Explain before moving a control.
2. Explore (8 minutes): Start at z = 0 and confirm that the output reproduces the input slit. Then advance z while watching both the intensity and complex-field plots. Compare widths 2 μm and 1 μm at the same distance. A narrower opening requires a broader range of transverse frequencies; their interference spreads farther. Use the narrow-slit preset, then compare padded and original windows at long distance. Change only padding: it changes the numerical boundary, not the physical slit.
3. Explain (6 minutes): use the equation and measurement or boundary assumptions to connect the observed changes.
4. Check (3 minutes): ask the three page questions before showing feedback; have learners justify an answer.
5. Compute (20–25 minutes): run the core notebook, alter one parameter, and inspect its numerical checks.
6. Reflect (5 minutes): state one changed prediction, the evidence, and a remaining model limitation.

Use the optional extension for a longer lab rather than rushing the core. The quiz is local and does not collect student responses.

## Assessment and worked reasoning

### Compare two widths

Predict the ratio of far-field angular widths, then measure their first minima or central-band widths.

**Worked reasoning:** Halving the slit width doubles the ideal far-field angular scale; a finite-distance pattern need not obey the far-field estimate exactly.

### Separate numerical errors

Change padding and sample spacing independently. Explain which fixes wrap-around and which extends Nyquist.

**Worked reasoning:** Padding separates periodic replicas; smaller pixels represent higher spatial frequencies. Neither replaces checking convergence.

### Test an eigenfunction

Propagate a single Fourier-grid plane wave and compare it with its analytic phase factor.

**Worked reasoning:** A grid-aligned plane wave keeps its transverse shape. Its coefficient gains e^(i k_z z), and its norm stays constant when k_z is real.

## Ten-point rubric

- Prediction and physical reasoning: 2 points.
- Reproducible parameter choices, units, and labelled plots: 3 points.
- Quantitative comparison or numerical validation: 3 points.
- Model limitations and interpretation of disagreement: 2 points.

Grade reasoning and evidence, not an attractive plot alone. Results may vary with a deliberately changed seed or model; require the learner to record it.

## Common misconceptions

- At fixed wavelength, halving a slit’s width generally makes its far-field central band… The field needs a broader transverse-frequency spectrum. The distant angular spread increases.

- Doubling zero padding at fixed pixel spacing primarily… Padding enlarges the computational window. Nyquist is still 1/(2Δx).

- For an evanescent component propagated forward, H is… The outgoing square-root branch has positive imaginary k_z, so e^(i k_z z) decays.

## Scope

Scalar, monochromatic propagation in homogeneous free space. The slit is a 1D field invariant in the omitted direction. No vector polarization, material boundary scattering, detector averaging, or noise is modeled. FFT windows are periodic.

Optional extension: Build a 2D propagator, compare exact and paraxial transfer functions on the same grid, and repeat with smaller pixels and larger padding.
