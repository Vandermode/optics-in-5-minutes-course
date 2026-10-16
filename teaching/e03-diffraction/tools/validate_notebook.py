"""Execute the complete student notebook, verify expected output, and save outputs."""
from pathlib import Path
import nbformat
from nbclient import NotebookClient

root = Path(__file__).resolve().parents[1]
path = root / "e03_diffraction_limit.ipynb"
nb = nbformat.read(path, as_version=4)
nbformat.validate(nb)
NotebookClient(nb, timeout=180, kernel_name="python3", resources={"metadata":{"path":str(root)}}).execute()
code = [c for c in nb.cells if c.cell_type == "code"]
images = sum("image/png" in o.get("data", {}) for c in code for o in c.get("outputs", []))
assert all(c.execution_count is not None for c in code)
assert images >= 4, f"Expected four educational figures, found {images}"
assert not any(o.output_type == "error" for c in code for o in c.get("outputs", []))
nbformat.write(nb, path)
print(f"PASS: {len(code)} code cells executed, {images} figures produced, all scientific assertions passed.")
for c in code:
    for o in c.get("outputs", []):
        if o.output_type == "stream" and o.name == "stdout": print(o.text.strip())
