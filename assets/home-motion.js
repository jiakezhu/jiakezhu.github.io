/* Chapter entrances, the archived title reveal, and gently moving photos. */
(() => {
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const entrances=[...document.querySelectorAll('.reveal')];
  const photos=[...document.querySelectorAll('.hero-photo,.story-invitation .story-photo')];
  const titles=[...document.querySelectorAll('.s-title,.story-invitation h2')];
  const visiblePhotos=new Set(),titleAnimations=new Map();let frame=0;
  const entranceObserver=new IntersectionObserver(entries=>{
    for(const entry of entries)entry.target.classList.toggle('is-in-view',entry.isIntersecting);
  },{threshold:0,rootMargin:'0px 0px -30px 0px'});
  const photoObserver=new IntersectionObserver(entries=>{
    for(const entry of entries){if(entry.isIntersecting)visiblePhotos.add(entry.target);else visiblePhotos.delete(entry.target);}
    schedule();
  },{rootMargin:'60px'});
  const titleObserver=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(entry.intersectionRatio>=.35&&!entry.target.classList.contains('title-entered')){
        entry.target.classList.add('title-entered');revealTitle(entry.target,520,140);
      }else if(!entry.isIntersecting){entry.target.classList.remove('title-entered');restoreTitle(entry.target);}
    }
  },{threshold:[0,.35],rootMargin:'0px'});
  function restoreTitle(title){
    const animation=titleAnimations.get(title);if(!animation)return;
    cancelAnimationFrame(animation.frame);clearTimeout(animation.timer);
    for(const {node,original} of animation.nodes)node.textContent=original;
    titleAnimations.delete(title);
  }
  function revealTitle(title,duration=520,delay=0){
    if(motion.matches||document.hidden)return;restoreTitle(title);
    const active=title.querySelector(':scope>[data-lang].show,:scope>.il.show')||title;
    const walker=document.createTreeWalker(active,NodeFilter.SHOW_TEXT),nodes=[];let node;
    while((node=walker.nextNode()))if(node.textContent.trim())nodes.push({node,original:node.textContent});
    if(!nodes.length)return;
    const animation={nodes,frame:0,timer:0,start:undefined};titleAnimations.set(title,animation);
    const pool='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    function step(time){
      if(motion.matches||document.hidden){restoreTitle(title);return;}
      animation.start??=time;const progress=Math.min(1,(time-animation.start)/duration);
      for(const {node,original} of nodes){
        const chars=Array.from(original);node.textContent=chars.map((char,index)=>{
          if(!/[\p{L}]/u.test(char)||progress>=index/chars.length)return char;
          return pool[Math.floor(Math.random()*pool.length)];
        }).join('');
      }
      if(progress<1)animation.frame=requestAnimationFrame(step);else restoreTitle(title);
    }
    animation.timer=setTimeout(()=>{animation.frame=requestAnimationFrame(step);},delay);
  }
  function paint(){
    frame=0;if(motion.matches||document.hidden)return;
    for(const photo of visiblePhotos){const r=photo.getBoundingClientRect();const drift=Math.max(-18,Math.min(18,(innerHeight/2-r.top-r.height/2)*.045));photo.style.setProperty('--scroll-drift',drift.toFixed(2)+'px');}
  }
  function schedule(){if(!frame&&!motion.matches&&!document.hidden)frame=requestAnimationFrame(paint);}
  function apply(){
    entranceObserver.disconnect();photoObserver.disconnect();titleObserver.disconnect();visiblePhotos.clear();
    for(const el of entrances){el.classList.toggle('motion-ready',!motion.matches);if(motion.matches)el.classList.add('is-in-view');else entranceObserver.observe(el);}
    for(const photo of photos){photo.style.removeProperty('--scroll-drift');if(!motion.matches)photoObserver.observe(photo);}
    for(const title of titles){restoreTitle(title);title.classList.remove('title-entered');if(!motion.matches)titleObserver.observe(title);}
    schedule();
  }
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)titles.forEach(restoreTitle);else schedule();});
  document.addEventListener('jiake:languagechange',()=>{titles.forEach(restoreTitle);schedule();});
  for(const title of titles)title.addEventListener('mouseenter',()=>{if(matchMedia('(hover:hover) and (pointer:fine)').matches)revealTitle(title,480);});
  motion.addEventListener('change',apply);apply();
})();
