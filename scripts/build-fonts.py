"""Generate local WOFF2 fonts from official Nunito and Resource Han Rounded files.

Usage: python3 scripts/build-fonts.py /path/to/extracted-fonts
Requires fonttools and brotli. The input directory should contain nunito.ttf,
ResourceHanRoundedCN-Regular.ttf and ResourceHanRoundedCN-Medium.ttf.
"""
import sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1])
destination = root / "assets/fonts"
destination.mkdir(parents=True, exist_ok=True)

# Common simplified Chinese plus every CJK character used by the current site.
# Less common characters in future posts use the system fallback until rebuilt.
characters = set()
for lead in range(0xB0, 0xF8):
    for trail in range(0xA1, 0xFF):
        try:
            characters.update(map(ord, bytes([lead, trail]).decode("gb2312")))
        except UnicodeDecodeError:
            pass
characters.update(range(0x3000, 0x3040))
characters.update(range(0xFF00, 0xFFF0))
for filename in [root / "index.html", *root.glob("content/posts/*.md"),
                 *root.glob("journal/*.html"), *root.glob("assets/*.js")]:
    characters.update(ord(c) for c in filename.read_text()
                      if 0x2E80 <= ord(c) <= 0x9FFF or 0xF900 <= ord(c) <= 0xFAFF)

for style in ("Regular", "Medium"):
    font = TTFont(source / f"ResourceHanRoundedCN-{style}.ttf")
    options = subset.Options()
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14, 16, 17]
    options.name_languages = ["*"]
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=characters)
    subsetter.subset(font)
    # Give this subset its own family name, preserving copyright/license records.
    for record in font["name"].names:
        replacement = {1: "Jiake Rounded", 2: style, 3: f"JiakeRounded-{style}-0.990",
                       4: f"Jiake Rounded {style}", 6: f"JiakeRounded-{style}",
                       16: "Jiake Rounded", 17: style}.get(record.nameID)
        if replacement:
            record.string = replacement.encode(record.getEncoding())
    font.flavor = "woff2"
    target = destination / f"jiake-rounded-{style.lower()}.woff2"
    font.save(target)
    print(f"{target.name}: {target.stat().st_size:,} bytes")

font = TTFont(source / "nunito.ttf")
font.flavor = "woff2"
target = destination / "nunito-variable.woff2"
font.save(target)
print(f"{target.name}: {target.stat().st_size:,} bytes")
