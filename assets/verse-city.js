/* Shared city kit for the hero scene (hero-scene.js) and the site-wide scenery
   (verse-scenes.js): theme palettes, shaded building strips, comic clouds and birds.
   Dark theme is a sunset/dusk city; light theme is a bright comic-book afternoon. */
window.VerseCity = (() => {
  const TAU = Math.PI * 2;
  const mulberry = seed => () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const rgba = (hex, a) => `rgba(${rgb(hex).join(',')},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
  const mix = (a, b, k) => { const x = rgb(a), y = rgb(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join(''); };

  // glow: horizon-up gradient stops [colour, alpha]. layers: far → near building tones.
  const THEMES = {
    dark: {
      glow: [['#f2a541', .44], ['#e2685a', .3], ['#6d4f9c', .14]], sun: '#ffc25c', halo: .55, stars: .8,
      layers: ['#2e2633', '#1f1b24', '#100f13'], shade: .28, rim: ['#f2a541', .22],
      window: '#ffcf73', glass: null, clouds: null, birds: null,
      web: '#f6f0e4', petal: '#f6c445', bubble: '#fff1cf', plane: '#f7e4bd',
      split: ['#ff3d6e', '#2fc6ff'], splitBlend: 'screen', figure: { glow: '#fff6e6' }
    },
    light: {
      glow: [['#ffcf8f', .62], ['#ffb3a1', .34], ['#7cc0f0', .42]], sun: '#ffb52e', halo: .6, stars: 0,
      layers: ['#dde5f2', '#b3c3e0', '#7286b3'], shade: .14, rim: ['#fff8e6', .8],
      window: '#ffffff', glass: '#eef6ff', clouds: { fill: '#ffffff', shade: '#d9e5f6', line: '#aab8d6', alpha: .95 }, birds: '#4a5578',
      web: '#3b3542', petal: '#eba52a', bubble: '#ffffff', plane: '#5e6f99',
      split: ['#ff3d6e', '#2fb0ff'], splitBlend: 'multiply', figure: { glow: null }
    }
  };
  const MOON = {
    dark: { glow: [['#8a7fd0', .32], ['#4f4c95', .22], ['#2a2557', .1]], sun: '#eef0ff', halo: .35, window: '#ffe6a0', stars: 1, clouds: null },
    light: { glow: [['#bcd7ff', .5], ['#dcd0ff', .32], ['#8fc4f2', .4]], sun: '#f7f6ff', halo: .45 }
  };
  // Time-of-day variants for the scenery strips further down the page.
  const MOODS = {
    dark: {
      night: { glow: [['#5f58b0', .3], ['#352f6e', .18], ['#1d1a3d', .08]], window: '#ffe6a0', stars: 1, sun: '#eef0ff', halo: .3, clouds: null },
      dawn: { glow: [['#ff9e6b', .48], ['#f5c26b', .26], ['#7a8fd6', .14]], sun: '#ffc870', layers: ['#3a3247', '#2a2433', '#17141c'], stars: .35, rim: ['#ff9e6b', .3] }
    },
    light: {
      noon: { glow: [['#bfe6ff', .5], ['#8fd0fb', .45], ['#5fb3f0', .42]], sun: '#ffd23f' },
      golden: { glow: [['#ffb36b', .62], ['#ff8f86', .36], ['#9fb7f0', .3]], sun: '#ff9f2e', rim: ['#ffe2b0', .8] }
    }
  };
  const theme = () => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  function palette({ moon = false, mood = null } = {}) {
    const t = theme();
    return { theme: t, ...THEMES[t], ...(mood ? MOODS[t][mood] : null), ...(moon ? MOON[t] : null) };
  }

  // Three parallax strips: far towers, mid blocks, near rooftops with water tanks.
  const SPECS = [
    { h: [.3, .58], w: [34, 86], speed: 5, lit: .1, depth: [5, 2, .35] },
    { h: [.2, .42], w: [44, 110], speed: 11, lit: .2, depth: [10, 4, .2] },
    { h: [.08, .22], w: [60, 140], speed: 22, lit: .28, depth: [18, 7, .07], tanks: true }
  ];
  // One seamless, horizontally tiling strip of buildings, pre-rendered once.
  // `spare` collects window slots the scene can switch on and off later.
  function strip({ index, width, tileH, ground, sky, unit, dpr, pal, seed = 97, spec = SPECS[index] }) {
    const rand = mulberry(seed + index * 31);
    const tileW = Math.ceil(width * 1.3) + 240;
    const body = document.createElement('canvas'), lights = document.createElement('canvas');
    for (const c of [body, lights]) { c.width = Math.round(tileW * dpr); c.height = Math.round(tileH * dpr); c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); }
    const b = body.getContext('2d'), l = lights.getContext('2d'), spare = [];
    const base = pal.layers[index], tones = { base, shade: mix(base, '#000000', pal.shade), rim: pal.rim };
    for (let x = -20; x < tileW;) {
      const w = (spec.w[0] + rand() * (spec.w[1] - spec.w[0])) * unit;
      const h = (spec.h[0] + rand() * (spec.h[1] - spec.h[0])) * sky;
      const building = { x, w, h, top: ground - h, roof: rand(), seed: Math.floor(rand() * 1e9) };
      // Paint the strip's tail again at its head so the scroll wraps without a seam.
      for (const offset of [0, -tileW]) paintBuilding(b, l, building, offset, spec, tones, pal, unit, tileH, offset ? null : spare);
      x += w + (rand() < .3 ? rand() * 16 * unit : -rand() * 6 * unit);
    }
    return { body, lights, tileW, tileH, spec, speed: spec.speed * unit, spare, on: new Set() };
  }
  function paintBuilding(b, l, { x, w, h, top, roof, seed }, offset, spec, tones, pal, unit, tileH, spare) {
    x += offset;
    const rand = mulberry(seed);
    b.fillStyle = b.strokeStyle = tones.base;
    b.fillRect(x, top, w, tileH - top);
    if (roof < .22) b.fillRect(x + w * .18, top - h * .07, w * .64, h * .07 + 1);
    else if (roof < .38) { b.fillRect(x + w * .5 - 1, top - 30 * unit, 2 * unit, 30 * unit); b.fillRect(x + w * .3, top - 6 * unit, w * .4, 6 * unit); }
    else if (spec.tanks && roof > .55) {
      const tx = x + w * (.2 + (roof - .55)), tw = 15 * unit, th = 13 * unit, legs = 9 * unit;
      b.lineWidth = 1.4 * unit;
      b.beginPath(); b.moveTo(tx + 2 * unit, top); b.lineTo(tx + 3 * unit, top - legs); b.moveTo(tx + tw - 2 * unit, top); b.lineTo(tx + tw - 3 * unit, top - legs); b.stroke();
      b.fillRect(tx, top - legs - th, tw, th);
      b.beginPath(); b.moveTo(tx - 1 * unit, top - legs - th); b.lineTo(tx + tw / 2, top - legs - th - 7 * unit); b.lineTo(tx + tw + 1 * unit, top - legs - th); b.fill();
    }
    // Two-tone volume: a shaded side away from the sun, a lit edge facing it.
    b.fillStyle = tones.shade; b.fillRect(x + w * .7, top, w * .3, tileH - top);
    b.fillStyle = rgba(tones.rim[0], tones.rim[1]); b.fillRect(x, top, Math.max(1, 1.6 * unit), tileH - top);
    if (rand() < .35) { b.fillStyle = rgba(tones.shade, .6); b.fillRect(x, top + h * .3, w, 1.2 * unit); }
    const gx = 9 * unit, gy = 12 * unit;
    for (let wy = top + 8 * unit; wy < top + h - 6 * unit; wy += gy)
      for (let wx = x + 6 * unit; wx < x + w - 6 * unit; wx += gx) {
        if (pal.glass) {
          // Daylight: every pane is glass, catching the sky unevenly.
          l.fillStyle = rgba(pal.glass, (.12 + rand() * .3) * (.45 + spec.lit * 2)); l.fillRect(wx, wy, 3.2 * unit, 5 * unit);
          if (spare && spare.length < 400 && wx > 0 && rand() < .3) spare.push({ x: wx, y: wy });
        } else if (rand() < spec.lit) { l.fillStyle = pal.window; l.fillRect(wx, wy, 3.2 * unit, 5 * unit); }
        else if (spare && spare.length < 400 && wx > 0) spare.push({ x: wx, y: wy });
      }
  }

  // A comic cloud: overlapping puffs, an inked outline, a shaded underside.
  function cloud(rand, unit, pal, dpr) {
    const c = pal.clouds, w = (80 + rand() * 90) * unit, h = w * .36, pad = 6;
    const canvas = document.createElement('canvas'); canvas.width = Math.round((w + pad * 2) * dpr); canvas.height = Math.round((h + pad * 2) * dpr);
    const g = canvas.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = 4 + Math.floor(rand() * 3), puffs = [];
    for (let i = 0; i < n; i++) {
      const t = (i + .5) / n, r = h * (.32 + .38 * Math.sin(Math.PI * t) + rand() * .12);
      puffs.push([pad + w * t, pad + h - r * .85, r]);
    }
    const shape = grow => { g.beginPath(); for (const [x, y, r] of puffs) { g.moveTo(x + r + grow, y); g.arc(x, y, r + grow, 0, TAU); } g.roundRect(pad - grow, pad + h * .55 - grow, w + grow * 2, h * .45 + grow * 2, h * .25); g.fill(); };
    g.fillStyle = c.line; shape(1.4);
    g.fillStyle = c.fill; shape(0);
    g.globalCompositeOperation = 'source-atop';
    const shade = g.createLinearGradient(0, pad + h * .45, 0, pad + h); shade.addColorStop(0, rgba(c.shade, 0)); shade.addColorStop(1, rgba(c.shade, 1));
    g.fillStyle = shade; g.fillRect(0, 0, w + pad * 2, h + pad * 2);
    return { canvas, w: w + pad * 2, h: h + pad * 2 };
  }

  // A loose flock of flapping birds heading left from (x, y).
  function birds(ctx, time, x, y, count, unit, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.3 * unit; ctx.lineCap = 'round';
    for (let i = 0; i < count; i++) {
      const bx = x + i * 16 * unit + Math.sin(i * 1.7) * 6 * unit, by = y + ((i * 7) % 3) * 7 * unit + Math.sin(time * 1.3 + i) * 2 * unit;
      const flap = Math.sin(time * 8 + i * 1.3) * 3.2 * unit, s = 5 * unit;
      ctx.beginPath(); ctx.moveTo(bx - s, by - flap); ctx.quadraticCurveTo(bx - s * .4, by - flap * .2 - 1, bx, by); ctx.quadraticCurveTo(bx + s * .4, by - flap * .2 - 1, bx + s, by - flap); ctx.stroke();
    }
  }

  // The sun (or moon) as a halftone disc, like a comic-book print.
  function sun(r, pal, dpr, moon) {
    const side = Math.ceil(r * 2.6), c = document.createElement('canvas'); c.width = c.height = Math.round(side * dpr);
    const s = c.getContext('2d'); s.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mid = side / 2, halo = s.createRadialGradient(mid, mid, r * .2, mid, mid, side / 2);
    halo.addColorStop(0, rgba(pal.sun, pal.halo)); halo.addColorStop(.5, rgba(pal.sun, pal.halo * .3)); halo.addColorStop(1, rgba(pal.sun, 0));
    s.fillStyle = halo; s.fillRect(0, 0, side, side);
    s.fillStyle = rgba(pal.sun, .92);
    const step = r / 19, craters = moon ? [[-.3, -.25, .22], [.28, .1, .16], [-.05, .38, .12]] : [];
    for (let y = -r; y <= r; y += step)
      for (let x = -r + ((y / step) % 2 ? step / 2 : 0); x <= r; x += step) {
        const d = Math.hypot(x, y); if (d > r) continue;
        let dot = step * .5 * (.35 + .65 * (1 - (y + r) / (2 * r) * .8)) * Math.min(1, (r - d) / step + .4);
        if (moon) dot = step * .42 * Math.min(1, (r - d) / step + .4) * (craters.some(([cx, cy, cr]) => Math.hypot(x / r - cx, y / r - cy) < cr) ? .55 : 1);
        s.beginPath(); s.arc(mid + x, mid + y, dot, 0, TAU); s.fill();
      }
    return { canvas: c, size: side, r };
  }

  // Sky haze rising from the skyline, with a Ben-Day screen punched through it.
  let screen = null;
  function haze(ctx, pal, x, y, w, h, boost = 0) {
    const grad = ctx.createLinearGradient(0, y + h, 0, y), [a, b, c] = pal.glow, k = 1 + boost;
    grad.addColorStop(0, rgba(a[0], a[1] * k)); grad.addColorStop(.35, rgba(b[0], b[1] * k)); grad.addColorStop(.72, rgba(c[0], c[1] * k)); grad.addColorStop(1, rgba(c[0], 0));
    ctx.fillStyle = grad; ctx.fillRect(x, y, w, h);
    if (!screen) {
      const tile = document.createElement('canvas'); tile.width = tile.height = 7;
      const t = tile.getContext('2d'); t.fillStyle = '#000'; t.beginPath(); t.arc(3.5, 3.5, 1.25, 0, TAU); t.fill();
      screen = tile;
    }
    ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = .42; ctx.fillStyle = ctx.createPattern(screen, 'repeat'); ctx.fillRect(x, y, w, h); ctx.restore();
  }

  return { palette, theme, strip, cloud, birds, sun, haze, SPECS, mulberry, rgba, mix };
})();
