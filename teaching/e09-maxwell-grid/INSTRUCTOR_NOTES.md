# Instructor notes · E09 · Maxwell on a grid

<!-- course-motivation:start -->
## Why learn this?

**When can you trust a simulated electromagnetic field?**

A device with reflections, interfaces, or wavelength-scale features may need Maxwell's coupled fields rather than a prescribed phase mask. Computing those fields still does not make every plotted ripple physical: the grid, time step, and artificial boundaries can change the result.

**What you gain:** Build a time-domain Maxwell solver and test its stability, propagation error, and boundary reflections before interpreting a simulated device response.
<!-- course-motivation:end -->

For learners with undergraduate calculus, linear algebra, and basic Python. Each lesson names the specific ideas it uses and links to focused refreshers. Review unfamiliar topics as needed; the lesson develops the optical method. Use the checklist below before class. During the lesson, give a short notation reminder or point back to a resource when needed, then keep the explanation focused on the current optical question.

<!-- course-preparation:start -->
## Before this lesson

Use these focused refreshers if an idea is unfamiliar; you do not need to complete each linked course.

- **Coupled electric and magnetic fields:** Recognize the coupling between changing electric and magnetic fields. Used here: The solver advances both fields in alternating updates. [Review: OpenStax · University Physics Volume 2, §16.1](https://openstax.org/books/university-physics-volume-2/pages/16-1-maxwells-equations-and-electromagnetic-waves). Read Maxwell's Equations and the discussion connecting changing electric and magnetic fields. Concentrate on Faraday's and Ampère–Maxwell's laws.
- **Derivatives on a sampled grid:** Approximate a derivative with neighboring samples and read partial derivatives as local rates of change. Used here: The Yee grid replaces spatial and temporal derivatives by staggered differences. [Review: MIT OCW · Lecture 10: Finite Differences in Time](https://ocw.mit.edu/courses/18-085-computational-science-and-engineering-i-fall-2008/resources/lecture-10-finite-differences-in-time/). Focus on replacing a derivative by a difference quotient and taking successive Euler steps. The stability discussion gives useful context for E09.

**Python preparation:** Use neighboring array slices and a time loop; distinguish field samples, probes, and recorded traces.
- [NumPy · The absolute basics for beginners](https://numpy.org/doc/stable/user/absolute_beginners.html) — Use the sections on array shape, indexing and slicing, basic operations, and broadcasting. Practice changing one parameter and rerunning a cell.

**Developed here:** Construct a Yee update, test its time-step limit, and measure boundary reflections and PML performance.

[All prerequisites and learning resources](https://vandermode.github.io/optics-in-5-minutes-course/preparation/)
<!-- course-preparation:end -->

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
