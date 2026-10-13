"""Optional Auth QA: Python + Pillow from local tools, no product dependency."""
import json
import re
from pathlib import Path
from PIL import Image, ImageChops

root = Path('docs/design/verification/ui-refresh/auth')
before = json.loads((root / 'my-events-before/measurements.json').read_text())['results']
after = json.loads((root / 'my-events-after/measurements.json').read_text())['results']
current = {(row['width'], row['name']): row for row in after}
differences = []
for row in before:
    match = current[(row['width'], row['name'])]
    for field in ['visual', 'overflow', 'firstRow', 'smallTargets', 'menu', 'nav']:
        if row[field] != match[field]:
            differences.append(dict(width=row['width'], state=row['name'], field=field))
images = []
for path in sorted((root / 'my-events-before').glob('*.png')):
    original = Image.open(path).convert('RGB')
    current_image = Image.open(root / 'my-events-after' / path.name).convert('RGB')
    box = ImageChops.difference(original, current_image).getbbox() if original.size == current_image.size else 'size mismatch'
    images.append(dict(file=path.name, difference_bbox=box))
report = dict(computed_records=len(before), differences=differences, images=images)
(root / 'my-events-comparison.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
assert not differences, differences
for row in images:
    if row['file'].startswith('organizing-'):
        assert row['difference_bbox'] is None, row
print(f'PASS: {len(before)} matching state records have identical styles and geometry; six Organizo PNG identical; {sum(not row["difference_bbox"] for row in images)}/{len(images)} total PNG identical')

# Contrast pairs from the central CSS tokens. Upper bound for this Auth wash:
# stack each radial gradient at its maximum opacity, before its fading mask.
tokens = dict(re.findall(r'--pi-color-([\w-]+):\s*(#[a-fA-F0-9]{6})', Path('src/styles/tokens.css').read_text()))
def rgb(name):
    value = tokens[name].lstrip('#')
    return tuple(int(value[i:i+2], 16) / 255 for i in (0, 2, 4))
def luminance(color):
    linear = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in color]
    return sum(v * weight for v, weight in zip(linear, [.2126, .7152, .0722]))
def ratio(a, b):
    low, high = sorted([luminance(a), luminance(b)])
    return (high + .05) / (low + .05)
wash = rgb('bg')
for color, alpha in [('lavender', .60), ('primary', .20), ('violet', .40)]:
    wash = tuple(alpha * foreground + (1 - alpha) * background for foreground, background in zip(rgb(color), wash))
glass = tuple(.72 + .28 * value for value in wash)
pairs = [('ink/surface', rgb('ink'), rgb('surface'), 4.5),
         ('placeholder/surface', rgb('placeholder'), rgb('surface'), 4.5),
         ('muted/bg', rgb('text-muted'), rgb('bg'), 4.5),
         ('border/surface', rgb('control-border'), rgb('surface'), 3),
         ('border/bg', rgb('control-border'), rgb('bg'), 3),
         ('focus/surface', rgb('focus'), rgb('surface'), 3),
         ('danger/danger-bg', rgb('danger-on-bg'), rgb('danger-bg'), 4.5),
         ('disabled-text/bg', rgb('disabled-text'), rgb('disabled-bg'), 4.5),
         ('muted/glass-over-auth-wash', rgb('text-muted'), glass, 4.5),
         ('heading/auth-wash', rgb('ink'), wash, 3),
         ('description/auth-wash', rgb('text-on-wash'), wash, 4.5)]
contrasts = [dict(pair=name, ratio=round(ratio(a,b), 3), minimum=minimum) for name,a,b,minimum in pairs]
(root / 'contrast.json').write_text(json.dumps(dict(method='WCAG relative luminance from CSS tokens; all three Auth wash layers at maximum alpha before mask; glass at .72 over that conservative bound', results=contrasts), indent=2) + '\n', encoding='utf-8')
assert all(row['ratio'] >= row['minimum'] for row in contrasts), contrasts
print(f'PASS: {len(contrasts)} text/control contrast pairs including translucent glass')
