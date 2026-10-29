/* A quiet coding desk: original typing arms, a head-only greeting and eyelid-only blink. */
(() => {
  const scene=document.querySelector('.desk-scene'),wrap=scene?.closest('.hero-img-wrap');
  if(!scene||!wrap)return;
  const root=document.documentElement,$=selector=>scene.querySelector(selector);
  const stage=$('.dk-stage'),room=$('.dk-room'),props=$('.dk-personal-props'),cat=$('.dk-cat'),greeting=$('.dk-wave');
  const screen=$('.dk-screen'),code=$('.dk-code'),preview=$('.dk-preview-image');
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),rig=window.HeroDeskMotion?.create(scene);
  const keyLights=[...scene.querySelectorAll('.dk-key-light')],base='images/web/desk/';
  const toggle=wrap.querySelector('.hero-real-toggle'),photo=wrap.querySelector('.hero-photo');
  const COPY={
    en:{hello:'Hi there! 👋',scene:'Jiake writing code at his desk with a resting cat',next:'Next project preview',greet:'Say hello to Jiake',cat:'Let the cat blink',flower:'A little sunshine',photo:'Show the real photo',drawing:'Return to the illustration'},
    zh:{hello:'嗨，你好！👋',scene:'佳科在桌前写代码，小猫安静地趴在旁边',next:'切换项目预览',greet:'和佳科打个招呼',cat:'让小猫眨眨眼',flower:'一点阳光',photo:'看看真人照片',drawing:'回到桌面插画'},
    fr:{hello:'Coucou ! 👋',scene:'Jiake écrit du code avec son chat au repos',next:'Projet suivant',greet:'Dire bonjour à Jiake',cat:'Faire cligner les yeux du chat',flower:'Un peu de soleil',photo:'Voir la vraie photo',drawing:'Revenir à l’illustration'},
    es:{hello:'¡Hola! 👋',scene:'Jiake escribe código junto a su gato',next:'Siguiente proyecto',greet:'Saludar a Jiake',cat:'Hacer parpadear al gato',flower:'Un poco de sol',photo:'Ver la foto real',drawing:'Volver a la ilustración'}
  };
  const PROJECTS=[
  {
    "title": "Sales Buddy",
    "file": "next-actions.js",
    "src": "images/web/desk/portfolio-sales.webp",
    "w": 640,
    "h": 215,
    "note": "AI account workspace",
    "script": "const nextActions =\n  tasks.filter(task =>\n    task.status !== 'done'\n  );\n\nnextActions.forEach(\n  renderNextAction\n);"
  },
  {
    "title": "LingoVibe",
    "file": "languages.js",
    "src": "images/web/desk/portfolio-lingovibe.webp",
    "w": 640,
    "h": 310,
    "note": "English · French · Spanish",
    "script": "const languages = [\n  'en', 'fr', 'es'\n];\n\nconst word = {\n  text: 'bonjour',\n  language: 'fr'\n};"
  },
  {
    "title": "Jiake Orbit",
    "file": "habits.js",
    "src": "images/web/desk/portfolio-orbit.webp",
    "w": 640,
    "h": 300,
    "note": "Habits · focus · reflection",
    "script": "const completed =\n  habits.filter(habit =>\n    habit.doneToday\n  );\n\nconst progress =\n  completed.length /\n  Math.max(1, habits.length);"
  },
  {
    "title": "Feishu KB RAG",
    "file": "SKILL.md",
    "src": "images/web/4a98ccad9a72-160.webp",
    "w": 160,
    "h": 160,
    "note": "Knowledge retrieval",
    "steps": [
      "Search documents",
      "Read matched pages",
      "Answer with sources"
    ],
    "script": "# Feishu KB RAG\n\n1. Search documents\n2. Read matched pages\n3. Answer with sources\n\nlark-cli docs +search"
  },
  {
    "title": "Tutoring Prep Agent",
    "file": "lesson-plan.py",
    "src": "images/web/63878dfe7d00-160.webp",
    "w": 160,
    "h": 160,
    "note": "Lesson preparation",
    "steps": [
      "Student + materials",
      "Draft lesson plan",
      "Save + email draft"
    ],
    "script": "lesson = {\n  \"student\": student,\n  \"materials\": materials,\n  \"outputs\": [\n    \"lesson-plan.docx\",\n    \"follow-up-draft\"\n  ]\n}"
  },
  {
    "title": "Budget Travel Planner",
    "file": "trip-plan.py",
    "src": "images/web/9bb764f5d19a-160.webp",
    "w": 160,
    "h": 160,
    "note": "Student-budget routes",
    "steps": [
      "Transport + stay",
      "Weather + sights",
      "Route + itinerary"
    ],
    "script": "trip = {\n  \"days\": 2,\n  \"stay\": booked_hostel,\n  \"checks\": [\n    \"weather\",\n    \"opening_hours\"\n  ]\n}"
  }
];
  const cache=new Map();
  let activeTheme='night',themeTicket=0,projectIndex=0,typed=22,nextKey=0,holdUntil=0,selectedAt=performance.now();
  let timer=0,visible=true,hoverScreen=false,turned=false,turnTimer=0,blinkTimer=0,lightTimer=0,keyCount=0;
  let nextBlink=performance.now()+9000;
  const copy=()=>COPY[root.lang]||COPY.en;
  const project=()=>PROJECTS[projectIndex];
  function preload(src){
    if(!cache.has(src))cache.set(src,new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(src);image.onerror=()=>{cache.delete(src);resolve(null);};image.src=src;}));
    return cache.get(src);
  }
  async function syncTheme(){
    const own=++themeTicket,theme=root.dataset.theme==='light'?'day':'night';
    if(theme===activeTheme&&cat.getAttribute('src')&&greeting.getAttribute('src')&&props?.dataset.ready)return;
    const [background,eyes,head,personal]=await Promise.all([preload(base+theme+'.webp'),preload(base+'cat-'+theme+'.webp?v=2'),preload(base+'wave-'+theme+'.webp?v=2'),preload(base+'personal-'+theme+'.webp')]);
    if(own!==themeTicket||!background)return;
    await rig?.setSources({room:background,cat:eyes,wave:head});
    if(own!==themeTicket)return;
    room.src=background;if(props){props.hidden=!personal;if(personal){props.querySelectorAll('img').forEach(img=>img.src=personal);props.dataset.ready='true';}}if(eyes)cat.src=eyes;if(head)greeting.src=head;
    activeTheme=theme;scene.dataset.theme=theme;
    rig?.setState({theme,turned,blinking:scene.classList.contains('is-blinking')});
  }
  function labels(){
    const c=copy();scene.setAttribute('aria-label',c.scene);$('.dk-bubble').textContent=c.hello;
    $('.dk-wave-hit').setAttribute('aria-label',c.greet);$('.dk-cat-hit').setAttribute('aria-label',c.cat);$('.dk-flower-hit').setAttribute('aria-label',c.flower);
    screen.setAttribute('aria-label',c.next+' · '+project().title);
    toggle?.setAttribute('aria-label',wrap.classList.contains('is-real')?c.drawing:c.photo);
  }
  function paintCode(){
    const text=project().script.slice(0,typed),fragment=document.createDocumentFragment();
    const tokens=/("[^"\n]*"|'[^'\n]*')|\b(const|function|true|document)\b|(<\/?[a-z]+|>)/g;
    text.split('\n').forEach((line,index)=>{
      const row=document.createElement('span');row.className='dk-code-line';row.dataset.line=String(index+1);
      let end=0,match;tokens.lastIndex=0;
      while((match=tokens.exec(line))){row.append(document.createTextNode(line.slice(end,match.index)));const token=document.createElement('span');token.className=match[1]?'dk-token-string':match[2]?'dk-token-keyword':'dk-token-tag';token.textContent=match[0];row.append(token);end=tokens.lastIndex;}
      row.append(document.createTextNode(line.slice(end)||'\u200b'));fragment.append(row);
    });
    const caret=document.createElement('span');caret.className='dk-caret';fragment.lastChild?.append(caret);code.replaceChildren(fragment);
  }
  function showProject(){
    const p=project();$('.dk-tab').textContent=p.title;$('.dk-editor-file').textContent=p.file;$('.dk-preview-title').textContent=p.title;$('.dk-preview-note').textContent=p.note;
    $('.dk-project-count').textContent=String(projectIndex+1).padStart(2,'0')+' / '+String(PROJECTS.length).padStart(2,'0');
    const visual=$('.dk-preview-window'),flow=$('.dk-workflow');
    visual.classList.toggle('is-workflow',Boolean(p.steps));preview.hidden=Boolean(p.steps);flow.hidden=!p.steps;flow.replaceChildren();
    if(p.steps){
      const head=document.createElement('span');head.className='dk-workflow-head';const icon=new Image();icon.src=p.src;icon.alt='';icon.width=22;icon.height=22;head.append(icon,document.createTextNode('AGENT'));flow.append(head);
      p.steps.forEach((text,index)=>{const row=document.createElement('span');row.className='dk-workflow-step';const marker=document.createElement('i');marker.textContent=String(index+1);row.append(marker,document.createTextNode(text));flow.append(row);});
    }
    $('.dk-preview-label').textContent=p.steps?'WORKFLOW':'PREVIEW';
    preview.src=p.src;preview.width=p.w;preview.height=p.h;typed=motion.matches?p.script.length:22;holdUntil=0;nextKey=0;selectedAt=performance.now();paintCode();labels();
  }
  function nextProject(){projectIndex=(projectIndex+1)%PROJECTS.length;showProject();}
  function setTurned(on,ms=0){
    clearTimeout(turnTimer);turned=on;rig?.setState({turned:on});
    if(!on)scene.classList.remove('is-turned');
    else syncTheme().then(async()=>{try{await greeting.decode();}catch{}if(turned&&greeting.naturalWidth)scene.classList.add('is-turned');});
    if(on&&ms)turnTimer=setTimeout(()=>setTurned(false),ms);
  }
  function sayHello(){setTurned(true,1200);}
  async function blink(){
    await syncTheme();try{await cat.decode();}catch{}if(!cat.naturalWidth)return;
    clearTimeout(blinkTimer);scene.classList.add('is-blinking');rig?.setState({blinking:true});
    blinkTimer=setTimeout(()=>{scene.classList.remove('is-blinking');rig?.setState({blinking:false});},170);
  }
  function lightFlower(){
    clearTimeout(lightTimer);scene.classList.add('is-flower-lit');lightTimer=setTimeout(()=>scene.classList.remove('is-flower-lit'),900);
    document.dispatchEvent(new CustomEvent('verse:egg',{detail:{id:'sunflower'}}));
  }
  function tick(){
    const now=performance.now(),script=project().script,audio=document.querySelector('audio.music-native'),env=window.SUNFLOWER_ENVELOPE;
    const live=audio&&!audio.paused&&!audio.muted&&audio.volume>0&&audio.readyState>2;
    const beat=live?Math.max(0,audio.currentTime-(env?.offset||0))/(60/90):now/1000/(60/90);
    rig?.setState({beat,typing:!turned&&typed<script.length});
    if(!turned){
      if(typed<script.length&&now>=nextKey){
        typed++;paintCode();const key=rig?.press(now)??(keyCount++%4),light=keyLights[key];
        if(light){light.classList.remove('is-pressed');void light.getBoundingClientRect();light.classList.add('is-pressed');}
        nextKey=now+65+Math.random()*80+(script[typed-1]==='\n'?250:0);
      }else if(typed===script.length&&!holdUntil)holdUntil=now+5000;
      else if(holdUntil&&now>holdUntil&&now-selectedAt>18000&&!hoverScreen)nextProject();
    }
    if(now>nextBlink){blink();nextBlink=now+9000+Math.random()*6000;}
  }
  function wake(){
    clearInterval(timer);timer=0;const active=visible&&!document.hidden&&!motion.matches&&!wrap.classList.contains('is-real');
    scene.classList.toggle('is-active',active);rig?.setActive(active);if(active)timer=setInterval(tick,70);
  }
  function projectScreen(points){
    const [p0,p1,p2,p3]=points,dx1=p1[0]-p2[0],dx2=p3[0]-p2[0],dx3=p0[0]-p1[0]+p2[0]-p3[0],dy1=p1[1]-p2[1],dy2=p3[1]-p2[1],dy3=p0[1]-p1[1]+p2[1]-p3[1],den=dx1*dy2-dx2*dy1,g=(dx3*dy2-dx2*dy3)/den,h=(dx1*dy3-dx3*dy1)/den;
    return `matrix3d(${[(p1[0]-p0[0]+g*p1[0])/520,(p1[1]-p0[1]+g*p1[1])/520,0,g/520,(p3[0]-p0[0]+h*p3[0])/320,(p3[1]-p0[1]+h*p3[1])/320,0,h/320,0,0,1,0,p0[0],p0[1],0,1].join(',')})`;
  }
  screen.style.transform=projectScreen([[439,301],[879,274],[875,578],[439,544]]);
  new ResizeObserver(()=>stage.style.setProperty('--dk-scale',Math.max(scene.clientWidth,scene.clientHeight)/1024)).observe(scene);
  screen.addEventListener('click',nextProject);screen.addEventListener('pointerenter',()=>{hoverScreen=true;});screen.addEventListener('pointerleave',()=>{hoverScreen=false;});screen.addEventListener('focus',()=>{hoverScreen=true;});screen.addEventListener('blur',()=>{hoverScreen=false;});
  const hello=$('.dk-wave-hit');hello.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')sayHello();});hello.addEventListener('click',sayHello);hello.addEventListener('focus',()=>{if(hello.matches(':focus-visible'))sayHello();});
  $('.dk-cat-hit').addEventListener('click',blink);$('.dk-flower-hit').addEventListener('click',lightFlower);
  toggle?.addEventListener('click',()=>{
    if(photo?.dataset.src){photo.srcset=photo.dataset.srcset||'';photo.src=photo.dataset.src;delete photo.dataset.src;}
    const real=wrap.classList.toggle('is-real');toggle.setAttribute('aria-pressed',String(real));photo?.setAttribute('aria-hidden',String(!real));scene.inert=real;setTurned(false);labels();wake();
  });
  new MutationObserver(records=>{if(records.some(record=>record.attributeName==='data-theme'))syncTheme();labels();}).observe(root,{attributes:true,attributeFilter:['lang','data-theme']});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;wake();}).observe(scene);
  document.addEventListener('visibilitychange',wake);motion.addEventListener('change',()=>{clearTimeout(blinkTimer);scene.classList.remove('is-blinking');rig?.setState({blinking:false,typing:false});if(motion.matches){typed=project().script.length;paintCode();}wake();});
  showProject();syncTheme();wake();
})();
