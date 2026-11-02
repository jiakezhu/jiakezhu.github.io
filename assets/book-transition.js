(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let overlay, timer, destination;
  // Mirrors the Story corner: same night, sign, and loading line as /story/.
  const copy = {
    zh:['走进我的故事','跳过动画','小店正在亮灯…'],
    en:['Entering my story','Skip animation','Opening the corner…'],
    fr:['Entrer dans mon histoire','Passer l’animation','Le coin s’illumine…'],
    es:['Entrar en mi historia','Saltar animación','Abriendo el rincón…']
  };
  function clean() {
    clearTimeout(timer);overlay?.remove();overlay=null;destination=null;
    document.documentElement.classList.remove('story-opening');
  }
  function finish() {
    if (!destination) return;
    const url = destination;
    clearTimeout(timer);destination=null;
    try {sessionStorage.setItem('story-book-arrival',String(Date.now()));} catch {}
    location.assign(url);
  }
  document.addEventListener('click',event => {
    const link = event.target.closest?.('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download') || motion.matches) return;
    const url = new URL(link.href,location.href);
    if (url.origin !== location.origin || !/\/story\/(?:index\.html)?$/.test(url.pathname) || /\/story\/(?:index\.html)?$/.test(location.pathname)) return;
    event.preventDefault();
    if (overlay) return;
    url.pathname = url.pathname.replace(/\/story\/$/, '/story/index.html');
    destination = url.href;
    const [title,skip,loading] = copy[document.documentElement.lang] || copy.en;
    overlay = document.createElement('div');
    overlay.className = 'book-transition';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',title);
    overlay.innerHTML = `<button type="button" class="book-skip">${skip} ↗</button>
      <div class="corner-stage" aria-hidden="true">
        <svg class="corner-bowl" viewBox="0 0 120 92" fill="none"><path d="M70 6 112 22M64 12l46 4" stroke="#ff3dcb" stroke-width="4" stroke-linecap="round"/><path d="M42 4c-8 9 8 15 0 24s8 15 0 24M58 4c-8 9 8 15 0 24s8 15 0 24" stroke="#fff668" stroke-width="3.5" stroke-linecap="round"/><path d="M10 50h100c0 22-20 36-50 36S10 72 10 50Z" stroke="#00bbff" stroke-width="5" stroke-linejoin="round"/></svg>
        <div class="corner-sign"><b>JIAKE ZHU</b><small>S T O R Y &nbsp; C O R N E R</small></div>
        <div class="corner-awning"></div>
      </div>
      <p class="corner-loading"><i></i>${loading}</p>`;
    document.body.append(overlay);document.documentElement.classList.add('story-opening');
    const button = overlay.querySelector('.book-skip');button.addEventListener('click',finish);button.focus({preventScroll:true});
    overlay.addEventListener('keydown',event => {if(event.key==='Escape'){event.preventDefault();finish();}else if(event.key==='Tab'){event.preventDefault();button.focus();}});
    timer = setTimeout(finish,1900);
  });
  // A history restore must never bring back a modal or locked homepage.
  addEventListener('pageshow',event => {if(event.persisted) clean();});
  motion.addEventListener('change',() => {if(motion.matches && destination) finish();});
})();
