(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const asset = file => new URL(`../images/${file}`,document.currentScript.src).href;
  const coverUrl = asset('comic/page-01-small.webp');
  const portraitUrl = asset('hero.jpeg');
  const projectUrl = asset('lingovibe-app-icon-v3.png');
  let overlay, timer, destination;
  const copy = {
    zh:['翻开我的故事','跳过动画','项目与日常','成长漫画','一路走着，也一路做着。','把路上的想法，一页页收好。','我的故事','公众号'],
    en:['Opening my story','Skip animation','Projects & notes','Life in frames','A life in the making.','Thoughts from the road, page by page.','My story','WeChat essays'],
    fr:['Ouvrir mon histoire','Passer l’animation','Projets & notes','Ma vie en images','Une vie qui se construit.','Les idées du chemin, page par page.','Mon histoire','Essais WeChat'],
    es:['Abrir mi historia','Saltar animación','Proyectos & notas','La vida en viñetas','Una vida en construcción.','Ideas del camino, página a página.','Mi historia','Ensayos WeChat']
  };
  const pages = {
    zh:{contents:'目录',note:'想法、项目与路上的片刻。',notes:'把想法做成产品',essay:'在技术之外，理解人',growth:'从海边，走向世界',journal:'项目手记',excerpt:'从一个真实的问题出发，把语言、文化与 AI 放进同一个工具。边做，边学。',travel:'一路，向更大的世界。',photo:'罗马 / 旅途中的我',travelNote:'从宁波到巴黎。学语言，也用不同的语言重新认识世界。',quote:'语言的边界，就是我世界的边界。'},
    en:{contents:'Contents',note:'Ideas, projects, and moments on the road.',notes:'From ideas to products',essay:'Understanding people beyond tech',growth:'From the coast to the world',journal:'Project notes',excerpt:'Start with a real question. Bring language, culture, and AI into one useful tool. Build, and keep learning.',travel:'A wider world.',photo:'ROME / ON THE ROAD',travelNote:'From Ningbo to Paris. Learning languages, and seeing the world through them.',quote:'The limits of my language are the limits of my world.'},
    fr:{contents:'Sommaire',note:'Idées, projets et instants du chemin.',notes:'Des idées aux produits',essay:'Comprendre l’humain au-delà de la tech',growth:'De la côte vers le monde',journal:'Carnet de projets',excerpt:'Partir d’une vraie question. Réunir langue, culture et IA dans un outil utile. Créer, et continuer à apprendre.',travel:'Un monde plus vaste.',photo:'ROME / EN CHEMIN',travelNote:'De Ningbo à Paris. Apprendre les langues et découvrir le monde à travers elles.',quote:'Les limites de ma langue sont les limites de mon monde.'},
    es:{contents:'Índice',note:'Ideas, proyectos y momentos del camino.',notes:'De las ideas a los productos',essay:'Entender a las personas más allá de la tecnología',growth:'De la costa hacia el mundo',journal:'Notas de proyectos',excerpt:'Partir de una pregunta real. Unir idiomas, cultura e IA en una herramienta útil. Crear y seguir aprendiendo.',travel:'Un mundo más amplio.',photo:'ROMA / EN EL CAMINO',travelNote:'De Ningbo a París. Aprender idiomas y descubrir el mundo a través de ellos.',quote:'Los límites de mi idioma son los límites de mi mundo.'}
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
    const [title,skip,notes,growth,motto,caption,name,wechat] = copy[document.documentElement.lang] || copy.en;
    const page = pages[document.documentElement.lang] || pages.en;
    overlay = document.createElement('div');
    overlay.className = 'book-transition';overlay.dataset.state='opening';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',title);
    overlay.innerHTML = `<button type="button" class="book-skip">${skip} ↗</button>
      <div class="book-stage" aria-hidden="true">
        <div class="book-sheet book-base"><div class="book-page book-index">
          <small class="book-page-kicker">JIAKE ZHU / PERSONAL COLLECTION</small><h2>${page.contents}<span>.</span></h2><p class="book-index-intro">${page.note}</p>
          <div class="book-contents"><div><b>01</b><span>${notes}<small>${page.notes}</small></span></div><div><b>02</b><span>${wechat}<small>${page.essay}</small></span></div><div><b>03</b><span>${growth}<small>${page.growth}</small></span></div></div>
          <div class="book-index-foot"><img src="${projectUrl}" alt=""><span>THINK.<br>BUILD.<br>KEEP WONDERING.</span><i>✧</i></div><small class="book-page-number">01</small>
        </div></div>
        <div class="book-sheet book-paper">
          <div class="book-page book-project"><small class="book-page-kicker">01 / ${page.journal}</small><div class="book-project-mark"><img src="${projectUrl}" alt=""><span>LingoVibe<small>LANGUAGE × CULTURE × AI</small></span></div><p>${page.excerpt}</p><div class="book-note-sketch"><span>language</span><i>↔</i><span>culture</span><i>↓</i><b>build with AI ✧</b></div><small class="book-page-number">02</small></div>
          <div class="book-page book-paper-back book-travel"><small class="book-page-kicker">03 / ${growth}</small><h3>${page.travel}</h3><figure><img src="${portraitUrl}" alt=""><figcaption>${page.photo} ↗</figcaption></figure><p>${page.travelNote}</p><div class="book-language-stamps"><span>你好</span><span>Bonjour</span><span>Hola</span></div><small class="book-page-number">03</small></div>
        </div>
        <div class="book-sheet book-cover"><div class="book-page book-cover-front"><small class="book-page-kicker">A PERSONAL COLLECTION</small><h2>${name}<span>.</span></h2><div class="book-cover-art"><img src="${coverUrl}" alt=""></div><span class="book-cover-author">JIAKE ZHU</span></div><div class="book-page book-cover-back"><small class="book-page-kicker">ALWAYS DAY ONE.</small><div class="book-cover-art"><img src="${coverUrl}" alt=""></div><p>${motto}</p><blockquote>${page.quote}</blockquote><small class="book-page-number">00</small></div></div>
      </div><p class="book-caption">${caption}</p>`;
    document.body.append(overlay);document.documentElement.classList.add('story-opening');
    overlay.querySelector('.book-stage').addEventListener('animationend',event=>{if(event.target.classList.contains('book-stage')&&overlay) overlay.dataset.state='open';});
    const button = overlay.querySelector('.book-skip');button.addEventListener('click',finish);button.focus({preventScroll:true});
    overlay.addEventListener('keydown',event => {if(event.key==='Escape'){event.preventDefault();finish();}else if(event.key==='Tab'){event.preventDefault();button.focus();}});
    timer = setTimeout(finish,2100);
  });
  // A history restore must never bring back a modal or locked homepage.
  addEventListener('pageshow',event => {if(event.persisted) clean();});
  motion.addEventListener('change',() => {if(motion.matches && destination) finish();});
})();
