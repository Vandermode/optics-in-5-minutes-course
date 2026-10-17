# Instructor notes · E05 · Holography and the phase problem

<!-- course-motivation:start -->
## Why learn this?

**How can you recover what an intensity image hides?**

A transparent sample can change optical thickness while barely changing in-focus brightness. Yet measuring that thickness or numerically refocusing the recorded light requires phase. A single intensity image generally leaves several possible fields consistent with the measurement.

**What you gain:** Use a reference wave to encode phase in measurable fringes, and identify the extra constraints needed for retrieval when no reference is available. Assess what a successful reconstruction actually establishes.
<!-- course-motivation:end -->

For learners with undergraduate calculus, linear algebra, and basic Python. Each lesson names the specific ideas it uses and links to focused refreshers. Review unfamiliar topics as needed; the lesson develops the optical method. Use the checklist below before class. During the lesson, give a short notation reminder or point back to a resource when needed, then keep the explanation focused on the current optical question.

<!-- course-preparation:start -->
## Before this lesson

Use these focused refreshers if an idea is unfamiliar; you do not need to complete each linked course.

- **Complex amplitudes and phase:** Expand interference between a signal and a known reference field. Used here: The cross terms carry relative phase into a measured intensity. [Review: MIT OCW · Complex Arithmetic and Exponentials](https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-i-first-order-differential-equations/complex-arithmetic-and-exponentials/). Read the notes on Euler's formula, polar form, multiplication, and complex conjugation. The differential-equation applications can wait.
- **Fourier transforms and convolution:** Recognize that a linear phase ramp shifts a Fourier spectrum. Used here: An off-axis reference separates the hologram's sidebands. [Review: TU Delft · Fourier analysis](https://qiweb.tudelft.nl/aoi/fourieranalysis/fourieranalysis/). Use §4.1 for the transform pair, then §4.2.1–4.2.4 for linearity, scaling, shifts, and convolution. Consult §4.2.7 for two successive transforms.

**Python preparation:** Select a Fourier sideband and alternate between complex amplitude and phase arrays.
- [NumPy · The absolute basics for beginners](https://numpy.org/doc/stable/user/absolute_beginners.html) — Use the sections on array shape, indexing and slicing, basic operations, and broadcasting. Practice changing one parameter and rerunning a cell.
- [NumPy · Discrete Fourier Transform](https://numpy.org/doc/stable/reference/routines.fft.html) — Read Implementation details and Normalization; look up fftfreq, fftshift, and ifftshift as they appear in the notebook.

**Developed here:** Recover a field with a reference and compare that route with reconstruction from intensity constraints.

[All prerequisites and learning resources](https://vandermode.github.io/optics-in-5-minutes-course/preparation/)
<!-- course-preparation:end -->

## Outcomes

- Expand a hologram into its background and interference terms.
- Choose a carrier and Fourier crop that isolate the desired field.
- Distinguish reference-based recovery from iterative phase retrieval and its ambiguities.

## Suggested 45–50-minute sequence

1. Predict (3 minutes): A transparent object can change phase while leaving its in-focus intensity nearly uniform. What extra field would make that phase affect a camera reading?
2. Explore (8 minutes): Use the isolated-sideband preset and compare the known and reconstructed phases. Check the numerical field error rather than judging the colours alone. Reduce the carrier until the sideband overlaps the central term. Keep the crop fixed and explain why translating the crop cannot remove mixed information. Restore the carrier and shrink the crop. Then increase the carrier toward Nyquist. Distinguish lost bandwidth from aliasing.
3. Explain (6 minutes): use the equation and measurement or boundary assumptions to connect the observed changes.
4. Check (3 minutes): ask the three page questions before showing feedback; have learners justify an answer.
5. Compute (20–25 minutes): run the core notebook, alter one parameter, and inspect its numerical checks.
6. Reflect (5 minutes): state one changed prediction, the evidence, and a remaining model limitation.

Use the optional extension for a longer lab rather than rushing the core. The quiz is local and does not collect student responses.

## Assessment and worked reasoning

### Budget the spectrum

For B = 8 and Nyquist = 64 bins, identify a safe carrier interval and explain both bounds.

**Worked reasoning:** Use 24 < f_c < 56 bins before adding practical margins. The crop must contain B without admitting central or conjugate terms.

### Compare crops

Reconstruct with a crop smaller than, equal to, and larger than the object bandwidth.

**Worked reasoning:** A small crop smooths the field. An unnecessarily large crop can collect unwanted terms; colour similarity is not a quantitative error test.

### Test an ambiguity

Rotate a candidate field by a constant phase and compare its Fourier magnitude.

**Worked reasoning:** The magnitude is unchanged. Phase-sensitive comparisons should align global phase when no known reference fixes it.

## Ten-point rubric

- Prediction and physical reasoning: 2 points.
- Reproducible parameter choices, units, and labelled plots: 3 points.
- Quantitative comparison or numerical validation: 3 points.
- Model limitations and interpretation of disagreement: 2 points.

Grade reasoning and evidence, not an attractive plot alone. Results may vary with a deliberately changed seed or model; require the learner to record it.

## Common misconceptions

- Why tilt the reference? The carrier shifts the cross terms, allowing a Fourier filter to isolate one.

- Increasing the carrier without limit eventually… The sideband’s outer edge must remain inside the sampled frequency range.

- A phase-retrieval run reaches a small magnitude residual. That guarantees… Uniqueness requires sufficient data and appropriate assumptions; magnitude agreement alone is weaker.

## Scope

Coherent, stable, monochromatic scalar fields and a known plane-wave reference. The browser uses a periodic, noiseless, explicitly band-limited object and integer-bin carriers. Real detectors add noise, finite pixels, nonuniform reference amplitude, and calibration errors.

Optional extension: Numerically refocus a recovered field, compare several Gerchberg–Saxton initializations, and design a phase-only two-spot hologram.
