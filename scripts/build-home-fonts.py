"""Subset the existing, licensed Chinese fonts for homepage text. Requires fonttools + brotli."""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
sources = [root / "index.html", *sorted((root / "assets").glob("*.js")),
           *sorted((root / "assets/maps").glob("*.json"))]
characters = {ord(char) for source in sources for char in source.read_text()
              if 0x2E80 <= ord(char) <= 0x9FFF or 0xF900 <= ord(char) <= 0xFAFF
              or 0xFF00 <= ord(char) <= 0xFFEF}
for style in ("regular", "medium"):
    font = TTFont(root / f"assets/fonts/jiake-rounded-{style}.woff2")
    options = subset.Options()
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14, 16, 17]
    options.name_languages = ["*"]
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=characters)
    subsetter.subset(font)
    for record in font["name"].names:
        replacement = {1: "Jiake Rounded Home", 2: style.title(),
                       3: f"JiakeRoundedHome-{style}", 4: f"Jiake Rounded Home {style.title()}",
                       6: f"JiakeRoundedHome-{style}", 16: "Jiake Rounded Home",
                       17: style.title()}.get(record.nameID)
        if replacement:
            record.string = replacement.encode(record.getEncoding())
    output = root / f"assets/fonts/jiake-home-{style}.woff2"
    font.save(output)
    print(f"{output.name}: {output.stat().st_size:,} bytes ({len(characters)} requested glyphs)")
