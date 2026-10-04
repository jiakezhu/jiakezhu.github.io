(() => {
  const copies=window.COMIC_I18N;
  if (!copies) return;
  const supported=['en','zh','fr','es'];
  let language='en';
  const text=key=>copies[language]?.[key]??copies.en[key]??'';
  const format=(key,variables)=>text(key).replace(/\{(\w+)\}/g,(_,name)=>variables[name]??'');
  window.COMIC_LANGUAGE={text,format,get language(){return language;}};
  function updateThemeLabel() {
    const button=document.querySelector('.theme-toggle');
    if (!button) return;
    const label=text(document.documentElement.dataset.theme==='light'?'darkTheme':'lightTheme');
    button.setAttribute('aria-label',label);
    button.title=label;
  }
  function setLanguage(value) {
    language=supported.includes(value)?value:'en';
    document.documentElement.lang=language;
    document.querySelectorAll('[data-comic-i18n]').forEach(element=>{element.textContent=text(element.dataset.comicI18n);});
    for(const [attribute,dataKey] of [['aria-label','comicI18nAria'],['alt','comicI18nAlt']]) {
      document.querySelectorAll(attribute==='alt'?'[data-comic-i18n-alt]':'[data-comic-i18n-aria]').forEach(element=>element.setAttribute(attribute,text(element.dataset[dataKey])));
    }
    document.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
    document.title=(document.body.dataset.comicView==='transcript'?text('wordsTitle'):text('bookTitle'))+' · Jiake Zhu';
    document.querySelector('meta[name="description"]')?.setAttribute('content',text('description'));
    updateThemeLabel();
    try { localStorage.setItem('jiake-language',language); } catch {}
    document.dispatchEvent(new CustomEvent('jiake:languagechange',{detail:{language}}));
  }
  document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.language)));
  window.addEventListener('storage',event=>{if(event.key==='jiake-language') setLanguage(event.newValue);});
  new MutationObserver(updateThemeLabel).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  if(document.readyState!=='complete') document.addEventListener('DOMContentLoaded',updateThemeLabel,{once:true});
  let initial=navigator.language.startsWith('zh')?'zh':'en';
  try {initial=localStorage.getItem('jiake-language')||initial;} catch {}
  setLanguage(initial);
})();
