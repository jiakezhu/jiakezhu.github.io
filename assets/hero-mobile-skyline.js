/* A quiet, viewport-sized city for touch screens. Draw once per size/theme change:
   no stretched poster, halftone dots, external image or continuous render loop. */
(() => {
  const hero = document.getElementById('hero'), City = window.VerseCity;
  if (!hero || !City) return;
  const root = document.documentElement;
  const desktop = matchMedia('(hover: hover) and (pointer: fine)');
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-skyline';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  hero.prepend(canvas);
  let lastSize = '', pending = 0;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function draw() {
    pending = 0;
    canvas.hidden = desktop.matches;
    if (desktop.matches) { lastSize = ''; return; }
    const width = Math.round(hero.getBoundingClientRect().width);
    const height = Math.round(Math.min(hero.offsetHeight, Math.max(innerHeight, 560)));
    if (!width || !height) return;
    const density = Math.min(devicePixelRatio || 1, 2);
    const pal = City.palette(), light = pal.theme === 'light';
    const size = [width, height, density, pal.theme].join(':');
    if (size === lastSize) return;
    lastSize = size;
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    canvas.style.height = height + 'px';
    canvas.dataset.theme = pal.theme;
    ctx.setTransform(density, 0, 0, density, 0, 0);

    const skylineHeight = Math.round(clamp(width * .72, 240, 340));
    const ground = height * .96;
    // Keep buildings below the main introduction. The sky stays smooth and open.
    const glow = ctx.createRadialGradient(width * .8, ground - skylineHeight * .3, 0, width * .8, ground - skylineHeight * .3, width * .95);
    glow.addColorStop(0, light ? 'rgba(244,179,121,.25)' : 'rgba(193,114,76,.18)');
    glow.addColorStop(1, 'rgba(193,114,76,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);

    const radius = clamp(width * .085, 26, 44), sunX = width * .83, sunY = ground - skylineHeight * .96;
    const halo = ctx.createRadialGradient(sunX, sunY, radius * .4, sunX, sunY, radius * 3);
    halo.addColorStop(0, light ? 'rgba(255,200,126,.2)' : 'rgba(239,171,107,.1)');
    halo.addColorStop(1, 'rgba(239,171,107,0)');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = light ? 'rgba(239,179,105,.45)' : 'rgba(223,169,113,.3)';
    ctx.beginPath(); ctx.arc(sunX, sunY, radius, 0, Math.PI * 2); ctx.fill();

    const quietPalette = {
      ...pal, layers: light ? ['#ccd7e3', '#aebfd0'] : ['#36313f', '#252630'],
      rim: [light ? '#f5e4d0' : '#b59b88', .12], glass: null,
      window: light ? '#fff4df' : '#d5ad80'
    };
    const specs = [
      { h: [.4, .72], w: [32, 70], lit: .045, depth: [0, 0, 0], speed: 0 },
      { h: [.16, .42], w: [48, 96], lit: .07, depth: [0, 0, 0], speed: 0 }
    ];
    specs.forEach((spec, index) => {
      const layer = City.strip({ index, width, tileH: skylineHeight, ground: skylineHeight, sky: skylineHeight, unit: .85, dpr: density, pal: quietPalette, spec });
      const y = ground - skylineHeight;
      ctx.globalAlpha = index ? .8 : .65;
      ctx.drawImage(layer.body, 0, y, layer.tileW, layer.tileH);
      ctx.globalAlpha = light ? .45 : .3;
      ctx.drawImage(layer.lights, 0, y, layer.tileW, layer.tileH);
    });
    ctx.globalAlpha = 1;
  }

  const schedule = () => { if (!pending) pending = requestAnimationFrame(draw); };
  new ResizeObserver(schedule).observe(hero);
  new MutationObserver(schedule).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  desktop.addEventListener('change', schedule);
  window.addEventListener('resize', schedule, { passive: true });
  draw();
})();
