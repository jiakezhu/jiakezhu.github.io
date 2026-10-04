(() => {
  const dialog = document.getElementById('site-intro');
  // Run as soon as the intro markup is parsed, before the homepage.
  const hero = () => document.getElementById('hero');
  const boot = window.JIAKE_HOME_BOOT;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const key = 'jiake-intro-seen-v10';
  let exitTimer, fallbackTimer;
  let phaseTimers = [];
  const clearTimers = () => {
    clearTimeout(exitTimer); clearTimeout(fallbackTimer);
    phaseTimers.forEach(clearTimeout); phaseTimers = [];
  };
  const seen = () => { try { return sessionStorage.getItem(key) === '1'; } catch { return false; } };
  function finish() {
    const wasPlaying=dialog.open||document.documentElement.classList.contains('intro-playing');
    clearTimers();
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove('intro-playing', 'intro-revealing');
    dialog.classList.remove('is-exiting');
    delete dialog.dataset.phase;
    boot?.releaseIntro();
    hero()?.classList.add('hero-arrived');
    if(wasPlaying)document.dispatchEvent(new CustomEvent('jiake:introend'));
  }
  function start() {
    if (motion.matches || !dialog.showModal || dialog.open) { boot?.releaseIntro(); return; }
    hero()?.classList.remove('hero-arrived');
    dialog.classList.remove('is-exiting');
    // Optional intro assets are requested only when the animation actually starts.
    dialog.querySelectorAll('[data-intro-src]').forEach(image => {
      image.src=image.dataset.introSrc;
      delete image.dataset.introSrc;
    });
    dialog.querySelectorAll('.il').forEach(el => el.classList.toggle('show',el.classList.contains(document.documentElement.lang)));
    try { dialog.showModal(); } catch { finish(); return; }
    document.documentElement.classList.add('intro-playing');
    boot?.releaseIntro();
    document.dispatchEvent(new CustomEvent('jiake:introstart'));
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
    document.documentElement.classList.remove('intro-playing', 'intro-revealing');
    clearTimers();
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
