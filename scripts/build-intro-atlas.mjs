import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const sharp = createRequire(import.meta.url)('sharp');
const root = new URL('../', import.meta.url);
const size = 320, columns = 4, rows = 2;
// Same photos and crops as the existing collage, packed into one download per screen size.
const photos = [
  ['be48c97a5125-400.webp', 1.5, true],
  ['cd8312dc7864-400.webp', 16/9, true],
  ['a11f415b67d3-400.webp', 1.5, false],
  ['66c4a64eea45-400.webp', 1.5, true],
  ['2f7469959f73-400.webp', 1.5, true],
  ['8bd883eb83b8-400.webp', .75, true],
  ['95f482e7a80e-400.webp', .75, false],
  ['4a99a3dd6722-400.webp', 1.5, true]
];
const output = new URL('images/web/intro/', root);
fs.mkdirSync(output, { recursive: true });
for (const mode of ['mobile','desktop']) {
  const tiles = [];
  for (const [index, [source, ratio, mobile]] of photos.entries()) {
    if (mode === 'mobile' && !mobile) continue;
    const crop = await sharp(fileURLToPath(new URL('images/web/' + source, root)))
      .resize(size, Math.round(size / ratio), { fit: 'cover' }).png().toBuffer();
    const input = await sharp(crop).resize(size, size, { fit: 'fill' }).png().toBuffer();
    tiles.push({ input, left: index % columns * size, top: Math.floor(index / columns) * size });
  }
  const target = new URL(mode + '.webp', output);
  await sharp({ create: { width: size * columns, height: size * rows, channels: 4, background: '#00000000' } })
    .composite(tiles).webp({ quality: 82, effort: 6 }).toFile(fileURLToPath(target));
  console.log(`Intro ${mode}: ${fs.statSync(target).size} bytes, ${tiles.length} photos in one request`);
}
