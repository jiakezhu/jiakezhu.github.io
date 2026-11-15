/* Let the intro own startup bandwidth; enhance the already-visible homepage afterwards. */
(() => {
  const base = new URL('.', document.currentScript.src);
  const afterIntro = callback => window.JIAKE_HOME_BOOT ? window.JIAKE_HOME_BOOT.afterIntro(callback) : callback();
  function loadScript(file) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL(file, base).href;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Unable to load ' + file));
      document.head.append(script);
    });
  }
  afterIntro(() => {
    // async=false preserves dependency order while the downloads run in parallel.
    Promise.all([
      'hero-desk-motion.js?v=3', 'hero-desk.js?v=10',
      'sunflower-envelope.js', 'verse-figure.js?v=5', 'verse-city.js?v=2',
      'hero-scene.js?v=11'
    ].map(loadScript)).catch(error => console.warn(error.message));
  });

  const journey = document.getElementById('journey');
  if (!journey) return;
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    afterIntro(() => {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = new URL('vendor/leaflet.css', base).href;
      document.head.append(stylesheet);
      Promise.all(['vendor/leaflet.js', 'journey.js?v=19'].map(loadScript))
        .catch(error => console.warn(error.message));
    });
  }, { rootMargin: '400px' });
  observer.observe(journey);
})();
