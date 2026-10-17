# E03 · The Diffraction Limit — teaching module

A complete English-language lesson connecting diffraction and image formation to a runnable Python model. The preparation checklist below names the expected background and focused review resources. This module includes the E03 film and can also be used independently.

<!-- course-motivation:start -->
## Why learn this?

**Why does more magnification stop revealing detail?**

You want to distinguish two nearby emitters in a microscope. Enlarging the image also enlarges their blur spots, so a bigger picture alone does not tell you whether the optics captured the separation. You need a way to connect the instrument to the information it records.

**What you gain:** Compare changes in numerical aperture and wavelength, distinguish optical resolution from display zoom, and judge which detail a measured image can support before attempting deconvolution.
<!-- course-motivation:end -->

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

## What is included

- `index.html` + `assets/`: a responsive, buildless course page with an interactive two-point Airy experiment, intensity profiles, modulation-transfer/stripe experiment, and three concept checks with feedback.
- `e03_diffraction_limit.ipynb`: a standalone Colab/Jupyter notebook with predictions, experiments, independent numerical verification, noisy inversion, exercises, worked reasoning, and a 10-point assessment rubric. Saved outputs allow browsing before execution.
- `INSTRUCTOR_NOTES.md`: a suggested lesson sequence, assessment prompts, misconceptions, and model assumptions.
- `tools/`: reproducible generation and notebook execution. These tools are for maintainers; students only need the notebook.
- `tests/`: browser-model checks against independent SciPy Bessel-function references.

The website has no runtime dependencies, CDN imports, telemetry, accounts, or backend. Lato is bundled with its font license. The browser evaluates an analytic scalar model; it does not call AI or a remote simulation service.

## Preview locally

From the repository root:

```bash
python -m http.server 8787 --directory teaching
```

Open http://localhost:8787/e03-diffraction/. Use HTTP because the page imports JavaScript modules. The controls work with keyboard arrows; plot labels and relative intensity scales stay consistent on small screens. Experiment URLs encode the optical settings, display zoom, stripe frequency, and contrast-display choice. Quiz answers are not persisted or uploaded.

## Run in Colab

[Open this notebook directly in Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e03-diffraction/e03_diffraction_limit.ipynb), sign in with a Google account, and select **Runtime → Run all**. The notebook is loaded from the public course repository; no GitHub account, clone, GPU, or paid Colab plan is required. To retain changes, choose **File → Save a copy in Drive**.

You can also download `e03_diffraction_limit.ipynb` and use **File → Upload notebook** in Colab or open it in local Jupyter. The notebook does not depend on any other repository file.

Public lesson: https://vandermode.github.io/optics-in-5-minutes-course/e03-diffraction/

Video companion: [Why Even a Perfect Lens Blurs](https://www.youtube.com/watch?v=1UCPEtZJJzw) (5:12), embedded near the top of the lesson. The film plays on demand in a responsive YouTube player, with a direct viewing link as a fallback.

Public source: https://github.com/Vandermode/optics-in-5-minutes-course

The notebook requires NumPy, SciPy and Matplotlib, which are normally present in Colab. Its first cell installs only missing packages. All seven code cells have been executed in both local Jupyter and a live Google Colab CPU runtime (latest Colab recheck: 2026-10-17; Python 3.13.16, NumPy 2.1.3, SciPy 1.16.3, Matplotlib 3.10.0). The numerical checks passed. All four figures were produced in local Jupyter. In live Colab, the inversion figure displayed correctly, but the Airy, MTF, and FFT figures still encountered rich-output loading failures after reloading, rerunning, and trying a fresh tab. Full live figure-display verification therefore remains incomplete. Exporting the executed notebook from that Colab session also timed out; the public notebook download remains available. If Colab reports that output JavaScript could not load, try reloading and checking the session; [Colab's FAQ](https://research.google.com/colaboratory/faq.html) also documents a targeted third-party-cookie exception for `googleusercontent.com`.

## Publish with GitHub Pages

This is a static site, so no Quarto or Node build step is required. The supplied repository workflow `.github/workflows/e03-course-pages.yml` packages and publishes the complete ten-episode course **only when manually dispatched**. It does not enable Pages, change repository visibility, or automatically deploy on push.

1. Review the content and configure repository **Settings → Pages → Source: GitHub Actions**. Pages availability for private repositories depends on your GitHub plan.
2. In Actions, select **Publish optics course**, select the branch containing this module, and run the workflow.
3. The artifact path is `dist/course/`, prepared by `teaching/tools/export_course.py`. This lesson remains at `e03-diffraction/`; notebook and asset URLs are relative.

Alternatively, export the complete course and upload the resulting directory to a static host. The course navigation expects the episode folders to remain together. The downloadable notebook stays next to the lesson index.

## Add the video when it is published

Replace the explicit “Video companion” release note near the end of `index.html` with the actual YouTube link or embed. No invented URL or inactive play button is included. The lesson itself is complete without a video.

## Model and units

- Vacuum wavelength λ₀ in nanometres in the UI; calculation lengths in micrometres.
- NA = n sin θ; equal incoherent emitters; ideal circular pupil; in-focus, monochromatic, shift-invariant scalar imaging.
- Peak-normalized Airy intensity `h(r) = [2 J1(v)/v]^2`, `v = 2π NA r/λ₀`, with `h(0)=1`. Source intensities add.
- Rayleigh reference `d_R = 0.6098349456332522 λ₀/NA`. This is a criterion for equal incoherent points, not a universal limit on estimating positions.
- Incoherent intensity cutoff `fc = 2 NA/λ₀`. The circular-pupil OTF is real and nonnegative; the analytic MTF is zero at and beyond cutoff.
- Display zoom only changes the field of view. The image uses a fixed 0–2 relative intensity scale; optional square-root display reveals rings. The profile always uses linear intensity. Peak normalization does not represent equal photon budgets across NA.
- The notebook uses a unit-sum PSF for FFT convolution, verifies OTF/pupil autocorrelation, and explicitly distinguishes a central PSF cross-section from the line-spread function.
- The noisy inversion exercise uses a periodic 1D stripe object, equivalent to the `fy=0` slice of the 2D OTF. It labels K as a regularization parameter. It does not claim to reconstruct missing frequencies.

See the on-page and notebook references. High NA is illustrative within the scalar approximation; aberrations, polarization, detector integration, and other real-world effects are omitted.

## Rebuild and verify

```bash
python -m pip install numpy scipy matplotlib nbformat nbclient ipykernel
python teaching/e03-diffraction/tools/build_materials.py
node teaching/e03-diffraction/tests/check-model.mjs
python teaching/e03-diffraction/tools/validate_notebook.py
```

Generation rebuilds the Airy lookup table, figure, fonts, numerical reference cases, and unexecuted notebook. Validation runs the notebook from the first cell and writes executed outputs back. The browser table linearly interpolates samples spaced by 1/128 in Bessel argument; reference checks require intensity error below 8×10⁻⁶. The notebook independently checks the Fourier model, DC normalization, pupil autocorrelation, and missing-band behavior.

For release QA, also check the page at desktop and mobile widths, all sliders/presets, quiz feedback, parameter sharing, PNG export, and the downloaded notebook. Test physics-changing controls separately from display zoom.

## Season 1 integration check

The complete-course validator re-executed this notebook in a clean Python 3.12 CPU kernel and saved all four PNG outputs. The lesson now also provides `figures.zip`, and its legacy root notebook download is retained. The earlier live-Colab limitation above remains a frontend verification limit; local execution does not establish successful display in Colab. See [course validation](../VALIDATION.md).
