#!/usr/bin/env python3
"""Build WebP reading assets from an explicitly selected folder of new page PNGs."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageOps

parser = argparse.ArgumentParser()
parser.add_argument('--source-dir', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'content/story/comic-manifest.json').read_text())
metadata = {'pages': []}
for page in manifest['pages']:
    number = page['page']
    source = args.source_dir / f'page-{number:02d}.png'
    with Image.open(source) as opened:
        full = ImageOps.exif_transpose(opened).convert('RGB')
        full.thumbnail((1600, 1800), Image.Resampling.LANCZOS)
        small = full.copy()
        small.thumbnail((800, 900), Image.Resampling.LANCZOS)
        for image, key, quality in [(full, 'image', 87), (small, 'smallImage', 85)]:
            destination = root / 'images/comic' / page[key]
            destination.parent.mkdir(parents=True, exist_ok=True)
            image.save(destination, 'WEBP', quality=quality, method=6)
        metadata['pages'].append({'page': number, 'width': full.width, 'height': full.height,
                                  'smallWidth': small.width, 'smallHeight': small.height})
out = root / 'images/comic/metadata.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(metadata, indent=2) + '\n')
print(f"Prepared {len(metadata['pages'])} selected comic pages.")
