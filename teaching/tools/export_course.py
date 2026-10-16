"""Package the complete buildless course without development environments or tests."""
from pathlib import Path
import argparse
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
ALLOWED = {".html", ".css", ".js", ".json", ".md", ".ipynb", ".png", ".svg", ".ttf", ".txt", ".zip"}
SKIP = {".qa", "node_modules", "test-results", "tests", "tools", "__pycache__"}


def export(destination):
    destination = Path(destination).resolve()
    if destination == ROOT or ROOT in destination.parents:
        raise ValueError("Export outside teaching/ to avoid recursively copying the output.")
    destination.mkdir(parents=True, exist_ok=True)
    written = []
    for source in sorted(ROOT.rglob("*")):
        relative = source.relative_to(ROOT)
        if not source.is_file() or any(part.startswith(".") or part in SKIP for part in relative.parts):
            continue
        if source.suffix not in ALLOWED or source.name.startswith("package"):
            continue
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        written.append(str(relative))
    # Remove only files from the previous export's manifest, never arbitrary checkout files.
    manifest = destination / "course-files.json"
    if manifest.exists():
        for stale in set(json.loads(manifest.read_text())) - set(written):
            candidate = (destination / stale).resolve()
            if destination in candidate.parents and candidate.is_file():
                candidate.unlink()
    manifest.write_text(json.dumps(written, indent=2) + "\n")
    assert (destination / "index.html").is_file()
    for entry in json.loads((ROOT / "course.json").read_text()):
        for file in ["index.html", entry["notebook"], "figures.zip", "INSTRUCTOR_NOTES.md"]:
            assert (destination / entry["slug"] / file).is_file(), f"Missing public artifact: {entry['slug']}/{file}"
    print(f"Packaged {len(written)} static files in {destination}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("destination")
    export(parser.parse_args().destination)
