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

EPISODE_FOCUS = {
    "E01": "propagation", "E02": "fourier", "E03": "imaging",
    "E04": "coherence", "E05": "recovery", "E06": "phase",
    "E07": "periodic", "E08": "modes", "E09": "maxwell", "E10": "adjoint",
}

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


def write_knowledge_data(root, catalog):
    """Share the authored overview with the finer, browser-side term layer."""
    data = dict(concepts=CONCEPTS, regions=REGIONS, episodes=catalog, focus=EPISODE_FOCUS)
    (root / 'shared/knowledge-data.js').write_text(
        '// Generated by tools/knowledge.py; edit the authored concept map instead.\n'
        + 'export const knowledge = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n')


def episode_concepts_html(episode):
    """A short entry point near the chapter opening, using the same map data."""
    links = ''.join(f'<a href="#concept-{node["id"]}" data-chapter-concept="{node["id"]}">{esc(node["label"])}</a>'
                    for node in CONCEPTS if episode in node["episodes"])
    return f'''<div class="chapter-concept-entry">
<p class="eyebrow">CONCEPTS IN THIS EPISODE</p>
<nav aria-label="Concepts in this episode">{links}</nav>
<a class="chapter-map-link" href="#knowledge-map">See this episode in the concept map ↓</a></div>'''


def knowledge_map_html(catalog, episode=None):
    episodes = {entry["id"]: entry for entry in catalog}
    concepts = {concept["id"]: concept for concept in CONCEPTS}
    assert len(concepts) == len(CONCEPTS), "Duplicate concept IDs"
    assert set(episodes) == {episode for concept in CONCEPTS for episode in concept["episodes"]}
    assert set(EPISODE_FOCUS) == set(episodes)
    assert all(id in concepts[focus]["episodes"] for id, focus in EPISODE_FOCUS.items())
    assert len({frozenset((a, b)) for a, b, _, _ in RELATIONS}) == len(RELATIONS)
    for a, b, kind, _ in RELATIONS:
        assert a in concepts and b in concepts and a != b
        assert kind in {"basis", "related"}

    prefix = "../" if episode else ""
    members = {node["id"] for node in CONCEPTS if episode in node["episodes"]}
    regions = []
    for index, title in enumerate(REGIONS):
        nodes = ''.join(
            f'<a class="concept-node" data-concept="{node["id"]}" href="#concept-{node["id"]}" '
            + ('data-in-episode aria-describedby="chapter-concept-key" ' if node["id"] in members else '')
            + f'aria-controls="concept-{node["id"]}">{esc(node["label"])}</a>'
            for node in CONCEPTS if node["region"] == index)
        regions.append(f'<section class="concept-region" data-region="{index}" aria-labelledby="region-{index}">'
                       f'<h3 id="region-{index}">{esc(title)}</h3><div class="concept-nodes">{nodes}</div></section>')

    def episode_route(id, concept, via=None, description=None):
        query = f'?concept={concept}'
        extra = f' data-via-concept="{via}"' if via else ''
        reason = (f'<small class="concept-route-via"><span>Via</span> {esc(concepts[via]["label"])}</small>'
                  f'<small class="concept-route-reason">{esc(description)}</small>') if via else ''
        return (f'<li><a href="{prefix}{episodes[id]["slug"]}/{query}#idea" data-episode-link="{id}"{extra}>'
                f'<span class="concept-episode-id">{id}</span><span class="concept-route-copy">'
                f'<span>{esc(episodes[id]["title"])}</span>{reason}</span>'
                '<span class="concept-route-arrow" aria-hidden="true">↗</span></a></li>')

    panels = []
    for node in CONCEPTS:
        direct = [id for id in node["episodes"] if id != episode]
        routes = ''.join(episode_route(id, node["id"]) for id in direct)
        route_heading = "Other episodes with this concept" if episode else "Explore in these episodes"
        route_section = f'<h4>{route_heading}</h4><ul class="concept-episodes">{routes}</ul>' if routes else ''
        foundations = ''.join(f'<li><a href="{prefix}preparation/#{key}">{esc(TOPICS[key]["title"])}</a></li>'
                              for key in node["foundations"])
        connections = []
        bridges = []
        visited = {episode, *direct}
        for a, b, kind, description in RELATIONS:
            if node["id"] not in (a, b):
                continue
            other = b if a == node["id"] else a
            role = "Related idea" if kind == "related" else "Builds on" if b == node["id"] else "Helps explain"
            mark = "↔" if kind == "related" else "←" if b == node["id"] else "→"
            connections.append(f'<li><span class="concept-relation-kind">{role}</span>'
                               f'<a href="#concept-{other}"><span aria-hidden="true">{mark} </span>'
                               f'{esc(concepts[other]["label"])}</a><p>{esc(description)}</p></li>')
            if episode and len(bridges) < 3:
                # Offer one chapter per connected idea. Prefer that concept's
                # main example, and avoid repeating direct routes or this page.
                candidates = sorted(concepts[other]["episodes"], key=lambda id: EPISODE_FOCUS[id] != other)
                target = next((id for id in candidates if id not in visited), None)
                if target:
                    bridges.append(episode_route(target, other, via=other, description=description))
                    visited.add(target)
        if bridges:
            route_section += ('<h4>Explore through connected ideas</h4>'
                              f'<ul class="concept-episodes concept-related-episodes">{"".join(bridges)}</ul>')
        membership = '<p class="concept-membership">In this episode</p>' if node["id"] in members else ''
        home_link = (f'<a class="concept-home" href="../?concept={node["id"]}#knowledge-map">Explore the full course map ↗</a>') if episode else ''
        panels.append(f'''<article id="concept-{node["id"]}" class="concept-panel" tabindex="-1" aria-labelledby="concept-{node["id"]}-title">
<p class="eyebrow">SELECTED CONCEPT</p><h3 id="concept-{node["id"]}-title">{esc(node["label"])}</h3>
{membership}
<p class="concept-description">{esc(node["description"])}</p>
{route_section}
<details class="concept-context"><summary>Foundations & connections</summary>
<h4>Refresh the foundations</h4><ul class="concept-foundations">{foundations}</ul>
<h4>Connected ideas</h4><ul class="concept-connections">{"".join(connections)}</ul></details>
<div class="concept-panel-links"><a class="concept-back" href="#knowledge-map">↑ Back to the concept map</a>{home_link}</div></article>''')
    config = json.dumps([dict(a=a, b=b, kind=kind) for a, b, kind, _ in RELATIONS])
    heading = 'Keep exploring from this episode.' if episode else 'Find your way through the ideas.'
    introduction = ('Highlighted concepts appear in this episode. Select any concept to find related episodes.'
                    if episode else 'Choose a concept to see its connections and open a related episode.')
    label = f'<span translate="no">{episode} / </span><span>CONNECTED IDEAS</span>' if episode else 'EXPLORE BY CONCEPT'
    attributes = f' data-current-episode="{episode}" data-default-concept="{EPISODE_FOCUS[episode]}"' if episode else ''
    membership_key = '<span id="chapter-concept-key"><span class="concept-chapter-key" aria-hidden="true"></span>In this episode</span>' if episode else ''
    return f'''<section id="knowledge-map" class="knowledge-section{" knowledge-lesson" if episode else ""}" aria-labelledby="knowledge-title"{attributes}>
<div class="knowledge-heading"><div><p class="section-label">{label}</p><h2 id="knowledge-title">{heading}</h2></div>
<p>{introduction}</p></div>
<div class="concept-search" hidden>
<form role="search" aria-labelledby="concept-search-label">
<label id="concept-search-label" for="concept-search-input">Search concepts</label>
<div class="concept-search-controls"><div class="concept-search-field">
<input id="concept-search-input" type="search" name="q" maxlength="120" autocomplete="off" spellcheck="false" placeholder="PSF, coherence length, 相干长度…" aria-describedby="concept-search-hint" aria-controls="concept-search-results">
<button class="concept-search-clear" type="button" aria-label="Clear search" hidden>×</button></div>
<button class="concept-search-submit" type="submit">Search</button></div>
<p id="concept-search-hint">Use an English or Chinese keyword. Choose a result, or press Enter to open the first match.</p></form>
<p class="concept-search-status" role="status" aria-live="polite" aria-atomic="true"></p>
<ul id="concept-search-results" class="concept-search-results" aria-label="Matching concepts" hidden></ul>
<button class="concept-search-more" type="button" hidden></button></div>
<div class="concept-legend">{membership_key}<span><span class="concept-line basis" aria-hidden="true"></span>Understanding foundation</span><span><span class="concept-line related" aria-hidden="true"></span>Cross-topic connection</span></div>
<p class="concept-map-note">Connections describe ideas, not a required episode order.</p>
<p class="concept-depth-note" hidden>Start with a core concept. Expand its specific terms when you want more detail.</p>
<noscript><p>Choose a concept to jump to its related episodes. All concepts and links are available below.</p></noscript>
<div class="knowledge-layout"><div id="concept-graph" class="concept-graph"><svg class="concept-lines" aria-hidden="true"></svg>
<div class="concept-regions">{"".join(regions)}</div></div>
<div id="concept-details" class="concept-details">{"".join(panels)}</div></div>
<p id="concept-status" class="visually-hidden" role="status" aria-live="polite"></p>
<script id="concept-relations" type="application/json">{config}</script></section>'''
