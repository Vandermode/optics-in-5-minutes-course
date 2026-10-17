"""Focused prerequisites and primary learning resources for the teaching course."""
import html
import re

SITE = "https://vandermode.github.io/optics-in-5-minutes-course/"
AUDIENCE = (
    "For learners with undergraduate calculus, linear algebra, and basic Python. "
    "Each lesson names the specific ideas it uses and links to focused refreshers. "
    "Review unfamiliar topics as needed; the lesson develops the optical method."
)

# These are preparation resources, separate from the research/model references.
# Focus statements identify the relevant portion, rather than assigning a course.
TOPICS = {
    "complex": dict(
        title="Complex amplitudes and phase",
        source="MIT OCW · Complex Arithmetic and Exponentials",
        url="https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-i-first-order-differential-equations/complex-arithmetic-and-exponentials/",
        focus="Read the notes on Euler's formula, polar form, multiplication, and complex conjugation. The differential-equation applications can wait.",
        ready="Read A exp(iφ), distinguish amplitude from phase, and compute |u|² = u u*.",
    ),
    "fourier": dict(
        title="Fourier transforms and convolution",
        source="TU Delft · Fourier analysis",
        url="https://qiweb.tudelft.nl/aoi/fourieranalysis/fourieranalysis/",
        focus="Use §4.1 for the transform pair, then §4.2.1–4.2.4 for linearity, scaling, shifts, and convolution. Consult §4.2.7 for two successive transforms.",
        ready="Interpret Fourier coefficients as weights of spatial oscillations; relate convolution to multiplication in frequency space.",
    ),
    "eigenvectors": dict(
        title="Matrices, eigenvectors, and modes",
        source="MIT OCW · Eigenvalues and Eigenvectors",
        url="https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/pages/least-squares-determinants-and-eigenvalues/eigenvalues-and-eigenvectors/",
        focus="Start with the lecture summary and one 2 × 2 worked problem. Focus on Av = λv and what changes when a matrix is applied repeatedly.",
        ready="Multiply a matrix by a vector and explain why an eigenvector retains its direction.",
    ),
    "complex-matrices": dict(
        title="Complex inner products",
        source="MIT OCW · Lecture 26: Complex matrices; fast Fourier transform",
        url="https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/lecture-26-complex-matrices-fast-fourier-transform/",
        focus="Focus on complex vectors, conjugate transpose, Hermitian matrices, and unitary matrices. The FFT algorithm at the end is optional here.",
        ready="Use x†y as a complex inner product and distinguish conjugate transpose from ordinary transpose.",
    ),
    "averages": dict(
        title="Averages, variance, and correlation",
        source="MIT OCW · Probability readings, Classes 4, 6, and 7",
        url="https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/pages/classes-reading-and-in-class-materials/",
        focus="Read Class 4b on expectation, Class 6a on expectation and variance, and Class 7b on covariance and correlation. R exercises are not needed.",
        ready="Distinguish an average of products from a product of averages, and recognize independent samples.",
    ),
    "phase-optics": dict(
        title="A lens as a phase element",
        source="TU Delft · Coherent optical imaging",
        url="https://qiweb.tudelft.nl/aoi/coherentimaging/coherentimaging/",
        focus="In §7.1, find the thin-lens transmission t_lens and the field immediately after the lens. Focus on multiplication by a position-dependent phase.",
        ready="Describe how multiplying a field by exp(iφ(x,y)) changes phase while preserving its local intensity.",
    ),
    "geometric-series": dict(
        title="Geometric series",
        source="OpenStax · Calculus Volume 2, §5.2",
        url="https://openstax.org/books/calculus-volume-2/pages/5-2-infinite-series",
        focus="Read the Geometric Series subsection: partial sums, the sum 1/(1−r), and the condition |r| < 1. Other series tests are not needed.",
        ready="Sum repeated contributions whose amplitudes differ by the same factor each time.",
    ),
    "maxwell": dict(
        title="Coupled electric and magnetic fields",
        source="OpenStax · University Physics Volume 2, §16.1",
        url="https://openstax.org/books/university-physics-volume-2/pages/16-1-maxwells-equations-and-electromagnetic-waves",
        focus="Read Maxwell's Equations and the discussion connecting changing electric and magnetic fields. Concentrate on Faraday's and Ampère–Maxwell's laws.",
        ready="Explain why a changing electric field and a changing magnetic field must be evolved together.",
    ),
    "finite-differences": dict(
        title="Derivatives on a sampled grid",
        source="MIT OCW · Lecture 10: Finite Differences in Time",
        url="https://ocw.mit.edu/courses/18-085-computational-science-and-engineering-i-fall-2008/resources/lecture-10-finite-differences-in-time/",
        focus="Focus on replacing a derivative by a difference quotient and taking successive Euler steps. The stability discussion gives useful context for E09.",
        ready="Read a difference quotient as an approximate derivative and distinguish grid spacing from time-step size.",
    ),
    "derivatives": dict(
        title="Chain rule and gradients",
        source="MIT OCW · Chain Rule, Gradient and Directional Derivatives",
        url="https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/2.-partial-derivatives/part-b-chain-rule-gradient-and-directional-derivatives/",
        focus="Use Sessions 32 and 34 for the multivariable chain rule, Session 35 for the gradient, and Session 38 for directional derivatives.",
        ready="Differentiate a scalar objective through intermediate variables and interpret a gradient as sensitivity to parameters.",
    ),
    "numpy": dict(
        title="NumPy arrays for the labs",
        source="NumPy · The absolute basics for beginners",
        url="https://numpy.org/doc/stable/user/absolute_beginners.html",
        focus="Use the sections on array shape, indexing and slicing, basic operations, and broadcasting. Practice changing one parameter and rerunning a cell.",
        ready="Create and slice an array, apply an elementwise function, and take a sum along an axis.",
    ),
    "fft": dict(
        title="FFT conventions in code",
        source="NumPy · Discrete Fourier Transform",
        url="https://numpy.org/doc/stable/reference/routines.fft.html",
        focus="Read Implementation details and Normalization; look up fftfreq, fftshift, and ifftshift as they appear in the notebook.",
        ready="Distinguish sample coordinates from frequency bins and keep the forward/inverse normalization consistent.",
    ),
}


def skill(topic, need, use):
    return dict(topic=topic, need=need, use=use)


LESSONS = {
    "E01": dict(
        skills=[
            skill("complex", "Read a wave as A exp(iφ) and intensity as |u|².", "The propagation factor changes each component's phase and, for evanescent components, its amplitude."),
            skill("fourier", "Interpret a Fourier transform as a change from position to spatial-frequency components.", "Each component represents one transverse wavevector."),
            skill("eigenvectors", "Recognize a basis expansion and Av = λv.", "The film describes plane waves as eigenfunctions of free-space propagation."),
        ],
        notebook="Use complex arrays and FFT frequency bins; keep physical sample spacing separate from array indices.",
        coding=["numpy", "fft"],
        new="Build the angular-spectrum propagator and test its sampling and propagation limits.",
    ),
    "E02": dict(
        skills=[
            skill("complex", "Follow a position-dependent phase multiplying a complex field.", "A thin lens changes the wavefront before free-space propagation."),
            skill("fourier", "Recognize spatial frequency, the Fourier shift property, and two successive transforms.", "These connect illumination direction, focal-plane position, and the inverted 4f image."),
        ],
        notebook="Use 2D FFTs and distinguish a frequency-bin coordinate from a focal-plane coordinate.",
        coding=["numpy", "fft"],
        new="Connect a lens's Fourier plane to spatial filtering and phase contrast.",
    ),
    "E03": dict(
        skills=[
            skill("complex", "Distinguish a complex field u from its intensity |u|².", "The pupil determines a field response; incoherent imaging uses an intensity PSF."),
            skill("fourier", "Read convolution as a sum of shifted responses and as multiplication in frequency space.", "This connects the point spread function to the image transfer function."),
        ],
        notebook="Use 2D arrays and FFTs; compare curves with the same units and normalization.",
        coding=["numpy", "fft"],
        new="Distinguish a two-point resolution criterion from a spatial-frequency cutoff. The Airy pattern and NA are introduced here.",
    ),
    "E04": dict(
        skills=[
            skill("complex", "Expand |u₁ + u₂|² and recognize complex-conjugate cross terms.", "The camera averages these interference terms during an exposure."),
            skill("averages", "Distinguish averaging a product from multiplying averages, and independent from repeated samples.", "These distinctions govern fringe visibility and speckle contrast."),
        ],
        extra=["eigenvectors", "complex-matrices"],
        extra_use="For the coherent-mode section and notebook extension, review eigenvectors and Hermitian matrices.",
        notebook="Average arrays over a realization axis and compare standard deviation with mean intensity.",
        coding=["numpy"],
        new="Connect detector averaging to temporal coherence, spatial coherence, and speckle; then represent correlations with coherent modes.",
    ),
    "E05": dict(
        skills=[
            skill("complex", "Expand interference between a signal and a known reference field.", "The cross terms carry relative phase into a measured intensity."),
            skill("fourier", "Recognize that a linear phase ramp shifts a Fourier spectrum.", "An off-axis reference separates the hologram's sidebands."),
        ],
        notebook="Select a Fourier sideband and alternate between complex amplitude and phase arrays.",
        coding=["numpy", "fft"],
        new="Recover a field with a reference and compare that route with reconstruction from intensity constraints.",
    ),
    "E06": dict(
        skills=[
            skill("complex", "Use exp(i(φ + 2π)) = exp(iφ) and distinguish phase from physical path length.", "A phase wrap preserves the complex transmission at the design wavelength."),
            skill("phase-optics", "Read a thin optical element as multiplication by a spatially varying phase.", "The lesson converts a focusing phase profile into a physical height profile."),
        ],
        notebook="Apply modulo and quantization to arrays, then compare wavelengths using consistent length units.",
        coding=["numpy", "fft"],
        new="Test wrapped phase, fabrication levels, and chromatic mismatch in a flat optic.",
    ),
    "E07": dict(
        skills=[
            skill("complex", "Track phase gained over one period and distinguish a phase factor from attenuation.", "Bloch factors describe how a field repeats through a structure."),
            skill("eigenvectors", "Multiply 2 × 2 matrices and interpret their eigenvalues.", "A period's transfer matrix determines its propagating and decaying solutions."),
        ],
        extra=["fourier"],
        extra_use="For the RCWA extension, review Fourier harmonics and basis truncation; the notebook introduces boundary matching and efficiencies.",
        notebook="Work with complex matrices and inspect convergence as the number of retained harmonics changes.",
        coding=["numpy"],
        new="Connect grating directions, Bloch propagation, and band gaps; calculate diffraction efficiencies in the extension.",
    ),
    "E08": dict(
        skills=[
            skill("eigenvectors", "Recognize an eigenfunction as a shape preserved by a linear operator.", "A guided mode retains its transverse profile as it propagates."),
            skill("complex", "Add complex amplitudes with different accumulated phases.", "Interference between modes controls power transfer in a coupler."),
            skill("geometric-series", "Sum a geometric series and check its convergence condition.", "Repeated round trips build the ring's resonant response."),
        ],
        notebook="Read eigenvalues and eigenvectors returned by a matrix solver, and plot parameter sweeps.",
        coding=["numpy"],
        new="Calculate slab modes, directional coupling, and ring resonances as three related experiments.",
    ),
    "E09": dict(
        skills=[
            skill("maxwell", "Recognize the coupling between changing electric and magnetic fields.", "The solver advances both fields in alternating updates."),
            skill("finite-differences", "Approximate a derivative with neighboring samples and read partial derivatives as local rates of change.", "The Yee grid replaces spatial and temporal derivatives by staggered differences."),
        ],
        notebook="Use neighboring array slices and a time loop; distinguish field samples, probes, and recorded traces.",
        coding=["numpy"],
        new="Construct a Yee update, test its time-step limit, and measure boundary reflections and PML performance.",
    ),
    "E10": dict(
        skills=[
            skill("derivatives", "Apply the multivariable chain rule to one scalar objective.", "The gradient measures how each phase pixel changes the image mismatch."),
            skill("complex-matrices", "Use a complex inner product and conjugate transpose.", "Moving a linear operator across that inner product produces the adjoint operation."),
            skill("fourier", "Follow a complex field through a forward and inverse Fourier transform.", "The core design example uses a unitary Fourier propagation model."),
        ],
        notebook="Use complex arrays and compare an analytic derivative with a finite-difference perturbation.",
        coding=["numpy", "fft"],
        new="Derive, check, and use an adjoint phase gradient. Prior knowledge of adjoint optimization is not required.",
    ),
}


def esc(value):
    return html.escape(str(value), quote=True)


def resource_html(key):
    topic = TOPICS[key]
    return (f'<li><a href="{esc(topic["url"])}" target="_blank" rel="noopener">'
            f'{esc(topic["source"])} ↗</a><p>{esc(topic["focus"])}</p></li>')


def preparation_html(episode, earlier):
    lesson = LESSONS[episode]
    needs = "".join(
        f'<li><strong>{esc(TOPICS[item["topic"]]["title"])}.</strong> {esc(item["need"])}'
        f'<span class="prep-use">Used here: {esc(item["use"])}</span></li>'
        for item in lesson["skills"]
    )
    resources = "".join(resource_html(item["topic"]) for item in lesson["skills"])
    coding = " · ".join(
        f'<a href="{esc(TOPICS[key]["url"])}" target="_blank" rel="noopener">{esc(TOPICS[key]["source"])} ↗</a>'
        for key in lesson["coding"]
    )
    extra = ""
    if lesson.get("extra"):
        extra = (f'<p class="prep-extra">{esc(lesson["extra_use"])}</p><ul class="prep-resources">'
                 + "".join(resource_html(key) for key in lesson["extra"]) + "</ul>")
    return f'''<section id="preparation" class="preparation" aria-labelledby="preparation-title">
<p class="prep-kicker">BEFORE {episode} / PREREQUISITES</p>
<h2 id="preparation-title">Check your starting point.</h2>
<p class="prep-earlier">{earlier}</p>
<ul class="prep-checklist">{needs}</ul>
<details class="prep-refreshers"><summary>Need a refresher? Open the recommended reading.</summary>
<p>Use the indicated sections for an unfamiliar idea, then return to this lesson.</p>
<ul class="prep-resources">{resources}</ul>{extra}</details>
<p class="prep-lab"><strong>For the notebook:</strong> {esc(lesson["notebook"])}<br>{coding}</p>
<p class="prep-new"><strong>Developed in this lesson:</strong> {esc(lesson["new"])}</p>
<a class="prep-all" href="../preparation/">Browse all prerequisites and learning resources →</a>
</section>'''


def preparation_markdown(episode, heading="Before this lesson"):
    lesson = LESSONS[episode]
    lines = ["<!-- course-preparation:start -->", f"## {heading}", "",
             "Use these focused refreshers if an idea is unfamiliar; you do not need to complete each linked course.", ""]
    for item in lesson["skills"]:
        topic = TOPICS[item["topic"]]
        lines.append(f'- **{topic["title"]}:** {item["need"]} Used here: {item["use"]} '
                     f'[Review: {topic["source"]}]({topic["url"]}). {topic["focus"]}')
    if lesson.get("extra"):
        lines.extend(["", lesson["extra_use"]])
        for key in lesson["extra"]:
            topic = TOPICS[key]
            lines.append(f'- [{topic["source"]}]({topic["url"]}) — {topic["focus"]}')
    lines.extend(["", "**Python preparation:** " + lesson["notebook"]])
    for key in lesson["coding"]:
        topic = TOPICS[key]
        lines.append(f'- [{topic["source"]}]({topic["url"]}) — {topic["focus"]}')
    lines.extend(["", "**Developed here:** " + lesson["new"], "",
                  f'[All prerequisites and learning resources]({SITE}preparation/)',
                  "<!-- course-preparation:end -->"])
    return "\n".join(lines)


def refresh_preparation_markdown(text, episode, heading="Before this lesson"):
    """Keep preparation in hand-authored E03 documents in sync with the catalog."""
    block = preparation_markdown(episode, heading)
    if "<!-- course-preparation:start -->" in text:
        return re.sub(r"<!-- course-preparation:start -->.*?<!-- course-preparation:end -->",
                      lambda match: block, text, flags=re.S)
    legacy = "**Prerequisites:** basic Python arrays, complex numbers, and the idea of a Fourier transform."
    if legacy in text:
        return text.replace(legacy, block)
    if "\n## " in text:
        intro, remainder = text.split("\n## ", 1)
        return intro.rstrip() + "\n\n" + block + "\n\n## " + remainder
    return text.rstrip() + "\n\n" + block + "\n"


def home_preparation_html():
    return '''<section id="preparation" class="section reading"><div class="section-label">PREREQUISITES & LEARNING RESOURCES</div><div>
<h2>Bring the foundations.<br>Follow the connections.</h2>
<p>The course assumes undergraduate calculus, linear algebra, and basic Python. Complex amplitudes and Fourier decomposition connect many topics. Probability, electromagnetic fields, and gradients enter where a lesson needs them.</p>
<p>Each lesson lists the specific skills it uses, explains where they enter, and points to selected readings or lectures. Check the lesson you want to take; review only the unfamiliar topics.</p>
<p><a class="button secondary" href="preparation/">Find a prerequisite or refresher →</a></p>
</div></section>'''


def guide_html(catalog):
    cards = []
    for key, topic in TOPICS.items():
        uses = [entry for entry in catalog
                if any(s["topic"] == key for s in LESSONS[entry["id"]]["skills"])]
        extras = [entry for entry in catalog if key in LESSONS[entry["id"]].get("extra", [])]
        labs = [entry for entry in catalog if key in LESSONS[entry["id"]]["coding"]]
        def episode_links(items):
            return ", ".join(f'<a href="../{entry["slug"]}/#preparation">{entry["id"]}</a>' for entry in items)
        context = []
        if uses:
            context.append("Used in " + episode_links(uses))
        if extras:
            context.append("For the deeper sections of " + episode_links(extras))
        if labs:
            context.append("Notebook preparation for " + episode_links(labs))
        cards.append(f'''<article id="{key}" class="prep-topic"><h2>{esc(topic["title"])}</h2>
<p><strong>You are ready when you can:</strong> {esc(topic["ready"])}</p>
<ul class="prep-resources">{resource_html(key)}</ul><p class="prep-use">{"<br>".join(context)}</p></article>''')
    jumps = " · ".join(f'<a href="#{key}">{esc(topic["title"])}</a>' for key, topic in TOPICS.items())
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prerequisites & learning resources · Optics in 5 Minutes</title><meta name="description" content="Focused preparation for ten computational optics lessons, with specific skills and selected primary learning resources.">
<link rel="icon" href="../e03-diffraction/assets/favicon.svg"><link rel="stylesheet" href="../shared/course.css"><link rel="stylesheet" href="../shared/preparation.css"></head>
<body><a class="skip" href="#resource-main">Skip to resources</a><div class="shell"><header class="topbar"><a class="brand" href="../">OPTICS<span>IN 5 MINUTES</span></a><nav aria-label="Course navigation"><a href="../#course">All lessons</a><a href="#topics">Find a topic</a></nav></header>
<main id="resource-main"><section class="prep-guide-intro"><p class="eyebrow">PREREQUISITES & LEARNING RESOURCES</p><h1>Refresh what you need.<br>Then return to the optics.</h1>
<p>{esc(AUDIENCE)}</p><p>These resources are selected for a specific skill. Start with the indicated section or lecture summary; a whole textbook or course is not assigned. Use each lesson's checklist to decide what needs review.</p>
<p><strong>For browser experiments:</strong> no Python setup is needed. <strong>For notebooks:</strong> be comfortable with Python functions, NumPy arrays, and reading plots.</p>
<nav id="topics" class="prep-topic-nav" aria-label="Preparation topics">{jumps}</nav></section>
<div class="prep-topic-grid">{"".join(cards)}</div></main><footer>OPTICS IN 5 MINUTES · <a href="../#course">Choose a lesson →</a> · <a href="#resource-main">Back to top ↑</a></footer></div></body></html>'''
