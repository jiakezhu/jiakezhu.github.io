(() => {
  const supported=['zh','en','fr','es'];
  const ui=JSON.parse(document.getElementById('article-ui').textContent);
  const buttons=[...document.querySelectorAll('[data-article-language]')];
  function setLanguage(language,persist=true){
    if(!supported.includes(language))language='zh';
    const current=document.querySelector('[data-article-version]:not([hidden])');
    const headings=current?[...current.querySelectorAll('.article-body h2,.article-body h3')]:[];
    const anchor=headings.filter(h=>h.getBoundingClientRect().top<110).at(-1);
    const anchorId=anchor?.id.replace(/^(zh|en|fr|es)-/,'');
    document.documentElement.lang=language;
    document.querySelectorAll('[data-article-version]').forEach(article=>article.hidden=article.dataset.articleVersion!==language);
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.articleLanguage===language)));
    document.title=ui[language].title+' · Jiake Zhu';
    document.querySelectorAll('[data-reading-text]').forEach(el=>el.textContent=ui[language][el.dataset.readingText]);
    document.querySelector('.journal-nav').setAttribute('aria-label',ui[language].nav);
    document.querySelector('.article-languages').setAttribute('aria-label',ui[language].languages);
    document.querySelector('meta[name="description"]').content=ui[language].summary;
    document.querySelector('meta[property="og:title"]').content=ui[language].title;
    document.querySelector('meta[property="og:description"]').content=ui[language].summary;
    const url=new URL(location.href);url.searchParams.set('lang',language);url.hash=url.hash.replace(/^#(?:zh|en|fr|es)-(section-\d+)$/,'#'+language+'-$1');if(persist)history.replaceState(null,'',url);
    document.querySelectorAll('a[href]').forEach(a=>{if(a.closest('.article-toc'))return;const link=new URL(a.href);if(link.origin===location.origin||a.classList.contains('article-permalink')){link.searchParams.set('lang',language);a.href=link.href;}});
    if(persist){try{localStorage.setItem('jiake-language',language);}catch{}if(anchorId)document.getElementById(language+'-'+anchorId)?.scrollIntoView({block:'start',behavior:'instant'});}
    document.dispatchEvent(new CustomEvent('jiake:languagechange',{detail:{language}}));
  }
  buttons.forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.articleLanguage)));
  let initial=new URLSearchParams(location.search).get('lang');
  if(!supported.includes(initial)){try{initial=localStorage.getItem('jiake-language');}catch{}}
  if(!supported.includes(initial))initial='en';
  setLanguage(initial,false);
  const hash=location.hash.replace(/^#(?:zh|en|fr|es)-/,'');if(hash.startsWith('section-'))document.getElementById(initial+'-'+hash)?.scrollIntoView({behavior:'instant'});
  window.addEventListener('storage',event=>{if(event.key==='jiake-language')setLanguage(event.newValue,false);});
})();
