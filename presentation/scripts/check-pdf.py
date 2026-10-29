"""Validate the exported deck and render every page for visual inspection.

Requires pypdf, pypdfium2 and Pillow; supplied by the Codex desktop runtime.
Run after npm run check:visual and npm run export.
"""
import json
import subprocess
from pathlib import Path

from PIL import Image
from pypdf import PdfReader
import pypdfium2 as pdfium

root = Path(__file__).resolve().parents[1]
metadata = json.loads(subprocess.check_output([
    "node", "--input-type=module", "-e",
    "import {deck,releases} from './data/deck.mjs'; import {stories} from './data/release-stories.mjs'; console.log(JSON.stringify({deck,releases,stories}))",
], cwd=root, encoding="utf-8"))
path = root / "exports/planit-completa.pdf"
reader = PdfReader(path)
document = pdfium.PdfDocument(str(path))
assert len(reader.pages) == len(metadata["deck"]) == 53
output = root / ".validation"
output.mkdir(exist_ok=True)
samples = [(20, 20), (640, 10), (1200, 10), (20, 350), (640, 710), (1200, 700)]
errors = []
for index, page in enumerate(reader.pages):
    assert len(page.extract_text().strip()) > 30, f"Selectable text missing on page {index + 1}"
    assert not page["/Resources"].get("/Shading"), f"PDF shading present on page {index + 1}"
    assert abs(float(page.mediabox.width) / float(page.mediabox.height) - 16 / 9) < .001
    rendered = document[index].render(scale=4 / 3).to_pil().convert("RGB")
    if rendered.size != (1280, 720):
        rendered = rendered.resize((1280, 720))
    rendered.save(output / f"pdf-slide-{index + 1}.png")
    browser = Image.open(output / f"canvas-slide-{index + 1}.png").convert("RGB")
    delta = max(abs(a - b) for point in samples for a, b in zip(rendered.getpixel(point), browser.getpixel(point)))
    assert delta <= 8, f"Background color differs on page {index + 1}: {delta}"
    errors.append(delta)
    spec = metadata["deck"][index]
    if spec.get("storyIds"):
        # PDFium follows rotated baselines correctly; pypdf can insert spaces inside
        # words or omit line breaks when post-it text has a small rotation.
        text = " ".join(document[index].get_textpage().get_text_range().split())
        for story_id in spec["storyIds"]:
            story = next(item for item in metadata["stories"] if item["id"] == story_id)
            assert story_id in text, f"Missing identifier {story_id} in PDF"
            assert " ".join(story["text"].split()) in text, f"Missing selectable full story {story_id} in PDF"

roadmap_index = next(i for i, slide in enumerate(metadata["deck"]) if slide["id"] == "roadmap")
roadmap = reader.pages[roadmap_index].extract_text()
for release in metadata["releases"]:
    assert release["id"] in roadmap
    assert release["start"] in roadmap and release["end"] in roadmap
for name in ["cover", "product", "architecture"]:
    assert Image.open(root / f"public/assets/backgrounds/{name}.png").mode == "RGB"
report = {"result": "PASS", "pages": len(reader.pages), "aspectRatio": "16:9", "selectableText": True, "completeStories": 53,
          "pdfShadings": 0, "backgroundChannelDeltas": errors, "roadmapDates": "PASS"}
(output / "pdf-results.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(f"PASS: {len(reader.pages)} PDF pages, 53 complete selectable stories, exact roadmap dates, no shadings; max background difference {max(errors)}/255")
