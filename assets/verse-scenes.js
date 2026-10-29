/* Site-wide scenery: the hero's city carries on down every page.
   - skyline strips in the bottom padding of chapters, each a later hour of the day;
   - a bookend above every footer where the web-slinger swings past now and then;
   - big swaying cobwebs with dew in chapter corners, and a tiny spider rappelling down
     the experience timeline as it fills.
   Everything sits in empty padding, never over text. Loaded by verse.js. */
(() => {
  const City = window.VerseCity, Figure = window.VerseFigure;
  if (!City || window.__jiakeScenes) return; window.__jiakeScenes = true;
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const BEAT = 60 / 90, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Near and far rows for a short strip; heights are fractions of the strip.
  const STRIP_SPECS = [
    { h: [.4, .8], w: [30, 80], speed: 3, lit: .14 },
    { h: [.18, .5], w: [50, 120], speed: 7, lit: .26, tanks: true }
  ];

  // ── Skyline strips ────────────────────────────────────────────────────────
  const strips = [];
  function addStrip(host, { mood, above = false, hero = false, seed = 7 }) {
    const pad = above ? parseFloat(getComputedStyle(host.previousElementSibling || host).paddingBottom) || 60 : parseFloat(getComputedStyle(host).paddingBottom) || 0;
    const height = Math.round(clamp(pad + (above ? 24 : -10), 0, hero ? 150 : 100));
    if (height < 44) return;
    host.classList.add('verse-host');
    const canvas = document.createElement('canvas');
    canvas.className = 'verse-strip' + (above ? ' is-above' : '') ; canvas.setAttribute('aria-hidden', 'true');
    canvas.style.height = height + 'px';
    host.prepend(canvas);
    const strip = { host, canvas, ctx: canvas.getContext('2d'), mood, hero, seed, height, visible: false };
    strips.push(strip);
    build(strip);
    watch.observe(canvas);
  }
  function build(s) {
    const width = s.canvas.clientWidth || innerWidth, h = s.height, dpr = Math.min(devicePixelRatio || 1, 2);
    s.width = width; s.canvas.width = Math.round(width * dpr); s.canvas.height = Math.round(h * dpr);
    s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    s.pal = City.palette({ mood: s.mood[City.theme()] });
    const unit = clamp(width / 1300, .7, 1.1);
    s.unit = unit;
    s.layers = STRIP_SPECS.map((spec, i) => City.strip({ index: i + 1, width, tileH: h, ground: h, sky: h, unit, dpr, pal: s.pal, seed: s.seed, spec }));
    s.sun = City.sun(h * .34, s.pal, dpr, Boolean(s.pal.stars > .9));
    const rand = City.mulberry(s.seed);
    s.stars = s.pal.stars ? Array.from({ length: Math.round(width / 40) }, () => ({ x: rand() * width, y: rand() * h * .55, r: .4 + rand(), phase: rand() * TAU })) : [];
    s.sunX = width * (.62 + rand() * .25);
  }

  // The bookend's web-slinger: every so often, two swings across the strip.
  function heroPass(s, time) {
    const period = 11, t = time % period, run = 2.6;
    if (t > run || !Figure) return;
    const h = s.height, w = s.width, size = h * .42, c = s.ctx;
    if (!s.paths || s.pathsW !== w) {
      s.pathsW = w;
      s.paths = [Figure.swing({ x: -size * 2, y: h * .38 }, { x: w * .5, y: h * .34 }, -h * .9), Figure.swing({ x: w * .54, y: h * .34 }, { x: w + size * 2.5, y: h * .4 }, -h * .9)];
    }
    const [a, b] = s.paths, half = run / 2, path = t < half ? a : b, k = (t < half ? t : t - half) / half, st = path.at(k);
    const f = { center: Figure.centerFromHand(st.hand, st.rot, 1, size), rot: st.rot, dir: 1, size, pose: Figure.pose({ tuck: st.tuck, time }) };
    c.strokeStyle = s.pal.web; c.lineWidth = 1.2; c.globalAlpha = .85;
    c.beginPath(); c.moveTo(st.hand.x, st.hand.y); c.lineTo(path.A.x, path.A.y); c.stroke(); c.globalAlpha = 1;
    Figure.paint(c, f, s.pal.figure);
  }

  function paint(s, time, beat, kick) {
    const { ctx: c, width: w, height: h, pal } = s;
    c.clearRect(0, 0, w, h);
    City.haze(c, pal, 0, 0, w, h, kick * .3);
    for (const st of s.stars) { c.fillStyle = '#fff4dc'; c.globalAlpha = pal.stars * (.3 + .3 * Math.sin(time * 1.5 + st.phase)); c.beginPath(); c.arc(st.x, st.y, st.r, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    const sun = s.sun, rise = s.hero ? Math.sin(time * .05) * 4 : 0;
    c.drawImage(sun.canvas, s.sunX - sun.size / 2, h * .62 - sun.size / 2 + rise, sun.size, sun.size);
    if (Math.floor(beat / 4) !== s.bar) {
      s.bar = Math.floor(beat / 4);
      for (const layer of s.layers) for (let i = 0; i < 4 && layer.spare.length; i++) {
        const k = Math.floor(Math.random() * layer.spare.length);
        if (layer.on.has(k)) layer.on.delete(k); else if (layer.on.size < 30) layer.on.add(k);
      }
    }
    s.layers.forEach((layer, i) => {
      const offset = (time * layer.speed) % layer.tileW;
      for (const x of [-offset, layer.tileW - offset]) {
        c.drawImage(layer.body, x, 0, layer.tileW, layer.tileH);
        c.globalAlpha = pal.glass ? .9 : .45 + i * .15 + kick * .4;
        c.drawImage(layer.lights, x, 0, layer.tileW, layer.tileH);
        c.fillStyle = pal.glass ? '#ffffff' : pal.window;
        for (const k of layer.on) { const p = layer.spare[k]; c.fillRect(x + p.x, p.y, 3.2 * s.unit, 5 * s.unit); }
        c.globalAlpha = 1;
      }
    });
    if (s.hero) { heroPass(s, time); sunflowers(s, time, beat, kick); }
  }

  // A row of sunflowers in the foreground of the footer bookend, nodding on the beat.
  function sunflowers(s, time, beat, kick) {
    const c = s.ctx, h = s.height, w = s.width, gap = clamp(w / 14, 46, 90);
    if (!s.flowers || s.flowersW !== w) {
      const rand = City.mulberry(s.seed + 5);
      s.flowersW = w; s.flowers = [];
      for (let x = gap * .4; x < w; x += gap * (.75 + rand() * .6)) s.flowers.push({ x, stem: h * (.32 + rand() * .3), r: h * (.08 + rand() * .045), phase: rand() * TAU, leaf: rand() < .5 ? -1 : 1 });
    }
    const pulse = Math.exp(-((beat % 1) * 6)) * (.5 + kick);
    for (const f of s.flowers) {
      const sway = Math.sin(time * 1.1 + f.phase) * .09 + Math.sin(beat * Math.PI + f.phase) * .04;
      const bx = f.x, by = h + 2, hx = bx + Math.sin(sway) * f.stem, hy = by - Math.cos(sway) * f.stem;
      c.strokeStyle = s.pal.theme === 'light' ? '#5f8f3a' : '#3f6b34'; c.lineWidth = Math.max(2, f.r * .22); c.lineCap = 'round';
      c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + Math.sin(sway) * f.stem * .3, by - f.stem * .55, hx, hy); c.stroke();
      c.fillStyle = c.strokeStyle;
      c.beginPath(); c.ellipse(bx + f.leaf * f.r * .7, by - f.stem * .35, f.r * .7, f.r * .25, f.leaf * -.6, 0, TAU); c.fill();
      const r = f.r * (1 + pulse * .08);
      c.save(); c.translate(hx, hy); c.rotate(sway * 1.5);
      c.fillStyle = '#ffc93c'; c.strokeStyle = '#1a1322'; c.lineWidth = 1.2;
      for (let i = 0; i < 12; i++) { c.save(); c.rotate(i / 12 * TAU); c.beginPath(); c.ellipse(0, -r * 1.05, r * .32, r * .62, 0, 0, TAU); c.fill(); c.stroke(); c.restore(); }
      c.fillStyle = '#6b3d1f'; c.beginPath(); c.arc(0, 0, r * .62, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#3d2212';
      for (let i = 0; i < 9; i++) { const a = i * 2.4, rr = r * .42 * Math.sqrt((i + .5) / 9); c.beginPath(); c.arc(Math.cos(a) * rr, Math.sin(a) * rr, r * .06, 0, TAU); c.fill(); }
      c.restore();
    }
  }

  // ── A paper plane on a dotted route across a section's top padding ────────
  const flights = [];
  function addFlight(host) {
    const pad = parseFloat(getComputedStyle(host).paddingTop) || 0;
    if (pad < 60) return;
    host.classList.add('verse-host');
    const canvas = document.createElement('canvas');
    canvas.className = 'verse-flight'; canvas.setAttribute('aria-hidden', 'true'); canvas.style.height = Math.round(pad - 8) + 'px';
    host.prepend(canvas);
    const f = { host, canvas, ctx: canvas.getContext('2d'), height: Math.round(pad - 8), visible: false, kind: 'flight' };
    sizeFlight(f); flights.push(f); watch.observe(canvas);
  }
  function sizeFlight(f) {
    const dpr = Math.min(devicePixelRatio || 1, 2), w = f.canvas.clientWidth || innerWidth;
    f.width = w; f.canvas.width = Math.round(w * dpr); f.canvas.height = Math.round(f.height * dpr); f.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  // ── Folded-paper flight with precise route markers ───────────────────────
  function flightY(x,w,h) {return h*.74-Math.sin(clamp(x/w,0,1)*Math.PI)*h*.17;}
  function routePath(c,from,to,w,h,offset=0) {
    c.beginPath();c.moveTo(from,flightY(from,w,h)+offset);
    for(let x=from+6;x<to;x+=6)c.lineTo(x,flightY(x,w,h)+offset);
    c.lineTo(to,flightY(to,w,h)+offset);
  }
  function flightBox(c,x,y,w,h,r) {
    c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();
  }
  function flagStar(c,x,y,r,rotation=-Math.PI/2) {
    c.beginPath();for(let i=0;i<10;i++){const a=rotation+i*Math.PI/5,s=i%2?r*.382:r;(i?c.lineTo.bind(c):c.moveTo.bind(c))(x+Math.cos(a)*s,y+Math.sin(a)*s);}c.closePath();c.fill();
  }
  function routeFlag(c,code,x,y) {
    const w=16,h=10.67;c.save();flightBox(c,x,y,w,h,1.6);c.clip();
    if(code==='CN') {
      c.fillStyle='#de2910';c.fillRect(x,y,w,h);c.fillStyle='#ffde00';flagStar(c,x+3.1,y+3.1,1.7);
      [[5.5,1.2],[6.5,2.5],[6.5,4.2],[5.4,5.5]].forEach(([sx,sy])=>flagStar(c,x+sx,y+sy,.58,Math.atan2(3.1-sy,3.1-sx)));
    }else if(code==='FR') {
      ['#0055a4','#fff','#ef4135'].forEach((color,i)=>{c.fillStyle=color;c.fillRect(x+i*w/3,y,w/3+.1,h);});
    }else{
      c.fillStyle='#aa151b';c.fillRect(x,y,w,h);c.fillStyle='#f1bf00';c.fillRect(x,y+h/4,w,h/2);
      c.fillStyle='#ae6a38';c.fillRect(x+4.4,y+4,1.7,2.8);c.fillStyle='#f5d27e';c.fillRect(x+4.8,y+4.5,.7,1.6);
    }
    const sheen=c.createLinearGradient(x,y,x+w,y+h);sheen.addColorStop(0,'rgba(255,255,255,.2)');sheen.addColorStop(.45,'rgba(255,255,255,0)');sheen.addColorStop(1,'rgba(0,0,0,.16)');c.fillStyle=sheen;c.fillRect(x,y,w,h);c.restore();
  }
  function routeBadge(c,code,x,y,light,proximity) {
    const bw=62,bh=24,by=y-42,bx=x-bw/2;
    c.strokeStyle=light?'rgba(87,111,144,.24)':'rgba(159,190,225,.22)';c.lineWidth=.7;
    c.beginPath();c.moveTo(x,by+bh+3);c.lineTo(x,y-4);c.stroke();
    c.save();c.shadowColor=light?'rgba(29,52,82,.08)':'rgba(3,8,16,.25)';c.shadowBlur=8;c.shadowOffsetY=2;
    flightBox(c,bx,by,bw,bh,7);const glass=c.createLinearGradient(bx,by,bx,by+bh);
    glass.addColorStop(0,light?'rgba(255,255,255,.92)':'rgba(44,57,75,.92)');glass.addColorStop(1,light?'rgba(240,245,251,.84)':'rgba(21,29,41,.94)');c.fillStyle=glass;c.fill();c.restore();
    flightBox(c,bx+.5,by+.5,bw-1,bh-1,6.5);c.strokeStyle=light?'rgba(99,126,162,.27)':`rgba(170,200,236,${.25+proximity*.25})`;c.stroke();
    c.strokeStyle=light?'rgba(255,255,255,.9)':'rgba(226,239,255,.18)';c.beginPath();c.moveTo(bx+8,by+1);c.lineTo(bx+bw-8,by+1);c.stroke();
    routeFlag(c,code,bx+9,by+6.7);c.font='600 10px system-ui,sans-serif';c.textAlign='left';c.textBaseline='middle';c.fillStyle=light?'#425871':'#dce7f5';c.fillText(code,bx+34,by+12.3);
    c.save();c.shadowColor=light?'#7894b3':'#b9d7ff';c.shadowBlur=proximity*7;c.fillStyle=light?'#7f98b5':'#bad4f2';c.beginPath();c.arc(x,y,1.6+proximity*.25,0,TAU);c.fill();c.restore();
  }
  function foldedPlane(c,x,y,angle,time,light) {
    const bank=Math.sin(time*.7)*.22;
    const point=([px,py,pz])=>{const yy=py*Math.cos(bank)-pz*Math.sin(bank),zz=py*Math.sin(bank)+pz*Math.cos(bank),perspective=1+zz*.012;return [px*perspective,yy*perspective];};
    const nose=point([26,0,1]),left=point([-20,-12,0]),ridge=point([-7,0,6]),right=point([-20,12,-1]),keel=point([-8,5,-4]);
    c.save();c.translate(x,y);c.rotate(angle);c.lineJoin='round';
    const face=(vertices,colors)=>{const fill=c.createLinearGradient(-18,-12,22,12);fill.addColorStop(0,colors[0]);fill.addColorStop(1,colors[1]);c.beginPath();vertices.forEach((p,i)=>(i?c.lineTo.bind(c):c.moveTo.bind(c))(...p));c.closePath();c.fillStyle=fill;c.fill();};
    c.shadowColor=light?'rgba(62,87,122,.12)':'rgba(177,215,255,.22)';c.shadowBlur=9;
    face([nose,left,ridge],light?['#ffffff','#d8e3f0']:['#f7fbff','#b5c9e2']);
    c.shadowBlur=0;face([nose,ridge,right],light?['#b8c9df','#7188a6']:['#b7d0ec','#5e789c']);face([ridge,keel,right],light?['#8299b7','#536b8a']:['#718fb3','#3e5675']);
    c.lineWidth=.7;c.strokeStyle=light?'rgba(255,255,255,.95)':'rgba(245,251,255,.9)';c.beginPath();c.moveTo(...left);c.lineTo(...nose);c.lineTo(...right);c.stroke();
    c.strokeStyle=light?'rgba(75,104,143,.48)':'rgba(208,230,255,.7)';c.beginPath();c.moveTo(...nose);c.lineTo(...ridge);c.lineTo(...keel);c.stroke();
    c.restore();
  }
  function paintFlight(f,time) {
    const c=f.ctx,w=f.width,h=f.height,light=City.theme()==='light';c.clearRect(0,0,w,h);
    const progress=(time%18)/18,k=progress-Math.sin(progress*TAU)*.025,px=-65+k*(w+130);
    const accent=light?'99,127,160':'169,201,237';
    c.lineWidth=.65;c.strokeStyle=`rgba(${accent},${light?.18:.14})`;routePath(c,w*.06,w*.94,w,h);c.stroke();
    const tail=Math.max(0,px-Math.min(210,w*.25)),head=Math.min(w,px-12);
    if(head>tail){
      const trail=c.createLinearGradient(tail,0,head,0);trail.addColorStop(0,`rgba(${accent},0)`);trail.addColorStop(.55,`rgba(${accent},.18)`);trail.addColorStop(1,`rgba(${accent},.7)`);
      c.strokeStyle=trail;c.lineWidth=1.1;c.shadowColor=`rgba(${accent},.2)`;c.shadowBlur=5;routePath(c,tail,head,w,h);c.stroke();c.shadowBlur=0;
      c.lineWidth=.45;c.globalAlpha=.35;routePath(c,tail+8,head-7,w,h,2.4);c.stroke();c.globalAlpha=1;
    }
    [['CN',.18],['FR',.5],['ES',.82]].forEach(([code,t])=>{const x=w*t;routeBadge(c,code,x,flightY(x,w,h),light,Math.exp(-(((px-x)/45)**2)));});
    const py=flightY(px,w,h),angle=Math.atan2(flightY(px+2,w,h)-py,2);foldedPlane(c,px,py,angle,time,light);
  }

  // ── Cobwebs in chapter corners, with dew and a dangling spider ────────────
  const SPIDER = '<svg viewBox="0 0 20 20" aria-hidden="true"><g stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none"><path d="M7 11 2.5 8M7 12.5 2 12.5M7 14 3 17.5M13 11l4.5-3M13 12.5h5M13 14l4 3.5"/></g><circle cx="10" cy="13" r="3.8" fill="currentColor"/><circle cx="10" cy="8" r="2.6" fill="currentColor"/><circle cx="9" cy="7.6" r=".9" fill="#fff"/><circle cx="11" cy="7.6" r=".9" fill="#fff"/></svg>';
  const bigWeb = (() => {
    const n = 7, cx = 0, cy = 0, R = 128, f = v => v.toFixed(1);
    const angles = Array.from({ length: n }, (_, i) => (i / (n - 1)) * Math.PI / 2);
    let d = angles.map(a => `M0 0L${f(Math.cos(a) * R)} ${f(Math.sin(a) * R)}`).join('');
    for (let r = 20; r < R; r += 15) angles.forEach((a, i) => {
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (!i) { d += `M${f(x)} ${f(y)}`; return; }
      const m = (a + angles[i - 1]) / 2, rr = r * .88;
      d += `Q${f(Math.cos(m) * rr)} ${f(Math.sin(m) * rr)} ${f(x)} ${f(y)}`;
    });
    const dew = [[46, 18], [84, 52], [30, 74], [100, 96], [64, 40]].map(([x, y], i) => `<circle class="verse-dew" style="animation-delay:${i * .7}s" cx="${x}" cy="${y}" r="${i % 2 ? 1.6 : 2.2}"/>`).join('');
    return `<svg viewBox="-4 -4 140 140" aria-hidden="true"><path d="${d}"/>${dew}</svg>`;
  })();
  function addWeb(host, side) {
    host.classList.add('verse-host');
    const web = document.createElement('div');
    web.className = `verse-bigweb is-${side}`; web.setAttribute('aria-hidden', 'true');
    web.innerHTML = bigWeb + `<span class="verse-dangle">${SPIDER}</span>`;
    host.prepend(web);
  }

  // ── Placement: what goes where, by page ───────────────────────────────────
  const PLAN = [
    ['#about', { strip: { mood: { dark: null, light: null }, seed: 3 }, web: 'left' }],
    ['#education', { web: 'right', flight: true }],
    ['#experience', { web: 'left' }],
    ['#projects', { strip: { mood: { dark: 'night', light: 'noon' }, seed: 9 } }],
    ['#honors', { web: 'right' }],
    ['#life', { web: 'left' }],
    ['.story-hub-header', { web: 'right', flight: true }],
    ['.article-shell', { web: 'right' }]
  ];
  const watch = new IntersectionObserver(entries => {
    for (const e of entries) { const s = strips.find(x => x.canvas === e.target) || flights.find(x => x.canvas === e.target); if (s) s.visible = e.isIntersecting; }
    wake();
  }, { rootMargin: '80px' });
  function mount() {
    for (const [selector, plan] of PLAN) {
      const host = document.querySelector(selector);
      if (!host) continue;
      if (plan.web && innerWidth >= 760) addWeb(host, plan.web);
      if (plan.strip) addStrip(host, plan.strip);
      if (plan.flight && innerWidth >= 760) addFlight(host);
    }
    const footer = document.querySelector('body > footer, .journal-footer');
    if (footer) addStrip(footer, { mood: { dark: 'dawn', light: 'golden' }, above: true, hero: true, seed: 21 });
    // A tiny spider rides the end of the experience timeline as it fills.
    const progress = document.querySelector('.tl-progress');
    if (progress) { const s = document.createElement('span'); s.className = 'verse-rappel'; s.innerHTML = SPIDER; s.setAttribute('aria-hidden', 'true'); progress.append(s); }
  }

  // ── Ambient sky behind every page ─────────────────────────────────────────
  const ambient = { on: false, canvas: null, ctx: null, stars: [], clouds: [], meteor: null, w: 0, h: 0 };
  function mountAmbient() {
    const canvas = document.createElement('canvas'); canvas.className = 'verse-ambient'; canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    Object.assign(ambient, { on: true, canvas, ctx: canvas.getContext('2d') });
    sizeAmbient();
  }
  function sizeAmbient() {
    if (!ambient.canvas) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5), w = innerWidth, h = innerHeight, rand = City.mulberry(77);
    Object.assign(ambient, { w, h, pal: City.palette() });
    ambient.canvas.width = Math.round(w * dpr); ambient.canvas.height = Math.round(h * dpr); ambient.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ambient.stars = Array.from({ length: Math.round(w * h / 16000) }, () => ({ x: rand() * w, y: rand() * h * 3, r: .4 + rand() * 1.1, phase: rand() * TAU, depth: .1 + rand() * .3, sparkle: rand() < .12 }));
    ambient.clouds = ambient.pal.clouds ? Array.from({ length: 5 }, () => ({ ...City.cloud(rand, 1.1, ambient.pal, dpr), x: rand() * w, y: rand() * h * 2.4, speed: 3 + rand() * 5, depth: .15 + rand() * .25 })) : [];
  }
  function sparklePath(c, x, y, r) {
    c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
  }
  function paintAmbient(time, dt, kick) {
    const { ctx: c, w, h, pal } = ambient, sy = scrollY, light = pal.theme === 'light';
    c.clearRect(0, 0, w, h);
    // Two slow glows that drift with the scroll: warm low on the left, cool high on the right.
    const glows = light
      ? [['#ffc98f', .5, .12, .92, .62], ['#9fd3ff', .45, .9, .1, .55], ['#ffb3c7', .22, .55, .5, .4]]
      : [['#e2685a', .2, .08, .95, .6], ['#6d4f9c', .26, .92, .08, .62], ['#f2a541', .1, .6, .55, .45]];
    glows.forEach(([color, a, gx, gy, gr], i) => {
      const x = w * gx + Math.sin(time * .05 + i * 2) * w * .04, y = h * gy - ((sy * (.05 + i * .02)) % (h * .3)) + Math.cos(time * .04 + i) * h * .03, r = Math.max(w, h) * gr;
      const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, City.rgba(color, a * (1 + kick * .3))); g.addColorStop(1, City.rgba(color, 0));
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
    if (!light) {
      for (const st of ambient.stars) {
        const y = ((st.y - sy * st.depth) % (h * 3) + h * 3) % (h * 3);
        if (y > h) continue;
        const tw = .3 + .7 * (1 + Math.sin(time * (1 + st.depth * 3) + st.phase)) / 2;
        c.fillStyle = '#fff4dc'; c.globalAlpha = .55 * tw;
        if (st.sparkle) sparklePath(c, st.x, y, st.r * 3.2 * tw); else { c.beginPath(); c.arc(st.x, y, st.r, 0, TAU); c.fill(); }
      }
      c.globalAlpha = 1;
      // A shooting star every few seconds.
      if (!ambient.meteor && Math.random() < dt * .12) ambient.meteor = { x: w * (.3 + Math.random() * .7), y: h * Math.random() * .4, t: 0 };
      const m = ambient.meteor;
      if (m) {
        m.t += dt; const k = m.t / .9, x = m.x - k * 260, y = m.y + k * 120;
        const g = c.createLinearGradient(x, y, x + 90, y - 42); g.addColorStop(0, 'rgba(255,244,220,.9)'); g.addColorStop(1, 'rgba(255,244,220,0)');
        c.strokeStyle = g; c.lineWidth = 1.6; c.globalAlpha = Math.sin(Math.PI * Math.min(1, k));
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + 90, y - 42); c.stroke(); c.globalAlpha = 1;
        if (k >= 1) ambient.meteor = null;
      }
    } else {
      c.globalAlpha = .55;
      for (const cl of ambient.clouds) {
        const x = ((cl.x + time * cl.speed) % (w + 400) + w + 400) % (w + 400) - 200;
        const y = ((cl.y - sy * cl.depth) % (h * 2.4) + h * 2.4) % (h * 2.4) - 100;
        if (y < h) c.drawImage(cl.canvas, x, y, cl.w * 1.3, cl.h * 1.3);
      }
      c.globalAlpha = 1;
      c.fillStyle = '#ffb52e';
      for (const st of ambient.stars) {
        if (!st.sparkle) continue;
        const y = ((st.y - sy * st.depth) % (h * 3) + h * 3) % (h * 3);
        if (y > h) continue;
        c.globalAlpha = .35 * (.4 + .6 * (1 + Math.sin(time * 1.4 + st.phase)) / 2);
        sparklePath(c, st.x, y, st.r * 3.6);
      }
      c.globalAlpha = 1;
    }
  }
  addEventListener('scroll', () => { if (motion.matches && ambient.on) paintAmbient(0, 0, 0); }, { passive: true });

  // ── Comic bursts on cards, sparkles on honours ────────────────────────────
  const WORDS = ['POW!', 'ZAP!', 'WOW!', 'BAM!', 'THWIP!', 'NEW!', 'YES!'];
  function mountBursts() {
    document.querySelectorAll('.proj-row, .journal-card, .edu-card').forEach((card, i) => {
      const burst = document.createElement('span');
      burst.className = 'verse-burst'; burst.setAttribute('aria-hidden', 'true'); burst.textContent = WORDS[i % WORDS.length];
      burst.style.setProperty('--tilt', `${(i % 2 ? 1 : -1) * (6 + (i * 7) % 8)}deg`);
      card.classList.add('verse-has-burst'); card.append(burst);
    });
    const shine = el => {
      if (motion.matches || el.dataset.verseShone > Date.now() - 700) return;
      el.dataset.verseShone = Date.now();
      for (let i = 0; i < 7; i++) {
        const sp = document.createElement('span'); sp.className = 'verse-sparkle'; sp.setAttribute('aria-hidden', 'true');
        const a = i / 7 * TAU + Math.random() * .5, d = 22 + Math.random() * 26;
        sp.style.cssText = `left:${10 + Math.random() * 40}px;top:50%;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;--s:${.6 + Math.random() * .7};animation-delay:${i * 25}ms`;
        el.append(sp); setTimeout(() => sp.remove(), 900);
      }
    };
    document.querySelectorAll('.honor-item, .vol-item, .stat-box, .media-card, .podcast-item').forEach(el => {
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.addEventListener('pointerenter', () => shine(el));
    });
  }

  // ── A web thread under the nav that tracks reading progress ───────────────
  function mountProgress() {
    if (document.querySelector('.scroll-progress')) return;
    const bar = document.createElement('div'); bar.className = 'verse-progress'; bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = `<i></i><span>${SPIDER}</span>`;
    document.body.append(bar);
    const update = () => { const max = document.documentElement.scrollHeight - innerHeight; bar.style.setProperty('--p', max > 0 ? clamp(scrollY / max, 0, 1) : 0); };
    addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
  }

  // ── One loop for every visible strip ──────────────────────────────────────
  let raf = 0, last = 0, prevBass = 0, kick = 0;
  const busy = () => strips.some(s => s.visible) || flights.some(f => f.visible) || ambient.on;
  function wake() { if (!raf && !motion.matches && !document.hidden && busy()) raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    if (now - last >= 33) {
      const dt = last ? Math.min(.1, (now - last) / 1000) : 0; last = now;
      const audio = document.querySelector('audio.music-native'), env = window.SUNFLOWER_ENVELOPE;
      const live = audio && !audio.paused && audio.readyState > 2 && audio.volume > 0 && !audio.muted && env;
      let beat = now / 1000 / BEAT;
      if (live) {
        beat = Math.max(0, audio.currentTime - env.offset) / BEAT;
        const ch = env.bass[Math.floor(audio.currentTime * env.fps)], bass = ch ? '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.indexOf(ch) / 63 : 0;
        kick = Math.max(kick * Math.exp(-dt * 5), Math.max(0, bass - prevBass) * 2); prevBass = bass;
      } else kick *= Math.exp(-dt * 5);
      for (const s of strips) if (s.visible) paint(s, now / 1000, beat, kick);
      for (const f of flights) if (f.visible) paintFlight(f, now / 1000);
      if (ambient.on) paintAmbient(now / 1000, dt, kick);
    }
    if (busy() && !document.hidden && !motion.matches) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  function rebuild() { for (const s of strips) build(s); for (const f of flights) sizeFlight(f); sizeAmbient(); wake(); }
  // Reduced motion still gets the scenery, drawn once.
  function still() { if (!motion.matches) return; for (const s of strips) paint(s, 0, 0, 0); for (const f of flights) paintFlight(f, 3); if (ambient.on) paintAmbient(0, 0, 0); }

  mount();
  mountAmbient();
  mountBursts();
  mountProgress();
  still();
  new MutationObserver(() => { rebuild(); still(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  let resizeTimer = 0;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { rebuild(); still(); }, 200); });
  document.addEventListener('visibilitychange', () => { last = 0; wake(); });
  motion.addEventListener('change', () => { wake(); still(); });
  wake();
})();
