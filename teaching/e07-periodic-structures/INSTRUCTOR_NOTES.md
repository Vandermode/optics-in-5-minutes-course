# Instructor notes · E07 · Gratings, Bloch waves, and band gaps

For learners with basic calculus and Python. Explain complex arrows and any needed matrix notation locally; do not assume a previous electromagnetics course.

## Outcomes

- Determine which grating orders propagate in each medium.
- Connect a finite Bragg mirror to an infinite crystal’s Bloch gap.
- Distinguish energy conservation from convergence in a truncated RCWA calculation.

## Suggested 45–50-minute sequence

1. Predict (3 minutes): If you shrink a grating’s period while keeping wavelength fixed, do more or fewer diffraction orders fit inside the propagating-wave circle?
2. Explore (8 minutes): Change the grating period and count orders. Tilt the input and watch positive and negative orders leave the allowed range at different settings. In the separate layer-stack experiment, reduce index contrast to zero. Explain both the reflectance curve and the disappearance of the Bloch attenuation band. Restore contrast and vary period count. Compare finite-stack reflection with the infinite-periodic gap condition.
3. Explain (6 minutes): use the equation and measurement or boundary assumptions to connect the observed changes.
4. Check (3 minutes): ask the three page questions before showing feedback; have learners justify an answer.
5. Compute (20–25 minutes): run the core notebook, alter one parameter, and inspect its numerical checks.
6. Reflect (5 minutes): state one changed prediction, the evidence, and a remaining model limitation.

Use the optional extension for a longer lab rather than rushing the core. The quiz is local and does not collect student responses.

## Assessment and worked reasoning

### Count orders

Predict the order count before changing wavelength, angle, or exit index.

**Worked reasoning:** Apply the propagation condition in the appropriate medium to every integer m; treat exact grazing separately.

### Build a mirror

Compare two and ten periods at fixed index contrast, then remove the contrast.

**Worked reasoning:** More periods strengthen finite-stack reflection in the same infinite-medium gap. No contrast removes the periodic scattering.

### Convergence audit

Report conservation, boundary residual, and changes in individual RCWA order powers.

**Worked reasoning:** A small residual or power-balance error alone does not bound truncation error. Retain more harmonics and compare complex t₀ as well.

## Ten-point rubric

- Prediction and physical reasoning: 2 points.
- Reproducible parameter choices, units, and labelled plots: 3 points.
- Quantitative comparison or numerical validation: 3 points.
- Model limitations and interpretation of disagreement: 2 points.

Grade reasoning and evidence, not an attractive plot alone. Results may vary with a deliberately changed seed or model; require the learner to record it.

## Common misconceptions

- The grating equation alone determines… Efficiencies require solving the boundary-value problem for the actual structure.

- For the lossless layer stack, |½ tr Mperiod| > 1 indicates… The Bloch wavevector becomes complex, giving reciprocal growing and decaying factors.

- An RCWA run has R + T = 1 to machine precision. Its individual orders are… Conservation is necessary but not sufficient. Compare order powers and amplitudes as the basis grows.

## Scope

The browser grating panel is kinematic only. The separate Bragg stack is lossless, normally illuminated, with equal layer thicknesses and exterior index 1.9. The optional RCWA model is a 1D lamellar, isotropic, lossless TE layer; it rejects exact cutoffs. TM and nonperiodic structures require additional treatment.

Optional extension: Implement a small single-layer TE-RCWA solver, compare uniform-film limits with Fresnel/Airy formulas, and increase the harmonic count until individual orders converge.
