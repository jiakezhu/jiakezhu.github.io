(() => {
  const assets = new URL('.',document.currentScript.src);
  const desktop = matchMedia('(hover: hover) and (pointer: fine)');
  let cursorLoaded=false;
  function loadCursor() {
    if(cursorLoaded || !desktop.matches) return;
    cursorLoaded=true;
    const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href=new URL('cute-cursor.css?v=3',assets).href;
    stylesheet.addEventListener('load',() => {const script=document.createElement('script');script.src=new URL('cute-cursor.js?v=3',assets).href;document.head.append(script);},{once:true});
    document.head.append(stylesheet);
  }
  loadCursor();desktop.addEventListener('change',loadCursor);
  try { document.documentElement.dataset.theme = localStorage.getItem('jiake-theme') === 'light' ? 'light' : 'dark'; } catch { document.documentElement.dataset.theme = 'dark'; }
  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    if (!nav) return;
    const button = document.createElement('button');
    button.className = 'theme-toggle';
    button.type = 'button';
    function refresh() {
      const light = document.documentElement.dataset.theme === 'light';
      button.textContent = light ? '☾' : '☀';
      button.setAttribute('aria-label', light ? '切换深色主题 / Dark theme' : '切换浅色主题 / Light theme');
      button.setAttribute('title', light ? '深色 / Dark' : '浅色 / Light');
    }
    button.addEventListener('click', () => {
      const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem('jiake-theme',theme); } catch {}
      refresh();
    });
    nav.insertBefore(button, nav.querySelector('.nav-menu-button'));
    refresh();
  });
})();
