(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const words = {
    zh:{all:'全部作品',products:'AI 产品',agents:'Agent & 自动化',more:'展开介绍 ↓',less:'收起介绍 ↑',accounts:'已推进客户',award:'腾讯 Hackathon · 营销拓客赛道第一名'},
    en:{all:'All work',products:'AI products',agents:'Agents & automation',more:'Read more ↓',less:'Show less ↑',accounts:'Accounts progressed',award:'Tencent Hackathon · 1st in Marketing & Acquisition'},
    fr:{all:'Tous les projets',products:'Produits IA',agents:'Agents & automatisations',more:'En savoir plus ↓',less:'Réduire ↑',accounts:'Comptes accompagnés',award:'Tencent Hackathon · 1er en marketing & acquisition'},
    es:{all:'Todos',products:'Productos IA',agents:'Agentes y automatización',more:'Leer más ↓',less:'Leer menos ↑',accounts:'Clientes impulsados',award:'Tencent Hackathon · 1.º en marketing y captación'}
  };
  const progress = document.createElement('div');
  progress.className = 'scroll-progress'; progress.setAttribute('aria-hidden','true'); document.body.prepend(progress);
  const topLink = document.createElement('a');
  topLink.href='#hero';topLink.className='back-to-top';topLink.textContent='↑';topLink.setAttribute('aria-label','返回顶部 / Back to top');document.body.append(topLink);
  let scrollFrame = 0;
  function updateScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1,scrollY/max) : 0})`;
    topLink.classList.toggle('is-visible',scrollY>600);
    scrollFrame=0;
  }
  window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);},{passive:true});
  window.addEventListener('resize',updateScroll);updateScroll();

  // Filter and expand portfolio cards while keeping all original descriptions.
  const container=document.querySelector('.proj-rows');
  const rows=[...container.querySelectorAll('.proj-row')];
  const headers=[...container.querySelectorAll('.proj-group-head')];
  let group='products';
  [...container.children].forEach(el=>{
    if(el.classList.contains('proj-group-head'))group=headers.indexOf(el)===0?'products':'agents';
    el.dataset.group=group;
  });
  const controls=document.createElement('div');controls.className='project-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','作品分类 / Project categories');
  ['all','products','agents'].forEach(value=>{
    const button=document.createElement('button');button.type='button';button.className='project-filter';button.dataset.projectFilter=value;button.setAttribute('aria-pressed',String(value==='all'));
    button.addEventListener('click',()=>{
      controls.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      [...container.children].forEach(el=>{
        el.hidden=value!=='all'&&el.dataset.group!==value;
        el.classList.remove('filter-enter');
        if(!el.hidden){el.classList.add('visible');requestAnimationFrame(()=>el.classList.add('filter-enter'));}
      });
      updateScroll();
    });controls.append(button);
  });
  container.before(controls);
  rows.forEach((row,index)=>{
    const description=row.querySelector('.proj-desc');
    description.id=`project-description-${index}`;
    const button=document.createElement('button');button.type='button';button.className='project-expand';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',description.id);
    description.after(button);
    button.addEventListener('click',()=>{const expanded=row.classList.toggle('is-expanded');button.setAttribute('aria-expanded',String(expanded));translate();updateScroll();});
  });
  rows[0].classList.add('is-featured');
  const proof=document.createElement('div');proof.className='project-proof';proof.innerHTML='<strong>40+</strong><p data-ui="accounts"></p><small data-ui="award"></small>';rows[0].append(proof);
  function translate() {
    const text=words[document.documentElement.lang]||words.en;
    controls.querySelectorAll('button').forEach(b=>b.textContent=text[b.dataset.projectFilter]);
    rows.forEach(row=>row.querySelector('.project-expand').textContent=text[row.classList.contains('is-expanded')?'less':'more']);
    document.querySelectorAll('[data-ui]').forEach(el=>el.textContent=text[el.dataset.ui]);
    rows.forEach(row=>{
      const name=row.querySelector('.proj-name');
      if(name.querySelector('.proj-name-note'))return;
      const parts=name.textContent.split(' · ');
      if(parts.length<2)return;
      const main=document.createElement('span');main.textContent=parts[0];
      const note=document.createElement('small');note.className='proj-name-note';note.textContent=parts.slice(1).join(' · ');
      name.replaceChildren(main,note);
    });
  }
  new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});translate();

  // Brief tactile feedback on buttons; pointer effects are desktop-only.
  document.querySelectorAll('.btn-primary,.proj-btn,.project-filter,.journal-filter').forEach(el=>{
    el.addEventListener('pointerdown',e=>{
      if(motion.matches)return;
      const rect=el.getBoundingClientRect(),size=Math.max(rect.width,rect.height)*2;
      const wave=document.createElement('span');wave.className='tap-wave';wave.style.cssText=`width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
      el.append(wave);wave.addEventListener('animationend',()=>wave.remove(),{once:true});
    });
  });
  document.querySelectorAll('.btn-primary,.proj-btn').forEach(button=>{
    button.addEventListener('pointermove',e=>{if(motion.matches||!finePointer.matches)return;const r=button.getBoundingClientRect();button.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.08}px,${(e.clientY-r.top-r.height/2)*.08}px)`;});
    button.addEventListener('pointerleave',()=>button.style.transform='');
  });
  const counterObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)return;counterObserver.unobserve(entry.target);
    const el=entry.target,final=Number(el.textContent.trim());if(motion.matches||!Number.isFinite(final))return;
    let start;
    function count(time){start??=time;const fraction=Math.min(1,(time-start)/900);el.textContent=Math.round(final*(1-Math.pow(1-fraction,3)));if(fraction<1&&!motion.matches)requestAnimationFrame(count);else el.textContent=final;}
    requestAnimationFrame(count);
  }),{threshold:.75});
  document.querySelectorAll('.stat-num').forEach(el=>counterObserver.observe(el));

  // Accessible existing life panels: keyboard opening and focus containment.
  document.querySelectorAll('.life-card[onclick]').forEach(card=>{
    card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-haspopup','dialog');
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();card.click();}});
  });
  document.querySelectorAll('.life-modal').forEach(panel=>{panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',panel.querySelector('.modal-title')?.textContent.trim()||'详情 / Details');});
  document.addEventListener('keydown',e=>{
    const panel=document.querySelector('.life-modal.open');if(!panel||e.key!=='Tab')return;
    const items=[...panel.querySelectorAll('button,a[href],input,textarea,[tabindex="0"]')].filter(el=>el.getClientRects().length);
    const first=items[0],last=items[items.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  });

  // Lightweight ambient constellation, paused offscreen and in background tabs.
  const hero=document.getElementById('hero'),canvas=document.getElementById('hero-canvas');
  const ctx=canvas.getContext('2d');if(!ctx)return;
  let width=0,height=0,points=[],animation=0,visible=true,lastTime=0;
  const pointer={x:-1000,y:-1000};
  function resize(){const r=hero.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);points=Array.from({length:width<700?18:35},()=>({x:Math.random()*width,y:Math.random()*height,vx:(Math.random()-.5)*.15,vy:(Math.random()-.5)*.15}));}
  function draw(time){animation=0;if(!visible||document.hidden||motion.matches)return;if(time-lastTime<32){animation=requestAnimationFrame(draw);return;}lastTime=time;ctx.clearRect(0,0,width,height);const color=getComputedStyle(hero).getPropertyValue('--gold').trim();
    points.forEach(p=>{p.x=(p.x+p.vx+width)%width;p.y=(p.y+p.vy+height)%height;ctx.globalAlpha=.22;ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,1.6,0,Math.PI*2);ctx.fill();const distance=Math.hypot(p.x-pointer.x,p.y-pointer.y);if(distance<160){ctx.globalAlpha=(1-distance/160)*.18;ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pointer.x,pointer.y);ctx.stroke();}});ctx.globalAlpha=1;animation=requestAnimationFrame(draw);
  }
  function restart(){cancelAnimationFrame(animation);animation=0;if(visible&&!document.hidden&&!motion.matches)animation=requestAnimationFrame(draw);else ctx.clearRect(0,0,width,height);}
  hero.addEventListener('pointermove',e=>{if(!finePointer.matches)return;const r=hero.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;});
  hero.addEventListener('pointerleave',()=>{pointer.x=pointer.y=-1000;});
  new ResizeObserver(()=>{resize();restart();}).observe(hero);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;restart();}).observe(hero);
  document.addEventListener('visibilitychange',restart);motion.addEventListener('change',restart);resize();restart();
})();
