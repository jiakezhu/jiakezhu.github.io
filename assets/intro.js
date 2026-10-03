(() => {
  const dialog = document.getElementById('site-intro');
  const replay = document.getElementById('intro-replay');
  const hero = document.getElementById('hero');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const key = 'jiake-intro-seen-v2';
  let exitTimer, fallbackTimer;
  const seen = () => { try { return sessionStorage.getItem(key) === '1'; } catch { return false; } };
  function finish() {
    clearTimeout(exitTimer); clearTimeout(fallbackTimer);
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove('intro-playing');
    dialog.classList.remove('is-exiting');
    hero.classList.add('hero-arrived');
  }
  function start() {
    if (motion.matches || !dialog.showModal || dialog.open) return;
    hero.classList.remove('hero-arrived');
    dialog.classList.remove('is-exiting');
    try { dialog.showModal(); } catch { finish(); return; }
    document.documentElement.classList.add('intro-playing');
    try { sessionStorage.setItem(key, '1'); } catch {}
    exitTimer = setTimeout(() => dialog.classList.add('is-exiting'), 1700);
    // A failed or cancelled CSS animation must never strand the reader.
    fallbackTimer = setTimeout(finish, 3000);
  }
  dialog.querySelector('.intro-skip').addEventListener('click', finish);
  dialog.addEventListener('cancel', event => { event.preventDefault(); finish(); });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('intro-playing');
    clearTimeout(exitTimer); clearTimeout(fallbackTimer);
  });
  dialog.addEventListener('animationend', event => {
    if (event.target === dialog && event.animationName === 'introCurtain') finish();
  });
  replay.addEventListener('click', start);
  function updateMotion() { replay.disabled = motion.matches; if (motion.matches) finish(); }
  motion.addEventListener('change', updateMotion);
  updateMotion();
  if (!seen() && !location.hash) start();
})();
