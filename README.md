# Optics in 5 Minutes · Season 1 teaching course

Public lessons and runnable notebooks by Vandermode.

[Open the ten-episode course](https://vandermode.github.io/optics-in-5-minutes-course/)

Each module includes its five-minute film, an interactive lesson, three concept checks, a standalone CPU notebook with saved figures, worked exercises, and instructor notes with a ten-point rubric. Allow 12–15 minutes for a lesson and 25–30 minutes for its core lab; optional extensions go deeper.

| Episode | Interactive lesson | Notebook |
| --- | --- | --- |
| E01 | [The angular spectrum method](https://vandermode.github.io/optics-in-5-minutes-course/e01-angular-spectrum/) | [Open in Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e01-angular-spectrum/e01_angular_spectrum.ipynb) |
| E02 | [Why a lens computes a Fourier transform](https://vandermode.github.io/optics-in-5-minutes-course/e02-lens-fourier/) | [Open in Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e02-lens-fourier/e02_lens_fourier.ipynb) |
| E03 | [The diffraction limit](https://vandermode.github.io/optics-in-5-minutes-course/e03-diffraction/) | [Open in Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e03-diffraction/e03_diffraction_limit.ipynb) |
| E04 | [Coherence and what a camera averages](https://vandermode.github.io/optics-in-5-minutes-course/e04-coherence/) | [Open in Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e04-coherence/e04_coherence.ipynb) |
| E05 | [Holography and the phase problem](https://vandermode.github.io/optics-in-5-minutes-course/e05-phase-problem/) | [Open in Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e05-phase-problem/e05_phase_problem.ipynb) |
| E06 | [Flat optics and wrapped phase](https://vandermode.github.io/optics-in-5-minutes-course/e06-flat-optics/) | [Open in Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e06-flat-optics/e06_flat_optics.ipynb) |
| E07 | [Gratings, Bloch waves, and band gaps](https://vandermode.github.io/optics-in-5-minutes-course/e07-periodic-structures/) | [Open in Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e07-periodic-structures/e07_periodic_structures.ipynb) |
| E08 | [Waveguides, modes, and resonators](https://vandermode.github.io/optics-in-5-minutes-course/e08-trapping-light/) | [Open in Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e08-trapping-light/e08_trapping_light.ipynb) |
| E09 | [Maxwell on a grid](https://vandermode.github.io/optics-in-5-minutes-course/e09-maxwell-grid/) | [Open in Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e09-maxwell-grid/e09_maxwell_grid.ipynb) |
| E10 | [Designing light with gradients](https://vandermode.github.io/optics-in-5-minutes-course/e10-adjoint-design/) | [Open in Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e10-adjoint-design/e10_adjoint_design.ipynb) |

The notebooks use NumPy, SciPy, and Matplotlib. No repository clone, external dataset, GPU, or paid Colab plan is required. Sign in with a Google account to run a notebook in Colab; save a copy to retain edits. Every module includes a figure ZIP if rich notebook outputs fail to load.

[Course structure and local development](teaching/README.md) · [Numerical and browser verification](teaching/VALIDATION.md)

All ten notebooks passed clean local CPU execution, including optional sections. Live execution and figure display of the nine new notebooks in authenticated Colab remain unverified; the validation record separates these checks.

For local preview, run `python -m http.server 8787 --directory teaching` and open [the local course](http://localhost:8787/). The lessons use buildless HTML, CSS, JavaScript, and Canvas; embedded films stream from YouTube. The manually dispatched Pages workflow publishes the complete course; CI checks changes without deploying Pages.

E03’s existing notebook path and legacy root experiment links remain available. The bundled Lato fonts retain their [license](teaching/shared/fonts/LICENSE-Lato.txt).
