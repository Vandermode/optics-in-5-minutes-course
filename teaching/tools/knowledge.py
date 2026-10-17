"""Curated concept relationships, independent of episode numbering or ordering."""
import html
import json

from preparation import TOPICS

REGIONS = ["Waves & representations", "Measurement & reconstruction",
           "Structures & devices", "Computation & design"]

CONCEPTS = [
    dict(id="field", label="Complex field & phase", region=0,
         description="Keep amplitude and phase together to describe what light does before a detector measures intensity.",
         foundations=["complex"], episodes=["E01", "E02", "E04", "E05", "E06", "E08", "E10"]),
    dict(id="fourier", label="Fourier representation", region=0,
         description="Describe a field by its spatial-frequency components. The same representation connects propagation, imaging, reconstruction, and design.",
         foundations=["complex", "fourier"], episodes=["E01", "E02", "E03", "E05", "E07", "E10"]),
    dict(id="propagation", label="Wave propagation", region=0,
         description="Follow a field through space by advancing its components and combining them again.",
         foundations=["complex", "fourier"], episodes=["E01", "E02"]),
    dict(id="coherence", label="Interference & coherence", region=1,
         description="Connect field correlations to what survives a camera's averaging: interference, fringe visibility, and speckle.",
         foundations=["complex", "averages"], episodes=["E04", "E05", "E03"]),
    dict(id="imaging", label="Imaging & resolution", region=1,
         description="Use point responses and frequency transfer to understand which details an optical image can carry.",
         foundations=["complex", "fourier"], episodes=["E03", "E02"]),
    dict(id="recovery", label="Holography & phase recovery", region=1,
         description="Recover information about an optical field using a reference or constraints on intensity measurements.",
         foundations=["complex", "fourier"], episodes=["E05"]),
    dict(id="phase", label="Phase control", region=2,
         description="Turn a desired phase profile into an optical element, then examine wrapping, quantization, and wavelength dependence.",
         foundations=["complex", "phase-optics"], episodes=["E06", "E02", "E10"]),
    dict(id="periodic", label="Periodicity & band gaps", region=2,
         description="Use repetition to connect diffraction directions, Bloch propagation, and frequency bands that a structure rejects.",
         foundations=["complex", "eigenvectors"], episodes=["E07"]),
    dict(id="modes", label="Eigenmodes & resonance", region=2,
         description="Find field patterns adapted to an operator or structure. Related eigenvalue methods also describe Bloch waves and statistical coherent modes.",
         foundations=["eigenvectors", "complex", "geometric-series"], episodes=["E08", "E07", "E04"]),
    dict(id="sampling", label="Sampling & discretization", region=3,
         description="Understand what changes when continuous fields become arrays: sampling limits, computational windows, and derivative approximations.",
         foundations=["fourier", "finite-differences"], episodes=["E01", "E05", "E09"]),
    dict(id="maxwell", label="Maxwell & FDTD", region=3,
         description="Evolve coupled electric and magnetic fields on a grid, and test the accuracy of time steps and boundaries.",
         foundations=["maxwell", "finite-differences"], episodes=["E09"]),
    dict(id="adjoint", label="Adjoints & inverse design", region=3,
         description="Use a scalar objective and an adjoint calculation to find how every design parameter changes the result.",
         foundations=["derivatives", "complex-matrices", "fourier"], episodes=["E10"]),
]

# "basis" is directional conceptual support, never an episode completion rule.
# "related" identifies a shared method, application, or comparison.
RELATIONS = [
    ("field", "propagation", "basis", "Propagating components accumulate phase."),
    ("fourier", "propagation", "basis", "The angular spectrum decomposes a field into plane waves."),
    ("field", "coherence", "basis", "Field addition produces interference cross terms."),
    ("field", "phase", "basis", "A phase factor changes complex transmission."),
    ("fourier", "imaging", "basis", "Frequency transfer describes which details survive."),
    ("coherence", "imaging", "basis", "Coherence determines how fields or intensities add."),
    ("coherence", "recovery", "basis", "A reference encodes relative phase in interference."),
    ("fourier", "recovery", "basis", "Carrier separation and constraints use frequency space."),
    ("sampling", "maxwell", "basis", "Grid spacing and time steps control numerical error."),
    ("modes", "periodic", "related", "A period's operator has Bloch eigenvalues."),
    ("phase", "periodic", "related", "Periodic phase profiles produce diffraction orders."),
    ("coherence", "modes", "related", "Both use eigendecomposition, on different physical objects."),
    ("propagation", "maxwell", "related", "Compare scalar propagation with electromagnetic field models."),
    ("sampling", "propagation", "related", "Discrete propagation introduces aliasing and window limits."),
    ("sampling", "imaging", "related", "Distinguish sampling limits from optical cutoffs."),
    ("fourier", "periodic", "related", "Spatial harmonics connect to diffraction orders."),
    ("fourier", "adjoint", "related", "E10 uses a Fourier operator as its forward-model example."),
    ("phase", "adjoint", "related", "Phase pixels become adjustable design parameters."),
    ("recovery", "adjoint", "related", "Reconstruction and design share optimization methods."),
    ("modes", "maxwell", "related", "Eigenfields and time evolution offer complementary views."),
]


def esc(value):
    return html.escape(str(value), quote=True)


def knowledge_map_html(catalog):
    episodes = {episode["id"]: episode for episode in catalog}
    concepts = {concept["id"]: concept for concept in CONCEPTS}
    assert len(concepts) == len(CONCEPTS), "Duplicate concept IDs"
    assert set(episodes) == {episode for concept in CONCEPTS for episode in concept["episodes"]}
    assert len({frozenset((a, b)) for a, b, _, _ in RELATIONS}) == len(RELATIONS)
    for a, b, kind, _ in RELATIONS:
        assert a in concepts and b in concepts and a != b
        assert kind in {"basis", "related"}

    regions = []
    for index, title in enumerate(REGIONS):
        nodes = ''.join(
            f'<a class="concept-node" data-concept="{node["id"]}" href="#concept-{node["id"]}" '
            f'aria-controls="concept-{node["id"]}">{esc(node["label"])}</a>'
            for node in CONCEPTS if node["region"] == index)
        regions.append(f'<section class="concept-region" data-region="{index}" aria-labelledby="region-{index}">'
                       f'<h3 id="region-{index}">{esc(title)}</h3><div class="concept-nodes">{nodes}</div></section>')

    panels = []
    for node in CONCEPTS:
        routes = ''.join(
            f'<li><a href="{episodes[id]["slug"]}/#idea" data-episode-link="{id}">'
            f'<span class="concept-episode-id">{id}</span><span>{esc(episodes[id]["title"])}</span>'
            '<span class="concept-route-arrow" aria-hidden="true">↗</span></a></li>'
            for id in node["episodes"])
        foundations = ''.join(f'<li><a href="preparation/#{key}">{esc(TOPICS[key]["title"])}</a></li>'
                              for key in node["foundations"])
        connections = []
        for a, b, kind, description in RELATIONS:
            if node["id"] not in (a, b):
                continue
            other = b if a == node["id"] else a
            role = "Related idea" if kind == "related" else "Builds on" if b == node["id"] else "Helps explain"
            mark = "↔" if kind == "related" else "←" if b == node["id"] else "→"
            connections.append(f'<li><span class="concept-relation-kind">{role}</span>'
                               f'<a href="#concept-{other}"><span aria-hidden="true">{mark} </span>'
                               f'{esc(concepts[other]["label"])}</a><p>{esc(description)}</p></li>')
        panels.append(f'''<article id="concept-{node["id"]}" class="concept-panel" tabindex="-1" aria-labelledby="concept-{node["id"]}-title">
<p class="eyebrow">SELECTED CONCEPT</p><h3 id="concept-{node["id"]}-title">{esc(node["label"])}</h3>
<p class="concept-description">{esc(node["description"])}</p>
<h4>Explore in these episodes</h4><ul class="concept-episodes">{routes}</ul>
<details class="concept-context"><summary>Foundations & connections</summary>
<h4>Refresh the foundations</h4><ul class="concept-foundations">{foundations}</ul>
<h4>Connected ideas</h4><ul class="concept-connections">{"".join(connections)}</ul></details>
<a class="concept-back" href="#knowledge-map">↑ Back to the concept map</a></article>''')
    config = json.dumps([dict(a=a, b=b, kind=kind) for a, b, kind, _ in RELATIONS])
    return f'''<section id="knowledge-map" class="knowledge-section" aria-labelledby="knowledge-title">
<div class="knowledge-heading"><div><p class="section-label">EXPLORE BY CONCEPT</p><h2 id="knowledge-title">Find your way through the ideas.</h2></div>
<p>Choose a concept to see its connections and open a related episode.</p></div>
<div class="concept-legend"><span><span class="concept-line basis" aria-hidden="true"></span>Understanding foundation</span><span><span class="concept-line related" aria-hidden="true"></span>Cross-topic connection</span></div>
<p class="concept-map-note">Connections describe ideas, not a required episode order.</p>
<noscript><p>Choose a concept to jump to its related episodes. All concepts and links are available below.</p></noscript>
<div class="knowledge-layout"><div id="concept-graph" class="concept-graph"><svg class="concept-lines" aria-hidden="true"></svg>
<div class="concept-regions">{"".join(regions)}</div></div>
<div id="concept-details" class="concept-details">{"".join(panels)}</div></div>
<p id="concept-status" class="visually-hidden" role="status" aria-live="polite"></p>
<script id="concept-relations" type="application/json">{config}</script></section>'''
