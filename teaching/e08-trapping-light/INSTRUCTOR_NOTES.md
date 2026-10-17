# Instructor notes · E08 · Waveguides, modes, and resonators

For learners with undergraduate calculus, linear algebra, and basic Python. Each lesson names the specific ideas it uses and links to focused refreshers. Review unfamiliar topics as needed; the lesson develops the optical method. Use the checklist below before class. During the lesson, give a short notation reminder or point back to a resource when needed, then keep the explanation focused on the current optical question.

<!-- course-preparation:start -->
## Before this lesson

Use these focused refreshers if an idea is unfamiliar; you do not need to complete each linked course.

- **Matrices, eigenvectors, and modes:** Recognize an eigenfunction as a shape preserved by a linear operator. Used here: A guided mode retains its transverse profile as it propagates. [Review: MIT OCW · Eigenvalues and Eigenvectors](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/pages/least-squares-determinants-and-eigenvalues/eigenvalues-and-eigenvectors/). Start with the lecture summary and one 2 × 2 worked problem. Focus on Av = λv and what changes when a matrix is applied repeatedly.
- **Complex amplitudes and phase:** Add complex amplitudes with different accumulated phases. Used here: Interference between modes controls power transfer in a coupler. [Review: MIT OCW · Complex Arithmetic and Exponentials](https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-i-first-order-differential-equations/complex-arithmetic-and-exponentials/). Read the notes on Euler's formula, polar form, multiplication, and complex conjugation. The differential-equation applications can wait.
- **Geometric series:** Sum a geometric series and check its convergence condition. Used here: Repeated round trips build the ring's resonant response. [Review: OpenStax · Calculus Volume 2, §5.2](https://openstax.org/books/calculus-volume-2/pages/5-2-infinite-series). Read the Geometric Series subsection: partial sums, the sum 1/(1−r), and the condition |r| < 1. Other series tests are not needed.

**Python preparation:** Read eigenvalues and eigenvectors returned by a matrix solver, and plot parameter sweeps.
- [NumPy · The absolute basics for beginners](https://numpy.org/doc/stable/user/absolute_beginners.html) — Use the sections on array shape, indexing and slicing, basic operations, and broadcasting. Practice changing one parameter and rerunning a cell.

**Developed here:** Calculate slab modes, directional coupling, and ring resonances as three related experiments.

[All prerequisites and learning resources](https://vandermode.github.io/optics-in-5-minutes-course/preparation/)
<!-- course-preparation:end -->

## Outcomes

- Recognize a guided mode as an eigenfunction with decaying cladding tails.
- Explain directional coupling through relative supermode phase.
- Relate ring resonance, storage, and critical coupling without confusing amplitude and power.

## Suggested 45–50-minute sequence

1. Predict (3 minutes): A guide can support several transverse shapes. If two supported shapes propagate with different phase constants, will their sum keep the same intensity profile?
2. Explore (8 minutes): Vary slab thickness and count supported modes. Request a higher mode, then shrink the guide until that mode no longer exists. Inspect the two-guide model. Predict the complete-transfer length from κ before reading the metric. Set ring r equal to a, then vary only r. Explain why the through-port dip can become shallower even when the resonator still stores light.
3. Explain (6 minutes): use the equation and measurement or boundary assumptions to connect the observed changes.
4. Check (3 minutes): ask the three page questions before showing feedback; have learners justify an answer.
5. Compute (20–25 minutes): run the core notebook, alter one parameter, and inspect its numerical checks.
6. Reflect (5 minutes): state one changed prediction, the evidence, and a remaining model limitation.

Use the optional extension for a longer lab rather than rushing the core. The quiz is local and does not collect student responses.

## Assessment and worked reasoning

### Check a mode

Report an effective index, eigen-equation residual, and sensitivity to window size.

**Worked reasoning:** The residual tests the discrete eigenproblem. Enlarging the window checks whether artificial boundaries disturb the physical tail.

### Predict a coupler

Compute the two supermode propagation constants and predict the first complete-transfer distance.

**Worked reasoning:** κ = (βs − βa)/2, so L = π/|βs − βa| for the ideal symmetric two-mode system.

### Track energy storage

Compare through-port power, circulating power, and decay after drive removal.

**Worked reasoning:** Stored power can be larger than incident power through repeated coherent accumulation; decay and dissipation still obey energy balance.

## Ten-point rubric

- Prediction and physical reasoning: 2 points.
- Reproducible parameter choices, units, and labelled plots: 3 points.
- Quantitative comparison or numerical validation: 3 points.
- Model limitations and interpretation of disagreement: 2 points.

Grade reasoning and evidence, not an attractive plot alone. Results may vary with a deliberately changed seed or model; require the learner to record it.

## Common misconceptions

- A guided slab mode’s effective index lies… The core supports transverse oscillation while the cladding tail decays.

- The ideal two-guide transfer length is… A supermode splitting 2κ accumulates a relative phase π at that distance.

- Critical coupling in the displayed ring occurs when… At resonance, equal amplitude self-coupling and round-trip survival cancel the through field.

## Scope

Scalar TE symmetric slab, ncore = 1.50, ncladding = 1.45, λ₀ = 1.55 μm. The coupler and ring are separate reduced models. The ring is an ideal single-bus all-pass resonator with amplitude parameters r and a. No bend radiation, vector effects, or fabrication disorder is included.

Optional extension: Solve the Hermitian finite-difference mode problem, derive κ from double-guide supermodes, and compare mode beating with split-step BPM.
