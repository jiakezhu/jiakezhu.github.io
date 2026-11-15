(() => {
  const dialog = document.getElementById('site-intro');
  // Run as soon as the intro markup is parsed, before the homepage.
  const hero = () => document.getElementById('hero');
  const boot = window.JIAKE_HOME_BOOT;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const key = 'jiake-intro-seen-v9';
  let exitTimer, fallbackTimer, preparationTimer, run = 0;
  let phaseTimers = [];
  const clearTimers = () => {
    clearTimeout(exitTimer); clearTimeout(fallbackTimer); clearTimeout(preparationTimer);
    phaseTimers.forEach(clearTimeout); phaseTimers = [];
  };
  const seen = () => { try { return sessionStorage.getItem(key) === '1'; } catch { return false; } };
  function finish() {
    run += 1;
    const wasPlaying=dialog.open||document.documentElement.classList.contains('intro-playing');
    clearTimers();
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove('intro-playing', 'intro-revealing');
    dialog.classList.remove('is-exiting', 'is-ready');
    delete dialog.dataset.phase;
    boot?.releaseIntro();
    hero()?.classList.add('hero-arrived');
    if(wasPlaying)document.dispatchEvent(new CustomEvent('jiake:introend'));
  }
  async function start() {
    if (motion.matches || !dialog.showModal || dialog.open) { boot?.releaseIntro(); return; }
    const currentRun = ++run;
    hero()?.classList.remove('hero-arrived');
    dialog.classList.remove('is-exiting', 'is-ready');
    dialog.querySelectorAll('.il').forEach(el => el.classList.toggle('show',el.classList.contains(document.documentElement.lang)));
    try { dialog.showModal(); } catch { finish(); return; }
    document.documentElement.classList.add('intro-playing');
    boot?.releaseIntro();
    document.dispatchEvent(new CustomEvent('jiake:introstart'));
    dialog.dataset.phase = 'preparing';
    // Do not download desktop-only cards on a phone. Decode before the CSS clock starts.
    const images = [...dialog.querySelectorAll('.intro-fragment img')].filter(image =>
      getComputedStyle(image.closest('.intro-fragment')).display !== 'none');
    const prepared = new Set();
    dialog.querySelectorAll('.intro-fragment').forEach(card => { delete card.dataset.imageReady; });
    const loading = images.map(async image => {
      image.fetchPriority = 'high';
      if (image.dataset.introSrc) {
        image.src = matchMedia('(max-width: 700px)').matches && image.dataset.introMobileSrc
          ? image.dataset.introMobileSrc : image.dataset.introSrc;
        delete image.dataset.introSrc;
      }
      try {
        if (image.decode) await image.decode();
        else if (!image.complete) await new Promise((resolve, reject) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', reject, { once: true });
        });
        if (image.naturalWidth) prepared.add(image);
      } catch { /* A failed picture must not leave an empty photo frame. */ }
    });
    // Keep the name and skip button visible; a slow or failed image cannot trap a visit.
    await Promise.race([
      Promise.all(loading),
      new Promise(resolve => { preparationTimer = setTimeout(resolve, 1800); })
    ]);
    clearTimeout(preparationTimer);
    if (currentRun !== run || !dialog.open) return;
    const photos = images.filter(image => image.closest('.intro-sprite'));
    if (!prepared.size || photos.some(image => !prepared.has(image))) { finish(); return; }
    prepared.forEach(image => { image.closest('.intro-fragment').dataset.imageReady = 'true'; });
    dialog.classList.add('is-ready');
    dialog.dataset.phase = 'portrait';
    phaseTimers = [
      setTimeout(() => { dialog.dataset.phase = 'greeting'; }, 1150),
      setTimeout(() => { dialog.dataset.phase = 'burst'; }, 1700),
      setTimeout(() => { dialog.dataset.phase = 'credo'; }, 2800)
    ];
    try { sessionStorage.setItem(key, '1'); } catch {}
    exitTimer = setTimeout(() => {
      dialog.dataset.phase = 'reveal';
      dialog.classList.add('is-exiting');
      document.documentElement.classList.add('intro-revealing');
      hero()?.classList.add('hero-arrived');
    }, 4300);
    // A failed or cancelled CSS animation must never strand the reader.
    fallbackTimer = setTimeout(finish, 6100);
  }
  dialog.querySelector('.intro-skip').addEventListener('click', finish);
  dialog.addEventListener('cancel', event => { event.preventDefault(); finish(); });
  dialog.addEventListener('close', () => {
    run += 1;
    document.documentElement.classList.remove('intro-playing', 'intro-revealing');
    clearTimers();
    boot?.releaseIntro();
  });
  dialog.addEventListener('animationend', event => {
    if (event.target === dialog && event.animationName === 'introDismiss') finish();
  });
  function updateMotion() {
    const replay=document.getElementById('intro-replay');
    if(replay) replay.disabled=motion.matches;
    if(motion.matches) finish();
  }
  motion.addEventListener('change', updateMotion);
  updateMotion();
  if (boot ? boot.introPending : !seen()&&!location.hash) start();
  function bindHomepage() {
    document.getElementById('intro-replay')?.addEventListener('click',start);
    updateMotion();
    if(!dialog.open) hero()?.classList.add('hero-arrived');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bindHomepage,{once:true});
  else bindHomepage();
})();
