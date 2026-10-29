/* Site-wide Spider-Verse layer, loaded by theme.js on every page:
   - a little web-slinger who rides the scroll down the right margin (click: back to top);
   - web splats where you click empty space, cobwebs that spin up in card corners,
     chapter titles that land like a misregistered comic print, petals in the page margins;
   - six easter eggs, counted from a 🕷 badge in the footer. */
(() => {
  if (window.__jiakeVerse) return; window.__jiakeVerse = true;
  const script = document.currentScript, root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)'), fine = matchMedia('(hover: hover) and (pointer: fine)');
  const BEAT = 60 / 90, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const interactive = 'a,button,input,textarea,select,label,summary,video,audio,iframe,dialog,[role="button"],[contenteditable=""],[contenteditable="true"],.leaflet-container,[data-native-cursor]';

  const EGGS = ['thwip', 'leap', 'sunflower', 'moon', 'tiny', 'sleepy'];
  const COPY = {
    zh: {
      egg: '彩蛋', all: '六个彩蛋全部找到！谁都可以戴上面具。', top: '回到顶部', tiny: '一只小蜘蛛', hints: '彩蛋线索',
      names: { thwip: 'Thwip!', leap: '信仰之跃', sunflower: '向日葵', moon: '月亮升起', tiny: '小小访客', sleepy: '别睡啦' },
      clues: { thwip: '在键盘上打出蛛丝发射的声音：thwip。', leap: '在键盘上依次按 ↑ ↑ ↓ ↓ ← → ← → B A（经典游戏秘籍）。', sunflower: '打出这首背景音乐的名字。', moon: '点一点首页的太阳，或者深夜再来。', tiny: '某张卡片的角落里，住着一位小客人。', sleepy: '让右边的小家伙睡一会儿，再叫醒他。' }
    },
    en: {
      egg: 'Easter egg', all: 'All six found! Anyone can wear the mask.', top: 'Back to top', tiny: 'A tiny spider', hints: 'Easter egg clues',
      names: { thwip: 'Thwip!', leap: 'Leap of faith', sunflower: 'Sunflower', moon: 'Moonrise', tiny: 'Tiny guest', sleepy: 'Rise and shine' },
      clues: { thwip: 'Type the sound a web makes: thwip.', leap: 'On a keyboard, press ↑ ↑ ↓ ↓ ← → ← → B A (the classic game cheat).', sunflower: 'Type the name of the song.', moon: 'Touch the sun on the home page — or visit very late.', tiny: 'A tiny guest lives in the corner of one card.', sleepy: 'Let the little one on the right nap, then wake him.' }
    },
    fr: {
      egg: 'Easter egg', all: 'Les six sont trouvés ! Tout le monde peut porter le masque.', top: 'Retour en haut', tiny: 'Une petite araignée', hints: 'Indices',
      names: { thwip: 'Thwip !', leap: 'Acte de foi', sunflower: 'Sunflower', moon: 'Lever de lune', tiny: 'Petit invité', sleepy: 'Debout !' },
      clues: { thwip: 'Tapez le bruit d’une toile : thwip.', leap: 'Au clavier, tapez ↑ ↑ ↓ ↓ ← → ← → B A (le code de triche culte).', sunflower: 'Tapez le titre de la chanson.', moon: 'Touchez le soleil de l’accueil — ou revenez très tard.', tiny: 'Un petit invité vit dans le coin d’une carte.', sleepy: 'Laissez le petit à droite s’endormir, puis réveillez-le.' }
    },
    es: {
      egg: 'Huevo de pascua', all: '¡Los seis encontrados! Cualquiera puede llevar la máscara.', top: 'Volver arriba', tiny: 'Una arañita', hints: 'Pistas',
      names: { thwip: '¡Thwip!', leap: 'Salto de fe', sunflower: 'Sunflower', moon: 'Sale la luna', tiny: 'Pequeño invitado', sleepy: '¡Arriba!' },
      clues: { thwip: 'Escribe el sonido de una telaraña: thwip.', leap: 'Con el teclado, pulsa ↑ ↑ ↓ ↓ ← → ← → B A (el truco clásico).', sunflower: 'Escribe el nombre de la canción.', moon: 'Toca el sol de la portada, o vuelve muy tarde.', tiny: 'Un pequeño invitado vive en la esquina de una tarjeta.', sleepy: 'Deja dormir al pequeño de la derecha y luego despiértalo.' }
    }
  };
  const copy = () => COPY[root.lang] || COPY.en;
  const ink = () => root.dataset.theme === 'light'
    ? { fill: '#1a1322', outline: '#ffffff', web: '#3b3542', petal: '#e9a92a', figure: { glow: null } }
    : { fill: '#1a1322', outline: '#fff1cf', web: '#f6f0e4', petal: '#f6c445', figure: { glow: '#fff6e6' } };

  function boot() {
    const Figure = window.VerseFigure;

    // ── Easter eggs ─────────────────────────────────────────────────────────
    let found = new Set();
    try { found = new Set(JSON.parse(localStorage.getItem('jiake-verse-eggs') || '[]').filter(id => EGGS.includes(id))); } catch {}
    const toast = document.createElement('div'); toast.className = 'verse-toast'; toast.setAttribute('role', 'status'); document.body.append(toast);
    let toastTimer = 0, badge = null, clues = null;
    function say(text) {
      toast.textContent = text; toast.classList.add('is-on');
      clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-on'), 3800);
    }
    function discover(id) {
      if (!EGGS.includes(id) || found.has(id)) return;
      found.add(id);
      try { localStorage.setItem('jiake-verse-eggs', JSON.stringify([...found])); } catch {}
      const c = copy();
      say(`🕷 ${c.egg} ${found.size}/${EGGS.length} · ${c.names[id]}`);
      if (found.size === EGGS.length) setTimeout(() => say(`🕷 ${c.all}`), 4000);
      renderBadge();
    }
    document.addEventListener('verse:egg', e => discover(e.detail?.id));

    const footer = document.querySelector('footer, .journal-footer');
    if (footer) {
      const wrap = document.createElement('div'); wrap.className = 'verse-eggs';
      badge = document.createElement('button'); badge.type = 'button'; badge.setAttribute('aria-expanded', 'false');
      clues = document.createElement('div'); clues.className = 'verse-eggs-list'; clues.hidden = true; clues.id = 'verse-egg-clues';
      badge.setAttribute('aria-controls', clues.id);
      badge.addEventListener('click', () => { clues.hidden = !clues.hidden; badge.setAttribute('aria-expanded', String(!clues.hidden)); });
      document.addEventListener('click', e => { if (!clues.hidden && !wrap.contains(e.target)) { clues.hidden = true; badge.setAttribute('aria-expanded', 'false'); } });
      wrap.append(clues, badge); footer.append(wrap);
    }
    function renderBadge() {
      if (!badge) return;
      const c = copy();
      badge.textContent = `🕷 ${found.size}/${EGGS.length}`; badge.title = c.hints; badge.setAttribute('aria-label', `${c.hints} · ${found.size}/${EGGS.length}`);
      clues.innerHTML = `<strong>${c.hints}</strong><ul>${EGGS.map(id => found.has(id) ? `<li class="is-found">✓ ${c.names[id]}</li>` : `<li>${c.clues[id]}</li>`).join('')}</ul>`;
    }
    renderBadge();
    new MutationObserver(() => { renderBadge(); if (hit) hit.setAttribute('aria-label', copy().top); }).observe(root, { attributes: true, attributeFilter: ['lang'] });

    // Typed words and the Konami code, ignored while typing into a field.
    const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
    let typed = '', konami = 0;
    document.addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input,textarea,select,[contenteditable=""],[contenteditable="true"]')) return;
      const key = e.key.toLowerCase();
      konami = key === KONAMI[konami] ? konami + 1 : key === KONAMI[0] ? 1 : 0;
      if (konami === KONAMI.length) { konami = 0; leap(); }
      if (key.length !== 1) return;
      typed = (typed + key).slice(-12);
      if (typed.endsWith('thwip')) { typed = ''; thwip(); }
      else if (typed.endsWith('sunflower')) { typed = ''; sunflower(); }
    });

    function leap() {
      discover('leap');
      if (motion.matches) return;
      const b = document.body;
      b.style.transformOrigin = `50% ${scrollY + innerHeight / 2}px`;
      b.animate([
        { transform: 'none' }, { transform: 'rotate(180deg) scale(.9)', offset: .35 },
        { transform: 'rotate(180deg) scale(.9)', offset: .62 }, { transform: 'rotate(360deg)' }
      ], { duration: 3400, easing: 'cubic-bezier(.65,0,.35,1)' }).finished.finally(() => { b.style.transformOrigin = ''; });
    }
    function sunflower() {
      discover('sunflower');
      const audio = document.querySelector('audio.music-native');
      if (!audio || audio.paused) document.querySelector('.music-toggle')?.click();
      if (motion.matches) return;
      for (let i = 0; i < 46; i++) bursts.push({ x: W / 2 + (Math.random() - .5) * 240, y: H + 10, vx: (Math.random() - .5) * 560, vy: -(480 + Math.random() * 360), rot: Math.random() * TAU, spin: (Math.random() - .5) * 8, size: 5 + Math.random() * 6, life: 0 });
      wake();
    }
    function thwip() {
      discover('thwip');
      if (motion.matches) return;
      swinger = { t0: performance.now() };
      wake();
    }

    // ── Corner cobwebs and a hidden tiny spider ─────────────────────────────
    const CARDS = '.edu-card, .life-card, .stat-box, .proj-row, .journal-card';
    const web = (() => {
      const angles = [90, 112.5, 135, 157.5, 180].map(a => a * Math.PI / 180), f = n => n.toFixed(1);
      let d = angles.map(a => `M48 0L${f(48 + 46 * Math.cos(a))} ${f(46 * Math.sin(a))}`).join('');
      for (const r of [13, 24, 35]) angles.forEach((a, i) => {
        const x = 48 + r * Math.cos(a), y = r * Math.sin(a);
        if (!i) { d += `M${f(x)} ${f(y)}`; return; }
        const m = (a + angles[i - 1]) / 2, rr = r * .84;
        d += `Q${f(48 + rr * Math.cos(m))} ${f(rr * Math.sin(m))} ${f(x)} ${f(y)}`;
      });
      return `<svg viewBox="0 0 48 48" aria-hidden="true"><path pathLength="1" d="${d}"/></svg>`;
    })();
    const cards = [...document.querySelectorAll(CARDS)];
    for (const card of cards) {
      if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
      card.classList.add('verse-has-web');
      const corner = document.createElement('span'); corner.className = 'verse-corner'; corner.innerHTML = web; card.append(corner);
    }
    const hosts = cards.filter(card => !card.closest('a'));
    if (hosts.length) {
      const host = hosts[Math.floor(Math.random() * hosts.length)], tiny = document.createElement('button');
      tiny.type = 'button'; tiny.className = 'verse-tiny'; tiny.setAttribute('aria-label', copy().tiny);
      tiny.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><g stroke="currentColor" stroke-width="1.1" stroke-linecap="round" fill="none"><path d="M6 9 2 6.5M6 10.5 1.5 10M6 12 2.5 14.5M10 9l4-2.5M10 10.5l4.5-.5M10 12l3.5 2.5"/></g><circle cx="8" cy="10.5" r="3" fill="currentColor"/><circle cx="8" cy="6.5" r="1.9" fill="currentColor"/><circle cx="7.3" cy="6.2" r=".5" fill="var(--bg)"/><circle cx="8.7" cy="6.2" r=".5" fill="var(--bg)"/></svg>';
      tiny.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); tiny.classList.add('is-fleeing'); discover('tiny'); });
      host.append(tiny);
    }

    // ── Chapter titles land like a misregistered print ─────────────────────
    const titles = document.querySelectorAll('.s-title, .article-title, .story-title');
    const misprint = el => { el.classList.remove('verse-print'); void el.offsetWidth; el.classList.add('verse-print'); };
    const titleWatch = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { misprint(entry.target); titleWatch.unobserve(entry.target); }
    }), { threshold: .6 });
    titles.forEach(el => { titleWatch.observe(el); el.addEventListener('mouseenter', () => misprint(el)); });

    // ── One fixed canvas for the buddy, splats, petals and the THWIP run ───
    const fx = document.createElement('canvas'); fx.className = 'verse-fx'; fx.setAttribute('aria-hidden', 'true');
    const g = fx.getContext('2d');
    document.body.append(fx);
    let W = 0, H = 0, navBottom = 0, gutter = 0;
    const splats = [], bursts = [], petals = [];
    let swinger = null, clicks = 0;

    function newPetal(anywhere) {
      const left = Math.random() < .5, x = left ? 12 + Math.random() * (gutter - 36) : W - gutter + 24 + Math.random() * (gutter - 36);
      return { x, home: x, y: anywhere ? Math.random() * H : -20, vy: 12 + Math.random() * 16, phase: Math.random() * TAU, size: 4 + Math.random() * 4, rot: Math.random() * TAU, spin: (Math.random() - .5) * 1.4 };
    }
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight; fx.width = Math.round(W * dpr); fx.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const nav = document.querySelector('nav'); navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
      // Petals only fall in the empty margins beside the reading column.
      gutter = (W - 1184) / 2; petals.length = 0;
      if (gutter >= 76 && !motion.matches) for (let i = 0; i < 10; i++) petals.push(newPetal(true));
      buddy.on = Boolean(Figure) && fine.matches && W >= 1100 && !motion.matches;
      root.classList.toggle('verse-buddy-on', buddy.on);
      if (hit) hit.hidden = !buddy.on;
      wake();
    }

    // The buddy hangs from the nav on a web; the thread lengthens as you read down the page.
    const buddy = { on: false, len: 40, ang: 0, vel: 0, alpha: 0, wave: 0, sleep: 0, hover: false, idle: performance.now(), lastScroll: scrollY };
    let hit = null;
    if (Figure) {
      hit = document.createElement('button'); hit.type = 'button'; hit.className = 'verse-buddy-hit'; hit.setAttribute('aria-label', copy().top);
      hit.addEventListener('pointerenter', () => { buddy.hover = true; });
      hit.addEventListener('pointerleave', () => { buddy.hover = false; });
      hit.addEventListener('click', () => {
        if (buddy.sleep > .5) { buddy.sleep = 0; buddy.vel += 1.6; buddy.idle = performance.now(); discover('sleepy'); return; }
        buddy.vel -= 1.2; buddy.idle = performance.now();
        splats.push({ x: buddy.hand.x, y: buddy.hand.y, t0: performance.now(), rot: 0, word: true });
        scrollTo({ top: 0, behavior: 'smooth' });
      });
      document.body.append(hit);
    }
    for (const type of ['pointermove', 'keydown', 'wheel', 'touchstart']) addEventListener(type, () => { if (buddy.sleep < .5) buddy.idle = performance.now(); }, { passive: true });

    function drawBuddy(now, dt, beat) {
      const max = document.documentElement.scrollHeight - H, p = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
      buddy.alpha += ((scrollY > 160 ? 1 : 0) - buddy.alpha) * Math.min(1, dt * 4);
      const target = 46 + p * (H - navBottom - 190);
      buddy.len += (target - buddy.len) * Math.min(1, dt * 5);
      // Scrolling yanks the line; a damped spring brings him back, nudged on every beat.
      const dy = scrollY - buddy.lastScroll; buddy.lastScroll = scrollY;
      buddy.vel += clamp(dy, -90, 90) * .012;
      const sway = Math.sin(beat * Math.PI) * .05;
      buddy.vel += (-(buddy.ang - sway) * 22 - buddy.vel * 3.4) * dt;
      buddy.ang = clamp(buddy.ang + buddy.vel * dt, -.9, .9);
      const asleep = now - buddy.idle > 20000;
      buddy.sleep += ((asleep ? 1 : 0) - buddy.sleep) * Math.min(1, dt * 2);
      buddy.wave += ((buddy.hover && buddy.sleep < .5 ? 1 : 0) - buddy.wave) * Math.min(1, dt * 6);
      if (buddy.alpha < .02) { if (hit) hit.style.visibility = 'hidden'; return; }
      // Centre him in the right-hand margin when there is one.
      const c = ink(), x0 = W - clamp(gutter / 2, 56, 90), y0 = navBottom, size = 58;
      const hand = { x: x0 + Math.sin(buddy.ang) * buddy.len, y: y0 + Math.cos(buddy.ang) * buddy.len };
      buddy.hand = hand;
      g.save(); g.globalAlpha = buddy.alpha;
      g.strokeStyle = c.web; g.lineWidth = 1; g.globalAlpha = buddy.alpha * .7;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(hand.x, hand.y); g.stroke();
      g.globalAlpha = buddy.alpha;
      Figure.splat(g, x0, y0 + 2, 6, c.web, .2);
      const rot = -buddy.ang, tuck = .4 + .1 * Math.sin(beat * Math.PI) + buddy.sleep * .55;
      const pose = Figure.pose({ tuck, wave: buddy.wave, time: now / 1000, asleep: buddy.sleep > .5, mood: buddy.wave > .5 ? 'happy' : 'normal' });
      const f = { center: Figure.centerFromHand(hand, rot, -1, size, pose), rot, dir: -1, size, pose };
      Figure.paint(g, f, c.figure);
      if (buddy.sleep > .5) {
        const head = Figure.toWorld(f, Figure.HEAD);
        g.fillStyle = c.outline; g.font = '700 11px system-ui, sans-serif';
        for (let i = 0; i < 3; i++) {
          const k = ((now / 1400) + i / 3) % 1;
          g.globalAlpha = buddy.alpha * Math.sin(k * Math.PI) * .9;
          g.fillText('z', head.x - 10 - k * 14, head.y - 10 - k * 26);
        }
      }
      g.restore();
      if (hit) { hit.style.visibility = buddy.alpha > .5 ? 'visible' : 'hidden'; hit.style.transform = `translate(${f.center.x - 28}px,${f.center.y - 40}px)`; }
    }

    // Click empty space: a web splat, and every fifth one says THWIP.
    document.addEventListener('click', e => {
      if (motion.matches || e.defaultPrevented || e.detail === 0 || e.target.closest(interactive)) return;
      if (!getSelection()?.isCollapsed) return;
      splats.push({ x: e.clientX, y: e.clientY, t0: performance.now(), rot: Math.random() * TAU, word: ++clicks % 5 === 0 });
      wake();
    });
    function drawSplats(now) {
      const c = ink();
      for (let i = splats.length - 1; i >= 0; i--) {
        const s = splats[i], k = (now - s.t0) / 900;
        if (k >= 1) { splats.splice(i, 1); continue; }
        Figure.splat(g, s.x, s.y, 18, c.web, k, s.rot);
        if (s.word) {
          g.save(); g.globalAlpha = 1 - k * k; g.translate(s.x + 18, s.y - 18); g.rotate(-.16); g.scale(1 + .3 * Math.max(0, 1 - k * 8), 1 + .3 * Math.max(0, 1 - k * 8));
          g.font = 'italic 900 14px "Arial Black", Impact, sans-serif'; g.textAlign = 'center'; g.lineJoin = 'round';
          g.lineWidth = 4; g.strokeStyle = c.fill; g.strokeText('THWIP!', 0, 0); g.fillStyle = c.outline; g.fillText('THWIP!', 0, 0);
          g.restore();
        }
      }
    }

    function drawPetals(dt, kick) {
      if (!petals.length && !bursts.length) return;
      const c = ink();
      g.fillStyle = c.petal;
      for (const p of petals) {
        p.y += p.vy * dt * (1 + kick); p.rot += p.spin * dt; p.phase += dt * .8;
        p.x = p.home + Math.sin(p.phase) * 12;
        if (p.y > H + 20) Object.assign(p, newPetal(false));
        g.save(); g.globalAlpha = .5; g.translate(p.x, p.y); g.rotate(p.rot);
        g.beginPath(); g.ellipse(0, 0, p.size, p.size * .36, 0, 0, TAU); g.fill(); g.restore();
      }
      for (let i = bursts.length - 1; i >= 0; i--) {
        const p = bursts[i]; p.life += dt;
        if (p.life > 3) { bursts.splice(i, 1); continue; }
        p.vy += 520 * dt; p.vx *= 1 - dt * .8; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.spin * dt;
        g.save(); g.globalAlpha = .85 * Math.min(1, (3 - p.life) / .8); g.translate(p.x, p.y); g.rotate(p.rot);
        g.beginPath(); g.ellipse(0, 0, p.size, p.size * .36, 0, 0, TAU); g.fill(); g.restore();
      }
    }

    // The THWIP egg: he swings right across the whole screen, two webs from the nav.
    function drawSwinger(now) {
      const t = (now - swinger.t0) / 1000, c = ink(), size = clamp(H * .13, 70, 120), top = Math.max(navBottom, 8);
      if (!swinger.paths) swinger.paths = [
        Figure.swing({ x: -size * 2, y: H * .42 }, { x: W * .47, y: H * .36 }, top),
        Figure.swing({ x: W * .55, y: H * .36 }, { x: W + size * 2.5, y: H * .4 }, top)
      ];
      const [a, b] = swinger.paths, SW = 1.15, AIR = .3;
      let path = null, s = 0, f;
      if (t < SW) { path = a; s = t / SW; }
      else if (t < SW + AIR) {
        const k = (t - SW) / AIR, from = a.at(1), to = b.at(0);
        const c0 = Figure.centerFromHand(from.hand, from.rot, 1, size), c1 = Figure.centerFromHand(to.hand, to.rot, 1, size);
        f = { center: { x: c0.x + (c1.x - c0.x) * k, y: c0.y + (c1.y - c0.y) * k - 40 * Math.sin(Math.PI * k) }, rot: from.rot + (to.rot + TAU - from.rot) * k, dir: 1, size, pose: Figure.pose({ tuck: 1 }) };
      } else if (t < SW * 2 + AIR) { path = b; s = (t - SW - AIR) / SW; }
      else { swinger = null; return; }
      if (path) {
        const st = path.at(s), shot = Math.min(1, s / .12);
        f = { center: Figure.centerFromHand(st.hand, st.rot, 1, size), rot: st.rot, dir: 1, size, pose: Figure.pose({ tuck: st.tuck }) };
        g.strokeStyle = c.web; g.lineWidth = 1.6; g.globalAlpha = .9;
        g.beginPath(); g.moveTo(st.hand.x, st.hand.y); g.lineTo(st.hand.x + (path.A.x - st.hand.x) * shot, st.hand.y + (path.A.y - st.hand.y) * shot); g.stroke();
        g.globalAlpha = 1;
        if (s < .35) {
          g.save(); g.globalAlpha = 1 - s / .35; g.translate(st.hand.x + 40, st.hand.y - 24); g.rotate(-.18);
          g.font = 'italic 900 22px "Arial Black", Impact, sans-serif'; g.textAlign = 'center'; g.lineJoin = 'round';
          g.lineWidth = 6; g.strokeStyle = c.fill; g.strokeText('THWIP!', 0, 0); g.fillStyle = c.outline; g.fillText('THWIP!', 0, 0); g.restore();
        }
      }
      Figure.paint(g, f, c.figure);
    }

    // Music clock (home page only): drifts at 90 BPM, locks to the track while it plays.
    let prevBass = 0, kick = 0;
    function clock(now, dt) {
      const audio = document.querySelector('audio.music-native'), env = window.SUNFLOWER_ENVELOPE;
      const live = audio && !audio.paused && audio.readyState > 2 && audio.volume > 0 && !audio.muted;
      if (live && env) {
        const ch = env.bass[Math.floor(audio.currentTime * env.fps)];
        const bass = ch ? '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.indexOf(ch) / 63 : 0;
        kick = Math.max(kick * Math.exp(-dt * 5), Math.max(0, bass - prevBass) * 2); prevBass = bass;
      } else kick *= Math.exp(-dt * 5);
      return live ? Math.max(0, audio.currentTime - .035) / BEAT : now / 1000 / BEAT;
    }

    let raf = 0, lastNow = 0, lastDraw = 0;
    function wake() { if (!raf && !document.hidden) raf = requestAnimationFrame(frame); }
    function frame(now) {
      raf = 0;
      const busy = Boolean(swinger || splats.length || bursts.length);
      if (!busy && now - lastDraw < 32) { raf = requestAnimationFrame(frame); return; }
      const dt = lastNow ? Math.min(.05, (now - lastNow) / 1000) : 0; lastNow = now; lastDraw = now;
      const beat = clock(now, dt);
      g.clearRect(0, 0, W, H);
      drawPetals(dt, kick);
      if (buddy.on && Figure) drawBuddy(now, dt, beat);
      if (Figure) drawSplats(now);
      if (swinger && Figure) drawSwinger(now);
      if (buddy.on || petals.length || busy || swinger) raf = requestAnimationFrame(frame);
      else lastNow = 0;
    }
    addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => { lastNow = 0; if (!document.hidden) wake(); });
    motion.addEventListener('change', resize); fine.addEventListener('change', resize);
    resize();

    console.log('%c🕷  Anyone can wear the mask.', 'font:700 15px system-ui;color:#e8384f');
    console.log('Psst — this site hides 6 easter eggs. Start by typing "thwip" anywhere on the page.');
  }

  const load = (file, ready) => new Promise(resolve => {
    if (ready()) return resolve();
    const s = document.createElement('script');
    s.src = new URL(file, script.src).href; s.onload = s.onerror = resolve;
    document.head.append(s);
  });
  async function start() {
    await load('verse-figure.js?v=5', () => window.VerseFigure);
    boot();
    await load('verse-city.js?v=2', () => window.VerseCity);
    await load('verse-scenes.js?v=3', () => window.__jiakeScenes);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
