# Instructor notes · E04 · Coherence and what a camera averages

For learners with undergraduate calculus, linear algebra, and basic Python. Each lesson names the specific ideas it uses and links to focused refreshers. Review unfamiliar topics as needed; the lesson develops the optical method. Use the checklist below before class. During the lesson, give a short notation reminder or point back to a resource when needed, then keep the explanation focused on the current optical question.

<!-- course-preparation:start -->
## Before this lesson

Use these focused refreshers if an idea is unfamiliar; you do not need to complete each linked course.

- **Complex amplitudes and phase:** Expand |u₁ + u₂|² and recognize complex-conjugate cross terms. Used here: The camera averages these interference terms during an exposure. [Review: MIT OCW · Complex Arithmetic and Exponentials](https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-i-first-order-differential-equations/complex-arithmetic-and-exponentials/). Read the notes on Euler's formula, polar form, multiplication, and complex conjugation. The differential-equation applications can wait.
- **Averages, variance, and correlation:** Distinguish averaging a product from multiplying averages, and independent from repeated samples. Used here: These distinctions govern fringe visibility and speckle contrast. [Review: MIT OCW · Probability readings, Classes 4, 6, and 7](https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/pages/classes-reading-and-in-class-materials/). Read Class 4b on expectation, Class 6a on expectation and variance, and Class 7b on covariance and correlation. R exercises are not needed.

For the coherent-mode section and notebook extension, review eigenvectors and Hermitian matrices.
- [MIT OCW · Eigenvalues and Eigenvectors](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/pages/least-squares-determinants-and-eigenvalues/eigenvalues-and-eigenvectors/) — Start with the lecture summary and one 2 × 2 worked problem. Focus on Av = λv and what changes when a matrix is applied repeatedly.
- [MIT OCW · Lecture 26: Complex matrices; fast Fourier transform](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/lecture-26-complex-matrices-fast-fourier-transform/) — Focus on complex vectors, conjugate transpose, Hermitian matrices, and unitary matrices. The FFT algorithm at the end is optional here.

**Python preparation:** Average arrays over a realization axis and compare standard deviation with mean intensity.
- [NumPy · The absolute basics for beginners](https://numpy.org/doc/stable/user/absolute_beginners.html) — Use the sections on array shape, indexing and slicing, basic operations, and broadcasting. Practice changing one parameter and rerunning a cell.

**Developed here:** Connect detector averaging to temporal coherence, spatial coherence, and speckle; then represent correlations with coherent modes.

[All prerequisites and learning resources](https://vandermode.github.io/optics-in-5-minutes-course/preparation/)
<!-- course-preparation:end -->

## Outcomes

- Explain intensity addition as a consequence of averaged cross terms.
- Distinguish temporal coherence, spatial coherence, and fixed spatial randomness.
- Use mutual intensity and coherent modes to propagate partially coherent light.

## Suggested 45–50-minute sequence

1. Predict (3 minutes): A rough wall has random phase delays at different positions. Does that guarantee a smooth camera image? Decide whether those phases must also change during the exposure.
2. Explore (8 minutes): Set all coherence-reducing controls to zero. Reduce the second beam’s brightness: visibility falls even though the relative phase is stable. Restore equal beams. Vary bandwidth at nonzero delay, then vary source width at fixed bandwidth. Identify which experimental filter would reverse each change. Average 32 independent speckle patterns, then repeat one fixed pattern 32 times. Explain the difference using the detector average rather than the word random alone.
3. Explain (6 minutes): use the equation and measurement or boundary assumptions to connect the observed changes.
4. Check (3 minutes): ask the three page questions before showing feedback; have learners justify an answer.
5. Compute (20–25 minutes): run the core notebook, alter one parameter, and inspect its numerical checks.
6. Reflect (5 minutes): state one changed prediction, the evidence, and a remaining model limitation.

Use the optional extension for a longer lab rather than rushing the core. The quiz is local and does not collect student responses.

## Assessment and worked reasoning

### Diagnose low visibility

Produce the same fringe visibility using intensity imbalance and phase averaging. Explain how to distinguish them.

**Worked reasoning:** Measure each beam separately and check polarization before interpreting visibility as |γ|.

### Audit the averaging law

Compare fixed and independent realizations at N = 1, 4, 16, 64.

**Worked reasoning:** Only independent equal-weight patterns give the ideal 1/√N scaling; finite fields give sampling variation.

### Propagate correlations

Compare direct source averaging with a full coherent-mode decomposition, then retain fewer modes.

**Worked reasoning:** The complete decompositions agree. Retained power and output intensity error should both be reported; a high retained-power fraction alone does not bound every pixel’s relative error.

## Ten-point rubric

- Prediction and physical reasoning: 2 points.
- Reproducible parameter choices, units, and labelled plots: 3 points.
- Quantitative comparison or numerical validation: 3 points.
- Model limitations and interpretation of disagreement: 2 points.

Grade reasoning and evidence, not an attractive plot alone. Results may vary with a deliberately changed seed or model; require the learner to record it.

## Common misconceptions

- The same stationary speckle pattern is added 64 times. Its normalized contrast… A repeated realization has perfectly correlated intensities. The independent-pattern averaging rule does not apply.

- A pinhole primarily changes… It selects spatial/angular contributions and loses flux. A spectral filter performs a different selection.

- Two beams show V = 0.5. This proves |γ| = 0.5 only if… Brightness imbalance and polarization mismatch also reduce visibility.

## Scope

Stationary scalar, same-polarization fields; small-angle uniform angular source; Gaussian frequency spectrum. The product of temporal, spatial, and jitter correlations assumes separable independent effects. Speckle uses circular complex Gaussian fields filtered by a finite pupil.

Optional extension: Build a mutual-intensity matrix from independent source angles, diagonalize it, and compare full and truncated coherent-mode propagation.
