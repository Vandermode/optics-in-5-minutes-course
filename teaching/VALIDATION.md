# Verification record · Season 1 teaching course

Checked on 2026-10-17. The machine-readable reports are [notebook execution](validation-notebooks.json) and [browser verification](validation-browser.json). These checks validate the stated numerical models; they do not establish experimental device accuracy.

## Notebook execution and figures

All ten notebooks ran from a fresh kernel in an empty temporary working directory, with two CPU numerical-library threads and no repository imports or external datasets. The environment was Python 3.12.13, NumPy 2.4.3, SciPy 1.16.3, and Matplotlib 3.11.2. Every optional section also ran. All 62 code cells completed, all scientific assertions passed, and 40 static PNG outputs were saved and visually inspected. Execution time includes kernel startup and the extensions; learner working time is longer because it includes prediction, parameter changes, and interpretation.

| Notebook | Executed code cells | PNG figures | Total CPU run |
| --- | ---: | ---: | ---: |
| E01 | 6 | 3 | 4.53 s |
| E02 | 6 | 4 | 3.70 s |
| E03 | 7 | 4 | 5.40 s |
| E04 | 6 | 4 | 4.29 s |
| E05 | 6 | 4 | 5.79 s |
| E06 | 6 | 4 | 3.81 s |
| E07 | 6 | 4 | 4.11 s |
| E08 | 6 | 4 | 5.33 s |
| E09 | 6 | 4 | 6.69 s |
| E10 | 7 | 5 | 6.61 s |

Each lesson includes a ZIP and individual PNG files, independent of notebook iframe rendering. Labels and legends were inspected; the new labs use constrained figure layout to prevent adjacent axes from colliding.

## Numerical evidence

The browser-model suite passes 9,112 numerical comparisons and invariants, plus E03's existing regression suite. Independent fixtures use NumPy FFTs, complex 2×2 transfer matrices, SciPy root finding, analytic limits, and central finite differences. Every default and named preset yields finite plotted data.

| Episode | Checks and representative result |
| --- | --- |
| E01 | Identity at z=0, analytic grid-plane-wave phase, propagating-band norm, evanescent decay; errors below 2×10⁻¹⁴ in the notebook examples. Padding is compared independently of sample spacing. |
| E02 | Correct focal coordinates and sample spacing; exact discrete 4f reversal; direct Fresnel kernel versus FFT plus output chirp agrees to 6×10⁻¹⁵ relative field error. |
| E03 | Airy origin/zero, Rayleigh dip, MTF cutoff, source addition, symmetry, units, and zoom invariance. Browser Airy error versus SciPy is below 3.7×10⁻⁶. |
| E04 | Gaussian spectral quadrature, visibility normalization, unchanged contrast for repeated fixed speckle, independent-pattern contrast, positive semidefinite mutual intensity, and all-mode/source-sum agreement within 8×10⁻¹⁵. |
| E05 | Isolated-sideband complex-field reconstruction and refocusing agree within 5×10⁻¹⁵. Overlap, Nyquist violation, and crop truncation deliberately increase error. Seeded GS runs satisfy amplitude constraints and show residual ambiguity. |
| E06 | Wrapped/unwrapped fields agree at the design wavelength. Numerical staircase-order efficiency agrees with sinc²(1/M) within 8×10⁻¹⁰. Axial maximum and paraxial focal prediction are distinguished. |
| E07 | Lossless stack flux, no-contrast limit, Bloch trace, and grating-angle identity. RCWA agrees with uniform-film Airy amplitudes; final retained-order refinement changes reflectance by 1.39×10⁻⁴. Flux conservation is checked separately from convergence. |
| E08 | Effective-index bounds, orthogonality, matrix residual below 2×10⁻¹⁴, analytic slab comparison, supermode power conservation, all-pass ring power balance, and critical coupling. |
| E09 | Reference-subtracted dielectric reflectance is 0.04084 versus analytic 0.04 on the stated grid. PML echo decreases under refinement; stable/unstable 1D steps and a 2D CPML reference comparison are exercised. Echo ratios apply to these specific pulses and windows. |
| E10 | Every phase derivative and every small Helmholtz derivative checked by central differences; relative errors below 7×10⁻¹⁰. Accepted backtracking steps decrease loss. Quantization and smoothing are evaluated afterward. |

## Browser behavior and compatibility

Headless Chromium was used at 1280×900 and 390×900. Checks cover all ten lessons, nonblank computed canvases, labels, horizontal overflow, keyboard slider operation, every new control, presets, reset, concept feedback, PNG downloads, clipboard experiment links, and URL state restoration. E09 and E10 workers stop and restart correctly. No browser console or page errors were observed. All 49 linked local course routes and downloads return HTTP 200. A package-level scan also checked 165 local HTML/Markdown links and assets. The added E09 stored-time selector was checked separately at 10 and 27 periods and after reset.

The course browser suite substitutes a minimal document for YouTube's iframe, so third-party player scripts and permission messages do not affect checks of the lesson code. The report marks external video playback as outside this suite; playback is checked separately against the real player.

The E03 regression preserves its existing model and notebook GitHub path. Legacy root experiment parameters, section anchors, and notebook download remain available. The homepage has a distinct skip-link anchor so it does not conflict with E03's historical #main link. Grating rays use equal coordinate scales; line weights do not imply diffraction efficiency.

## Live Colab verification limit

Local notebook execution and saved-image inspection are complete. The nine new notebooks have not been executed in an authenticated live Colab runtime in this session: an authenticated browser-control connection was unavailable. Their public links and notebook files can be checked independently, but that is not a substitute for a live kernel test or iframe display test.

The earlier E03 live Colab check passed its seven numerical cells, while three of four rich figure outputs still failed to load; its inversion figure displayed. That historical result is recorded in the E03 README. No claim is made that the new publication fixes Colab's frontend. Saved PNG outputs, lesson figure ZIPs, and the Colab Files-sidebar download provide fallbacks.

## Reproduce

See [the course README](README.md) for installation and commands. Numerical fixtures and all tests are included. The manual Pages workflow packages the whole course; the CI workflow checks notebooks and browser behavior without deploying Pages. Publication preserves the existing Site's URL and public audience, with the previous saved version retained by Sites.
