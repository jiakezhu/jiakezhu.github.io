# Comic orbital library · 2026-10-04

The homepage becomes a private space station and orbital library. Journey is the observatory, the AI portfolio is the laboratory, and Story is the reading room. The existing biography, projects, travel places, music, archive and four languages remain the content of these rooms.

## Final artwork

Generated and edited with the built-in imagegen tool, then copied into this repository. The edit target was a preliminary orbital-library scene; that unselected preliminary image is not deployed.

- Master: `images/station/orbital-library-comic-source.png` (1672 × 941).
- Web variants: `images/web/f6716f50e5ef-640.webp` (69,148 bytes), `images/web/f6716f50e5ef-1120.webp` (200,336 bytes), `images/web/f6716f50e5ef-1440.webp` (301,440 bytes).
- All lettering, navigation, roles and contacts are HTML rather than baked into the image.

### Final prompt (verbatim)

Use case: style-transfer. Edit target: the attached orbital library image. Transform the ENTIRE image into a sophisticated hand-drawn 2D science fiction COMIC PANEL, not a photograph or 3D render. Preserve the scene concept of a private space station library with huge circular observation window, Earth outside, warm bookshelves, plants, reading lamps on both sides, empty floor in foreground. Graphic novel aesthetic: confident fine dark navy ink contours on EVERY object, simplified flat cel-shaded color blocks, light watercolor paper grain and subtle screen-tone stippling; clearly illustrated and playful with poetic Franco-Belgian comic atmosphere. Palette: cream paper and ivory architecture, deep ink-navy sky, muted turquoise Earth, warm ochre lamps and book spines, a few terracotta accents. Keep this a single full-bleed landscape 16:9 comic illustration with no panel divisions and no lettering, captions, signs, speech bubbles, UI, logos or watermarks. Wide and symmetrical, library shelves flank left and right edges, the center window looks into a charming drawn Earth with swirling graphic clouds and star doodles, generous clean floor in bottom 35% for actual HTML text overlay. Make the bottom foreground a large quiet navy-blue rug/area with very few details so cream website typography reads clearly; warm side lighting. No people, trucks, cars, cockpit controls, steering wheels. Avoid: photorealism, glossy CGI, realistic lens effects, cyberpunk neon, dense hatching, clutter, childish preschool cartoon. Essential: unmistakable inked comic illustration, visible human line quality, attractive mature graphic-novel character.

## Interaction and maintenance

- `assets/orbital-comic.css` provides ink frames, paper palettes, bold rounded headings and responsive comic panels.
- `assets/orbital.css` provides the station layout shared by home, Story, articles and the growth comic.
- `assets/orbital-intro.css` uses the existing first-paint-safe intro controller with code-drawn rings instead of photo downloads.
- `assets/orbital.js` translates new copy and adds bounded stars, heading drift and pointer parallax. It respects reduced motion and background tabs.
- `assets/orbital-globe.js` renders the globe from the same local atlas data as Journey. The connected route is only the confirmed study route: Ningbo, Hangzhou, Chengdu, Paris. Choosing any existing place updates the globe and postcard together.
- Canvas sizes and frame rates are capped; geographic data loads close to the Journey section. Photo modal contents stay deferred.
- The old website archive remains unchanged. This theme is recorded in the existing single redesign journal article, in all four languages.

To regenerate WebP variants, use `python3 scripts/prepare-web-images.py` in an environment with Pillow. Then run `npm run build` and `npm test`. The master source is never downloaded by the homepage.
