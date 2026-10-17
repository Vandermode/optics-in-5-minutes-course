"""Render the static course from authored curriculum and standalone percent-format labs."""
from pathlib import Path
import html
import json
import re
import shutil
import nbformat
from curriculum import MODULES
from preparation import AUDIENCE, preparation_html, preparation_markdown, refresh_preparation_markdown, home_preparation_html, guide_html
from motivation import motivation_html, motivation_markdown, refresh_motivation_markdown

ROOT = Path(__file__).resolve().parents[1]
VIDEOS = json.loads((ROOT / "videos.json").read_text())
PUBLIC = "https://github.com/Vandermode/optics-in-5-minutes-course"
COLAB = "https://colab.research.google.com/github/Vandermode/optics-in-5-minutes-course/blob/main/teaching"
CATALOG = [dict(id=m["id"],slug=m["slug"],title=m["title"],description=m["deck"],
                prerequisites=m["prerequisites"],notebook=m["slug"].replace("-","_")+".ipynb") for m in MODULES]
CATALOG.append(dict(id="E03",slug="e03-diffraction",title="The diffraction limit",
                    description="Explore point spread functions, numerical aperture, and the spatial frequencies an image can carry.",
                    prerequisites=["E01","E02"],notebook="e03_diffraction_limit.ipynb"))
CATALOG.sort(key=lambda m:m["id"])
BY_ID = {m["id"]:m for m in CATALOG}

def esc(s):
    return html.escape(str(s), quote=True)

def links(items):
    return "".join(f'<li><a href="{esc(url)}" target="_blank" rel="noopener">{esc(label)} ↗</a></li>' for label,url in items)

def video_section(m):
    video = VIDEOS[m["id"]]
    video_id = video["youtubeId"]
    if not re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id):
        raise ValueError(f'Invalid YouTube video ID for {m["id"]}')
    return f'''<section id="video" class="section video-section" aria-labelledby="video-title">
<div class="section-heading"><div><p class="section-label">{m["id"]} / THE FIVE-MINUTE FILM</p><h2 id="video-title">{esc(m["title"])}</h2></div><p>Watch the story, then use the experiment below to test the ideas yourself.</p></div>
<div class="video-player"><iframe width="1280" height="720" src="https://www.youtube-nocookie.com/embed/{video_id}?rel=0&amp;playsinline=1&amp;hl=en" title="{esc(video["title"])}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen; web-share" allowfullscreen></iframe></div>
<p class="video-caption"><span>{esc(video["duration"])} · {m["id"]} · {esc(m["title"])}</span><a href="https://www.youtube.com/watch?v={video_id}" target="_blank" rel="noopener">Watch on YouTube ↗</a></p>
</section>'''

def navigation(id):
    i=next(i for i,m in enumerate(CATALOG) if m["id"]==id)
    prev=CATALOG[i-1] if i else None
    following=CATALOG[i+1] if i+1<len(CATALOG) else None
    a=f'<a href="../{prev["slug"]}/">← {prev["id"]} · {esc(prev["title"])}</a>' if prev else '<a href="../">← Course homepage</a>'
    b=f'<a href="../{following["slug"]}/">{following["id"]} · {esc(following["title"])} →</a>' if following else '<a href="../">Explore the complete course →</a>'
    return '<div class="next-prev" aria-label="Course sequence">'+a+b+'</div>'

def control(c, defaults):
    id=c["id"]
    if c["type"]=="select":
        options="".join(f'<option value="{esc(o["value"])}"{" selected" if o["value"]==defaults[id] else ""}>{esc(o["label"])}</option>' for o in c["options"])
        field=f'<select id="{id}">{options}</select>'
        output=""
    else:
        output=f'<output id="{id}-value" for="{id}"></output>'
        field=f'<input id="{id}" type="range" min="{c["min"]}" max="{c["max"]}" step="{c["step"]}" value="{defaults[id]}" aria-describedby="{id}-help">'
    return f'<div class="control"><label for="{id}">{esc(c["label"])}{output}</label>{field}<p id="{id}-help">{esc(c.get("help",""))}</p></div>'

def page(m):
    notebook=BY_ID[m["id"]]["notebook"]
    requirements=", ".join(f'<a href="../{BY_ID[id]["slug"]}/">{id}</a>' for id in m["prerequisites"]) or "Start here"
    earlier = "Useful earlier lessons: " + requirements if m["prerequisites"] else "This is the first lesson in the course."
    goals="".join("<li>"+esc(x)+"</li>" for x in m["goals"])
    steps="".join("<li>"+esc(x)+"</li>" for x in m["steps"])
    presets="".join(f'<button type="button" data-preset="{i}">{esc(p["label"])}</button>' for i,p in enumerate(m["presets"]))
    quiz=""
    for i,q in enumerate(m["quiz"]):
        options="".join(f'<label><input type="radio" name="q{i}" value="{j}"> {esc(a)}</label>' for j,a in enumerate(q["choices"]))
        quiz+=f'<fieldset><legend>{i+1}. {esc(q["prompt"])}</legend>{options}<p id="feedback-{i}" class="feedback" aria-live="polite"></p></fieldset>'
    tasks="".join(f'<li><strong>{esc(title)}.</strong> {esc(task)}</li>' for title,task,answer in m["exercises"])
    answers="".join(f'<h3>{esc(title)}</h3><p>{esc(answer)}</p>' for title,task,answer in m["exercises"])
    config=json.dumps(m,ensure_ascii=False).replace("</","<\\/")
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="{esc(m["deck"])}"><meta name="theme-color" content="#f5f3ed">
<title>{m["id"]} · {esc(m["title"])} · Optics in 5 Minutes</title>
<link rel="icon" href="../e03-diffraction/assets/favicon.svg"><link rel="stylesheet" href="../shared/course.css"><link rel="stylesheet" href="../shared/preparation.css"><link rel="stylesheet" href="../shared/motivation.css">
<script type="module" src="../shared/lesson.js"></script></head><body>
<a class="skip" href="#main">Skip to lesson</a><div class="shell">
<header class="topbar"><a class="brand" href="../">OPTICS<span>IN 5 MINUTES</span></a>
<nav aria-label="Lesson navigation"><a href="../">All episodes</a><a href="#idea">The idea</a><a href="#lab">Experiment</a><a href="#notebook">Notebook ↗</a></nav></header>
<main id="main"><section class="hero"><div><p class="eyebrow">{m["id"]} / AN INTERACTIVE OPTICS LESSON</p>
<h1>{m["headline"]}</h1><p class="lede">{esc(m["deck"])}</p><div class="actions"><a class="button" href="#lab">Try the experiment ↓</a><a href="#video">Watch the film ↓</a></div>
<p class="meta">12–15-minute lesson · 25–30-minute Python lab<br><a href="#preparation">Prerequisites & recommended learning resources ↓</a></p></div>
<figure><img src="assets/hero.png" width="1000" height="700" alt="Computed illustration from this lesson’s numerical model."><figcaption>COMPUTED FROM THE LESSON MODEL</figcaption></figure></section>
    {motivation_html(m["id"])}
    {preparation_html(m["id"], earlier)}
    {video_section(m)}
<section id="idea" class="section reading"><div class="section-label">01 / BUILD AN INTUITION</div><div><h2>What to notice first.</h2>{m["intro"]}
<h3>By the end, you can</h3><ol>{goals}</ol><div class="callout"><p class="eyebrow">PREDICT BEFORE YOU CHANGE A CONTROL</p><p>{esc(m["prediction"])}</p></div></div></section>
<section id="lab" class="section"><div class="section-heading"><div><p class="section-label">02 / TEST YOUR PREDICTION</p><h2>Change one thing.<br>Follow what changes.</h2></div><p>All plotted fields and curves are calculated from the stated model. Keep the other controls fixed while testing a prediction.</p></div>
<noscript><p class="callout">Enable JavaScript to run the experiment. The explanations and downloadable notebook remain available.</p></noscript>
<div class="lab-layout"><aside class="controls" aria-label="Experiment controls">{"".join(control(c,m["defaults"]) for c in m["controls"])}
<div class="control-buttons"><button id="run" class="button" type="button">Run</button><button id="cancel" class="button secondary" type="button" disabled>Stop</button><button id="reset" class="button secondary" type="button">Reset</button><button id="copy-link" class="button secondary" type="button">Copy experiment</button></div>
<p id="status" class="status" role="status">Preparing calculation…</p><p id="share-status" class="status" role="status"></p></aside>
<div class="visuals"><div id="plots" class="plots"></div><div id="metrics" class="metrics" aria-live="polite"></div><p id="run-note" class="run-note"></p>
<div class="presets" aria-label="Example experiments">{presets}<button type="button" id="download-plot">Save first plot PNG ↓</button></div><a id="plot-download" hidden>Download generated PNG ↓</a></div></div>
<p class="model-note"><strong>Model:</strong> {esc(m["limits"])}</p>
<div class="reading" style="margin-top:35px"><div class="section-label">A GUIDED EXPERIMENT</div><div><ol>{steps}</ol></div></div></section>
<section id="explain" class="section reading"><div class="section-label">03 / CONNECT THE LOGIC</div><div>{m["theory"]}</div></section>
<section id="check" class="section reading"><div><p class="section-label">04 / CHECK YOUR UNDERSTANDING</p><p>Make a prediction before checking the explanation.</p></div>
<div><h2>Can you explain the change?</h2><form id="quiz">{quiz}<button class="button" type="submit">Check answers →</button><p id="quiz-status" role="status"></p></form></div></section>
<section id="notebook" class="section reading"><div class="section-label">05 / TURN IT INTO CODE</div><div><h2>Your own computational experiment.</h2>
<p>The standalone notebook builds the model in small steps, draws the results, and checks the calculation against independent predictions. It runs on CPU using NumPy, SciPy, and Matplotlib. No repository clone, GPU, or external dataset is needed.</p>
<div class="actions"><a class="button" href="{COLAB}/{m["slug"]}/{notebook}" target="_blank" rel="noopener">Open in Colab ↗</a><a class="button secondary" href="{notebook}" download>Download notebook ↓</a><a href="figures.zip" download>Saved figures ↓</a></div>
<p class="meta">In Colab, sign in with a Google account and select Runtime → Run all. Save a copy in Drive to retain edits. Saved notebook outputs and downloadable PNG figures provide a fallback if Colab’s output frame cannot load.</p>
<h3>A short lab report</h3><ol>{tasks}</ol><details><summary>Compare your reasoning</summary><div class="answer">{answers}</div></details>
<details><summary>Optional deeper extension</summary><div class="answer"><p>{esc(m["extension"])}</p><p>The notebook marks the extension clearly. Complete the core experiment and its checks first.</p></div></details>
<p><a href="INSTRUCTOR_NOTES.md">Instructor notes and assessment rubric ↗</a> · <a href="README.md">Model, setup, and reproducibility ↗</a></p></div></section>
<section class="section reading"><div class="section-label">MODEL & SOURCES</div><div><h2>Know what the model leaves out.</h2><p>{esc(m["limits"])}</p>
<p><strong>Video companion:</strong> <a href="#video">watch the {m["id"]} film above</a> ({esc(VIDEOS[m["id"]]["duration"])}).</p>
<ul class="resource-list">{links(m["refs"])}<li><a href="{PUBLIC}/tree/main/teaching/{m["slug"]}" target="_blank" rel="noopener">Lesson and notebook source ↗</a></li></ul>
<p class="meta">Calculations and concept checks run locally in your browser. Quiz answers are not uploaded or stored.</p></div></section>
{navigation(m["id"])}</main><footer>OPTICS IN 5 MINUTES · {m["id"]} / {esc(m["title"]).upper()} · <a href="#main">Back to top ↑</a></footer></div>
<script id="lesson-config" type="application/json">{config}</script></body></html>'''

def build_notebook(m):
    path=ROOT/m["slug"]/"lab.py"
    if not path.exists():
        return
    introduction=f"""# {m['id']} · {m['title']}

{m['deck']}

{motivation_markdown(m['id'])}

{preparation_markdown(m['id'], "Before this lab")}

**Core lab: 25–30 minutes.** Work through the predictions before running the next cell. Sections labelled optional can be skipped on a first pass. Run all executes both the core and the small CPU extension.

**You will learn to:**

"""+ "\n".join("- "+g for g in m["goals"])+f"""

**Model:** {m['limits']}

This notebook is self-contained. It uses synthetic data, runs on CPU, and needs no repository clone, mounted Drive, API key, or external dataset. The setup installs only missing packages. Figures are displayed as static PNGs and also saved in a local folder for download.
"""
    setup=f'''import importlib.util, subprocess, sys
missing = [p for p in ["numpy", "scipy", "matplotlib"] if importlib.util.find_spec(p) is None]
if missing:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", *missing])
import numpy as np
import scipy
import matplotlib
import matplotlib.pyplot as plt
from pathlib import Path
from IPython.display import display, FileLink
from matplotlib_inline.backend_inline import set_matplotlib_formats
set_matplotlib_formats("png")
FIGURES = Path("{m['id'].lower()}_figures")
FIGURES.mkdir(exist_ok=True)
plt.rcParams.update({{"figure.dpi": 110, "font.size": 11, "axes.grid": False, "figure.constrained_layout.use": True}})
def show(fig, name):
    fig.savefig(FIGURES / (name + ".png"), dpi=140, bbox_inches="tight")
    display(fig)
    plt.close(fig)
print("Python", sys.version.split()[0], "| NumPy", np.__version__, "| SciPy", scipy.__version__, "| Matplotlib", matplotlib.__version__)
'''
    cells=[nbformat.v4.new_markdown_cell(introduction),nbformat.v4.new_code_cell(setup)]
    for section in re.split(r"(?m)^# %%",path.read_text()):
        if not section.strip():
            continue
        if section.startswith(" [markdown]"):
            body=section.split("\n",1)[1]
            body="\n".join(re.sub(r"^# ?", "",line) for line in body.splitlines())
            cells.append(nbformat.v4.new_markdown_cell(body.strip()))
        else:
            cells.append(nbformat.v4.new_code_cell(section.strip()))
    report="## A short lab report\n\n"+"\n\n".join(f"**{i+1}. {title}.** {task}" for i,(title,task,answer) in enumerate(m["exercises"]))
    report+="\n\n### Worked reasoning\n\n"+"\n\n".join(f"**{title}.** {answer}" for title,task,answer in m["exercises"])
    report+="\n\n### Ten-point rubric\n\nPrediction and reasoning: 2; reproducible parameters, units, and plots: 3; quantitative validation: 3; limitations and interpretation: 2.\n\n## References\n\n"
    report+="\n".join(f"- [{title}]({url})" for title,url in m["refs"])
    report+="\n\n## Save your figures\n\nThe final cell creates a ZIP of the computed PNGs. In Colab, use the Files sidebar to download it if an output frame or link is blocked. Saved notebook outputs and the public lesson's figure download provide another viewing route."
    cells.append(nbformat.v4.new_markdown_cell(report))
    cells.append(nbformat.v4.new_code_cell('''import zipfile
archive = FIGURES.with_suffix(".zip")
with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as bundle:
    for file in sorted(FIGURES.glob("*.png")):
        bundle.write(file, file.name)
print("Saved", len(list(FIGURES.glob("*.png"))), "figures in", archive)
display(FileLink(str(archive)))
'''))
    nb=nbformat.v4.new_notebook(cells=cells,metadata={
        "kernelspec":{"display_name":"Python 3","language":"python","name":"python3"},
        "language_info":{"name":"python"},"colab":{"name":BY_ID[m["id"]]["notebook"],"provenance":[]}})
    output=path.with_name(BY_ID[m["id"]]["notebook"])
    if output.exists():
        old=nbformat.read(output,as_version=4)
        if [(c.cell_type,c.source) for c in old.cells]==[(c.cell_type,c.source) for c in nb.cells]:
            return
        # Editorial changes do not invalidate executed code or its saved figures.
        if (len(old.cells) == len(nb.cells)
                and all(a.cell_type == b.cell_type for a, b in zip(old.cells, nb.cells))
                and all(a.source == b.source for a, b in zip(old.cells, nb.cells) if a.cell_type == "code")):
            for previous, current in zip(old.cells, nb.cells):
                if previous.cell_type == "markdown":
                    previous.source = current.source
            nb = old
    nbformat.write(nb,output)

def docs(m):
    path=ROOT/m["slug"]
    title=f'{m["id"]} · {m["title"]}'
    goals="\n".join("- "+g for g in m["goals"])
    exercises="\n\n".join(f"### {title}\n\n{task}\n\n**Worked reasoning:** {answer}" for title,task,answer in m["exercises"])
    refs="\n".join(f"- [{title}]({url})" for title,url in m["refs"])
    (path/"README.md").write_text(f"""# {title}

{m["deck"]}

{motivation_markdown(m['id'])}

{preparation_markdown(m['id'])}

## Learning outcomes

{goals}

## Use the lesson

Watch the [{m["id"]} film](https://www.youtube.com/watch?v={VIDEOS[m["id"]]["youtubeId"]}) ({VIDEOS[m["id"]]["duration"]}), embedded near the top of the lesson.

Serve the complete teaching/ directory over HTTP. The lesson uses shared local assets and native JavaScript modules. Open this episode's folder in the browser. Its standalone notebook also works directly in Colab or Jupyter; it does not import repository code or require a GPU.

The notebook's core takes about 25–30 minutes to work through, with a separate optional extension. The first code cell installs numerical packages only when missing. Saved outputs, figures/, and figures.zip provide static figure access if a notebook frontend blocks rich output.

## Model and normalization

{m["limits"]}

Computed quantities are generated by model.js in the browser and the explicitly written NumPy/SciPy models in lab.py. Model-specific assertions and independent references are in the lab and the course checks. The browser and notebook use documented but not necessarily identical grid sizes. Synthetic randomness is seeded.

## Rebuild

From the repository root, run: python teaching/tools/build_course.py, then python teaching/tools/validate_notebooks.py. The authored page content and controls are in teaching/tools/curriculum.py; opening motivations are in teaching/tools/motivation.py; preparation is in teaching/tools/preparation.py; notebook source is this folder's percent-format lab.py. Building preserves saved outputs when code cells are unchanged. Run npm test --prefix teaching for numerical browser-model tests.

## References

{refs}
""")
    (path/"INSTRUCTOR_NOTES.md").write_text(f"""# Instructor notes · {title}

{motivation_markdown(m['id'])}

{AUDIENCE} Use the checklist below before class. During the lesson, give a short notation reminder or point back to a resource when needed, then keep the explanation focused on the current optical question.

{preparation_markdown(m['id'])}

## Outcomes

{goals}

## Suggested 45–50-minute sequence

1. Predict (3 minutes): {m["prediction"]}
2. Explore (8 minutes): {" ".join(m["steps"])}
3. Explain (6 minutes): use the equation and measurement or boundary assumptions to connect the observed changes.
4. Check (3 minutes): ask the three page questions before showing feedback; have learners justify an answer.
5. Compute (20–25 minutes): run the core notebook, alter one parameter, and inspect its numerical checks.
6. Reflect (5 minutes): state one changed prediction, the evidence, and a remaining model limitation.

Use the optional extension for a longer lab rather than rushing the core. The quiz is local and does not collect student responses.

## Assessment and worked reasoning

{exercises}

## Ten-point rubric

- Prediction and physical reasoning: 2 points.
- Reproducible parameter choices, units, and labelled plots: 3 points.
- Quantitative comparison or numerical validation: 3 points.
- Model limitations and interpretation of disagreement: 2 points.

Grade reasoning and evidence, not an attractive plot alone. Results may vary with a deliberately changed seed or model; require the learner to record it.

## Common misconceptions

"""+"\n\n".join(f'- {q["prompt"]} {q["explanation"]}' for q in m["quiz"])+f"""

## Scope

{m["limits"]}

Optional extension: {m["extension"]}
""")

def build_home():
    cards=""
    for m in CATALOG:
        hero="assets/airy-hero.png" if m["id"]=="E03" else "assets/hero.png"
        cards+=f'<a class="course-card" href="{m["slug"]}/"><img src="{m["slug"]}/{hero}" width="1000" height="700" alt="Computed {esc(m["title"])} illustration." loading="lazy"><span class="eyebrow">{m["id"]} / FILM + LESSON + PYTHON LAB</span><h3>{esc(m["title"])}</h3><p>{esc(m["description"])}</p></a>'
    compatibility="""const oldKeys=['na','wavelength','separation','zoom','frequency','rings'];const u=new URL(location.href);if(oldKeys.some(k=>u.searchParams.has(k))||['#idea','#lab','#frequency-space','#notebook','#check','#title','#main'].includes(u.hash))location.replace('./e03-diffraction/'+u.search+u.hash);"""
    (ROOT/"index.html").write_text(f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Optics in 5 Minutes · The interactive course</title><meta name="description" content="Ten interactive computational-optics lessons with standalone Python labs: from wave propagation to adjoint design."><meta name="theme-color" content="#f5f3ed"><link rel="icon" href="e03-diffraction/assets/favicon.svg"><link rel="stylesheet" href="shared/course.css"><script>{compatibility}</script></head><body><a class="skip" href="#course-main">Skip to course</a><div class="shell"><header class="topbar"><a class="brand" href="./">OPTICS<span>IN 5 MINUTES</span></a><nav><a href="#course">The lessons</a><a href="#approach">How to learn</a><a href="preparation/">Prerequisites</a><a href="{PUBLIC}">Source ↗</a></nav></header><main id="course-main"><section class="hero"><div><p class="eyebrow">TEN IDEAS / ONE COMPUTATIONAL THREAD</p><h1>Understand the light.<br><em>Then change it.</em></h1><p class="lede">From a spreading wave to an optimized optical device. Predict what will happen, test it in your browser, and build the calculation yourself.</p><div class="actions"><a class="button" href="e01-angular-spectrum/">Start with wave propagation →</a><a href="#course">Choose a lesson ↓</a></div><p class="meta">Five-minute films · Browser experiments · CPU notebooks<br>Ten self-contained lessons, with optional deeper extensions</p></div><figure><img src="e04-coherence/assets/hero.png" width="1000" height="700" alt="Computed speckle field illustrating interference and coherence."><figcaption>ONE FIELD. MANY INTERFERING CONTRIBUTIONS.</figcaption></figure></section><section id="approach" class="section reading"><div class="section-label">A COURSE YOU CAN TEST</div><div><h2>A picture, a prediction, a calculation.</h2><p>Each lesson opens with an optical problem and why solving it matters. Check the prerequisites, watch the five-minute film, then use controls that change the actual model and connect the result to a few equations. The Python lab then rebuilds the calculation, tests it independently, and asks you to explain what the model leaves out.</p><p>Allow 12–15 minutes for a lesson and 25–30 minutes for its core lab. Begin with E01 and continue in order, or use each page’s preparation links to revisit an unfamiliar idea. The modules work without the companion films.</p><p>Run notebooks in Colab or local Jupyter. They use NumPy, SciPy, and Matplotlib on CPU, with saved figures and no external datasets. Instructor notes provide a 45–50-minute classroom sequence and assessment rubric.</p><p class="pathway">Propagation → Fourier optics → Imaging → Coherence → Phase recovery → Flat optics → Periodicity → Guided modes → Maxwell solvers → Adjoint design</p></div></section>{home_preparation_html()}<section id="course" class="section"><div class="section-heading"><div><p class="section-label">SEASON 1 / THE TEN IDEAS</p><h2>Choose where to begin.</h2></div><p>Every module includes its film, an experiment, reasoning checks, a standalone notebook, and explicit model assumptions.</p></div><div class="catalog">{cards}</div></section></main><footer>OPTICS IN 5 MINUTES · <a href="{PUBLIC}">Public source and teaching materials ↗</a> · Calculations run locally in your browser.</footer></div></body></html>''')

def main():
    fonts=ROOT/"shared/fonts";fonts.mkdir(parents=True,exist_ok=True)
    for name in ["Lato-Regular.ttf","Lato-Bold.ttf","LICENSE-Lato.txt"]:
        shutil.copy2(ROOT/"e03-diffraction/assets"/name,fonts/name)
        if name.endswith(".txt"):
            (fonts/name).write_text("\n".join(line.rstrip() for line in (fonts/name).read_text().splitlines())+"\n")
    (ROOT/"course.json").write_text(json.dumps(CATALOG,indent=2,ensure_ascii=False)+"\n")
    for m in MODULES:
        path=ROOT/m["slug"];path.mkdir(exist_ok=True)
        (path/"index.html").write_text(page(m))
        build_notebook(m)
        docs(m)
    e03=ROOT/"e03-diffraction/index.html"
    text=e03.read_text()
    preparation = ('<!-- course-preparation -->\n'
                   + preparation_html("E03", 'Useful earlier lessons: <a href="../e01-angular-spectrum/">E01</a>, <a href="../e02-lens-fourier/">E02</a>').replace('class="preparation"', 'class="preparation preparation-e03"')
                   + '\n<!-- /course-preparation -->')
    if '<!-- course-preparation -->' in text:
        text=re.sub(r'<!-- course-preparation -->.*?<!-- /course-preparation -->', lambda match: preparation, text, flags=re.S)
    else:
        text=text.replace('  <section id="video"', preparation+'\n\n  <section id="video"', 1)
    if 'href="../shared/preparation.css"' not in text:
        text=text.replace('<link rel="stylesheet" href="assets/style.css">', '<link rel="stylesheet" href="assets/style.css">\n  <link rel="stylesheet" href="../shared/preparation.css">')
    motivation = ('<!-- course-motivation -->\n' + motivation_html("E03", original_e03=True)
                  + '\n<!-- /course-motivation -->')
    if '<!-- course-motivation -->' in text:
        text=re.sub(r'<!-- course-motivation -->.*?<!-- /course-motivation -->', lambda match: motivation, text, flags=re.S)
    else:
        text=text.replace('<!-- course-preparation -->', motivation+'\n\n<!-- course-preparation -->', 1)
    if 'href="../shared/motivation.css"' not in text:
        text=text.replace('<link rel="stylesheet" href="../shared/preparation.css">', '<link rel="stylesheet" href="../shared/preparation.css">\n  <link rel="stylesheet" href="../shared/motivation.css">')
    text=text.replace('Calculus + basic Python</p>', '<a href="#preparation">Prerequisites & recommended learning resources ↓</a></p>')
    if '<!-- course-navigation -->' not in text:
        text=text.replace('<nav aria-label="Lesson navigation">','<nav aria-label="Lesson navigation"><a href="../">All episodes</a>')
        text=text.replace("</main>",'<!-- course-navigation --><div style="display:flex;justify-content:space-between;gap:20px;max-width:1200px;margin:30px auto;padding:0 24px;font-size:1rem"><a href="../e02-lens-fourier/">← E02 · Lens Fourier transforms</a><a href="../e04-coherence/">E04 · Coherence →</a></div></main>')
        e03.write_text(text)
    course_nav='<!-- course-navigation -->'+navigation("E03").replace('class="next-prev"', 'style="display:flex;justify-content:space-between;gap:20px;max-width:1200px;margin:30px auto;padding:0 24px;font-size:1rem"')
    text=re.sub(r'<!-- course-navigation -->.*?</div>(?=</main>)',course_nav,text,flags=re.S)
    e03.write_text(text)
    if 'href="figures.zip"' not in text:
        text=text.replace('</div><p class="small-note">The notebook is publicly', '<a href="figures.zip" download>Saved PNG figures ↓</a></div><p class="small-note">The notebook is publicly')
        e03.write_text(text)
    if (ROOT/"e03-diffraction/e03_diffraction_limit.ipynb").exists():
        notebook_path=ROOT/"e03-diffraction/e03_diffraction_limit.ipynb"
        notebook=nbformat.read(notebook_path, as_version=4)
        previous=notebook.cells[0].source
        notebook.cells[0].source=refresh_preparation_markdown(previous, "E03", "Before this lab")
        notebook.cells[0].source=refresh_motivation_markdown(notebook.cells[0].source, "E03")
        if notebook.cells[0].source != previous:
            nbformat.write(notebook, notebook_path)
        shutil.copy2(ROOT/"e03-diffraction/e03_diffraction_limit.ipynb",ROOT/"e03_diffraction_limit.ipynb")
    for filename in ["README.md", "INSTRUCTOR_NOTES.md"]:
        document=ROOT/"e03-diffraction"/filename
        prepared=refresh_preparation_markdown(document.read_text(), "E03")
        document.write_text(refresh_motivation_markdown(prepared, "E03"))
    (ROOT/"preparation").mkdir(exist_ok=True)
    (ROOT/"preparation/index.html").write_text(guide_html(CATALOG))
    build_home()
    print("Built ten-lesson course, nine new pages and instructor packs, and legacy E03 routes.")

if __name__=="__main__":
    main()
