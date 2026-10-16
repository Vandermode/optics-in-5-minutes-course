# E03 · The Diffraction Limit — teaching module

A complete English-language lesson for learners with basic calculus and Python. This module supplements the E03 film and is independently usable before the film is published.

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
python -m http.server 8765 --directory teaching/e03-diffraction
```

Open http://localhost:8765. Use HTTP because the page imports JavaScript modules. The controls work with keyboard arrows; plot labels and relative intensity scales stay consistent on small screens. Experiment URLs encode the optical settings, display zoom, stripe frequency, and contrast-display choice. Quiz answers are not persisted or uploaded.

## Run in Colab

[Open this notebook directly in Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e03-diffraction/e03_diffraction_limit.ipynb), sign in with a Google account, and select **Runtime → Run all**. The notebook is loaded from the public course repository; no GitHub account, clone, GPU, or paid Colab plan is required. To retain changes, choose **File → Save a copy in Drive**.

You can also download `e03_diffraction_limit.ipynb` and use **File → Upload notebook** in Colab or open it in local Jupyter. The notebook does not depend on any other repository file.

Public lesson: https://optics-e03-diffraction-lab.w765809530.chatgpt.site/

Public source: https://github.com/Vandermode/optics-in-5-minutes-course

The notebook requires NumPy, SciPy and Matplotlib, which are normally present in Colab. Its first cell installs only missing packages. Its plots and scientific assertions have also been executed in a local Jupyter kernel; a live Colab session is a separate verification step.

## Publish with GitHub Pages

This is a static site, so no Quarto or Node build step is required. The supplied repository workflow `.github/workflows/e03-course-pages.yml` publishes this directory **only when manually dispatched**. It does not enable Pages, change repository visibility, or automatically deploy on push.

1. Review the content and configure repository **Settings → Pages → Source: GitHub Actions**. Pages availability for private repositories depends on your GitHub plan.
2. In Actions, select **Publish E03 course**, select the branch containing this module, and run the workflow.
3. The artifact path is `teaching/e03-diffraction/`. Both the notebook download and local assets use relative URLs, so a repository subpath works.

Alternatively, upload the contents of this directory to any static web host. The downloadable notebook must remain next to `index.html`.

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
