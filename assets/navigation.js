(() => {
  const button = document.getElementById('nav-menu');
  const links = document.getElementById('nav-links');
  const copy = {
    zh:{label:'导航',open:'打开导航',close:'收起导航'},
    en:{label:'Menu',open:'Open navigation',close:'Close navigation'},
    fr:{label:'Menu',open:'Ouvrir la navigation',close:'Fermer la navigation'},
    es:{label:'Menú',open:'Abrir navegación',close:'Cerrar navegación'}
  };
  function label() {
    const t=copy[document.documentElement.lang]||copy.en;
    button.textContent=t.label;
    button.setAttribute('aria-label',button.getAttribute('aria-expanded')==='true'?t.close:t.open);
  }
  function close() {links.classList.remove('is-open');button.setAttribute('aria-expanded','false');label();}
  button.addEventListener('click',()=>{const open=links.classList.toggle('is-open');button.setAttribute('aria-expanded',String(open));label();});
  links.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&links.classList.contains('is-open')){close();button.focus();}});
  document.addEventListener('click',e=>{if(!document.getElementById('nav').contains(e.target))close();});
  window.addEventListener('resize',()=>{if(window.innerWidth>850)close();});
  document.addEventListener('jiake:languagechange',label);
  new ResizeObserver(entries=>document.documentElement.style.setProperty('--nav-height',entries[0].target.offsetHeight+'px')).observe(document.getElementById('nav'));
  // Track section starts: a long portfolio can never meet a whole-section ratio.
  const nav=document.getElementById('nav');
  const chapterLinks=[...links.querySelectorAll('a[href^="#"]')];
  const chapters=chapterLinks.map(link=>({link,section:document.getElementById(link.hash.slice(1))})).filter(chapter=>chapter.section);
  let frame=0;
  function updateChapter(){
    frame=0;const line=nav.offsetHeight+Math.min(140,innerHeight*.2);let current;
    for(const chapter of chapters){if(chapter.section.getBoundingClientRect().top<=line)current=chapter.link;else break;}
    for(const link of chapterLinks){const active=link===current;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}
  }
  function scheduleChapter(){if(!frame)frame=requestAnimationFrame(updateChapter);}
  window.addEventListener('scroll',scheduleChapter,{passive:true});
  window.addEventListener('resize',scheduleChapter);
  document.addEventListener('jiake:languagechange',scheduleChapter);
  new ResizeObserver(scheduleChapter).observe(document.body);
  updateChapter();
  label();
})();
