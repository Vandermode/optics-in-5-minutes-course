# Instructor notes · E03

<!-- course-preparation:start -->
## Before this lesson

Use these focused refreshers if an idea is unfamiliar; you do not need to complete each linked course.

- **Complex amplitudes and phase:** Distinguish a complex field u from its intensity |u|². Used here: The pupil determines a field response; incoherent imaging uses an intensity PSF. [Review: MIT OCW · Complex Arithmetic and Exponentials](https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-i-first-order-differential-equations/complex-arithmetic-and-exponentials/). Read the notes on Euler's formula, polar form, multiplication, and complex conjugation. The differential-equation applications can wait.
- **Fourier transforms and convolution:** Read convolution as a sum of shifted responses and as multiplication in frequency space. Used here: This connects the point spread function to the image transfer function. [Review: TU Delft · Fourier analysis](https://qiweb.tudelft.nl/aoi/fourieranalysis/fourieranalysis/). Use §4.1 for the transform pair, then §4.2.1–4.2.4 for linearity, scaling, shifts, and convolution. Consult §4.2.7 for two successive transforms.

**Python preparation:** Use 2D arrays and FFTs; compare curves with the same units and normalization.
- [NumPy · The absolute basics for beginners](https://numpy.org/doc/stable/user/absolute_beginners.html) — Use the sections on array shape, indexing and slicing, basic operations, and broadcasting. Practice changing one parameter and rerunning a cell.
- [NumPy · Discrete Fourier Transform](https://numpy.org/doc/stable/reference/routines.fft.html) — Read Implementation details and Normalization; look up fftfreq, fftshift, and ifftshift as they appear in the notebook.

**Developed here:** Distinguish a two-point resolution criterion from a spatial-frequency cutoff. The Airy pattern and NA are introduced here.

[All prerequisites and learning resources](https://vandermode.github.io/optics-in-5-minutes-course/preparation/)
<!-- course-preparation:end -->

## Audience and outcomes

For advanced undergraduates or early graduate students in CS, imaging, or engineering with calculus, linear algebra, and basic Python. Use the preparation checklist for complex fields, convolution, and Fourier computation; direct learners to its focused resources when a topic is unfamiliar. Keep in-class reminders brief and tied to the imaging question. No prior microscopy course is assumed. This is a teaching design, not a claim that learning gains have already been measured.

Learners should be able to predict PSF changes, distinguish Rayleigh from the incoherent cutoff, and explain why a stable inverse cannot recover an unconstrained null-space component.

## Suggested sequence (40–50 minutes)

1. **Predict (3 min).** Ask which of a shorter wavelength, larger NA, or display zoom changes optical overlap. Collect explanations before showing the controls.
2. **Explore (7 min).** At 550 nm and 520 nm separation, vary only NA. Then vary only zoom. Require a verbal prediction before each change. Read the object-space scale bar.
3. **Explain (5 min).** Add intensities for incoherent sources. Contrast the 0.61 coefficient for equal point sources with the 0.5 coefficient for reciprocal cutoff period. At cutoff the stripe contrast is zero.
4. **Check (3 min).** Use the three on-page concept questions. Discuss reasoning, not just score.
5. **Compute (20–25 min).** Run the notebook, compare analytic Airy and FFT-derived PSFs, verify OTF as pupil overlap, and vary the inversion regularization.
6. **Reflect (5 min).** Ask learners to explain one mistaken initial prediction and what evidence changed it.

## Questions that reveal misconceptions

- “Why is a large image not necessarily a detailed image?” Ask learners to name an invariant when zoom changes.
- “Why do 0.61 λ₀/NA and λ₀/(2 NA) differ?” Require the learner to specify the test object and criterion.
- “Can you Fourier-transform the center line of the Airy pattern to get this OTF slice?” No: integrate the 2D PSF along y to form the line-spread function first.
- “Does a sharper reconstruction prove the fine structure was measured?” Ask which frequencies have H = 0.
- “If NA changes, do these normalized pictures predict the photon count?” No: the browser compares shape with unit single-source peak.

## Feedback and assessment

Use the notebook's short report and 10-point rubric. If piloting the lesson, retain anonymized observations about where students get stuck and what you changed. Do not infer learning from page views. A small informal pilot is useful for revision but does not by itself establish a general causal teaching effect.

The webpage does not transmit or store quiz answers. The instructor can collect a separate worksheet or use the class's existing submission method.

## Scope and adaptation

The ideal browser experiment is noiseless. The notebook adds seeded additive Gaussian noise; shot noise can be a later extension. The scalar model omits vector effects (increasingly relevant at high NA), aberrations, finite source size, defocus, and detector integration.

For a shorter session, use the two-point and stripe experiments plus questions 1–2. For a longer graduate lab, add phase aberrations to the pupil, compare OTF and MTF, or replace the periodic inversion object with a padded finite 2D object.

## Release checklist

- Run the model tests and full notebook; check numerical assertions and rendered figures.
- Test controls and text on mobile and desktop, plus keyboard access.
- Verify the public GitHub-to-Colab link and anonymous notebook download; keep local Jupyter instructions available.
- Replace branch links with the final release ref after merging.
- Add the real E03 YouTube link when available.
- Update the course's visibility deliberately when ready for public students or hiring committees.
