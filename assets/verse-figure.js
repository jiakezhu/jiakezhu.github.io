/* The site's web-slinger, shared by the hero scene (hero-scene.js) and the site-wide
   extras (verse.js, verse-scenes.js): a chibi hero in a red-and-blue suit with big
   expressive lenses. Poses are solved in figure units — 1 ≈ standing height, hip at the
   origin, +x facing forward — and every part is inked separately, comic-book style. */
window.VerseFigure = (() => {
  const TAU = Math.PI * 2;
  const CENTER = { x: 0, y: -.3 }, SHOULDER = { x: .02, y: -.36 }, HAND = { x: .1, y: -.88 }, HEAD = { x: 0, y: -.58 };
  const HEAD_R = .21, THIGH = .17, SHIN = .16, UPPER = .14, FORE = .13;
  const polar = (p, len, a) => ({ x: p.x + len * Math.sin(a), y: p.y + len * Math.cos(a) });

  // tuck 1 = knees up (apex of a swing, a crouch), 0 = stretched out (bottom of a swing).
  // web 'up' holds a line overhead, 'rest' lets that arm hang. wave 0..1 raises the free arm and waves it.
  // mood: 'normal' | 'happy' | 'wide' | 'sleep' — the lenses do the acting.
  // side -1 waves on the back side (away from a wall he faces).
  function pose({ tuck = .5, web = 'up', wave = 0, side = 1, time = 0, look = 0, mood = 'normal', asleep = false } = {}) {
    const thigh = -.45 + 1.8 * tuck, fold = .3 + 1.8 * tuck;
    const legs = [0, -.45].map(o => { const knee = polar({ x: 0, y: 0 }, THIGH, thigh + o); return [knee, polar(knee, SHIN, thigh + o - fold)]; });
    const arm = -.7 + 2.1 * tuck * tuck, raised = arm + (1.75 * side - arm) * wave;
    // Waving, the shoulder slides out to the side so the hand clears the face.
    const shoulder = { x: SHOULDER.x + .15 * wave * side, y: SHOULDER.y + .03 * wave };
    const elbow = polar(shoulder, UPPER, raised);
    const free = polar(elbow, FORE, raised + .5 * (1 - wave) + wave * side * (.95 + .3 * Math.sin(time * 10)));
    const webElbow = web === 'up' ? { x: .13, y: -.62 } : polar(SHOULDER, UPPER, .25);
    const webHand = web === 'up' ? HAND : polar(webElbow, FORE, .6);
    return { legs, shoulder, elbow, free, webElbow, webHand, look, time, wave, mood: asleep ? 'sleep' : mood };
  }

  // Distance from the figure's center down to its lowest foot, in figure units.
  const feet = p => Math.max(p.legs[0][1].y, p.legs[1][1].y) - CENTER.y;

  // f = { center, rot, dir, size, pose }; maps a point in figure units to the canvas.
  function toWorld(f, v) {
    const x = (v.x - CENTER.x) * f.dir * f.size, y = (v.y - CENTER.y) * f.size, c = Math.cos(f.rot), s = Math.sin(f.rot);
    return { x: f.center.x + x * c - y * s, y: f.center.y + x * s + y * c };
  }
  // Where the center must be for the web hand to sit at `hand`.
  function centerFromHand(hand, rot, dir, size, p) {
    const h = p ? p.webHand : HAND, x = (CENTER.x - h.x) * dir * size, y = (CENTER.y - h.y) * size, c = Math.cos(rot), s = Math.sin(rot);
    return { x: hand.x + x * c - y * s, y: hand.y + x * s + y * c };
  }

  const SUIT = { red: '#e33a3f', redDeep: '#b8263a', blue: '#2f62d8', blueDeep: '#1f3f9a', ink: '#1a1322', eye: '#ffffff', glow: null };

  // colors: { red, redDeep, blue, blueDeep, ink, eye, glow } (SUIT by default).
  // `flat` paints a single-colour silhouette in colors.fill (smears, misprints).
  function paint(ctx, f, colors = SUIT, { alpha = 1, dx = 0, flat = false } = {}) {
    const p = f.pose, c = flat ? null : { ...SUIT, ...colors }, line = .03;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(f.center.x + dx, f.center.y); ctx.rotate(f.rot); ctx.scale(f.dir * f.size, f.size); ctx.translate(-CENTER.x, -CENTER.y);
    ctx.lineCap = ctx.lineJoin = 'round';
    const hip = { x: 0, y: 0 };

    const limb = (a, b, w) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); };
    const torsoPath = g => {
      ctx.beginPath();
      ctx.moveTo(-.085 - g, .03 + g);
      ctx.bezierCurveTo(-.14 - g, -.1, -.13 - g, -.3, -.07 - g, -.4 - g);
      ctx.quadraticCurveTo(.03, -.45 - g, .12 + g, -.39 - g);
      ctx.bezierCurveTo(.16 + g, -.28, .14 + g, -.08, .085 + g, .03 + g);
      ctx.quadraticCurveTo(0, .08 + g, -.085 - g, .03 + g);
    };
    // Each part: ink outline grown by `line`, then its colours on top.
    const part = (shape, fill) => {
      if (flat) { ctx.fillStyle = ctx.strokeStyle = colors.fill; shape(0); return; }
      ctx.fillStyle = ctx.strokeStyle = c.ink; shape(line);
      ctx.fillStyle = ctx.strokeStyle = fill; shape(0);
    };
    const leg = ([knee, foot]) => {
      part(g => { limb(hip, knee, .1 + 2 * g); limb(knee, foot, .09 + 2 * g); }, c?.blue);
      part(g => { ctx.beginPath(); ctx.ellipse(foot.x + .025, foot.y + .005, .065 + g, .045 + g, 0, 0, TAU); ctx.fill(); }, c?.red);
    };
    const arm = (elbow, hand, upper, from = SHOULDER) => {
      part(g => { limb(from, elbow, .075 + 2 * g); limb(elbow, hand, .068 + 2 * g); }, upper ? c?.red : c?.redDeep);
      part(g => { ctx.beginPath(); ctx.arc(hand.x, hand.y, .045 + g, 0, TAU); ctx.fill(); }, c?.red);
    };

    // A soft pale halo first, so he reads against a dark sky.
    if (!flat && c.glow) {
      ctx.save(); ctx.fillStyle = ctx.strokeStyle = c.glow;
      const g = .07;
      for (const [knee, foot] of p.legs) { limb(hip, knee, .1 + 2 * g); limb(knee, foot, .09 + 2 * g); }
      limb(SHOULDER, p.webElbow, .075 + 2 * g); limb(p.webElbow, p.webHand, .07 + 2 * g); limb(SHOULDER, p.elbow, .075 + 2 * g); limb(p.elbow, p.free, .07 + 2 * g);
      torsoPath(g); ctx.fill(); ctx.beginPath(); ctx.ellipse(HEAD.x, HEAD.y, .235 + g, .215 + g, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }

    leg(p.legs[1]);
    arm(p.webElbow, p.webHand, false);
    part(g => { torsoPath(g); ctx.fill(); }, c?.red);
    if (!flat) {
      // Blue flank, the belt line and a chest spider.
      ctx.save(); torsoPath(0); ctx.clip();
      ctx.fillStyle = c.blue; ctx.beginPath(); ctx.moveTo(-.15, .1); ctx.lineTo(-.15, -.3); ctx.quadraticCurveTo(-.04, -.22, -.035, .1); ctx.fill();
      ctx.strokeStyle = c.ink; ctx.lineWidth = .014; ctx.beginPath(); ctx.moveTo(-.15, -.3); ctx.quadraticCurveTo(-.04, -.22, -.035, .1); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = ctx.strokeStyle = c.ink; ctx.lineWidth = .013;
      ctx.beginPath(); ctx.ellipse(.045, -.29, .02, .032, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(.045, -.335, .013, 0, TAU); ctx.fill();
      for (const sx of [-1, 1]) for (const [y1, y2] of [[-.33, -.38], [-.3, -.33], [-.28, -.24], [-.26, -.21]]) {
        ctx.beginPath(); ctx.moveTo(.045, -.295); ctx.lineTo(.045 + sx * .045, y1); ctx.lineTo(.045 + sx * .06, y2); ctx.stroke();
      }
    }
    leg(p.legs[0]);
    // A waving arm comes out in front of the head; otherwise the head overlaps the shoulder.
    if (p.wave <= .3) arm(p.elbow, p.free, true, p.shoulder);
    head(ctx, p, c, flat ? colors.fill : null, line);
    if (p.wave > .3) arm(p.elbow, p.free, true, p.shoulder);
    ctx.restore();
  }

  // A front-facing chibi mask: wide round head, two mirrored lenses, rosy cheeks.
  const HEAD_RX = .235, HEAD_RY = .215;
  function head(ctx, p, c, flatFill, line) {
    ctx.save(); ctx.translate(HEAD.x, HEAD.y); ctx.rotate(p.look || 0);
    const shape = g => { ctx.beginPath(); ctx.ellipse(0, 0, HEAD_RX + g, HEAD_RY + g, 0, 0, TAU); ctx.fill(); };
    if (flatFill) { ctx.fillStyle = flatFill; shape(0); ctx.restore(); return; }
    ctx.fillStyle = c.ink; shape(line);
    ctx.fillStyle = c.red; shape(0);
    // Web lines radiate from the middle of the face.
    ctx.save(); shape(0); ctx.clip();
    const o = { x: 0, y: .03 };
    ctx.strokeStyle = c.ink; ctx.globalAlpha *= .35; ctx.lineWidth = .008;
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + Math.PI / 10; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + Math.cos(a) * .4, o.y + Math.sin(a) * .4); ctx.stroke(); }
    for (const r of [.1, .18, .26]) {
      ctx.beginPath();
      for (let i = 0; i <= 20; i++) { const a = i / 20 * TAU + Math.PI / 10, rr = r * (i % 2 ? .92 : 1); const x = o.x + Math.cos(a) * rr, y = o.y + Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    ctx.restore();
    // Soft shine on the crown.
    ctx.fillStyle = 'rgba(255,255,255,.32)'; ctx.beginPath(); ctx.ellipse(-.09, -.12, .065, .03, -.45, 0, TAU); ctx.fill();
    // Rosy cheeks under the lenses.
    ctx.fillStyle = 'rgba(255,170,190,.55)';
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * .135, .1, .042, .024, 0, 0, TAU); ctx.fill(); }
    const blink = p.mood !== 'sleep' && (p.time % 4.3) > 4.17;
    const mood = p.mood === 'sleep' ? 'sleep' : blink ? 'blink' : p.mood;
    for (const sx of [-1, 1]) lens(ctx, c, sx, mood);
    ctx.restore();
  }
  // One lens, mirrored by sx: a big rounded teardrop whose outer corner lifts.
  function lens(ctx, c, sx, mood) {
    ctx.save(); ctx.translate(sx * .09, -.01); ctx.scale(sx, 1);
    ctx.lineCap = ctx.lineJoin = 'round';
    if (mood === 'happy') {
      // ^ ^ — closed, smiling lenses.
      ctx.strokeStyle = c.ink; ctx.lineWidth = .05;
      ctx.beginPath(); ctx.moveTo(-.055, .03); ctx.quadraticCurveTo(.005, -.07, .065, .02); ctx.stroke();
      ctx.restore(); return;
    }
    if (mood === 'sleep' || mood === 'blink') {
      ctx.strokeStyle = c.ink; ctx.lineWidth = .04;
      ctx.beginPath(); ctx.moveTo(-.055, 0); ctx.quadraticCurveTo(.005, mood === 'sleep' ? .045 : .02, .065, 0); ctx.stroke();
      ctx.restore(); return;
    }
    const k = mood === 'wide' ? 1.12 : 1;
    ctx.scale(k, k);
    const path = g => {
      ctx.beginPath();
      ctx.moveTo(-.058 - g, .015);
      ctx.bezierCurveTo(-.062 - g, -.05 - g, .0, -.078 - g, .055, -.07 - g);
      ctx.bezierCurveTo(.09 + g, -.064 - g, .1 + g, -.01, .085 + g, .03);
      ctx.bezierCurveTo(.07 + g, .075 + g, .01, .085 + g, -.025, .075 + g);
      ctx.bezierCurveTo(-.05 - g, .065 + g, -.056 - g, .045, -.058 - g, .015);
      ctx.closePath(); ctx.fill();
    };
    ctx.fillStyle = c.ink; path(.024);
    ctx.fillStyle = c.eye; path(0);
    // A cool tint along the bottom and a sparkle, so the lenses look glossy.
    ctx.save(); path(0); ctx.clip();
    ctx.fillStyle = 'rgba(190,205,235,.45)'; ctx.beginPath(); ctx.ellipse(.03, .1, .1, .04, 0, 0, TAU); ctx.fill();
    ctx.restore();
    
    ctx.restore();
  }

  // A short-lived web splat: spokes and two sagging rings, `k` 0..1 through its life.
  function splat(ctx, x, y, radius, color, k, rot = 0) {
    const grow = Math.min(1, k * 6), spokes = 7;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.lineCap = 'round';
    ctx.globalAlpha *= 1 - k * k;
    for (let i = 0; i < spokes; i++) { const a = i / spokes * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * radius * grow, Math.sin(a) * radius * grow); ctx.stroke(); }
    for (const ring of [.38, .72]) {
      ctx.beginPath();
      for (let i = 0; i <= spokes; i++) {
        const a = i / spokes * TAU, r = ring * radius * grow, px = Math.cos(a) * r, py = Math.sin(a) * r;
        if (!i) { ctx.moveTo(px, py); continue; }
        const m = a - Math.PI / spokes, rr = r * .82;
        ctx.quadraticCurveTo(Math.cos(m) * rr, Math.sin(m) * rr, px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // A pendulum swing from hand position S to release point R, hung from a line at height `anchorY`.
  function swing(S, R, anchorY) {
    S = { x: S.x, y: Math.max(S.y, anchorY + 24) }; R = { x: R.x, y: Math.max(R.y, anchorY + 24) };
    if (Math.abs(R.x - S.x) < 30) R.x = S.x + (R.x >= S.x ? 30 : -30);
    let ax = ((R.x * R.x - S.x * S.x) + (R.y - anchorY) ** 2 - (S.y - anchorY) ** 2) / (2 * (R.x - S.x));
    let phi0 = Math.atan2(S.x - ax, S.y - anchorY), phi1 = Math.atan2(R.x - ax, R.y - anchorY);
    // Very uneven heights push the anchor sideways; level the release instead of flinging.
    if (Math.abs(phi0) > 1.3 || Math.abs(phi1) > 1.3) { R = { x: R.x, y: S.y }; ax = (S.x + R.x) / 2; phi0 = Math.atan2(S.x - ax, S.y - anchorY); phi1 = Math.atan2(R.x - ax, R.y - anchorY); }
    const A = { x: ax, y: anchorY }, L = Math.hypot(S.x - ax, S.y - anchorY), dir = Math.sign(R.x - S.x) || 1;
    return {
      A, L, S, R, dir,
      at(s) {
        const phi = phi0 + (phi1 - phi0) * (1 - Math.cos(Math.PI * s)) / 2;
        return { hand: { x: A.x + L * Math.sin(phi), y: A.y + L * Math.cos(phi) }, rot: -phi, tuck: (Math.cos(TAU * s) + 1) / 2 };
      }
    };
  }

  return { pose, paint, splat, swing, feet, toWorld, centerFromHand, SUIT, HAND, HEAD, CENTER };
})();
