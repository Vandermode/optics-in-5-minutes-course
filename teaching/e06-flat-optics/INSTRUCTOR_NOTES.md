# Instructor notes · E06 · Flat optics and wrapped phase

For learners with undergraduate calculus, linear algebra, and basic Python. Each lesson names the specific ideas it uses and links to focused refreshers. Review unfamiliar topics as needed; the lesson develops the optical method. Use the checklist below before class. During the lesson, give a short notation reminder or point back to a resource when needed, then keep the explanation focused on the current optical question.

<!-- course-preparation:start -->
## Before this lesson

Use these focused refreshers if an idea is unfamiliar; you do not need to complete each linked course.

- **Complex amplitudes and phase:** Use exp(i(φ + 2π)) = exp(iφ) and distinguish phase from physical path length. Used here: A phase wrap preserves the complex transmission at the design wavelength. [Review: MIT OCW · Complex Arithmetic and Exponentials](https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-i-first-order-differential-equations/complex-arithmetic-and-exponentials/). Read the notes on Euler's formula, polar form, multiplication, and complex conjugation. The differential-equation applications can wait.
- **A lens as a phase element:** Read a thin optical element as multiplication by a spatially varying phase. Used here: The lesson converts a focusing phase profile into a physical height profile. [Review: TU Delft · Coherent optical imaging](https://qiweb.tudelft.nl/aoi/coherentimaging/coherentimaging/). In §7.1, find the thin-lens transmission t_lens and the field immediately after the lens. Focus on multiplication by a position-dependent phase.

**Python preparation:** Apply modulo and quantization to arrays, then compare wavelengths using consistent length units.
- [NumPy · The absolute basics for beginners](https://numpy.org/doc/stable/user/absolute_beginners.html) — Use the sections on array shape, indexing and slicing, basic operations, and broadcasting. Practice changing one parameter and rerunning a cell.
- [NumPy · Discrete Fourier Transform](https://numpy.org/doc/stable/reference/routines.fft.html) — Read Implementation details and Normalization; look up fftfreq, fftshift, and ifftshift as they appear in the notebook.

**Developed here:** Test wrapped phase, fabrication levels, and chromatic mismatch in a flat optic.

[All prerequisites and learning resources](https://vandermode.github.io/optics-in-5-minutes-course/preparation/)
<!-- course-preparation:end -->

## Outcomes

- Convert physical height into a phase delay.
- Explain why phase wrapping is equivalent at one design wavelength.
- Quantify staircase efficiency and identify when the thin-element model fails.

## Suggested 45–50-minute sequence

1. Predict (3 minutes): A glass profile delays light by exactly one full phase turn at 550 nm. If you remove that height, will the device remain equivalent at 450 nm?
2. Explore (8 minutes): At 550 nm, compare the unwrapped and continuous wrapped focal profiles using the same incident-intensity scale. Keep wavelength fixed and reduce the number of phase levels. Inspect how energy leaves the intended focal order. Restore a continuous wrapped surface and change wavelength. Compare the axial focus curves of the two physical profiles, then move the observation plane to the new peak.
3. Explain (6 minutes): use the equation and measurement or boundary assumptions to connect the observed changes.
4. Check (3 minutes): ask the three page questions before showing feedback; have learners justify an answer.
5. Compute (20–25 minutes): run the core notebook, alter one parameter, and inspect its numerical checks.
6. Reflect (5 minutes): state one changed prediction, the evidence, and a remaining model limitation.

Use the optional extension for a longer lab rather than rushing the core. The quiz is local and does not collect student responses.

## Assessment and worked reasoning

### Verify wrapping

Compare complex transmissions of continuous and wrapped profiles at two wavelengths.

**Worked reasoning:** They agree at λ₀ up to floating-point error. At another wavelength the removed height need not be a full phase turn.

### Measure order efficiency

Compute the +1 Fourier coefficient of 2-, 4-, 8-, and 16-level phase ramps.

**Worked reasoning:** Use a common unit-amplitude input and compare squared coefficient magnitude with sinc²(1/N).

### Separate error sources

Compare quantization, height smoothing, and pixel refinement.

**Worked reasoning:** Quantization and smoothing alter the modeled device; pixel refinement changes its numerical representation. Full-wave model error is a separate issue.

## Ten-point rubric

- Prediction and physical reasoning: 2 points.
- Reproducible parameter choices, units, and labelled plots: 3 points.
- Quantitative comparison or numerical validation: 3 points.
- Model limitations and interpretation of disagreement: 2 points.

Grade reasoning and evidence, not an attractive plot alone. Results may vary with a deliberately changed seed or model; require the learner to record it.

## Common misconceptions

- Removing h₂π leaves the field multiplier unchanged… The complex transmission is unchanged when the removed phase is an integer multiple of 2π.

- An ideal lossless two-level grating sends about 41% into its design order. The rest… Low efficiency in one order does not imply absorption.

- A finer grid always fixes a thin-element model that neglects sidewall scattering. Grid refinement solves the chosen model more accurately; it cannot add omitted physical coupling.

## Scope

1D scalar thin-element lens, fixed n = 1.5, design λ₀ = 550 nm, aperture radius 15 μm and paraxial focal length 120 μm. Propagation uses exact scalar ASM. Fresnel reflection, material dispersion, polarization, and sidewall coupling are omitted.

Optional extension: Measure blazed-grating order efficiency, vary wavelength, and smooth a fabricated height profile before propagation. Separate fabrication approximation, sampling error, and model error.
