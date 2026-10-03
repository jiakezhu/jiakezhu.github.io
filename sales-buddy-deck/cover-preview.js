// Fit the author's 1920 × 1080 first slide without reflowing its composition.
(() => {
  const stage = document.getElementById('deckStage');
  const fit = () => {
    const scale = Math.min(innerWidth / 1920, innerHeight / 1080);
    const x = (innerWidth - 1920 * scale) / 2;
    const y = (innerHeight - 1080 * scale) / 2;
    stage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  };
  fit();
  addEventListener('resize', fit, { passive: true });
})();
