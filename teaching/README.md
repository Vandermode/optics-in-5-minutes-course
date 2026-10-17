# Optics in 5 Minutes · Season 1 teaching course

Ten interactive lessons connect wave propagation to adjoint design. Each lesson combines an embedded five-minute film, a 12–15-minute explanation and experiment, three concept checks, a standalone 25–30-minute Python lab, optional deeper calculations, and instructor notes with worked reasoning and a ten-point rubric.

The website opens in English on a first visit. Use **English / 中文** in the header or chapter sidebar to switch to Simplified Chinese. The choice is remembered, and switching keeps the current section and experiment settings, including controls changed before selecting Run. The homepage, preparation guide, and all ten lessons include Chinese prose, controls, chart labels, quiz feedback, and term explanations. The films and downloadable Python notebooks retain their original language and code.

Every lesson and notebook opens with a concrete optical problem, why it matters, and what studying the topic enables you to do. This motivation comes before the prerequisite checklist.

Each lesson page has a navigation sidebar for its own sections, with the current section highlighted as you read. Terms marked with a dotted underline open an explanation in the selected language with a concise definition, its role in that chapter, and a formula where helpful. The explanation can be closed with its close button or Escape. On narrow screens, the section list expands from “On this page” and explanations open in a modal side panel.

The course is for learners with undergraduate calculus, linear algebra, and basic Python. Each lesson lists the specific prior skills it uses, where they enter the argument, and focused resources for review. Complex amplitudes and Fourier decomposition are useful from E01; probability, electromagnetic fields, and gradients are called out where needed. The optical methods are developed in the lessons. See the [prerequisites and learning resources](https://vandermode.github.io/optics-in-5-minutes-course/preparation/) and the matching preparation block at the start of each notebook.

All numerical data are synthetic and seeded. The notebooks use CPU NumPy, SciPy, and Matplotlib; no renderer imports, repository clone, GPU, private data, or credentials are required.

[Open the course homepage](https://vandermode.github.io/optics-in-5-minutes-course/) · [Public teaching repository](https://github.com/Vandermode/optics-in-5-minutes-course)

| Episode | Lesson | Standalone notebook |
| --- | --- | --- |
| E01 | [The angular spectrum method](https://vandermode.github.io/optics-in-5-minutes-course/e01-angular-spectrum/) | [Open Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e01-angular-spectrum/e01_angular_spectrum.ipynb) |
| E02 | [Why a lens computes a Fourier transform](https://vandermode.github.io/optics-in-5-minutes-course/e02-lens-fourier/) | [Open Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e02-lens-fourier/e02_lens_fourier.ipynb) |
| E03 | [The diffraction limit](https://vandermode.github.io/optics-in-5-minutes-course/e03-diffraction/) | [Open Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e03-diffraction/e03_diffraction_limit.ipynb) |
| E04 | [Coherence and what a camera averages](https://vandermode.github.io/optics-in-5-minutes-course/e04-coherence/) | [Open Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e04-coherence/e04_coherence.ipynb) |
| E05 | [Holography and the phase problem](https://vandermode.github.io/optics-in-5-minutes-course/e05-phase-problem/) | [Open Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e05-phase-problem/e05_phase_problem.ipynb) |
| E06 | [Flat optics and wrapped phase](https://vandermode.github.io/optics-in-5-minutes-course/e06-flat-optics/) | [Open Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e06-flat-optics/e06_flat_optics.ipynb) |
| E07 | [Gratings, Bloch waves, and band gaps](https://vandermode.github.io/optics-in-5-minutes-course/e07-periodic-structures/) | [Open Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e07-periodic-structures/e07_periodic_structures.ipynb) |
| E08 | [Waveguides, modes, and resonators](https://vandermode.github.io/optics-in-5-minutes-course/e08-trapping-light/) | [Open Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e08-trapping-light/e08_trapping_light.ipynb) |
| E09 | [Maxwell on a grid](https://vandermode.github.io/optics-in-5-minutes-course/e09-maxwell-grid/) | [Open Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e09-maxwell-grid/e09_maxwell_grid.ipynb) |
| E10 | [Designing light with gradients](https://vandermode.github.io/optics-in-5-minutes-course/e10-adjoint-design/) | [Open Colab](https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching/e10-adjoint-design/e10_adjoint_design.ipynb) |

## Teaching sequence

Follow the episode order for a full course, or use the preparation links on each lesson. A classroom session can use 3 minutes of prediction, 8 minutes of browser exploration, 6 minutes of explanation, 3 minutes of concept checks, 20–25 minutes of notebook work, and 5 minutes of reflection. Optional sections suit a longer lab or independent study.

E04 follows the corrected extended narrative: fields always superpose, the detector averages cross terms, fixed spatial randomness differs from temporal variation, and independent source contributions lead to mutual intensity and coherent modes. The teaching course does not modify the films.

## Run and rebuild

From the repository root:

```bash
python -m venv .course-venv
.course-venv/bin/pip install -r teaching/requirements-dev.txt
.course-venv/bin/python teaching/tools/build_course.py
npm ci --prefix teaching
.course-venv/bin/python teaching/tools/build_references.py
npm test --prefix teaching
.course-venv/bin/python teaching/tools/validate_notebooks.py
.course-venv/bin/python teaching/tools/render_heroes.py
python -m http.server 8787 --bind 127.0.0.1 --directory teaching
```

Open [the local course](http://127.0.0.1:8787/). In a second terminal, install the QA browser once with `npx --prefix teaching playwright install chromium`, then run `npm run test:browser --prefix teaching`. Set `COURSE_URL` to test another served copy.

The lesson code uses static HTML/CSS, native modules, and Canvas, with no build dependency or backend. Embedded films stream from YouTube and include direct viewing links. Heavy Yee and optimization loops run in cancellable workers. `tools/curriculum.py` contains authored content, `tools/motivation.py` holds the opening problems and learning payoffs, `tools/preparation.py` holds the shared prerequisite checklists and resource selections, `videos.json` holds film metadata for the generated lessons, and `course.json` is the generated navigation manifest. Each episode has a separate physical `model.js`; notebook source is the percent-format `lab.py`. Rebuilding preserves executed outputs when code cells are unchanged, including after edits to preparation or other Markdown.

`shared/glossary.js` contains the authored term definitions, matching aliases, and chapter-specific uses. `shared/reader.js` adds the section navigation and marks each term's first prose occurrence per section, excluding controls, code, equations, and quiz choices. `shared/reader.css` adapts the content to the space beside the panels without reducing text size. `tests/reader.mjs` checks all ten chapters at six widths, including navigation, unchanged prose, term coverage, keyboard access, focus restoration, reading position, and modal behavior.

`tools/locales/zh.json` holds the reviewed Chinese phrases and term aliases. The course builder calls `tools/localization.py` to create sibling `index.zh.html` pages and `shared/zh.js`; missing page translations fail the build. Update the catalog when editing English content, then rebuild instead of editing generated Chinese files. Equations, code, and numerical configuration are preserved, and both languages share the same models. `shared/language.js` translates runtime text and handles preference and state-preserving navigation. `tests/languages.mjs` checks the English default, remembered choice, round-trip controls and section anchors, Chinese glossary and feedback, phone layouts, and navigation without JavaScript or browser storage.

`tools/export_course.py <destination>` packages the complete static course, notebook downloads, and figures without development environments or tests. The manual Pages workflow publishes that package only when dispatched. CI independently runs numerical checks, all notebooks, and browser tests; a push does not trigger Pages publication.

## Public interfaces and compatibility

Each `eNN-topic/` route is stable, with experiment values encoded in query parameters. E03 retains its public GitHub notebook path. Legacy root experiment parameters and section hashes redirect to `e03-diffraction/`, and the old root `e03_diffraction_limit.ipynb` download remains available. The root is now the ten-lesson catalog.

Chinese pages use `index.zh.html` in the same folders, including the [Chinese homepage](https://vandermode.github.io/optics-in-5-minutes-course/index.zh.html). Their internal lesson and preparation links retain Chinese, and their experiment links include the page language as well as parameter values. Both languages have readable static content and ordinary language links when JavaScript is disabled.

Each notebook stores static PNG outputs. Every lesson also provides `figures.zip` and individual PNGs in `figures/`. In Colab, use Runtime → Run all; if an output iframe fails, use the notebook's Files sidebar or the public figure download. See [verification details and limits](VALIDATION.md) for the distinction between local execution and live Colab frontend checks.

## Model boundaries

All demonstrations state their normalization, units, and limitations beside the experiment. Scalar angular-spectrum and thin-element models do not claim vector Maxwell accuracy. The grating-angle display does not invent efficiencies; the notebook's RCWA supplies those. The ring and coupler are reduced models. CPML error is measured against a reference. Adjoint derivatives are checked against finite differences, and optimization has no global-optimum guarantee.

The Lato fonts retain their [license](shared/fonts/LICENSE-Lato.txt). Primary references are listed with each lesson; figures are generated from the lesson models.
