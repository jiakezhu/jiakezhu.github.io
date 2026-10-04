/* Ambient, local-only motion. Nothing is required to navigate or read. */
(() => {
  const root=document.documentElement;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const copy={
    en:{earthLabel:'Earth / A personal atlas',earthTitle:'My world keeps getting wider.',earthQuote:'The limits of my language are the limits of my world.',welcome:'A private space station · An orbital library',horizon:'A world still opening.',identity:'Curiosity, in orbit',coordinates:'Three coordinates',open:'Open horizons',observatory:'Observatory',observatoryNote:'Places, routes & encounters',laboratory:'The laboratory',laboratoryNote:'Ideas made into useful things',library:'The orbital library',libraryNote:'Stories, essays & life in frames',portrait:'A face from the road',portraitMotto:'Still curious. Always moving.',libraryEyebrow:'The orbital library',next:'The voyage continues',nextTitle:'The next chapter is still unwritten.',compass:'Earth below. Possibility ahead.'},
    zh:{earthLabel:'地球 / 我的个人地图',earthTitle:'我的世界，正在一点点扩大。',earthQuote:'语言的边界，就是我世界的边界。',welcome:'私人空间站 · 星际图书馆',horizon:'世界，仍在向我展开。',identity:'让好奇心，持续在轨',coordinates:'三个探索坐标',open:'继续拓展边界',observatory:'航线观测区',observatoryNote:'城市、旅途与相遇',laboratory:'AI 实验舱',laboratoryNote:'把想法做成有用的东西',library:'星际图书馆',libraryNote:'故事、文章与成长漫画',portrait:'来自旅途中的一张照片',portraitMotto:'保持好奇，继续出发。',libraryEyebrow:'星际图书馆',next:'航行还在继续',nextTitle:'下一章，留给尚未抵达的世界。',compass:'脚下是地球，前方是可能。'},
    fr:{earthLabel:'La Terre / Mon atlas personnel',earthTitle:'Mon monde s’élargit encore.',earthQuote:'Les limites de ma langue sont les limites de mon monde.',welcome:'Une station privée · Une bibliothèque en orbite',horizon:'Un monde qui s’ouvre encore.',identity:'La curiosité en orbite',coordinates:'Trois coordonnées',open:'Élargir les horizons',observatory:'L’observatoire',observatoryNote:'Lieux, voyages et rencontres',laboratory:'Le laboratoire',laboratoryNote:'Des idées devenues utiles',library:'La bibliothèque orbitale',libraryNote:'Récits, essais et vie en images',portrait:'Un visage du voyage',portraitMotto:'Toujours curieux. Toujours en chemin.',libraryEyebrow:'La bibliothèque orbitale',next:'Le voyage continue',nextTitle:'Le prochain chapitre reste à écrire.',compass:'La Terre en dessous. Des possibles devant.'},
    es:{earthLabel:'La Tierra / Mi atlas personal',earthTitle:'Mi mundo sigue creciendo.',earthQuote:'Los límites de mi idioma son los límites de mi mundo.',welcome:'Una estación privada · Una biblioteca orbital',horizon:'Un mundo que sigue abriéndose.',identity:'La curiosidad en órbita',coordinates:'Tres coordenadas',open:'Ampliar los horizontes',observatory:'El observatorio',observatoryNote:'Lugares, viajes y encuentros',laboratory:'El laboratorio',laboratoryNote:'Ideas que se vuelven útiles',library:'La biblioteca orbital',libraryNote:'Historias, ensayos y vida en viñetas',portrait:'Un rostro del camino',portraitMotto:'Siempre curioso. Siempre en camino.',libraryEyebrow:'La biblioteca orbital',next:'El viaje continúa',nextTitle:'El próximo capítulo aún está por escribir.',compass:'La Tierra debajo. Posibilidades delante.'}
  };
  const mark='<svg class="station-brand" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="8"/><ellipse cx="16" cy="16" rx="15" ry="5" transform="rotate(-32 16 16)"/><path d="M16 5V1M16 31v-4"/><circle cx="27" cy="10" r="2"/></svg>';
  document.querySelectorAll('.nav-logo').forEach(logo=>logo.insertAdjacentHTML('afterbegin',mark));
  function localize() {
    const text=copy[root.lang]||copy.en;
    document.querySelectorAll('[data-station-copy]').forEach(el=>{if(text[el.dataset.stationCopy])el.textContent=text[el.dataset.stationCopy];});
  }
  localize();
  let previousLanguage=root.lang;
  document.addEventListener('jiake:languagechange',event=>{
    localize();
    if(event.detail?.measurement){previousLanguage=root.lang;return;}
    if(root.lang===previousLanguage)return;
    previousLanguage=root.lang;
    if(motion.matches||document.hidden||!document.querySelector('.station-vista'))return;
    document.querySelector('.station-language-signal')?.remove();
    const signal=document.createElement('div');signal.className='station-language-signal';signal.setAttribute('aria-hidden','true');document.body.append(signal);
    signal.addEventListener('animationend',()=>signal.remove(),{once:true});
  });
  // A bounded star field, rendered at 24 fps and stopped in background tabs.
  const canvas=document.createElement('canvas');canvas.className='station-stars';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
  const ctx=canvas.getContext('2d');
  let width=0,height=0,stars=[],frame=0,last=0,color='#b6d3ee',drift=0;
  function palette(){color=root.dataset.theme==='light'?'#365a78':'#bad5ed';}
  function resize(){
    width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);
    stars=Array.from({length:width<700?35:85},(_,i)=>({x:(Math.sin(i*127.1+4)*43758.5453)%1,y:(Math.sin(i*269.5+7)*23845.4321)%1,r:i%9===0?1.3:.7,phase:i*1.7})).map(s=>({...s,x:Math.abs(s.x)*width,y:Math.abs(s.y)*height}));
    draw(0,true);
  }
  function draw(time,once=false){
    if(!once)frame=0;if(!ctx)return;
    if(!once&&(document.hidden||motion.matches))return;
    if(!once&&time-last<42){frame=requestAnimationFrame(draw);return;}last=time;
    ctx.clearRect(0,0,width,height);ctx.fillStyle=color;
    for(const star of stars){ctx.globalAlpha=.22+.23*(1+Math.sin(time/3500+star.phase))/2;ctx.beginPath();ctx.arc(star.x,(star.y-drift+height)%height,star.r,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;if(!once)frame=requestAnimationFrame(draw);
  }
  function restart(){cancelAnimationFrame(frame);frame=0;draw(0,true);if(!motion.matches&&!document.hidden&&ctx)frame=requestAnimationFrame(draw);}
  window.addEventListener('resize',()=>{resize();restart();});
  document.addEventListener('visibilitychange',restart);
  motion.addEventListener('change',restart);
  new MutationObserver(()=>{palette();draw(0,true);restart();}).observe(root,{attributes:true,attributeFilter:['data-theme']});
  palette();resize();restart();
  const headings=[...document.querySelectorAll('.orbital-home .s-title')];
  const visible=new Set();let scrollFrame=0;
  const observer=new IntersectionObserver(entries=>{entries.forEach(e=>e.isIntersecting?visible.add(e.target):visible.delete(e.target));schedule();});
  headings.forEach(el=>observer.observe(el));
  function paint(){scrollFrame=0;drift=motion.matches?0:(scrollY*.035)%height;for(const title of visible){const r=title.getBoundingClientRect();title.style.setProperty('--station-heading-drift',motion.matches?'0px':`${Math.max(-12,Math.min(12,(innerHeight*.5-r.top)*.03))}px`);}if(motion.matches)draw(0,true);}
  function schedule(){if(!scrollFrame)scrollFrame=requestAnimationFrame(paint);}
  window.addEventListener('scroll',schedule,{passive:true});motion.addEventListener('change',schedule);schedule();
  const hero=document.getElementById('hero');
  if(hero){
    let pointerFrame=0,pointerX=0;
    hero.addEventListener('pointermove',event=>{
      if(!fine.matches||motion.matches)return;
      pointerX=(event.clientX/innerWidth-.5)*9;
      if(!pointerFrame)pointerFrame=requestAnimationFrame(()=>{hero.style.setProperty('--station-x',`${pointerX}px`);pointerFrame=0;});
    });
    hero.addEventListener('pointerleave',()=>{cancelAnimationFrame(pointerFrame);pointerFrame=0;hero.style.setProperty('--station-x','0px');});
    motion.addEventListener('change',()=>{if(motion.matches)hero.style.setProperty('--station-x','0px');});
  }
})();
