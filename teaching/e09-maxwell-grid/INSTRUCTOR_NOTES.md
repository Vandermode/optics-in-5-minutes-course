# Instructor notes · E09 · Maxwell on a grid

For learners with basic calculus and Python. Explain complex arrows and any needed matrix notation locally; do not assume a previous electromagnetics course.

## Outcomes

- Explain the spatial and temporal staggering of a Yee update.
- Distinguish instability, numerical dispersion, and boundary reflection.
- Measure reflection with a reference run and verify an absorber by refinement.

## Suggested 45–50-minute sequence

1. Predict (3 minutes): A layer absorbs light strongly. Does that guarantee it produces little reflection where the wave first enters it?
2. Explore (8 minutes): Run the matched-boundary case. Watch the field and probe trace, then repeat with a wall and the electric-loss layer at identical sampling. Insert n = 1.5. Locate the reflected and transmitted pulses. Do not infer reflectance by comparing unrelated instantaneous peaks. Run the unstable preset. Observe exponential growth and the automatic stop, then reduce S without changing the spatial grid.
3. Explain (6 minutes): use the equation and measurement or boundary assumptions to connect the observed changes.
4. Check (3 minutes): ask the three page questions before showing feedback; have learners justify an answer.
5. Compute (20–25 minutes): run the core notebook, alter one parameter, and inspect its numerical checks.
6. Reflect (5 minutes): state one changed prediction, the evidence, and a remaining model limitation.

Use the optional extension for a longer lab rather than rushing the core. The quiz is local and does not collect student responses.

## Assessment and worked reasoning

### Measure an interface

Estimate reflectance for n: 1 → 1.5 with a reference-subtracted, time-gated trace.

**Worked reasoning:** Compare with ((1−1.5)/(1+1.5))² = 0.04, then refine the grid. Keep incident normalization and arrival windows fixed physically.

### Audit the boundary

Compare wall, loss layer, and CPML with identical excitation and a larger-domain reference.

**Worked reasoning:** Subtract fields before squaring. Distinguish amplitude echo ratios from integrated reflected-power estimates.

### Separate two failures

Create a stable coarse run and an unstable fine run, then explain why each is unreliable.

**Worked reasoning:** The first can accumulate dispersion error; the second violates the time-step stability bound. Refining space without reducing Δt can make stability worse.

## Ten-point rubric

- Prediction and physical reasoning: 2 points.
- Reproducible parameter choices, units, and labelled plots: 3 points.
- Quantitative comparison or numerical validation: 3 points.
- Model limitations and interpretation of disagreement: 2 points.

Grade reasoning and evidence, not an attractive plot alone. Results may vary with a deliberately changed seed or model; require the learner to record it.

## Common misconceptions

- A 1D vacuum run uses S = 0.9. The same value on an equal-grid 2D vacuum Yee grid is… The bounds are 1 in 1D and 1/√2 in equal-grid 2D.

- A strongly absorbing electric-loss layer can reflect because… Dissipation and matching are separate properties.

- A stable FDTD run is guaranteed to have accurate phase velocity. Grid dispersion remains. Check wavelength sampling and refinement.

## Scope

1D normalized Yee fields with real, nondispersive ε = n² and μ = 1. The PML specialization uses cubic grading with κ = 1 and α = 0. The electric source is bidirectional. The field display clips amplitudes outside ±1; the growth plot reports actual maxima and stops at 10⁶.

Optional extension: Run a compact 2D TMz Yee solver with CPML, compare its residual against a larger domain, and repeat grid-dispersion and Courant tests.
