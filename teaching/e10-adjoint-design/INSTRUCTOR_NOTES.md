# Instructor notes · E10 · Designing light with gradients

<!-- course-motivation:start -->
## Why learn this?

**How do you improve a design with thousands of controls?**

You want a phase mask to produce a chosen intensity pattern, but each pixel is a design variable. Perturbing every pixel separately makes each optimization step expensive. You need the sensitivity of one objective to all those variables at once.

**What you gain:** Compute and verify a gradient with an adjoint calculation, use it to improve the pattern, and assess the resulting design without assuming that a lower error proves a global optimum.
<!-- course-motivation:end -->

For learners with undergraduate calculus, linear algebra, and basic Python. Each lesson names the specific ideas it uses and links to focused refreshers. Review unfamiliar topics as needed; the lesson develops the optical method. Use the checklist below before class. During the lesson, give a short notation reminder or point back to a resource when needed, then keep the explanation focused on the current optical question.

<!-- course-preparation:start -->
## Before this lesson

Use these focused refreshers if an idea is unfamiliar; you do not need to complete each linked course.

- **Chain rule and gradients:** Apply the multivariable chain rule to one scalar objective. Used here: The gradient measures how each phase pixel changes the image mismatch. [Review: MIT OCW · Chain Rule, Gradient and Directional Derivatives](https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/2.-partial-derivatives/part-b-chain-rule-gradient-and-directional-derivatives/). Use Sessions 32 and 34 for the multivariable chain rule, Session 35 for the gradient, and Session 38 for directional derivatives.
- **Complex inner products:** Use a complex inner product and conjugate transpose. Used here: Moving a linear operator across that inner product produces the adjoint operation. [Review: MIT OCW · Lecture 26: Complex matrices; fast Fourier transform](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/lecture-26-complex-matrices-fast-fourier-transform/). Focus on complex vectors, conjugate transpose, Hermitian matrices, and unitary matrices. The FFT algorithm at the end is optional here.
- **Fourier transforms and convolution:** Follow a complex field through a forward and inverse Fourier transform. Used here: The core design example uses a unitary Fourier propagation model. [Review: TU Delft · Fourier analysis](https://qiweb.tudelft.nl/aoi/fourieranalysis/fourieranalysis/). Use §4.1 for the transform pair, then §4.2.1–4.2.4 for linearity, scaling, shifts, and convolution. Consult §4.2.7 for two successive transforms.

**Python preparation:** Use complex arrays and compare an analytic derivative with a finite-difference perturbation.
- [NumPy · The absolute basics for beginners](https://numpy.org/doc/stable/user/absolute_beginners.html) — Use the sections on array shape, indexing and slicing, basic operations, and broadcasting. Practice changing one parameter and rerunning a cell.
- [NumPy · Discrete Fourier Transform](https://numpy.org/doc/stable/reference/routines.fft.html) — Read Implementation details and Normalization; look up fftfreq, fftshift, and ifftshift as they appear in the notebook.

**Developed here:** Derive, check, and use an adjoint phase gradient. Prior knowledge of adjoint optimization is not required.

[All prerequisites and learning resources](https://vandermode.github.io/optics-in-5-minutes-course/preparation/)
<!-- course-preparation:end -->

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
