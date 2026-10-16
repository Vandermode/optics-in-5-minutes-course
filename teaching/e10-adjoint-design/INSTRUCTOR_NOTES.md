# Instructor notes · E10 · Designing light with gradients

For learners with basic calculus and Python. Explain complex arrows and any needed matrix notation locally; do not assume a previous electromagnetics course.

## Outcomes

- Derive a real phase gradient through a complex Fourier operator.
- Verify that gradient with central finite differences.
- Explain why adjoints are not generally inverse propagation and why gradients do not guarantee global optimality.

## Suggested 45–50-minute sequence

1. Predict (3 minutes): A mask has 4,096 adjustable phase pixels and one scalar loss. How many perturbed simulations would a central finite-difference gradient require? What calculation could share work across all pixels?
2. Explore (8 minutes): Run the two-spot design. Compare target and output with their common intensity scale, and follow the accepted-step loss curve. Change only the initialization seed. Compare final losses and phase masks; different solutions can have similar performance. Increase the maximum phase step. Watch backtracking add forward evaluations when needed, rather than assuming every larger step improves the design.
3. Explain (6 minutes): use the equation and measurement or boundary assumptions to connect the observed changes.
4. Check (3 minutes): ask the three page questions before showing feedback; have learners justify an answer.
5. Compute (20–25 minutes): run the core notebook, alter one parameter, and inspect its numerical checks.
6. Reflect (5 minutes): state one changed prediction, the evidence, and a remaining model limitation.

Use the optional extension for a longer lab rather than rushing the core. The quiz is local and does not collect student responses.

## Assessment and worked reasoning

### Check derivatives

Compare an analytic phase gradient with central differences at several perturbation sizes.

**Worked reasoning:** Look for an intermediate step-size range where truncation and roundoff are both small; compare relative and absolute errors.

### Count actual work

Report gradient evaluations and extra forward trials for two maximum step sizes.

**Worked reasoning:** One forward plus one adjoint produces a gradient for one objective. Backtracking and validation add separate evaluations.

### Test the manufactured design

Quantize the final phase and re-evaluate the unchanged objective and intensity normalization.

**Worked reasoning:** Fabrication projection can worsen performance. A model-aware optimization can include such constraints, but a continuous-mask result alone is insufficient.

## Ten-point rubric

- Prediction and physical reasoning: 2 points.
- Reproducible parameter choices, units, and labelled plots: 3 points.
- Quantitative comparison or numerical validation: 3 points.
- Model limitations and interpretation of disagreement: 2 points.

Grade reasoning and evidence, not an attractive plot alone. Results may vary with a deliberately changed seed or model; require the learner to record it.

## Common misconceptions

- For thousands of phase parameters and one scalar loss, the adjoint gradient needs… The overlap computes all parameter derivatives from the same forward and adjoint fields.

- For an attenuating transfer factor H, the adjoint uses… The inverse and adjoint coincide only when |H| = 1.

- A finite-difference gradient check establishes… It validates differentiation of the model, not the physical completeness of that model or the optimization landscape.

## Scope

64 × 64 scalar phase-only pupil with a circular fixed amplitude and a unitary Fourier propagation operator. Targets have equal total power. No pixel coupling, material dispersion, noise, or fabrication constraints are included in the browser optimization. The optional Helmholtz example has a lossy boundary layer, explicitly not a PML.

Optional extension: Check every gradient component in a small lossy sparse Helmholtz model, compare adjoint conventions, and evaluate quantized or smoothed phase masks after optimization.
