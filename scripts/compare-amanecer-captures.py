"""Optional visual QA helper; Python + Pillow, no product dependency."""
import json
from pathlib import Path
from PIL import Image, ImageChops

root = Path('docs/design/verification/ui-refresh/amanecer-foundation')
images = []
for before, after in [('baseline', 'after'), ('baseline-home', 'regression-home'),
                      ('baseline-map', 'regression-map'), ('baseline-chat', 'regression-chat')]:
    for path in sorted((root / before).glob('*.png')):
        original = Image.open(path).convert('RGB')
        current = Image.open(root / after / path.name).convert('RGB')
        box = ImageChops.difference(original, current).getbbox() if original.size == current.size else 'size mismatch'
        images.append(dict(suite=after, file=path.name, size=original.size,
                           after_size=current.size, difference_bbox=box))
(root / 'pilot-comparison.json').write_text(json.dumps(images, indent=2) + '\n', encoding='utf-8')

before = json.loads((root / 'baseline/measurements.json').read_text())['results']
after = json.loads((root / 'after/measurements.json').read_text())['results']
styles, geometry = [], []
for original, current in zip(before, after, strict=True):
    assert (original['width'], original['name']) == (current['width'], current['name'])
    for name in ['overflow', 'firstRow', 'smallTargets', 'menu', 'nav']:
        if original[name] != current[name]:
            geometry.append(dict(width=original['width'], state=original['name'], property=name,
                                 before=original[name], after=current[name]))
    assert len(original['visual']) == len(current['visual'])
    for index, (a, b) in enumerate(zip(original['visual'], current['visual'], strict=True)):
        delta = {name: [a[name], b[name]] for name in a if a[name] != b[name]}
        if delta:
            styles.append(dict(width=original['width'], state=original['name'], index=index, delta=delta))
(root / 'computed-comparison.json').write_text(json.dumps(styles, indent=2) + '\n', encoding='utf-8')
(root / 'geometry-comparison.json').write_text(json.dumps(geometry, indent=2) + '\n', encoding='utf-8')
print(f'PNG: {len(images)} compared, {sum(not row["difference_bbox"] for row in images)} identical')
print(f'Computed style differences: {len(styles)}; geometry differences: {len(geometry)}')
for row in images:
    if row['suite'] == 'after' and row['file'].startswith('organizing-'):
        assert row['difference_bbox'] is None, row
assert not styles, 'Review and document every computed style difference'
assert not geometry, 'Review and document every geometry difference'
