"""Generate sized WebP derivatives; preserve originals and the historical snapshot."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
config = json.loads((root / "assets/web-image-sources.json").read_text())
output = root / "images/web"
output.mkdir(parents=True, exist_ok=True)
images = {}
for item in config["images"]:
    source = root / item["source"]
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert("RGBA" if "A" in original.getbands() else "RGB")
        variants = []
        stem = hashlib.sha256(item["source"].encode()).hexdigest()[:12]
        for width in sorted({min(width, image.width) for width in item["widths"]}):
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            destination = output / f"{stem}-{width}.webp"
            resized.save(destination, "WEBP", quality=item.get("quality", 85), method=6)
            variants.append({"src": str(destination.relative_to(root)), "width": width, "height": height, "bytes": destination.stat().st_size})
        images[item["source"]] = {"width": image.width, "height": image.height, "originalBytes": source.stat().st_size, "variants": variants}

manifest = {"baseline": config["baseline"], "images": images}
(root / "assets/web-images.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(f"Prepared {sum(len(entry['variants']) for entry in images.values())} WebP variants from {len(images)} originals.")
