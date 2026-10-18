"""Render video reasoning guides and collect their paired translations."""
import html
import re
from video_logic_data import GUIDES, tr


UI = [
    tr("VIDEO / FOLLOW THE REASONING", "视频 / 跟随推理"),
    tr("The film’s logic, step by step.", "视频的逻辑，一步步展开。"),
    tr("Follow the film’s argument, then open an explanation where a step feels too fast. Times are approximate; select one to replay that part of the film.", "先沿着大纲理解视频论证，再展开跳得太快的环节。时间点为近似值，点击可回看对应片段。"),
    tr("Video logic", "视频逻辑"),
    tr("Logic flow", "逻辑大纲"),
    tr("Unpack the difficult steps", "展开疑难逻辑"),
    tr("Open the missing step →", "展开这一步的推理 →"),
    tr("Replay this part", "回看这一段"),
    tr("Play from {time}", "从 {time} 开始播放"),
    tr("Video selected at {time}.", "已定位视频至 {time}。"),
    tr("Explore the full experiment →", "继续完整实验 →"),
    tr("Further reading for these explanations", "这些解释的延伸阅读"),
    tr("Test the spectrum–coherence link", "亲手检验光谱与相干性的联系"),
    tr("Keep the path difference fixed and widen the spectrum. Then narrow the spectrum and move the path difference: watch how quickly visibility falls.", "先固定光程差，再加宽光谱；接着缩窄光谱并移动光程差，观察可见度下降得有多快。"),
    tr("Spectral width Δλ (FWHM, approximate)", "光谱宽度 Δλ（近似半高全宽）"),
    tr("Optical path difference ΔL", "光程差 ΔL"),
    tr("1. Power spectrum", "1. 功率谱"),
    tr("2. Interference versus path difference", "2. 干涉随光程差的变化"),
    tr("Frequency offset ν − ν₀ (THz)", "频率偏移 ν − ν₀（THz）"),
    tr("Path difference ΔL (μm)", "光程差 ΔL（μm）"),
    tr("Spectrum normalized to unit peak; centre wavelength 550 nm. Wider spectra contain a broader spread of phase advances.", "光谱峰值归一为一，中心波长为 550 nm。更宽的光谱对应更分散的相位推进。"),
    tr("Gold: ±|g⁽¹⁾|, with the lower envelope dashed. Teal: normalized interference contribution Re g⁽¹⁾, with its constant background removed. The vertical line marks the selected path difference.", "金色：±|g⁽¹⁾|，下侧包络用虚线表示。青色：去掉恒定背景后的归一化干涉贡献 Re g⁽¹⁾。竖线标记所选光程差。"),
    tr("Fringe visibility at ΔL", "所选 ΔL 处的条纹可见度"),
    tr("1/e coherence length ℓe", "1/e 相干长度 ℓe"),
    tr("Rough scale λ₀²/Δλ", "粗略尺度 λ₀²/Δλ"),
    tr("Frequency FWHM: {width} THz. Here ℓe is the positive delay-path value where |g⁽¹⁾| = 1/e; it is not the full width of the envelope.", "频率半高全宽：{width} THz。这里 ℓe 是 |g⁽¹⁾| = 1/e 时的正光程差，不是包络的全宽。"),
    tr("Static example: at 550 nm with Δλ ≈ 30 nm, the rough scale is 10.08 μm and the Gaussian 1/e length is 5.34 μm. At ΔL = 5 μm, visibility is about 0.417. Enable JavaScript to change the two controls.", "静态例子：550 nm、Δλ ≈ 30 nm 时，粗略尺度为 10.08 μm，高斯 1/e 长度为 5.34 μm。在 ΔL = 5 μm 处，可见度约为 0.417。启用 JavaScript 后可调整两个控件。"),
]


def translations():
    result = {}

    def visit(value):
        if isinstance(value, dict):
            if set(value) == {"en", "zh"}:
                key = " ".join(value["en"].split())
                if key in result and result[key] != value["zh"]:
                    raise ValueError(f"Conflicting video-guide translation: {key}")
                result[key] = value["zh"]
            else:
                for item in value.values():
                    visit(item)
        elif isinstance(value, (list, tuple)):
            for item in value:
                visit(item)

    visit(GUIDES)
    visit(UI)
    result["· Replay this part"] = "· 回看这一段"
    for guide in GUIDES.values():
        for item in [*guide["steps"], *guide["bridges"]]:
            time = time_label(item["at"])
            result[f"Play from {time}"] = f"从 {time} 开始播放"
    return result


def esc(value):
    return html.escape(str(value), quote=True)


def time_label(seconds):
    return f"{seconds // 60}:{seconds % 60:02d}"


def replay(video_id, seconds, label=None):
    time = time_label(seconds)
    return (f'<a class="video-time" data-video-seek="{seconds}" '
            f'href="https://www.youtube.com/watch?v={esc(video_id)}&amp;t={seconds}s" '
            f'target="_blank" rel="noopener" title="Play from {time}">'
            f'<span translate="no">{time}</span>' + (f' · {esc(label)}' if label else '') + '</a>')


def coherence_demo():
    return '''<div class="coherence-demo" id="spectrum-demo" aria-labelledby="spectrum-demo-title">
<h4 id="spectrum-demo-title">Test the spectrum–coherence link</h4>
<p>Keep the path difference fixed and widen the spectrum. Then narrow the spectrum and move the path difference: watch how quickly visibility falls.</p>
<p class="coherence-fallback">Static example: at 550 nm with Δλ ≈ 30 nm, the rough scale is 10.08 μm and the Gaussian 1/e length is 5.34 μm. At ΔL = 5 μm, visibility is about 0.417. Enable JavaScript to change the two controls.</p>
<div class="coherence-interactive" hidden>
<div class="coherence-controls">
<div><label for="spectrum-width">Spectral width Δλ (FWHM, approximate)</label><output for="spectrum-width" id="spectrum-width-value"></output><input id="spectrum-width" type="range" min="3" max="45" step="1" value="30"></div>
<div><label for="spectrum-path">Optical path difference ΔL</label><output for="spectrum-path" id="spectrum-path-value"></output><input id="spectrum-path" type="range" min="0" max="12" step="0.1" value="5"></div>
</div>
<div class="coherence-plots">
<figure><h4>1. Power spectrum</h4><canvas id="spectrum-plot" role="img" aria-label="Spectrum normalized to unit peak; centre wavelength 550 nm. Wider spectra contain a broader spread of phase advances."></canvas><p class="coherence-axis">Frequency offset ν − ν₀ (THz)</p><figcaption>Spectrum normalized to unit peak; centre wavelength 550 nm. Wider spectra contain a broader spread of phase advances.</figcaption></figure>
<figure><h4>2. Interference versus path difference</h4><canvas id="coherence-plot" role="img" aria-label="Gold: ±|g⁽¹⁾|, with the lower envelope dashed. Teal: normalized interference contribution Re g⁽¹⁾, with its constant background removed. The vertical line marks the selected path difference."></canvas><p class="coherence-axis">Path difference ΔL (μm)</p><figcaption>Gold: ±|g⁽¹⁾|, with the lower envelope dashed. Teal: normalized interference contribution Re g⁽¹⁾, with its constant background removed. The vertical line marks the selected path difference.</figcaption></figure>
</div>
<dl class="coherence-values" aria-live="polite" aria-atomic="true">
<div><dt>Fringe visibility at ΔL</dt><dd id="spectrum-visibility"></dd></div>
<div><dt>1/e coherence length ℓe</dt><dd id="spectrum-length"></dd></div>
<div><dt>Rough scale λ₀²/Δλ</dt><dd id="spectrum-rough"></dd></div>
</dl><p class="coherence-convention" id="spectrum-convention"></p>
</div></div>'''


def video_logic_html(episode, video_id):
    if not re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id):
        raise ValueError(f"Invalid video ID for guide {episode}")
    guide = GUIDES[episode]
    ids = [b["id"] for b in guide["bridges"]]
    if len(ids) != len(set(ids)) or any(not re.fullmatch(r"[a-z-]+", id) for id in ids):
        raise ValueError(f"Invalid explanation IDs for {episode}")
    if [s["at"] for s in guide["steps"]] != sorted(s["at"] for s in guide["steps"]):
        raise ValueError(f"Non-chronological outline for {episode}")
    steps = []
    for s in guide["steps"]:
        detail = s.get("detail")
        if detail and detail not in ids:
            raise ValueError(f"Missing explanation {episode}/{detail}")
        more = f'<a class="video-bridge-link" href="#guide-{detail}">Open the missing step →</a>' if detail else ''
        steps.append(f'<li>{replay(video_id, s["at"])}<div><h4>{esc(s["title"]["en"])}</h4><p>{esc(s["text"]["en"])}</p>{more}</div></li>')
    explanations = []
    for b in guide["bridges"]:
        blocks = []
        for block in b["blocks"]:
            if block["kind"] == "equation":
                blocks.append('<div class="equation">' + '<br>'.join(esc(line) for line in block["text"].splitlines()) + '</div>')
            else:
                blocks.append(f'<p>{esc(block["text"]["en"])}</p>')
        # The spectrum question is the entry point for this companion experiment.
        opened = ' open' if episode == "E04" and b["id"] == "spectrum" else ''
        explanations.append(f'<details class="video-bridge" id="guide-{b["id"]}"{opened}><summary>{esc(b["title"]["en"])}</summary><div class="video-bridge-body"><p class="video-replay">{replay(video_id, b["at"], "Replay this part")}</p>{"".join(blocks)}{coherence_demo() if b.get("demo") else ""}</div></details>')
    sources = ''.join(f'<li><a href="{esc(s["url"])}" target="_blank" rel="noopener">{esc(s["title"]["en"])}</a></li>' for s in guide.get("sources", []))
    sources = f'<div class="video-guide-sources"><h4>Further reading for these explanations</h4><ul>{sources}</ul></div>' if sources else ''
    return f'''<section id="video-guide" class="section video-guide" aria-labelledby="video-guide-title">
<p class="section-label">VIDEO / FOLLOW THE REASONING</p><h2 id="video-guide-title">The film’s logic, step by step.</h2>
<p class="video-guide-question">{esc(guide["question"]["en"])}</p><p class="video-guide-intro">Follow the film’s argument, then open an explanation where a step feels too fast. Times are approximate; select one to replay that part of the film.</p>
<h3>Logic flow</h3><ol class="video-flow">{"".join(steps)}</ol>
<div class="video-explanations"><h3>Unpack the difficult steps</h3>{"".join(explanations)}</div>
{sources}<p class="video-guide-next"><a href="#lab">Explore the full experiment →</a></p></section>'''
