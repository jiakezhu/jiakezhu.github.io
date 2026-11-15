/* Keep real pictures visible when a mobile connection drops an individual asset. */
(() => {
  const base = new URL('../',document.currentScript.src);
  const fallbacks = JSON.parse(document.getElementById('home-media-fallbacks')?.textContent || '{}');
  const states = new WeakMap(), failed = new Set();
  const key = src => {
    try { const url=new URL(src,base); return url.href.startsWith(base.href)?url.href.slice(base.href.length).split('?')[0]:null; } catch { return null; }
  };
  const nearby = image => { const r=image.getBoundingClientRect();return r.width>0&&r.height>0&&r.top<innerHeight+350&&r.bottom>-350; };
  // Reuse each already-parsed logo rather than repeating its bytes or making more requests.
  const logos=new Map([...document.querySelectorAll('img[data-inline-src]')].map(image=>[image.dataset.inlineSrc,image.src]));
  document.querySelectorAll('img[src]').forEach(image=>{if(image.closest('#site-intro'))return;const source=key(image.getAttribute('src'));if(logos.has(source)){image.dataset.mediaOriginal=source;image.src=logos.get(source);}});
  function begin(image,state) {
    clearTimeout(state.timer);
    if(image.getAttribute('src')&&!image.getAttribute('src').startsWith('data:')&&(!image.complete||!image.naturalWidth)&&state.active) state.timer=setTimeout(()=>retry(image,state),6000);
  }
  function retry(image,state) {
    clearTimeout(state.timer);clearTimeout(state.retryTimer);
    if(!state.active&&!nearby(image)) {failed.add(image);return;}
    if(state.attempts>=2) {failed.add(image);image.dataset.mediaState='failed';return;}
    const source=image.currentSrc||image.getAttribute('src');
    const fallback=fallbacks[key(source)]||fallbacks[key(image.getAttribute('src'))]||fallbacks[image.dataset.inlineSrc||image.dataset.mediaOriginal];
    if(!source||source.startsWith('data:')&&!fallback) return;
    const target=new URL(state.attempts===0&&fallback?fallback:source,base);
    state.attempts++;
    target.searchParams.set('media-retry',String(++state.sequence));
    image.dataset.mediaState='retrying';
    state.retryTimer=setTimeout(()=>{
      state.current=target.href;image.removeAttribute('srcset');image.style.removeProperty('display');image.src=target.href;begin(image,state);
    },state.attempts===1?200:900);
  }
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries) {
      const image=entry.target,state=states.get(image);state.active=entry.isIntersecting;
      if(!state.active) {clearTimeout(state.timer);continue;}
      if(image.complete&&!image.naturalWidth&&image.getAttribute('src')) retry(image,state);
      else begin(image,state);
    }
  },{rootMargin:'350px'});
  function watch(image) {
    if(image.closest('#site-intro'))return;
    const existing=states.get(image);
    if(existing) {if(existing.current!==image.src){existing.attempts=0;existing.current=image.src;failed.delete(image);}begin(image,existing);return;}
    const state={attempts:0,sequence:0,current:image.src,active:image.loading!=='lazy'||nearby(image),timer:0,retryTimer:0};states.set(image,state);
    // Legacy handlers hid a failed picture permanently, including after reconnecting.
    image.removeAttribute('onerror');image.style.removeProperty('display');
    image.addEventListener('error',()=>retry(image,state));
    image.addEventListener('load',()=>{clearTimeout(state.timer);clearTimeout(state.retryTimer);state.attempts=0;failed.delete(image);image.dataset.mediaState='loaded';image.style.removeProperty('display');});
    observer.observe(image);
    if(image.complete&&!image.naturalWidth&&image.getAttribute('src'))retry(image,state);else begin(image,state);
  }
  function load(src) {
    const image=new Image();image.decoding='async';
    return new Promise(resolve=>{
      const fallback=fallbacks[key(src)];
      const retryTimer=setTimeout(()=>{if(fallback&&!image.naturalWidth)image.src=new URL(fallback,base).href;},3000);
      const timeout=setTimeout(()=>{clearTimeout(retryTimer);image.onload=null;image.onerror=null;image.removeAttribute('src');resolve(null);},6500);
      const complete=()=>{clearTimeout(timeout);clearTimeout(retryTimer);resolve(image.naturalWidth?image.src:null);};
      image.onload=complete;image.onerror=()=>{if(fallback&&key(image.src)!==fallback)image.src=new URL(fallback,base).href;else complete();};
      image.src=new URL(src,base).href;
    });
  }
  document.querySelectorAll('img').forEach(watch);
  new MutationObserver(records=>{
    for(const record of records) {
      if(record.type==='attributes') {if(record.target.tagName==='IMG') watch(record.target);}
      else for(const node of record.addedNodes) if(node.nodeType===1) {if(node.tagName==='IMG')watch(node);node.querySelectorAll('img').forEach(watch);}
    }
  }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','srcset']});
  window.addEventListener('online',()=>{for(const image of failed){const state=states.get(image);state.attempts=0;state.active=nearby(image);retry(image,state);}});
  window.JIAKE_HOME_MEDIA={watch,load};
})();
