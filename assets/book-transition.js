(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const coverUrl = new URL('../images/growth-comic-cover-v2.png',document.currentScript.src).href;
  let overlay, timer, destination;
  const copy = {
    zh:['翻开我的故事','跳过动画','项目与日常','成长漫画','一路走着，也一路做着。','把路上的想法，一页页收好。','我的故事','公众号'],
    en:['Opening my story','Skip animation','Projects & notes','Life in frames','A life in the making.','Thoughts from the road, page by page.','My story','WeChat essays'],
    fr:['Ouvrir mon histoire','Passer l’animation','Projets & notes','Ma vie en images','Une vie qui se construit.','Les idées du chemin, page par page.','Mon histoire','Essais WeChat'],
    es:['Abrir mi historia','Saltar animación','Proyectos & notas','La vida en viñetas','Una vida en construcción.','Ideas del camino, página a página.','Mi historia','Ensayos WeChat']
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
    if (url.origin !== location.origin || !/\/story\/$/.test(url.pathname) || url.pathname === location.pathname) return;
    event.preventDefault();
    if (overlay) return;
    destination = url.href;
    const [title,skip,notes,growth,motto,caption,name,wechat] = copy[document.documentElement.lang] || copy.en;
    overlay = document.createElement('div');
    overlay.className = 'book-transition';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',title);
    overlay.innerHTML = `<button type="button" class="book-skip">${skip} ↗</button><div class="book-stage" aria-hidden="true"><div class="book-sheet book-base"><div class="book-page"><small class="book-page-kicker">NOTES FROM A LIFE IN MOTION</small><h2>${name}<span>.</span></h2><div class="book-contents"><span>01 / ${notes}</span><span>02 / ${wechat}</span><span>03 / ${growth}</span></div><small class="book-page-number">01</small></div></div><div class="book-sheet book-paper"><div class="book-page"><small class="book-page-kicker">THINK · BUILD · WRITE</small><div class="book-paper-lines"></div></div><div class="book-page book-paper-back"><small class="book-page-kicker">IDEAS / PROJECTS / LIFE</small><div class="book-paper-lines"></div></div></div><div class="book-sheet book-cover"><div class="book-page book-cover-front"><small class="book-page-kicker">A PERSONAL COLLECTION</small><h2>${name}<span>.</span></h2><img src="${coverUrl}" alt=""><span class="book-cover-author">JIAKE ZHU / 朱佳科</span></div><div class="book-page book-cover-back"><small class="book-page-kicker">ALWAYS DAY ONE.</small><img src="${coverUrl}" alt=""><p>${motto}</p><small class="book-page-number">00</small></div></div></div><p class="book-caption">${caption}</p>`;
    document.body.append(overlay);document.documentElement.classList.add('story-opening');
    const button = overlay.querySelector('.book-skip');button.addEventListener('click',finish);button.focus({preventScroll:true});
    overlay.addEventListener('keydown',event => {if(event.key==='Escape'){event.preventDefault();finish();}else if(event.key==='Tab'){event.preventDefault();button.focus();}});
    timer = setTimeout(finish,1650);
  });
  // A history restore must never bring back a modal or locked homepage.
  addEventListener('pageshow',event => {if(event.persisted) clean();});
  motion.addEventListener('change',() => {if(motion.matches && destination) finish();});
})();
