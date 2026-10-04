"""Create public WebP encodings of unaltered, generated comic atlases."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
raw_dir = root.parent / "漫画素材" / "正式网页原稿"
output = root / "images" / "comic"
output.mkdir(parents=True, exist_ok=True)
pages = []
for number in range(1, 17):
    raw = raw_dir / f"page-{number:02d}.png"
    if not raw.is_file():
        raise FileNotFoundError(raw)
    with Image.open(raw) as source:
        image = source.convert("RGB")
        if image.width > 1400:
            image = image.resize((1400, round(image.height * 1400 / image.width)), Image.Resampling.LANCZOS)
        full_name = f"page-{number:02d}.webp"
        small_name = f"page-{number:02d}-small.webp"
        image.save(output / full_name, "WEBP", quality=84, method=6)
        small = image.resize((min(640, image.width), round(image.height * min(640, image.width) / image.width)), Image.Resampling.LANCZOS)
        small.save(output / small_name, "WEBP", quality=82, method=6)
        pages.append({"page": number, "width": image.width, "height": image.height, "smallWidth": small.width, "smallHeight": small.height, "bytes": (output / full_name).stat().st_size, "smallBytes": (output / small_name).stat().st_size})
metadata = {"pages": pages, "totalBytes": sum(p["bytes"] for p in pages), "totalSmallBytes": sum(p["smallBytes"] for p in pages)}
(output / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
print(json.dumps(metadata, indent=2))
