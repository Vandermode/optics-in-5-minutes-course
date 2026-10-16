"""Execute standalone labs in clean directories and retain PNG outputs and evidence."""
import argparse
import base64
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import time
import zipfile

import nbformat
from nbclient import NotebookClient

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("episodes", nargs="*", help="E01 … E10; default: all ten")
    args = parser.parse_args()
    catalog = json.loads((ROOT / "course.json").read_text())
    report_path = ROOT / "validation-notebooks.json"
    previous = json.loads(report_path.read_text()) if report_path.exists() else []
    report = {row["id"]: row for row in previous}
    os.environ.update(OPENBLAS_NUM_THREADS="2", OMP_NUM_THREADS="2", MKL_NUM_THREADS="2", MPLBACKEND="module://matplotlib_inline.backend_inline")
    with tempfile.TemporaryDirectory(prefix="optics-notebooks-") as temporary:
        temp = Path(temporary)
        kernel = temp / "jupyter/kernels/optics-qa"
        kernel.mkdir(parents=True)
        (kernel / "kernel.json").write_text(json.dumps({
            "argv": [sys.executable, "-m", "ipykernel_launcher", "-f", "{connection_file}"],
            "display_name": "Optics clean CPU kernel", "language": "python"}))
        os.environ["JUPYTER_PATH"] = str(temp / "jupyter") + os.pathsep + os.environ.get("JUPYTER_PATH", "")
        for item in catalog:
            if args.episodes and item["id"] not in args.episodes:
                continue
            directory = ROOT / item["slug"]
            path = directory / item["notebook"]
            nb = nbformat.read(path, as_version=4)
            nbformat.validate(nb)
            scratch = temp / item["id"]
            scratch.mkdir()
            started = time.monotonic()
            NotebookClient(nb, timeout=180, kernel_name="optics-qa", resources={"metadata": {"path": str(scratch)}}).execute()
            elapsed = time.monotonic() - started
            code = [cell for cell in nb.cells if cell.cell_type == "code"]
            assert all(cell.execution_count is not None for cell in code)
            assert not any(output.output_type == "error" for cell in code for output in cell.outputs)
            pngs = [output["data"]["image/png"] for cell in code for output in cell.outputs if "image/png" in output.get("data", {})]
            assert len(pngs) >= 3, f"{item['id']}: missing static figure outputs"
            figures = directory / "figures"
            figures.mkdir(exist_ok=True)
            saved = sorted((scratch / (item["id"].lower() + "_figures")).glob("*.png"))
            if saved:
                for file in saved:
                    shutil.copy2(file, figures / file.name)
            else:
                for number, data in enumerate(pngs, 1):
                    (figures / f"{number:02d}-notebook-figure.png").write_bytes(base64.b64decode(data))
            with zipfile.ZipFile(directory / "figures.zip", "w", zipfile.ZIP_DEFLATED) as archive:
                for file in sorted(figures.glob("*.png")):
                    archive.write(file, file.name)
            nbformat.write(nb, path)
            streams = [o.text.strip() for c in code for o in c.outputs if o.output_type == "stream" and o.name == "stdout"]
            report[item["id"]] = dict(id=item["id"], code_cells=len(code), png_outputs=len(pngs), elapsed_seconds=round(elapsed, 2), clean_kernel=True, optional_sections_executed=True, assertions="passed", stdout=streams)
            report_path.write_text(json.dumps(sorted(report.values(), key=lambda r: r["id"]), indent=2) + "\n")
            print(f"PASS {item['id']}: {len(code)} cells, {len(pngs)} figures, {elapsed:.1f}s including extensions", flush=True)
            for line in streams:
                print(line, flush=True)
    if (ROOT / "e03-diffraction/e03_diffraction_limit.ipynb").exists():
        shutil.copy2(ROOT / "e03-diffraction/e03_diffraction_limit.ipynb", ROOT / "e03_diffraction_limit.ipynb")


if __name__ == "__main__":
    main()
