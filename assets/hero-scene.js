/* Hero backdrop: a web-slinger working a sunset skyline behind the hero, timed to Sunflower.
   His webs hang from the underside of the nav bar, he clings to the edge of the portrait
   between runs, and every web fires on a beat — phase-locked to the track while it plays.
   Click the sky to send him there, click him for a flip, hover the portrait to call him
   over, hover "Explore my work" while he rests and he'll tug it; click the sun for the moon.
   The city shifts in depth with the pointer and the scroll. Paused offscreen, in
   background tabs and under reduced motion. */
(() => {
  const hero = document.getElementById('hero'), canvas = document.getElementById('hero-canvas');
  const Figure = window.VerseFigure, City = window.VerseCity;
  if (!hero || !canvas || !Figure || !City) return;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const env = window.SUNFLOWER_ENVELOPE;
  const BEAT = 60 / 90, TAU = Math.PI * 2;

  // Precomputed band envelopes: one base64 char per frame, 0-63.
  const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
  const decode = s => Float32Array.from(s, c => ALPHABET.indexOf(c) / 63);
  const bands = env ? { bass: decode(env.bass) } : null;
  const sample = (band, t) => {
    const f = t * env.fps, i = Math.floor(f), a = band[i] ?? 0, b = band[i + 1] ?? a;
    return a + (b - a) * (f - i);
  };
  const { mulberry, rgba } = City;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = v => v * v * (3 - 2 * v);
  const lerp = (a, b, k) => a + (b - a) * k;
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

  let moon = new Date().getHours() < 5, palette = City.palette({ moon });

  let width = 0, height = 0, dpr = 1, ground = 0, sky = 0, top = 0, unit = 1, size = 40, anchorY = 70, pageTop = 0;
  let layers = [], sun = null, stars = [], petals = [], clouds = [], wall = null;
  const cta = hero.querySelector('.hero-actions .btn-primary');

  function spawnPetal(rand, anywhere) {
    return {
      x: anywhere ? rand() * width : width + 20 + rand() * 60, y: rand() * ground * (anywhere ? .85 : .6),
      vx: -(10 + rand() * 16) * unit, vy: (5 + rand() * 8) * unit, rot: rand() * TAU, spin: (rand() - .5) * 1.6,
      size: (5 + rand() * 5) * unit, phase: rand() * TAU
    };
  }

  function measure() {
    const r = hero.getBoundingClientRect();
    width = r.width; height = r.height; dpr = Math.min(devicePixelRatio || 1, 2); pageTop = r.top + scrollY;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // On stacked mobile layouts the hero is taller than the screen; keep the scene in the first view.
    ground = Math.min(height, Math.max(innerHeight, 560)); sky = Math.min(ground, 820); top = ground - sky;
    unit = clamp(width / 1300, .7, 1.25); size = clamp(sky * .11, 40, 92);
    // Webs hang from the underside of the fixed nav bar.
    const nav = document.querySelector('nav');
    anchorY = clamp((nav ? nav.offsetHeight : 0) - pageTop + 3, 12, sky * .3);
    measureWall();
  }
  // He clings to the portrait's left edge, frog-style, but only where the gap to the text
  // column fits him. Re-measured before each visit: the portrait animates in on load.
  function measureWall() {
    const r = hero.getBoundingClientRect(), photo = hero.querySelector('.hero-photo-clip')?.getBoundingClientRect(), text = hero.querySelector('.hero-left')?.getBoundingClientRect();
    wall = null;
    if (!photo || !text || !text.width || photo.height < 120 || photo.left - text.right < size * .5) return;
    const p = Figure.pose({ tuck: .8, web: 'rest' }), reach = Math.max(p.free.x, p.webHand.x, p.legs[0][0].x, p.legs[1][0].x, Figure.HEAD.x + .34);
    wall = { x: photo.left - r.left, y: photo.top - r.top + photo.height * .32 };
    wall.center = { x: wall.x - (reach - Figure.CENTER.x) * size + 1, y: wall.y };
  }
  function build() {
    palette = City.palette({ moon });
    layers = [0, 1, 2].map(index => City.strip({ index, width, tileH: Math.ceil(height), ground, sky, unit, dpr, pal: palette }));
    sun = City.sun(Math.min(width, sky) * .2, palette, dpr, moon);
    const rand = mulberry(11);
    stars = Array.from({ length: Math.round(width / 26) }, () => ({ x: rand() * width, y: top + rand() * sky * .5, r: .5 + rand() * 1.1, phase: rand() * TAU }));
    petals = Array.from({ length: width < 700 ? 6 : 12 }, () => spawnPetal(rand, true));
    clouds = palette.clouds ? Array.from({ length: width < 700 ? 2 : 4 }, (_, i) => ({
      ...City.cloud(rand, unit, palette, dpr), x: rand() * (width + 300) - 150, y: top + sky * (.02 + rand() * .12), speed: (4 + rand() * 6) * unit, depth: .5 + i * .2
    })) : [];
  }

  // ── Choreography ────────────────────────────────────────────────────────────
  // A queue of segments in beat time: swing (3 beats), air (1), perch (8+), hidden (2).
  let queue = [], seg = null, last = null, planAt = 0, heading = 1, passes = 0, wantPerch = true;
  let blend = null, lastWeb = null, current = null, prevCenter = null;
  const margin = () => size * 2.2;
  const handY = () => anchorY + sky * (.24 + Math.random() * .1);
  const span = y => 2 * (y - anchorY) * Math.tan((48 + Math.random() * 8) * Math.PI / 180);

  function swingSeg(S, R, b0, dur, thwip) { return { kind: 'swing', b0, dur, path: Figure.swing(S, R, anchorY), thwip }; }
  function airSeg(from, to, b0, dur, opts = {}) {
    return { kind: 'air', b0, dur, from: { center: from.center, rot: from.rot }, to: { center: to.center, rot: from.rot + wrap(to.rot - from.rot) }, dir: opts.dir ?? from.dir ?? 1, flip: opts.flip, lift: opts.lift ?? sky * .05 };
  }
  function stateOf(s, k, b) {
    if (s.kind === 'swing') {
      const { hand, rot, tuck } = s.path.at(k), pose = Figure.pose({ tuck, time: (b ?? 0) * BEAT });
      return { center: Figure.centerFromHand(hand, rot, s.path.dir, size), rot, dir: s.path.dir, size, pose, hand };
    }
    if (s.kind === 'air') {
      const e = ease(k), r1 = s.to.rot + (s.flip ? s.dir * TAU : 0);
      return {
        center: { x: lerp(s.from.center.x, s.to.center.x, k), y: lerp(s.from.center.y, s.to.center.y, k) - s.lift * Math.sin(Math.PI * k) },
        rot: s.from.rot + (r1 - s.from.rot) * e, dir: s.dir, size, pose: Figure.pose({ tuck: .95, mood: s.flip ? 'wide' : 'normal', time: (b ?? 0) * BEAT })
      };
    }
    if (s.kind === 'perch') {
      const bob = Math.sin((b ?? 0) * Math.PI) * .6 + kick * 3;
      const f = { center: { x: wall.center.x, y: wall.center.y + bob }, rot: 0, dir: 1, size, perched: true };
      f.pose = Figure.pose({ tuck: .8 - .06 * kick, web: tugging ? 'up' : 'rest', wave, side: -1, time: (b ?? 0) * BEAT, look, mood: wave > .5 || tugging ? 'happy' : 'normal' });
      return f;
    }
    return null;
  }
  const handOf = f => f.hand || Figure.toWorld(f, f.pose.webHand);

  function enter(b) {
    const dir = wantPerch && wall ? 1 : heading, S = { x: dir > 0 ? -margin() : width + margin(), y: handY() };
    let R = { x: S.x + dir * span(S.y), y: handY() };
    if (wantPerch && wall) R.x = Math.min(R.x, wall.x - sky * .22);
    return [swingSeg(S, R, b, 3, true)];
  }
  function hop(from, b, dir, opts = {}) {
    const hand = handOf(from), S = { x: opts.x ?? hand.x + dir * sky * .12, y: handY() };
    const sw = swingSeg(S, { x: S.x + dir * span(S.y), y: handY() }, b + (opts.air ?? 1), 3, opts.thwip ?? Math.random() < .2);
    const start = stateOf(sw, 0);
    return [airSeg(from, start, b, opts.air ?? 1, { dir, flip: opts.flip ?? Math.random() < .3, lift: opts.lift }), sw];
  }
  function plan(state, b) {
    if (!state) return enter(b);
    if (state.perched) return hop(state, b, -1, { x: wall.x - sky * .3, air: 1, flip: false, lift: sky * .12, thwip: true });
    if (wantPerch) measureWall();
    if (wantPerch && wall) {
      wantPerch = false;
      const perch = { kind: 'perch', b0: b + 2, dur: 8 };
      return [airSeg(state, stateOf(perch, 0, b + 2), b, 2, { dir: 1, flip: false, lift: sky * .08 }), perch];
    }
    const dir = state.dir, next = handOf(state).x + dir * sky * .12;
    if (next < -margin() || next > width + margin()) {
      heading = -dir; passes++;
      if (wall && passes % 2 === 0) wantPerch = true;
      return [{ kind: 'hidden', b0: b, dur: 2 }];
    }
    return hop(state, b, dir);
  }
  function step(b) {
    for (let guard = 0; guard < 10; guard++) {
      if (!seg) {
        if (!queue.length) queue = plan(last, planAt);
        seg = queue.shift();
        if (seg.kind === 'perch') puff = { b: seg.b0 };
      }
      const end = seg.b0 + seg.dur;
      // Keep resting while someone is playing with him.
      if (seg.kind === 'perch' && (near || tugging) && b > end - .2 && seg.dur < 40) seg.dur += 4;
      if (b < end) return;
      last = seg.kind === 'hidden' ? null : stateOf(seg, 1, end);
      if (seg.kind === 'swing') lastWeb = { A: seg.path.A, hand: last.hand, b: end };
      planAt = end; seg = null;
    }
    // Fell far behind (a long background pause): start over from the wings.
    queue = []; seg = null; last = null; planAt = Math.ceil(b);
  }
  function figureAt(b) {
    if (!seg || b < seg.b0) return null;
    let f = stateOf(seg, clamp((b - seg.b0) / seg.dur, 0, 1), b);
    if (f && blend) {
      const k = (b - blend.b0) / blend.dur;
      if (k >= 1) blend = null;
      else { const e = ease(clamp(k, 0, 1)); f = { ...f, center: { x: lerp(blend.center.x, f.center.x, e), y: lerp(blend.center.y, f.center.y, e) }, rot: blend.rot + wrap(f.rot - blend.rot) * e, hand: undefined }; }
    }
    return f;
  }
  function interrupt(segments) {
    if (current) blend = { center: current.center, rot: current.rot, b0: beats, dur: .35 };
    queue = segments; seg = null;
  }

  // ── Interaction ─────────────────────────────────────────────────────────────
  const pointer = { x: -1e4, y: -1e4, inside: false };
  let parallaxX = 0, parallaxY = 0, wave = 0, look = 0, near = false, tugging = false, ctaHover = false, puff = null;

  function sendTo(p) {
    const b = beats, dur = Math.max(1, Math.ceil(b) + 1 - b);
    const S = current ? handOf(current) : { x: p.x < width / 2 ? -margin() : width + margin(), y: handY() };
    const T = { x: p.x, y: clamp(p.y, anchorY + sky * .12, ground - size) };
    if (Math.abs(T.x - S.x) < size * 1.5) T.x = S.x + (T.x >= S.x ? 1 : -1) * size * 1.5;
    wantPerch = false;
    interrupt([swingSeg(S, T, b, dur, true)]);
  }
  function flip() {
    if (!current) return;
    const b = beats, up = { center: { x: current.center.x, y: current.center.y }, rot: current.rot };
    interrupt([airSeg(current, up, b, 1.5, { dir: current.dir, flip: true, lift: sky * .14 })]);
  }
  function toggleMoon() {
    moon = !moon; build();
    if (moon) document.dispatchEvent(new CustomEvent('verse:egg', { detail: { id: 'moon' } }));
  }
  const sunCenter = () => ({ x: width * .5 - parallaxX * 3, y: ground - sky * .42 + scrollShift() * .45 });
  const scrollShift = () => clamp(scrollY - pageTop, 0, height);

  hero.addEventListener('click', e => {
    if (motion.matches || e.target.closest('a,button,input,textarea,select,label,[role="button"]')) return;
    const r = hero.getBoundingClientRect(), p = { x: e.clientX - r.left, y: e.clientY - r.top }, s = sunCenter();
    if (Math.hypot(p.x - s.x, p.y - s.y) < sun.r) { toggleMoon(); return; }
    if (e.target.closest('.hero-img-wrap')) { if (wall && !current?.perched) { sendTo({ x: wall.x - sky * .26, y: handY() }); wantPerch = true; } return; }
    if (current && Math.hypot(p.x - current.center.x, p.y - current.center.y) < size * .75) { flip(); return; }
    if (p.y < ground) sendTo(p);
  });
  hero.addEventListener('pointermove', e => {
    if (!finePointer.matches) return;
    const r = hero.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.inside = true;
  });
  hero.addEventListener('pointerleave', () => { pointer.inside = false; pointer.x = pointer.y = -1e4; });
  hero.querySelector('.hero-img-wrap')?.addEventListener('pointerenter', () => { if (wall && !current?.perched && seg?.kind !== 'perch') wantPerch = true; });
  cta?.addEventListener('pointerenter', () => { ctaHover = true; });
  cta?.addEventListener('pointerleave', () => { ctaHover = false; });

  // ── Music clock: free-runs at 90 BPM and phase-locks to the bar when the song plays ──
  let beats = 0, lastNow = 0, level = 0, bass = 0, prevBass = 0, kick = 0, split = 0, bar = -1;
  function advance(now) {
    const dt = lastNow ? Math.min(.1, (now - lastNow) / 1000) : 0; lastNow = now;
    beats += dt / BEAT;
    const audio = document.querySelector('audio.music-native');
    const live = Boolean(bands && audio && !audio.paused && !audio.ended && audio.readyState > 2 && !audio.muted && audio.volume > 0);
    if (live) {
      const t = audio.currentTime, target = Math.max(0, t - env.offset) / BEAT;
      const err = (((target - beats) % 4) + 6) % 4 - 2;
      beats += err * Math.min(1, dt * 2.5);
      bass = sample(bands.bass, t);
    } else bass = .22 * Math.exp(-(beats % 1) * 5);
    level += ((live ? 1 : .35) - level) * Math.min(1, dt * 1.5);
    const onset = Math.max(0, bass - prevBass); prevBass = bass;
    kick = Math.max(kick * Math.exp(-dt * 5), onset * 2);
    if (live && onset > .1) split = Math.min(1, split + onset * 3);
    split *= Math.exp(-dt * 4.5);
    // A few windows switch on and off every bar.
    if (Math.floor(beats / 4) !== bar) {
      bar = Math.floor(beats / 4);
      for (const layer of layers.slice(1)) for (let i = 0; i < 6 && layer.spare.length; i++) {
        const w = Math.floor(Math.random() * layer.spare.length);
        if (layer.on.has(w)) layer.on.delete(w); else if (layer.on.size < 70) layer.on.add(w);
      }
    }
    return dt;
  }

  // ── Painting ────────────────────────────────────────────────────────────────
  function paintBackdrop(time) {
    const sy = scrollShift();
    City.haze(ctx, palette, 0, ground - sky * .85, width, sky * .85, .25 * kick * level);
    if (palette.stars) {
      ctx.fillStyle = '#fff4dc';
      for (const s of stars) {
        ctx.globalAlpha = palette.stars * (.25 + .35 * (1 + Math.sin(time * 1.6 + s.phase)) / 2) * (1 - sy / height);
        ctx.beginPath(); ctx.arc(s.x - parallaxX * 2, s.y + sy * .5, s.r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // A plane crossing high up every so often, its beacon blinking.
    const k = (time % 46) / 46, px = -40 + k * (width + 80), py = top + sky * .13 + Math.sin(k * 7) * 3 + sy * .5;
    ctx.fillStyle = palette.plane; ctx.globalAlpha = .55; ctx.fillRect(px - 5 * unit, py, 10 * unit, 1.6 * unit); ctx.fillRect(px - 1.5 * unit, py - 2 * unit, 3 * unit, 5.6 * unit);
    if ((time * 1.4) % 1 < .14) { ctx.fillStyle = '#e8384f'; ctx.globalAlpha = .9; ctx.beginPath(); ctx.arc(px + 5 * unit, py + 1, 1.6 * unit, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    const s = sunCenter(), sunSize = sun.size * (1 + .05 * kick * level);
    ctx.drawImage(sun.canvas, s.x - sunSize / 2, s.y - sunSize / 2, sunSize, sunSize);
    // Clouds drift past in front of the sun; birds cross on clear days.
    ctx.globalAlpha = palette.clouds?.alpha ?? 1;
    for (const c of clouds) {
      const x = ((c.x + time * c.speed) % (width + 400) + width + 400) % (width + 400) - 200 - parallaxX * 4 * c.depth;
      ctx.drawImage(c.canvas, x, c.y + sy * .4, c.w, c.h);
    }
    ctx.globalAlpha = 1;
    if (palette.birds) {
      const f = (time % 34) / 34;
      if (f < .6) City.birds(ctx, time, width + 60 - f / .6 * (width + 220), top + sky * .2 + Math.sin(f * 5) * 10 + sy * .45, 5, unit, palette.birds);
    }
    layers.forEach((layer, i) => {
      const [dx, dy, scroll] = layer.spec.depth, offset = (time * layer.speed) % layer.tileW;
      const shiftX = -parallaxX * dx * unit, shiftY = -parallaxY * dy + sy * scroll;
      for (const x0 of [-offset, layer.tileW - offset]) {
        const x = x0 + shiftX;
        ctx.drawImage(layer.body, x, shiftY, layer.tileW, layer.tileH);
        ctx.globalAlpha = palette.glass ? .9 : (.3 + i * .12) + .45 * kick * level;
        ctx.drawImage(layer.lights, x, shiftY, layer.tileW, layer.tileH);
        if (layer.on.size) {
          // Night: lights going on and off. Day: panes catching the sun.
          ctx.fillStyle = palette.glass ? '#ffffff' : palette.window;
          for (const w of layer.on) { const p = layer.spare[w]; ctx.fillRect(x + p.x, shiftY + p.y, 3.2 * unit, 5 * unit); }
        }
        ctx.globalAlpha = 1;
      }
    });
  }

  function paintWebs(f, b) {
    ctx.lineCap = 'round';
    if (lastWeb && b - lastWeb.b < .6) {
      const k = (b - lastWeb.b) / .6;
      ctx.strokeStyle = palette.web; ctx.lineWidth = 1.2 * unit; ctx.globalAlpha = .7 * (1 - k);
      ctx.beginPath(); ctx.moveTo(lastWeb.A.x, lastWeb.A.y);
      ctx.quadraticCurveTo(lerp(lastWeb.A.x, lastWeb.hand.x, .6) + 14 * k, lerp(lastWeb.A.y, lastWeb.hand.y, .6) + 30 * k, lastWeb.hand.x, lastWeb.hand.y + 40 * k);
      ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (!f) return;
    if (f.perched && tugging && cta) {
      const r = hero.getBoundingClientRect(), c = cta.getBoundingClientRect(), hand = Figure.toWorld(f, f.pose.webHand);
      const tx = c.left + c.width * .85 - r.left, ty = c.top + c.height * .2 - r.top;
      ctx.strokeStyle = palette.web; ctx.lineWidth = 1.3 * unit; ctx.globalAlpha = .85;
      ctx.beginPath(); ctx.moveTo(hand.x, hand.y); ctx.quadraticCurveTo((hand.x + tx) / 2, (hand.y + ty) / 2 + 6 * Math.sin(b * Math.PI), tx, ty); ctx.stroke();
      ctx.globalAlpha = 1; Figure.splat(ctx, tx, ty, 7 * unit, palette.web, .15);
      return;
    }
    if (seg?.kind !== 'swing') return;
    const u = b - seg.b0, shot = ease(clamp(u / .18, 0, 1)), hand = handOf(f), A = seg.path.A;
    const tip = { x: lerp(hand.x, A.x, shot), y: lerp(hand.y, A.y, shot) };
    ctx.strokeStyle = palette.web; ctx.lineWidth = 1.4 * unit; ctx.globalAlpha = .9;
    ctx.beginPath(); ctx.moveTo(hand.x, hand.y);
    // A little slack while the line is still flying.
    ctx.quadraticCurveTo((hand.x + tip.x) / 2 + (1 - shot) * 12 * seg.path.dir, (hand.y + tip.y) / 2 + (1 - shot) * 10, tip.x, tip.y);
    ctx.stroke(); ctx.globalAlpha = 1;
    if (shot === 1) Figure.splat(ctx, A.x, A.y, 8 * unit, palette.web, clamp((u - .18) / 3.2, 0, .55));
    if (seg.thwip && u < .9) {
      const k = u / .9, pop = 1 + .3 * Math.max(0, 1 - u / .12);
      ctx.save(); ctx.globalAlpha = 1 - k * k;
      ctx.translate(hand.x + seg.path.dir * 30 * unit, hand.y - 16 * unit); ctx.rotate(-.18 * seg.path.dir); ctx.scale(pop, pop);
      ctx.font = `italic 900 ${15 * unit}px "Arial Black", Impact, sans-serif`; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      ctx.lineWidth = 4 * unit; ctx.strokeStyle = Figure.SUIT.ink; ctx.strokeText('THWIP!', 0, 0);
      ctx.fillStyle = palette.bubble; ctx.fillText('THWIP!', 0, 0);
      ctx.restore();
    }
  }

  function paintFigure(f, b, dt) {
    if (!f) { prevCenter = null; return; }
        // Speed lines trail him through the air.
    if (prevCenter && dt) {
      const vx = f.center.x - prevCenter.x, vy = f.center.y - prevCenter.y, v = Math.hypot(vx, vy) / dt;
      if (v > size * 4) {
        const nx = vx / Math.hypot(vx, vy), ny = vy / Math.hypot(vx, vy), alpha = clamp((v - size * 4) / (size * 8), 0, .45);
        ctx.strokeStyle = palette.web; ctx.lineWidth = 1.2 * unit; ctx.globalAlpha = alpha;
        for (const o of [-.3, 0, .3]) {
          const sx = f.center.x - nx * size * .55 - ny * o * size, sy = f.center.y - ny * size * .55 + nx * o * size;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - nx * size * (.5 - Math.abs(o)), sy - ny * size * (.5 - Math.abs(o))); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }
    prevCenter = f.center;
    const g = seg && b - .06 >= seg.b0 ? figureAt(b - .06) : null;
    if (g && g.dir === f.dir) Figure.paint(ctx, g, { fill: palette.split[1] }, { alpha: .16, flat: true });
    if (split > .05) {
      ctx.globalCompositeOperation = palette.splitBlend;
      Figure.paint(ctx, f, { fill: palette.split[0] }, { alpha: .7 * split, dx: -4 * split * unit, flat: true });
      Figure.paint(ctx, f, { fill: palette.split[1] }, { alpha: .7 * split, dx: 4 * split * unit, flat: true });
      ctx.globalCompositeOperation = 'source-over';
    }
    Figure.paint(ctx, f, palette.figure);
    // Landing dust where he grabs the portrait.
    if (puff && b - puff.b < .7 && wall) {
      const k = (b - puff.b) / .7;
      ctx.strokeStyle = palette.web; ctx.lineWidth = 1.2; ctx.globalAlpha = .5 * (1 - k);
      for (const o of [-1, 0, 1]) { ctx.beginPath(); ctx.arc(wall.x - 3, wall.y + o * size * .3 + o * k * 10 - size * .2, 3 + k * 9, 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
  }

  function paintPetals(time, dt) {
    const gust = 1 + kick * 1.5;
    ctx.fillStyle = palette.petal;
    petals.forEach((p, i) => {
      p.x += (p.vx * gust + Math.sin(time * .6 + p.phase) * 10) * dt; p.y += (p.vy + Math.cos(time * .8 + p.phase) * 6) * dt; p.rot += p.spin * dt;
      if (p.x < -30 || p.y > ground + 30) petals[i] = spawnPetal(Math.random, false);
      ctx.save(); ctx.globalAlpha = .6; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * .36, 0, 0, TAU); ctx.fill(); ctx.restore();
    });
  }

  function paint(now) {
    const dt = advance(now), time = now / 1000;
    // Pointer: depth parallax, and where he looks and waves while resting.
    const px = pointer.inside ? clamp(pointer.x / width * 2 - 1, -1, 1) : 0, py = pointer.inside ? clamp(pointer.y / ground * 2 - 1, -1, 1) : 0;
    parallaxX += (px - parallaxX) * Math.min(1, dt * 3); parallaxY += (py - parallaxY) * Math.min(1, dt * 3);
    step(beats);
    current = figureAt(beats);
    near = Boolean(current?.perched && pointer.inside && Math.hypot(pointer.x - current.center.x, pointer.y - current.center.y) < size * 2.6);
    tugging = Boolean(current?.perched && ctaHover);
    cta?.classList.toggle('verse-tug', tugging);
    wave += ((near && !tugging ? 1 : 0) - wave) * Math.min(1, dt * 6);
    let targetLook = 0;
    if (current?.perched && pointer.inside) {
      const head = Figure.toWorld(current, Figure.HEAD);
      targetLook = clamp(wrap(Math.atan2(pointer.y - head.y, pointer.x - head.x) - (current.rot - Math.PI / 2)), -.7, .7);
    }
    look += (targetLook - look) * Math.min(1, dt * 8);

    ctx.clearRect(0, 0, width, height);
    paintBackdrop(time);
    paintWebs(current, beats);
    paintFigure(current, beats, dt);
    paintPetals(time, dt);
  }

  let animation = 0, visible = true, lastPaint = 0;
  function frame(now) {
    animation = 0;
    if (!visible || document.hidden || motion.matches) return;
    if (now - lastPaint >= 30) { lastPaint = now; paint(now); }
    animation = requestAnimationFrame(frame);
  }
  function restart() {
    cancelAnimationFrame(animation); animation = 0; lastNow = 0;
    if (visible && !document.hidden && !motion.matches) animation = requestAnimationFrame(frame);
    else { ctx.clearRect(0, 0, width, height); cta?.classList.remove('verse-tug'); }
  }
  function reset() { measure(); build(); queue = []; seg = null; last = null; blend = null; planAt = Math.ceil(beats); }

  new ResizeObserver(() => { reset(); restart(); }).observe(hero);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; restart(); }).observe(hero);
  new MutationObserver(() => { build(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('visibilitychange', restart); motion.addEventListener('change', restart);
  reset(); restart();
  // Late-night visitors get the moon; it counts as finding that easter egg.
  if (moon) setTimeout(() => document.dispatchEvent(new CustomEvent('verse:egg', { detail: { id: 'moon' } })), 1500);
})();
