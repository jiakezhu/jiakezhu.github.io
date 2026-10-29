import * as T from './vendor/three.module.min.js';

// Device interfaces retain the source Ramen-Shop screens; only personal content is replaced.
export async function createStoryTerminals({renderer,camera,canvas,objects,materials,sourceTextures,onExit,onRead,onEffect,reduced}) {
  const projects=await fetch(new URL('./story-projects.json',import.meta.url)).then(r=>r.json());
  const images=await Promise.all(projects.map(project=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=new URL(project.image,document.baseURI).href;})));
  const lang=()=>['zh','en','fr','es'].includes(document.documentElement.lang)?document.documentElement.lang:'en';
  const labels={zh:{back:'返回',menu:'返回作品',open:'进入作品',choose:'选一瓶，开始探索',about:'关于我',skills:'语言与工具',experience:'我的经历',read:'阅读成长漫画',essays:'小朱还在想'},en:{back:'Go Back',menu:'Go Back',open:'Open Project',choose:'Choose a bottle to get started …',about:'About',skills:'Skills',experience:'Experience',read:'Read my illustrated story',essays:'WeChat essays'},fr:{back:'Retour',menu:'Retour',open:'Ouvrir',choose:'Choisissez une bouteille …',about:'À propos',skills:'Compétences',experience:'Parcours',read:'Lire mon récit illustré',essays:'Essais WeChat'},es:{back:'Volver',menu:'Volver',open:'Abrir',choose:'Elige una botella …',about:'Sobre mí',skills:'Habilidades',experience:'Trayectoria',read:'Leer mi historia ilustrada',essays:'Ensayos WeChat'}};
  const profile={
    zh:{about:['你好，我是朱佳科。','我在腾讯云担任技术—产品—商务管培生，关注传媒 AIGC 和 AI Native 客户。此前在字节跳动参与 AI 人才招募，也做过法语外贸、中法文化交流和中芬项目。\n\n本科读法语与跨境电商，硕士读国际商务，也在巴黎一大交流学习国际法。现在把语言、商业和技术连在一起，构建销售、语言学习与效率工具。Always Day One.'],skills:['语言，也是工具。','中文是母语。英语 IELTS 7.5，法语 DALF C1，西班牙语 A2–B1。\n\n我用 AI 构建销售、语言学习、教育和效率工具。贩卖机里收集了 Sales Buddy、LingoVibe、Jiake Orbit，以及我制作的几个 Agent。'],experience:['走过不同的行业。','腾讯云 · 技术 / 产品 / 商务方向\n字节跳动 / TikTok · 全球人才招募\n成都法盟 · 中法文化交流\nMarket Union · 法语外贸\nMingle Advisors · 中芬项目\n\n宁波 → 杭州 → 成都 → 巴黎，故事还在继续。']},
    en:{about:["Hi, I’m Jiake.",'I am a Technology–Product–Business Trainee at Tencent Cloud, focusing on media AIGC and AI Native teams. Previously, I recruited AI talent at ByteDance and worked in French-speaking trade, Sino-French cultural exchange and Sino-Finnish projects.\n\nI studied French and Cross-border E-commerce, then International Business, and spent an exchange year studying International Law at Paris 1. Today I connect languages, business and technology by building AI tools. Always Day One.'],skills:['Languages & tools.','Chinese · Native\nEnglish · IELTS 7.5\nFrench · DALF C1\nSpanish · A2–B1\n\nI build AI tools for sales, language learning, education and daily life. Explore six of them in the vending machine.'],experience:['Across industries.','Tencent Cloud · Technology / Product / Business\nByteDance / TikTok · Global Talent Acquisition\nAlliance Française · Cultural exchange\nMarket Union · French-speaking export sales\nMingle Advisors · Sino-Finnish projects\n\nNingbo → Hangzhou → Chengdu → Paris.']},
    fr:{about:['Bonjour, moi c’est Jiake.','Je travaille entre technologie, produit et développement commercial chez Tencent Cloud, autour de l’AIGC et des équipes AI Native. Mon parcours passe aussi par le recrutement de talents IA chez ByteDance, le commerce francophone et les échanges sino-français et sino-finlandais.\n\nJ’ai étudié le français, le commerce électronique transfrontalier et le commerce international, puis le droit international en échange à Paris 1. Aujourd’hui, je relie langues, business et technologie pour créer des outils IA. Always Day One.'],skills:['Langues & outils.','Chinois · Langue maternelle\nAnglais · IELTS 7.5\nFrançais · DALF C1\nEspagnol · A2–B1\n\nJe crée des outils IA pour la vente, l’apprentissage des langues, l’éducation et la vie quotidienne. Six projets sont dans le distributeur.'],experience:['Un parcours pluriel.','Tencent Cloud · Technologie / Produit / Business\nByteDance / TikTok · Recrutement international\nAlliance Française · Échanges culturels\nMarket Union · Commerce francophone\nMingle Advisors · Projets sino-finlandais\n\nNingbo → Hangzhou → Chengdu → Paris.']},
    es:{about:['Hola, soy Jiake.','Trabajo entre tecnología, producto y negocio en Tencent Cloud, con atención al AIGC y a los equipos AI Native. Antes participé en la contratación de talento de IA en ByteDance y trabajé en comercio francófono e intercambios sino-franceses y sino-finlandeses.\n\nEstudié francés, comercio electrónico transfronterizo y negocios internacionales, además de Derecho Internacional en un intercambio en París 1. Hoy conecto idiomas, negocio y tecnología para crear herramientas de IA. Always Day One.'],skills:['Idiomas y herramientas.','Chino · Lengua materna\nInglés · IELTS 7.5\nFrancés · DALF C1\nEspañol · A2–B1\n\nCreo herramientas de IA para ventas, idiomas, educación y vida cotidiana. Seis proyectos están en la máquina expendedora.'],experience:['Entre industrias.','Tencent Cloud · Tecnología / Producto / Negocio\nByteDance / TikTok · Talento internacional\nAlliance Française · Intercambio cultural\nMarket Union · Comercio francófono\nMingle Advisors · Proyectos sino-finlandeses\n\nNingbo → Hangzhou → Chengdu → París.']}
  };
  const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  function decodeScreen(texture,w,h,map) {
    const target=new T.WebGLRenderTarget(w,h);target.texture.colorSpace=T.SRGBColorSpace;
    const geometry=new T.PlaneGeometry(2,2),uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++){const result=map(uv.getX(i),1-uv.getY(i));uv.setXY(i,...result);}
    const scene=new T.Scene(),mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({map:texture}));scene.add(mesh);
    const view=new T.OrthographicCamera(-1,1,1,-1,0,2);view.position.z=1;
    const previous=renderer.getRenderTarget();renderer.setRenderTarget(target);renderer.render(scene,view);const pixels=new Uint8Array(w*h*4);renderer.readRenderTargetPixels(target,0,0,w,h,pixels);renderer.setRenderTarget(previous);
    const output=makeCanvas(w,h),ctx=output.getContext('2d'),data=ctx.createImageData(w,h);for(let y=0;y<h;y++)data.data.set(pixels.subarray((h-y-1)*w*4,(h-y)*w*4),y*w*4);ctx.putImageData(data,0,0);
    geometry.dispose();mesh.material.dispose();target.dispose();return output;
  }
  const menuBase=decodeScreen(sourceTextures[0],1024,1200,(u,v)=>[u*.854,v]);
  const detailBase=decodeScreen(sourceTextures[1],1024,1200,(u,v)=>[u*.854,v]);
  const aboutBase=decodeScreen(sourceTextures[2],1536,945,(u,v)=>[(1-v)*.616,u]);
  const overlay=document.createElement('div');overlay.className='world-terminal-overlay';overlay.hidden=true;overlay.setAttribute('aria-label','Interactive device');document.querySelector('.world-stage').append(overlay);
  let device=null,page=null,buttons=[],transitions=[],selected=0,contentDirty=false;
  const textureCache=new Map(),savedImages={};
  for(const name of ['vendingMachineScreen','bigScreen','arcadeScreen'])savedImages[name]=materials[name].uniforms.imageA.value;
  const font=(ctx,size,weight=400)=>{ctx.font=`${weight} ${size}px Nunito,"Jiake Rounded","PingFang SC",sans-serif`;};
  function wrapped(ctx,text,x,y,width,lineHeight,maxLines=30,paint=true) {
    const segments=String(text).split('\n'),lines=[];
    for(const paragraph of segments){if(!paragraph){lines.push('');continue;}const parts=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(lang(),{granularity:'word'}).segment(paragraph)].map(part=>part.segment):(paragraph.match(/[A-Za-z0-9]+|\s+|./gu)||[]);let line='';for(const part of parts){if(line&&ctx.measureText(line+part).width>width){lines.push(line.trimEnd());line=part.trimStart();}else line+=part;}if(line)lines.push(line);}
    if(!paint)return lines.length;
    const visible=lines.slice(0,maxLines);if(lines.length>maxLines)visible[visible.length-1]=visible.at(-1).replace(/.{0,3}$/,'…');visible.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));return visible.length;
  }
  function sampleFill(ctx,base,x,y,w,h,sx,sy) {const pixel=base.getContext('2d').getImageData(Math.floor(sx*base.width),Math.floor(sy*base.height),1,1).data;ctx.fillStyle=`rgb(${pixel[0]} ${pixel[1]} ${pixel[2]})`;ctx.fillRect(x*base.width,y*base.height,w*base.width,h*base.height);}
  const cardRects=projects.map((project,i)=>({project,rect:[.07+(i%4)*.22,.075+Math.floor(i/4)*.365,.20,.31]}));
  const indexHeight=project=>projects.indexOf(project)<4?.090:.074;
  function menuCanvas() {
    const c=makeCanvas(1024,1200),ctx=c.getContext('2d');ctx.drawImage(menuBase,0,0);
    for(const {project,rect:[x,y,w]} of cardRects){sampleFill(ctx,menuBase,x+.012,y+.216,w-.024,indexHeight(project),x+.016,y+.213);ctx.fillStyle='#153a2b';font(ctx,22,700);wrapped(ctx,project.title,(x+.018)*1024,(y+.238)*1200,(w-.035)*1024,24,4);}
    return c;
  }
  const ownMenu=menuCanvas();
  function detailCanvas(index) {
    const project=projects[index],c=makeCanvas(1024,1200),ctx=c.getContext('2d');ctx.drawImage(detailBase,0,0);
    const r=cardRects[index].rect;ctx.drawImage(ownMenu,r[0]*1024,r[1]*1200,r[2]*1024,r[3]*1200,.07*1024,.075*1200,.20*1024,.31*1200);
    ctx.fillStyle='#10272a';ctx.fillRect(332,116,575,317);const image=images[index];if(image){const ratio=Math.min(575/image.width,317/image.height),w=image.width*ratio,h=image.height*ratio;ctx.drawImage(image,332+(575-w)/2,116+(317-h)/2,w,h);}
    sampleFill(ctx,detailBase,.112,.465,.77,.252,.115,.45);ctx.fillStyle='#183b30';font(ctx,32,700);ctx.fillText(project.title,123,593,770);font(ctx,25);wrapped(ctx,project.description[lang()]||project.description.en,123,644,760,31,8);
    sampleFill(ctx,detailBase,.55,.803,.325,.091,.56,.802);ctx.fillStyle='#fff';font(ctx,31,700);ctx.fillText(labels[lang()].open,565,1005,320);font(ctx,23);ctx.fillText(project.action?'Read the collection':'Open link',565,1040,320);
    return c;
  }
  function aboutCanvas(tab='about') {
    const c=makeCanvas(1536,945),ctx=c.getContext('2d');ctx.drawImage(aboutBase,0,0);
    ctx.fillStyle='#101010';ctx.fillRect(194,168,1110,100);ctx.fillRect(200,316,1095,365);ctx.fillRect(215,847,565,80);
    const content=profile[lang()][tab];ctx.fillStyle='#fff';font(ctx,61,800);ctx.fillText(content[0],210,231,1060);
    let bodySize=35,leading=43,lineLimit=8;
    for(;bodySize>=25;bodySize--){font(ctx,bodySize);leading=Math.ceil(bodySize*1.19);lineLimit=Math.floor(313/leading)+1;if(wrapped(ctx,content[1],215,362,1050,leading,100,false)<=lineLimit)break;}
    font(ctx,bodySize);wrapped(ctx,content[1],215,362,1050,leading,lineLimit);
    const socials=['X','in','GH','微','@'];font(ctx,38,700);socials.forEach((text,i)=>ctx.fillText(text,245+i*72,887));
    if(tab==='experience'){ctx.fillStyle='#91ece8';font(ctx,28,600);ctx.fillText(labels[lang()].read+' ↗',215,788,1000);}
    return c;
  }
  function essayCanvas(index=null) {
    const c=makeCanvas(1024,900),ctx=c.getContext('2d');ctx.fillStyle='#111e68';ctx.fillRect(0,0,1024,900);ctx.strokeStyle='#354996';for(let y=0;y<900;y+=45){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y);ctx.stroke();}for(let x=0;x<1024;x+=45){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,900);ctx.stroke();}
    ctx.fillStyle='#8dffef';font(ctx,60,800);ctx.fillText(labels[lang()].essays,70,135,880);ctx.fillStyle='#edf7ff';font(ctx,31);ctx.fillText('Start small and cast wide',70,195);
    const essays=[...document.querySelectorAll('.wechat-article-card')];essays.forEach((card,i)=>{ctx.fillStyle=index===i?'#30449a':'#182d7c';ctx.fillRect(65,250+i*220,890,175);ctx.fillStyle='#fff';font(ctx,33,700);wrapped(ctx,card.querySelector('h3')?.textContent||card.textContent.trim(),92,312+i*220,825,43,3);});
    ctx.fillStyle='#93f8dd';font(ctx,35,700);ctx.fillText('← '+labels[lang()].back,75,825);return c;
  }
  function texture(key,draw){if(!textureCache.has(key)){const tx=new T.CanvasTexture(draw());tx.flipY=false;tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=8;textureCache.set(key,tx);}return textureCache.get(key);}
  function display(name,key,draw) {contentDirty=true;const material=materials[name],next=texture(lang()+key,draw);transitions=transitions.filter(t=>t.material!==material);if(reduced.matches){material.uniforms.imageA.value=next;material.uniforms.imageB.value=next;material.uniforms.progress.value=0;}else{material.uniforms.imageB.value=next;material.uniforms.progress.value=0;transitions.push({material,start:performance.now()});}}
  function setButtons(items,description='') {
    buttons=items;overlay.replaceChildren();if(description){const text=document.createElement('p');text.className='world-device-transcript';text.textContent=description;overlay.append(text);}
    for(const item of items){const el=document.createElement(item.href?'a':'button');if(item.href){el.href=item.href;el.target='_blank';el.rel='noopener';}else el.type='button';el.className='world-device-hit';el.setAttribute('aria-label',item.label);el.textContent=item.label;el.dataset.terminalAction=item.action||item.label;if(item.project)el.dataset.projectId=item.project;
      Object.assign(el.style,{left:item.rect[0]*100+'%',top:item.rect[1]*100+'%',width:item.rect[2]*100+'%',height:item.rect[3]*100+'%'});
      el.addEventListener('pointerenter',()=>onEffect?.('click'));el.addEventListener('click',event=>{if(!item.href)event.preventDefault();onEffect?.('bloop');item.run?.();});overlay.append(el);}
  }
  const backRect=[.09,.79,.37,.165],enterRect=[.525,.79,.375,.165];
  const localizedHref=href=>{const url=new URL(href,document.baseURI);if(url.origin===location.origin&&/\/story\/comic\//.test(url.pathname))url.searchParams.set('lang',lang());return url.href;};
  // The physical screen stays intact; a text view makes the same profile readable on a phone.
  const profileReaderCopy={
    zh:{read:'阅读简介',close:'返回小店屏幕',name:'朱佳科'},
    en:{read:'Read profile',close:'Back to the screen',name:'Jiake Zhu'},
    fr:{read:'Lire le profil',close:'Retour à l’écran',name:'Jiake Zhu'},
    es:{read:'Leer perfil',close:'Volver a la pantalla',name:'Jiake Zhu'}
  };
  const profileOpen=document.createElement('button');profileOpen.type='button';profileOpen.className='world-profile-open';profileOpen.hidden=true;
  profileOpen.setAttribute('aria-haspopup','dialog');profileOpen.setAttribute('aria-controls','world-profile-reader');document.body.append(profileOpen);
  const profileReader=document.createElement('dialog');profileReader.id='world-profile-reader';profileReader.className='world-profile-reader';profileReader.setAttribute('aria-labelledby','world-profile-title');
  const profileHeader=document.createElement('header'),profileName=document.createElement('p'),profileClose=document.createElement('button');profileClose.type='button';profileClose.textContent='×';
  profileHeader.append(profileName,profileClose);
  const profileTabs=document.createElement('nav');profileTabs.className='world-profile-tabs';
  const profileTitle=document.createElement('h2');profileTitle.id='world-profile-title';
  const profileBody=document.createElement('div');profileBody.className='world-profile-body';
  const profileComic=document.createElement('a');profileComic.className='world-profile-comic';
  profileReader.append(profileHeader,profileTabs,profileTitle,profileBody,profileComic);document.body.append(profileReader);
  const readableTabs=['about','skills','experience'].map(id=>{
    const button=document.createElement('button');button.type='button';button.addEventListener('click',()=>{onEffect?.('bloop');about(id);});profileTabs.append(button);return {id,button};
  });
  function readableProfile(tab){
    const text=profile[lang()][tab],copy=profileReaderCopy[lang()];profileOpen.textContent=copy.read;profileName.textContent=copy.name+' / '+labels[lang()].about;
    profileClose.setAttribute('aria-label',copy.close);profileTabs.setAttribute('aria-label',labels[lang()].about);
    readableTabs.forEach(({id,button})=>{button.textContent=labels[lang()][id];button.setAttribute('aria-pressed',String(id===tab));});
    profileTitle.textContent=text[0];profileBody.replaceChildren(...text[1].split('\n\n').map(part=>{const p=document.createElement('p');p.textContent=part;return p;}));
    profileComic.hidden=tab!=='experience';profileComic.textContent=labels[lang()].read+' ↗';profileComic.href=localizedHref('./comic/index.html');
  }
  profileOpen.addEventListener('click',()=>{onEffect?.('bloop');profileReader.showModal();});
  profileClose.addEventListener('click',()=>profileReader.close());
  profileReader.addEventListener('click',event=>{if(event.target===profileReader){const r=profileReader.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)profileReader.close();}});
  profileReader.addEventListener('close',()=>{if(!profileOpen.hidden)profileOpen.focus({preventScroll:true});});
  function vending(index=null) {
    device='journal';page=index===null?'menu':'detail';selected=index??0;document.body.dataset.terminal=index===null?'vending-menu':'vending-'+projects[index].id;
    if(index===null){display('vendingMachineScreen','vending-menu',()=>ownMenu);setButtons([...cardRects.map(({project,rect},i)=>({rect,label:project.title,project:project.id,action:'project-'+project.id,run:()=>vending(i)})),{rect:backRect,label:labels[lang()].back,action:'back',run:()=>onExit?.()}]);}
    else {const project=projects[index];display('vendingMachineScreen','vending-'+index,()=>detailCanvas(index));setButtons([{rect:backRect,label:labels[lang()].menu,action:'back',run:()=>vending()},{rect:enterRect,label:labels[lang()].open+' · '+project.title,action:'enter',...(project.href?{href:localizedHref(project.href)}:{run:()=>onRead?.('journal')})}],project.title+' — '+(project.description[lang()]||project.description.en));}
  }
  function about(tab='about') {
    device='growth';page=tab;document.body.dataset.terminal='about-'+tab;display('bigScreen','about-'+tab,()=>aboutCanvas(tab));
    profileOpen.hidden=false;readableProfile(tab);
    const items=[{rect:[.025,.02,.23,.09],label:labels[lang()].back,action:'back',run:()=>onExit?.()},...['about','skills','experience'].map((id,i)=>({rect:[.92,.09+i*.25,.07,.23],label:labels[lang()][id],action:id,run:()=>about(id)}))];
    const socialLinks=['https://x.com/jkzhusolo','https://www.linkedin.com/in/Jack-zhujiake-career/','https://github.com/jiakezhu',null,'mailto:zjksolo@foxmail.com'];
    socialLinks.forEach((href,i)=>items.push({rect:[.15+i*.047,.88,.04,.075],label:['X','LinkedIn','GitHub',labels[lang()].essays,'Email'][i],action:'social-'+i,...(href?{href}:{run:()=>onRead?.('wechat')})}));
    if(tab==='experience')items.push({rect:[.13,.78,.69,.085],label:labels[lang()].read,action:'comic',href:localizedHref('./comic/index.html')});setButtons(items,profile[lang()][tab].join(' '));
  }
  function essays() {
    device='wechat';page='essays';document.body.dataset.terminal='essays';display('arcadeScreen','essays',()=>essayCanvas());
    const cards=[...document.querySelectorAll('.wechat-article-card')];setButtons([...cards.map((card,i)=>({rect:[.06,(250+i*220)/900,.88,175/900],label:card.querySelector('h3')?.textContent||'WeChat essay',action:'essay-'+i,href:card.href})),{rect:[.05,.84,.5,.13],label:labels[lang()].back,action:'back',run:()=>onExit?.()}]);
  }
  function open(id) {if(id!=='growth'){profileOpen.hidden=true;if(profileReader.open)profileReader.close();}overlay.hidden=!id;document.body.classList.toggle('world-terminal-open',Boolean(id));if(id==='journal')vending();else if(id==='growth')about();else if(id==='wechat')essays();else{device=null;page=null;document.body.removeAttribute('data-terminal');for(const [name,image] of Object.entries(savedImages)){materials[name].uniforms.imageA.value=image;materials[name].uniforms.imageB.value=image;materials[name].uniforms.progress.value=0;}transitions=[];}}
  function point(u,v) {
    const mesh=objects[device==='journal'?'vendingMachineScreen':device==='growth'?'bigScreen':'arcadeScreen'];const b=mesh.geometry.boundingBox;
    const local=device==='journal'?new T.Vector3(T.MathUtils.lerp(b.min.x,b.max.x,u),T.MathUtils.lerp(b.max.y,b.min.y,v),b.max.z):new T.Vector3(T.MathUtils.lerp(b.min.x,b.max.x,u),b.max.y,T.MathUtils.lerp(b.min.z,b.max.z,v));
    local.applyMatrix4(mesh.matrixWorld).project(camera);return {x:(local.x+1)*canvas.clientWidth/2,y:(1-local.y)*canvas.clientHeight/2};
  }
  function tick(now,moving) {
    const changed=contentDirty||transitions.length>0;contentDirty=false;
    for(const item of transitions){const k=Math.min(1,(now-item.start)/220);item.material.uniforms.progress.value=k;if(k===1){item.material.uniforms.imageA.value=item.material.uniforms.imageB.value;item.material.uniforms.progress.value=0;}}
    transitions=transitions.filter(item=>now-item.start<220);
    if(!device)return changed;overlay.inert=moving;overlay.style.visibility=moving?'hidden':'visible';const corners=[point(0,0),point(1,0),point(0,1),point(1,1)],left=Math.min(...corners.map(p=>p.x)),top=Math.min(...corners.map(p=>p.y)),right=Math.max(...corners.map(p=>p.x)),bottom=Math.max(...corners.map(p=>p.y));
    Object.assign(overlay.style,{left:left+'px',top:top+'px',width:right-left+'px',height:bottom-top+'px'});return changed;
  }
  return {open,tick,back(){if(device==='journal'&&page==='detail'){onEffect?.('bloop');vending();return true;}return false;},refresh(){if(device==='journal')vending(page==='detail'?selected:null);else if(device==='growth')about(page);else if(device==='wechat')essays();}};
}
