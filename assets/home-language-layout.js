(() => {
  const applyLanguage=window.setLang;
  const languages=['zh','en','fr','es'];
  // Reserve each component's longest translation at its actual responsive width.
  // Measure only on load, font readiness, resize, or a portfolio layout change.
  const selector='.s-title,.hero-name,.hero-tagline,.hero-actions,.hero-contact,.hero-now,.hero-footer,.about-text,.stat-box,.edu-card,.tl-item,.project-controls,.proj-group-head,.proj-body,.proj-action,.project-proof,#honors .honors-grid,.journey-panel,.life-card,.jp-ms,.jp-eu-ms,.portal-copy,.footer-sub';
  const components=[...document.querySelectorAll(selector)];
  let measuring=false, resizeTimer, scheduled=false;
  function readingAnchor() {
    if(scrollY<100) return null;
    const elements=[...document.querySelectorAll('#hero,main section,body>section,body>.sf,#story')];
    const element=elements.find(el=>{const r=el.getBoundingClientRect();return r.top<=100&&r.bottom>100;});
    return element?{element,top:element.getBoundingClientRect().top}:null;
  }
  function keepAnchor(anchor) {
    if(anchor) window.scrollBy({top:anchor.element.getBoundingClientRect().top-anchor.top,behavior:'instant'});
  }
  function measure() {
    if(measuring) return;
    measuring=true;
    const language=document.documentElement.lang;
    const anchor=readingAnchor();
    components.forEach(el=>el.style.removeProperty('min-block-size'));
    const heights=new Map();
    try {
      for(const language of languages) {
        applyLanguage(language,{persist:false,refresh:false});
        for(const el of components) {
          if(!el.getClientRects().length) continue;
          heights.set(el,Math.max(heights.get(el)||0,Math.ceil(parseFloat(getComputedStyle(el).height))));
        }
      }
    } finally {
      applyLanguage(language,{persist:false,refresh:false});
      for(const [el,height] of heights) el.style.minBlockSize=`${height}px`;
      keepAnchor(anchor);
      measuring=false;
    }
  }
  window.setLang=function(language) {
    const anchor=readingAnchor();
    applyLanguage(language);
    keepAnchor(anchor);
  };
  function scheduleMeasure() {
    if(scheduled||document.documentElement.classList.contains('intro-playing')) return;
    scheduled=true;
    const run=()=>{scheduled=false;if(!document.documentElement.classList.contains('intro-playing')) measure();};
    if('requestIdleCallback' in window) window.requestIdleCallback(run,{timeout:500});
    else setTimeout(run,0);
  }
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(scheduleMeasure,120);});
  document.querySelector('.project-controls')?.addEventListener('click',scheduleMeasure);
  document.querySelectorAll('.project-expand').forEach(button=>button.addEventListener('click',scheduleMeasure));
  document.querySelector('.map-tabs-wrap')?.addEventListener('click',scheduleMeasure);
  document.addEventListener('jiake:introend',scheduleMeasure);
  document.fonts.ready.then(scheduleMeasure);
})();
