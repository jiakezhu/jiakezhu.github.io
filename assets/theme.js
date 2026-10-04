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
    const labels={en:['Switch to dark theme','Switch to light theme'],zh:['切换深色主题','切换浅色主题'],fr:['Passer au thème sombre','Passer au thème clair'],es:['Cambiar al tema oscuro','Cambiar al tema claro']};
    function refresh() {
      const light = document.documentElement.dataset.theme === 'light';
      button.textContent = light ? '☾' : '☀';
      const label=(labels[document.documentElement.lang]||labels.en)[light?0:1];
      button.setAttribute('aria-label',label);
      button.setAttribute('title',label);
    }
    button.addEventListener('click', () => {
      const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem('jiake-theme',theme); } catch {}
      refresh();
    });
    const tools = nav.querySelector('.nav-tools');
    if (tools) tools.append(button);
    else nav.insertBefore(button, nav.querySelector('.nav-menu-button'));
    document.addEventListener('jiake:languagechange',refresh);
    refresh();
  });
})();
