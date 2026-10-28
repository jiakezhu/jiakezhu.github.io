/* Hero desk scene: a chibi Jiake typing at his monitor, in place of the hero photo.
   The monitor browses real project screenshots, a bar at a time; the editor beside it
   types out a little self-portrait in code, one key press at a time. Head bobs, fairy
   lights and the desk sunflower follow Sunflower's beat (locked to the track while it
   plays). Hover and he turns round to wave; click the monitor for the next project,
   the sunflower for a spin; the badge switches to the real photo. */
(() => {
  const svg = document.querySelector('.desk-scene'), wrap = svg?.closest('.hero-img-wrap');
  if (!svg || !wrap) return;
  const NS = 'http://www.w3.org/2000/svg', root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const BEAT = 60 / 90, TAU = Math.PI * 2;
  const $ = s => svg.querySelector(s);
  const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent?.append(n); return n; };
  const ease = k => k < .5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;

  const HELLO = { zh: '嗨！你好 👋', en: 'Hi there! 👋', fr: 'Coucou ! 👋', es: '¡Hola! 👋' };

  // ── Monitor feed: real screenshots, each with the tab title it shows ──
  const FEED = [
    { src: 'images/web/desk/sales-account.jpg', w: 520, h: 310, tab: 'Sales Buddy' },
    { src: 'images/web/desk/site.jpg', w: 520, h: 343, tab: 'jiakezhu.github.io' },
    { icons: ['ae9c3e3303cb', '8646e4f7ea6c', '9bb764f5d19a', '63878dfe7d00', '4a98ccad9a72'], h: 34, tab: 'My apps' },
    { src: 'images/web/desk/sales-analytics.jpg', w: 520, h: 310, tab: 'Sales Buddy · Analytics' },
    { src: 'images/web/desk/paris-vlog.jpg', w: 520, h: 401, tab: 'Paris vlog' },
    { src: 'images/web/desk/comic.jpg', w: 240, h: 360, tab: 'Growth comic', narrow: true },
    { src: 'images/web/desk/sales-customers.jpg', w: 520, h: 310, tab: 'Sales Buddy · Customers' }
  ];
  const feed = $('.dk-feed'), FX = 254, FW = 164, GAP = 8, TOP = 124;
  const stops = [];
  let feedH = 0;
  // Two copies, so scrolling past the end wraps without a jump.
  for (let copy = 0; copy < 2; copy++) {
    let y = TOP + copy * feedH;
    FEED.forEach((item, i) => {
      if (!copy) stops.push(y - TOP);
      if (item.icons) {
        const size = 26, step = (FW - size * 5) / 4;
        item.icons.forEach((id, k) => el('image', { href: `images/web/${id}-160.webp`, x: FX + k * (size + step), y: y + 4, width: size, height: size }, feed));
        y += item.h + GAP;
      } else {
        const w = item.narrow ? 96 : FW, h = w * item.h / item.w, x = FX + (FW - w) / 2;
        el('image', { href: item.src, x, y, width: w, height: h, preserveAspectRatio: 'xMidYMid slice' }, feed);
        el('rect', { x, y, width: w, height: h, rx: 2, fill: 'none', stroke: '#c9cedb', 'stroke-width': .6 }, feed);
        y += h + GAP;
      }
      if (!copy && i === FEED.length - 1) feedH = y - TOP;
    });
  }
  const tab = $('.dk-tab');
  let feedIndex = 0, feedFrom = 0, feedTo = 0, feedT0 = -1;
  function nextFeed(now) {
    feedFrom = currentFeedY(now); feedIndex++;
    feedTo = feedIndex < FEED.length ? stops[feedIndex] : feedH + stops[feedIndex - FEED.length];
    feedT0 = now;
    tab.textContent = FEED[feedIndex % FEED.length].tab;
  }
  function currentFeedY(now) {
    if (feedT0 < 0) return feedTo;
    const k = Math.min(1, (now - feedT0) / 900);
    return feedFrom + (feedTo - feedFrom) * ease(k);
  }
  function paintFeed(now) {
    let y = currentFeedY(now);
    if (feedIndex >= FEED.length && now - feedT0 > 900) { feedIndex -= FEED.length; feedTo = stops[feedIndex]; feedFrom = feedTo; y = feedTo; }
    feed.setAttribute('transform', `translate(0 ${-y})`);
  }

  // ── Editor: a self-portrait in code, typed key by key ──
  const SCRIPT = [
    '// Always Day One.',
    'const me = {',
    "  langs: ['中','EN',",
    "    'FR','ES'],",
    "  role: 'AI builder',",
    '};',
    'while (curious) {',
    '  build(nextIdea);',
    '  ship(); learn();',
    '}',
    "deploy('Lessonfold');",
    '// ♪ Sunflower ×∞'
  ];
  const code = $('.dk-code'), LINE = 9.6, CX = 438, CY = 130, VISIBLE = 15;
  let typed = [''], lineNodes = [], caret = null;
  function colour(text) {
    if (text.trimStart().startsWith('//')) return [['c', text]];
    const out = [], re = /('[^']*'?)|\b(const|while)\b|\b([a-z]+)(?=\()/gi;
    let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push(['', text.slice(last, m.index)]);
      out.push([m[1] ? 's' : m[2] ? 'k' : 'f', m[0]]); last = re.lastIndex;
    }
    if (last < text.length) out.push(['', text.slice(last)]);
    return out;
  }
  function renderLine(i) {
    let node = lineNodes[i];
    if (!node) {
      const g = el('g', {}, code);
      el('text', { class: 'ln', x: CX - 5, y: CY + i * LINE }, g).textContent = i + 1;
      node = lineNodes[i] = el('text', { x: CX, y: CY + i * LINE }, g);
    }
    node.replaceChildren(...colour(typed[i]).map(([cls, text]) => { const t = el('tspan', cls ? { class: cls } : {}); t.textContent = text; return t; }));
  }
  function placeCaret() {
    const i = typed.length - 1, node = lineNodes[i];
    if (!caret) caret = el('rect', { class: 'caret', width: 3.2, height: 7 }, code);
    const w = node && typed[i] ? node.getComputedTextLength() : 0;
    caret.setAttribute('x', CX + w + .5); caret.setAttribute('y', CY + i * LINE - 6);
    const overflow = Math.max(0, typed.length - VISIBLE);
    code.setAttribute('transform', `translate(0 ${-overflow * LINE})`);
  }
  function resetCode() { code.replaceChildren(); lineNodes = []; caret = null; typed = ['']; renderLine(0); placeCaret(); }
  // Returns false once the script is finished.
  function typeKey() {
    const i = typed.length - 1, target = SCRIPT[i];
    if (target === undefined) return false;
    if (typed[i].length < target.length) {
      // Leading spaces go in as one tab press.
      const indent = typed[i] === '' ? target.match(/^ */)[0] : '';
      typed[i] += indent || target[typed[i].length];
      renderLine(i);
    } else {
      if (i + 1 >= SCRIPT.length) return false;
      typed.push(''); renderLine(i + 1);
    }
    placeCaret();
    return true;
  }

  // ── Keyboard keys light up as they are pressed ──
  const keys = [], keysG = $('.dk-keys');
  for (let row = 0; row < 3; row++) for (let col = 0; col < 13; col++) {
    const x = 260 + col * 13 + row * 3.4, y = 343.5 + row * 6.4;
    keys.push(el('rect', { x, y, width: 10.4, height: 4.6, rx: 1 }, keysG));
  }
  
  // ── Fairy lights along the wire ──
  const bulbs = [], bulbsG = $('.dk-bulbs'), COLORS = ['#ffd84a', '#ff6b8b', '#5fd4ff', '#b7ef6b'];
  for (let i = 0; i < 15; i++) {
    const t = (i + .5) / 15, x = -4 + t * 608, y = (1 - t) * (1 - t) * 24 + 2 * (1 - t) * t * 92 + t * t * 30;
    const g = el('g', {}, bulbsG);
    el('circle', { cx: x, cy: y + 7, r: 9, fill: COLORS[i % 4], opacity: .18 }, g);
    el('circle', { cx: x, cy: y + 7, r: 3.6, fill: COLORS[i % 4], stroke: '#1a1322', 'stroke-width': .8 }, g);
    bulbs.push(g);
  }

  // ── The desk sunflower ──
  const bloom = $('.dk-bloom');
  for (let i = 0; i < 14; i++) el('ellipse', { cx: 0, cy: -12, rx: 4.2, ry: 8.5, fill: '#ffc93c', stroke: '#1a1322', 'stroke-width': 1, transform: `rotate(${i / 14 * 360})` }, bloom);
  el('circle', { r: 8, fill: '#6b3d1f', stroke: '#1a1322', 'stroke-width': 1 }, bloom);
  for (let i = 0; i < 8; i++) el('circle', { cx: Math.cos(i * 2.4) * 4.5 * Math.sqrt((i + .5) / 8), cy: Math.sin(i * 2.4) * 4.5 * Math.sqrt((i + .5) / 8), r: .9, fill: '#3d2212' }, bloom);
  const flower = $('.dk-flower');
  let spinT0 = -1;

  // ── Music notes from the headphones ──
  const notesG = $('.dk-notes'), notes = [];
  function spawnNote(now) {
    const t = el('text', { x: 246, y: 300 }, notesG);
    t.textContent = Math.random() < .5 ? '♪' : '♫';
    notes.push({ t, t0: now, dx: 10 + Math.random() * 22, wob: Math.random() * TAU });
  }

  // ── State ──
  const head = $('.dk-head'), handL = $('.dk-hand--l'), handR = $('.dk-hand--r'), wave = $('.dk-wave');
  const bubbleText = $('.dk-bubble text'), screen = $('.dk-screen');
  let turned = false, turnUntil = 0, nextKey = 0, pause = 0, lastBeat = -1, lastBar = -1, hand = 0, prevBass = 0, kick = 0;
  const setHello = () => { bubbleText.textContent = HELLO[root.lang] || HELLO.en; };
  setHello();
  new MutationObserver(setHello).observe(root, { attributes: true, attributeFilter: ['lang'] });

  function clock(now) {
    const audio = document.querySelector('audio.music-native'), env = window.SUNFLOWER_ENVELOPE;
    const live = Boolean(audio && env && !audio.paused && audio.readyState > 2 && audio.volume > 0 && !audio.muted);
    if (live) {
      const ch = env.bass[Math.floor(audio.currentTime * env.fps)], bass = ch ? '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.indexOf(ch) / 63 : 0;
      kick = Math.max(kick * .85, Math.max(0, bass - prevBass) * 2); prevBass = bass;
      return { beat: Math.max(0, audio.currentTime - env.offset) / BEAT, live };
    }
    kick *= .85;
    return { beat: now / 1000 / BEAT, live };
  }

  function press(now) {
    hand ^= 1;
    const h = hand ? handR : handL;
    h.setAttribute('transform', 'translate(0 -3.5)');
    setTimeout(() => h.removeAttribute('transform'), 70);
    const k = keys[Math.floor(Math.random() * keys.length)];
    k.classList.add('is-down'); setTimeout(() => k.classList.remove('is-down'), 90);
    if (!typeKey()) { pause = now + 2600; }
  }

  function frame(now) {
    raf = 0;
    const { beat, live } = clock(now), phase = beat % 1, b = Math.floor(beat), bar = Math.floor(beat / 4);
    if (turned && now > turnUntil && !hover) setTurned(false);

    // Head: a nod on every beat while typing; a little tilt while waving.
    const nod = Math.exp(-phase * 5) * (live ? 4 : 2.2);
    head.setAttribute('transform', turned ? `rotate(${Math.sin(now / 260) * 4})` : `translate(0 ${nod}) rotate(${-2 + nod * .4})`);
    if (turned) wave.setAttribute('transform', `rotate(${Math.sin(now / 120) * 14})`);

    // Typing: bursts of key presses, a breath at the end of each line of the script.
    if (!turned && !motion.matches) {
      if (pause && now > pause) { pause = 0; resetCode(); }
      if (!pause && now >= nextKey) { press(now); nextKey = now + 55 + Math.random() * 95 + (Math.random() < .08 ? 260 : 0); }
    }

    if (b !== lastBeat) {
      lastBeat = b;
      bulbs.forEach((g, i) => g.setAttribute('opacity', (i + b) % 3 === 0 ? 1 : .55));
      if (live ? Math.random() < .6 : Math.random() < .15) spawnNote(now);
    }
    if (bar !== lastBar) { if (lastBar >= 0 && !hoverScreen) nextFeed(now); lastBar = bar; }
    paintFeed(now);

    // Sunflower: sway, a nod on the beat, a full spin when clicked.
    let rot = Math.sin(now / 900) * 4 + Math.exp(-phase * 6) * (2 + kick * 6);
    if (spinT0 >= 0) { const k = (now - spinT0) / 900; if (k >= 1) spinT0 = -1; else rot += ease(k) * 360; }
    flower.setAttribute('transform', `rotate(${rot})`);

    for (let i = notes.length - 1; i >= 0; i--) {
      const n = notes[i], k = (now - n.t0) / 1800;
      if (k >= 1) { n.t.remove(); notes.splice(i, 1); continue; }
      n.t.setAttribute('transform', `translate(${n.dx * k + Math.sin(k * 6 + n.wob) * 4} ${-k * 60})`);
      n.t.setAttribute('opacity', Math.sin(Math.PI * k));
    }
    if (visible && !document.hidden && !motion.matches && !wrap.classList.contains('is-real')) raf = requestAnimationFrame(frame);
  }

  // ── Interaction ──
  let hover = false, hoverScreen = false;
  function setTurned(on, ms = 0) { turned = on; turnUntil = on ? performance.now() + ms : 0; svg.classList.toggle('is-turned', on); }
  svg.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hover = true; setTurned(true); } });
  svg.addEventListener('pointerleave', () => { hover = false; hoverScreen = false; setTurned(false); });
  screen.addEventListener('pointerenter', () => { hoverScreen = true; });
  screen.addEventListener('pointerleave', () => { hoverScreen = false; });
  svg.addEventListener('click', e => {
    const now = performance.now();
    if (e.target.closest('.dk-screen')) {
      nextFeed(now); screen.classList.add('is-flash'); requestAnimationFrame(() => requestAnimationFrame(() => screen.classList.remove('is-flash')));
    } else if (e.target.closest('.dk-flower')) {
      spinT0 = now; for (let i = 0; i < 4; i++) setTimeout(() => spawnNote(performance.now()), i * 120);
      document.dispatchEvent(new CustomEvent('verse:egg', { detail: { id: 'sunflower' } }));
    } else if (e.pointerType !== 'mouse') setTurned(!turned, 2600);
    wake();
  });

  // Badge: switch to the real photo (loaded only when first asked for).
  const toggle = wrap.querySelector('.hero-real-toggle'), photo = wrap.querySelector('.hero-photo');
  toggle?.addEventListener('click', () => {
    if (photo && photo.dataset.src) { photo.srcset = photo.dataset.srcset; photo.src = photo.dataset.src; delete photo.dataset.src; }
    const real = wrap.classList.toggle('is-real');
    toggle.setAttribute('aria-pressed', String(real));
    wake();
  });

  // ── Loop control ──
  let raf = 0, visible = true;
  function wake() { if (!raf && visible && !document.hidden && !motion.matches && !wrap.classList.contains('is-real')) raf = requestAnimationFrame(frame); }
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; wake(); }).observe(svg);
  document.addEventListener('visibilitychange', wake);
  motion.addEventListener('change', () => { if (motion.matches) still(); wake(); });
  // Reduced motion: a finished screen, no movement.
  function still() { resetCode(); while (typeKey()); paintFeed(0); }

  resetCode();
  tab.textContent = FEED[0].tab;
  if (motion.matches) still(); else { for (let i = 0; i < 40; i++) typeKey(); }
  wake();
})();
