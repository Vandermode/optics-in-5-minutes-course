"""Draw scientific hero figures from the exact browser model output."""
from pathlib import Path
import json
import subprocess
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
subprocess.run(["node",str(ROOT/"tools/render_heroes.mjs")],check=True)
cmap=LinearSegmentedColormap.from_list("course",["#05131a","#0f3d4a","#287278","#6eb1a3","#dfe5bc","#fff9de"])
plt.rcParams.update({"font.size":11,"axes.labelcolor":"#172f39","text.color":"#172f39","axes.edgecolor":"#a9b7af","figure.facecolor":"#f5f3ed","axes.facecolor":"#fffdf8"})
for item in json.loads((ROOT/".qa/heroes.json").read_text()):
    p=item["plot"];fig,ax=plt.subplots(figsize=(7,4.9),dpi=145,layout="constrained")
    if p["kind"]=="image":
        values=np.asarray(p["values"]).reshape(p["height"],p["width"])
        palette={"intensity":cmap,"phase":"twilight","signed":"RdBu_r"}.get(p["palette"],cmap)
        bounds=p.get("range",[float(values.min()),float(values.max())])
        ax.imshow(values,cmap=palette,aspect="auto" if values.shape[0]<values.shape[1]/3 else "equal",vmin=bounds[0],vmax=bounds[1])
        ax.set_xticks([]);ax.set_yticks([])
    else:
        for series in p["series"]:
            ax.plot(series["x"],series["y"],label=series["label"],color=series["color"],lw=2)
        ax.set(xlabel=p.get("xLabel",""),ylabel=p.get("yLabel",""))
        if "xRange" in p:ax.set_xlim(p["xRange"])
        if "yRange" in p:ax.set_ylim(p["yRange"])
        ax.legend(frameon=False,fontsize=10);ax.grid(alpha=.17)
    ax.set_title(p["title"],fontsize=13,pad=15)
    out=ROOT/item["slug"]/"assets";out.mkdir(exist_ok=True)
    fig.savefig(out/"hero.png");plt.close(fig)
print("Saved nine computed hero figures.")
