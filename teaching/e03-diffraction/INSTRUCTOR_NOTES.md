# Instructor notes · E03

## Audience and outcomes

For advanced undergraduates or early graduate students in CS, imaging, or engineering with basic Python/calculus. The web lesson builds intuition; the notebook connects it to Fourier computation. No prior microscopy course is assumed. This is a teaching design, not a claim that learning gains have already been measured.

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
