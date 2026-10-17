"""Opening optical problems and learning payoffs shared by pages and notebooks."""
import html
import re


MOTIVATIONS = {
    "E01": {
        "question": "Where will the light go after this plane?",
        "problem": (
            "You know the field just after a slit or a phase mask, but the detector sits farther away. "
            "Predicting its image means following diffraction and phase through space. The same problem "
            "appears when refocusing a hologram or checking whether a designed optic produces its intended pattern."
        ),
        "payoff": (
            "Build a propagation tool that later lessons reuse, predict how aperture, wavelength, and "
            "distance change a field, and recognize when a surprising pattern comes from the numerical grid."
        ),
    },
    "E02": {
        "question": "Can you filter an image before the camera sees it?",
        "problem": (
            "Suppose you want to suppress fine texture, emphasize boundaries, or reveal a nearly invisible "
            "transparent object. A lens gives you access to the spatial frequencies of the field, so a mask "
            "placed between two lenses can change which features reach the camera."
        ),
        "payoff": (
            "Choose where to place a filter and predict its effect on amplitude and phase objects, "
            "including which image detail the filter removes."
        ),
    },
    "E03": {
        "question": "Why does more magnification stop revealing detail?",
        "problem": (
            "You want to distinguish two nearby emitters in a microscope. Enlarging the image also enlarges "
            "their blur spots, so a bigger picture alone does not tell you whether the optics captured "
            "the separation. You need a way to connect the instrument to the information it records."
        ),
        "payoff": (
            "Compare changes in numerical aperture and wavelength, distinguish optical resolution from "
            "display zoom, and judge which detail a measured image can support before attempting deconvolution."
        ),
    },
    "E04": {
        "question": "Why do fringes disappear when the optics stay put?",
        "problem": (
            "An interference pattern can fade after a change in illumination or exposure even when neither "
            "path moves. A rough surface can also produce stable speckle. Interpreting these observations "
            "requires knowing which relationships between fields survive the camera's averaging."
        ),
        "payoff": (
            "Diagnose changes in fringe visibility, distinguish a static random pattern from lost coherence, "
            "and decide when your imaging model should add fields, intensities, or coherent modes."
        ),
    },
    "E05": {
        "question": "How can you recover what an intensity image hides?",
        "problem": (
            "A transparent sample can change optical thickness while barely changing in-focus brightness. "
            "Yet measuring that thickness or numerically refocusing the recorded light requires phase. "
            "A single intensity image generally leaves several possible fields consistent with the measurement."
        ),
        "payoff": (
            "Use a reference wave to encode phase in measurable fringes, and identify the extra constraints "
            "needed for retrieval when no reference is available. Assess what a successful reconstruction "
            "actually establishes."
        ),
    },
    "E06": {
        "question": "How much of a lens's thickness is doing useful work?",
        "problem": (
            "A compact optical system needs a shallow focusing element. Removing material changes the "
            "phase delay, but at one wavelength a full phase turn can be removed without changing the "
            "thin-element transmission. Fabrication steps and a change of colour then test how far "
            "that shortcut remains useful."
        ),
        "payoff": (
            "Turn a desired phase into a height profile, estimate the cost of using only a few height "
            "levels, and judge the wavelength range and model assumptions behind a flat-optic design."
        ),
    },
    "E07": {
        "question": "How does repetition select where light can travel?",
        "problem": (
            "Repeated grooves can separate wavelengths into different directions, while repeated layers "
            "can form a mirror over a band of wavelengths. Designing either device requires connecting "
            "one repeating unit to the waves supported by the whole structure."
        ),
        "payoff": (
            "Use period and angle to find propagating diffraction orders, connect a layer stack to its "
            "reflection band, and distinguish a prediction of allowed directions from a prediction of "
            "how much power enters each direction."
        ),
    },
    "E08": {
        "question": "How do you route and store light on a chip?",
        "problem": (
            "An optical circuit must keep light inside a guide, transfer it to a neighbouring path, or "
            "build it up in a resonator. Drawing the paths is not enough to predict the power: the "
            "supported field shapes and their relative phases determine what the device does."
        ),
        "payoff": (
            "Connect confinement to guided modes, choose a coupling length from mode beating, and "
            "explain how round-trip phase, coupling, and loss set a ring's spectral response."
        ),
    },
    "E09": {
        "question": "When can you trust a simulated electromagnetic field?",
        "problem": (
            "A device with reflections, interfaces, or wavelength-scale features may need Maxwell's "
            "coupled fields rather than a prescribed phase mask. Computing those fields still does "
            "not make every plotted ripple physical: the grid, time step, and artificial boundaries "
            "can change the result."
        ),
        "payoff": (
            "Build a time-domain Maxwell solver and test its stability, propagation error, and boundary "
            "reflections before interpreting a simulated device response."
        ),
    },
    "E10": {
        "question": "How do you improve a design with thousands of controls?",
        "problem": (
            "You want a phase mask to produce a chosen intensity pattern, but each pixel is a design "
            "variable. Perturbing every pixel separately makes each optimization step expensive. "
            "You need the sensitivity of one objective to all those variables at once."
        ),
        "payoff": (
            "Compute and verify a gradient with an adjoint calculation, use it to improve the pattern, "
            "and assess the resulting design without assuming that a lower error proves a global optimum."
        ),
    },
}


def motivation_html(episode, *, original_e03=False):
    item = {key: html.escape(value) for key, value in MOTIVATIONS[episode].items()}
    classes = "motivation motivation-e03" if original_e03 else "motivation"
    return f'''<section id="motivation" class="{classes}" aria-labelledby="motivation-title">
<div><p class="motivation-kicker">{episode} / WHY LEARN THIS?</p>
<h2 id="motivation-title">{item["question"]}</h2></div>
<div class="motivation-copy"><p>{item["problem"]}</p>
<p><strong>What you gain:</strong> {item["payoff"]}</p></div>
</section>'''


def motivation_markdown(episode):
    item = MOTIVATIONS[episode]
    return f'''<!-- course-motivation:start -->
## Why learn this?

**{item["question"]}**

{item["problem"]}

**What you gain:** {item["payoff"]}
<!-- course-motivation:end -->'''


def refresh_motivation_markdown(text, episode):
    """Sync hand-authored E03 openings, placing motivation before preparation."""
    block = motivation_markdown(episode)
    if "<!-- course-motivation:start -->" in text:
        return re.sub(r"<!-- course-motivation:start -->.*?<!-- course-motivation:end -->",
                      lambda match: block, text, flags=re.S)
    anchor = "<!-- course-preparation:start -->"
    if anchor not in text:
        raise ValueError("Add the preparation block before inserting the lesson motivation.")
    return text.replace(anchor, block + "\n\n" + anchor, 1)
