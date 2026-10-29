(() => {
  const section=document.getElementById('journey');
  if(!section) return;
  const baseURL=new URL('.',document.currentScript.src);
  const container=document.getElementById('journey-atlas');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const visited=new Set(['CHN','FRA','CHE','DEU','BEL','NLD','ESP','ITA','VAT','CZE','AUT','HUN','SVK','LUX','NOR','FIN']);
  const copy={
    zh:{world:'世界 / 继续探索',china:'中国 / 从海边出发',europe:'欧洲 / 巴黎之外',place:'旅途中的一站',note:'在这里留下过足迹。地图记录我去过的地方；求学路线单独连接，不推断旅行先后。',story:'读读路上的故事 ↗',loading:'正在展开地图…',error:'地图暂时未能加载。下方仍可选择地点，阅读足迹。',map:'可交互的个人旅行地图'},
    en:{world:'WORLD / STILL EXPLORING',china:'CHINA / FROM THE COAST',europe:'EUROPE / BEYOND PARIS',place:'A stop along the way',note:'A place I have visited. The atlas records places; the connected line follows my studies, without inventing a travel itinerary.',story:'Read a story from the road ↗',loading:'Opening the atlas…',error:'The map could not load. You can still select the featured stops below.',map:'Interactive personal travel atlas'},
    fr:{world:'MONDE / CONTINUER À EXPLORER',china:'CHINE / DEPUIS LA CÔTE',europe:'EUROPE / AU-DELÀ DE PARIS',place:'Une étape du voyage',note:'Un lieu où je suis passé. La carte rassemble mes étapes ; la ligne relie mes études, sans inventer un ordre de voyage.',story:'Lire un récit du voyage ↗',loading:'La carte se déploie…',error:'La carte n’a pas pu se charger. Les étapes ci-dessous restent accessibles.',map:'Carte interactive de mes voyages'},
    es:{world:'MUNDO / SEGUIR EXPLORANDO',china:'CHINA / DESDE LA COSTA',europe:'EUROPA / MÁS ALLÁ DE PARÍS',place:'Una parada del camino',note:'Un lugar que he visitado. El mapa reúne mis paradas; la línea conecta mis estudios sin inventar un itinerario de viaje.',story:'Leer una historia del camino ↗',loading:'Abriendo el atlas…',error:'No se pudo cargar el mapa. Puedes seguir eligiendo las paradas de abajo.',map:'Mapa interactivo de mis viajes'}
  };
  const stories={
    'Xianxiang · Ningbo':{icon:'🌊',period:'2002–2020',href:'story/comic/index.html#page-01',names:['咸祥 · 宁波','Xianxiang · Ningbo','Xianxiang · Ningbo','Xianxiang · Ningbo'],captions:['故事的起点','Where it began','Le point de départ','Donde empezó todo'],notes:['小时候住在父亲的货车上，跟他一起运货。那时，走出去的愿望比地图上的世界更早出现。','As a child, I often stayed in my father’s truck and travelled with him on deliveries. The wish to go beyond home came before I knew how wide the world was.','Enfant, je vivais souvent dans le camion de mon père et l’accompagnais dans ses livraisons. L’envie de partir est née avant que je mesure l’étendue du monde.','De niño, a menudo me quedaba en el camión de mi padre y lo acompañaba en sus entregas. El deseo de salir llegó antes de saber lo grande que era el mundo.']},
    'ZJSU · Hangzhou':{image:'images/web/2cfe86fe3b56-200.webp',academic:true,period:'2020–2024',href:'story/comic/index.html#page-09',names:['杭州 · 浙江工商大学','Hangzhou · ZJSU','Hangzhou · ZJSU','Hangzhou · ZJSU'],captions:['语言开始打开世界','Languages opened the door','Les langues ouvrent la porte','Los idiomas abrieron la puerta'],notes:['在这里选择法语，继续教英语，也经历了改变人生的手术。学习、教学和慢慢找回自信，发生在同一段日子里。','Here I chose French, continued teaching English and underwent the surgery that changed my life. Study, teaching and gradually rebuilding confidence belonged to the same chapter.','J’y ai choisi le français, continué à enseigner l’anglais et vécu l’opération qui a changé ma vie. Études, enseignement et confiance retrouvée appartiennent au même chapitre.','Aquí elegí francés, seguí enseñando inglés y pasé por la cirugía que cambió mi vida. Los estudios, la enseñanza y recuperar la confianza fueron parte de la misma etapa.']},
    'SWUFE · Chengdu':{image:'images/web/f7cdd3926a9e-200.webp',academic:true,period:'2024–2027',href:'story/comic/index.html#page-13',names:['成都 · 西南财经大学','Chengdu · SWUFE','Chengdu · SWUFE','Chengdu · SWUFE'],captions:['向西，也向新的可能','Westward, towards possibility','Vers l’ouest et de nouvelles voies','Al oeste, hacia nuevas posibilidades'],notes:['读国际商务，在法语联盟实习，又为字节的 AI 团队寻找海外人才。在成都，语言、商业和 AI 开始真正相遇。','International business, an internship at Alliance Française and overseas talent work for ByteDance’s AI team. In Chengdu, languages, business and AI began to meet.','Commerce international, stage à l’Alliance française et recherche de talents pour l’équipe IA de ByteDance : à Chengdu, langues, affaires et IA se rencontrent.','Comercio internacional, prácticas en la Alianza Francesa y búsqueda de talento para el equipo de IA de ByteDance. En Chengdu se encontraron los idiomas, los negocios y la IA.']},
    'Paris 1 Panthéon':{image:'images/web/e787c9d9f92e-200.webp',academic:true,period:'2025–2026',href:'journal/posts/lingovibe-paris-language/index.html',names:['巴黎 · 巴黎第一大学','Paris · Panthéon-Sorbonne','Paris · Panthéon-Sorbonne','París · Panthéon-Sorbonne'],captions:['小时候想看的世界','The world I wanted to see','Le monde que je rêvais de voir','El mundo que soñaba ver'],notes:['选择延毕，换来一年的巴黎交换。在这里学国际法，也学了一年西班牙语；然后从巴黎出发，走向法国和欧洲。','I chose to extend my studies for a year in Paris. I studied international law, learned Spanish for a year and used Paris as the starting point for exploring France and Europe.','J’ai prolongé mes études pour une année d’échange à Paris. Droit international, un an d’espagnol, puis des voyages en France et en Europe au départ de Paris.','Decidí alargar mis estudios para pasar un año de intercambio en París. Estudié derecho internacional, aprendí español durante un año y exploré Francia y Europa desde allí.']},
    'Amsterdam':{image:'images/web/be48c97a5125-400.webp',names:['阿姆斯特丹','Amsterdam','Amsterdam','Ámsterdam'],captions:['换一座城市，换一种目光','A different city, a different view','Une autre ville, un autre regard','Otra ciudad, otra mirada'],notes:['旅途中留下的一张照片。走出熟悉的语境，也是在练习用新的角度看普通生活。','A photograph from my travels. Stepping outside a familiar context is also a way of learning to see ordinary life differently.','Une photo de mes voyages. Sortir de son cadre habituel, c’est aussi apprendre à regarder autrement la vie ordinaire.','Una foto de mis viajes. Salir del contexto conocido también enseña a mirar de otra manera la vida cotidiana.']},
    'Rome':{image:'images/web/8bd883eb83b8-400.webp',names:['罗马','Rome','Rome','Roma'],captions:['站在更大的时间里','Inside a longer history','Dans un temps plus vaste','Dentro de una historia más larga'],notes:['首页这张照片拍在罗马斗兽场。它提醒我：曾经觉得遥远的地方，后来也能成为自己站过的地方。','The homepage photograph was taken at the Colosseum. It reminds me that places which once felt distant can become places where I have stood.','La photo de l’accueil a été prise au Colisée. Elle me rappelle qu’un lieu longtemps lointain peut devenir un endroit où l’on s’est tenu.','La foto de la portada se tomó en el Coliseo. Me recuerda que los lugares que parecían lejanos pueden acabar siendo lugares donde hemos estado.']},
    'Rigi':{image:'images/web/2f7469959f73-400.webp',names:['瑞士 · 瑞吉山','Switzerland · Rigi','Suisse · Rigi','Suiza · Rigi'],captions:['把目光放远一点','Let the view open up','Laisser le regard s’élargir','Dejar que se abra la mirada'],notes:['瑞士的山间，是欧洲旅行的一部分。语言让路上的交流变得容易，也让我更愿意走进陌生的地方。','The Swiss mountains were part of my European travels. Languages made encounters easier and encouraged me to step into unfamiliar places.','Les montagnes suisses font partie de mes voyages européens. Les langues facilitent les rencontres et donnent envie d’entrer dans des lieux inconnus.','Las montañas suizas fueron parte de mis viajes europeos. Los idiomas facilitaron los encuentros y me animaron a entrar en lugares desconocidos.']},
    'Tromsø':{image:'images/web/a11f415b67d3-400.webp',names:['挪威 · 特罗姆瑟','Norway · Tromsø','Norvège · Tromsø','Noruega · Tromsø'],captions:['地图上的更北方','Further north on the map','Plus au nord sur la carte','Más al norte en el mapa'],notes:['从宁波海边，到欧洲更北的地方。每走到一站，我都更确信：世界仍然有很多值得亲眼看看的东西。','From Ningbo’s coast to the north of Europe. Every stop makes me more certain that there is still so much worth seeing for myself.','De la côte de Ningbo au nord de l’Europe. Chaque étape me rappelle tout ce qui mérite encore d’être vu de mes propres yeux.','De la costa de Ningbo al norte de Europa. Cada parada me recuerda cuánto queda todavía por ver con mis propios ojos.']}
  };
  let map,geometry,provinces,pinLayer,routeLayer,gridLayer,data,ready,view='world',selected='Xianxiang · Ningbo',photoVariant='place';
  const pins=new Map();
  const language=()=>['zh','en','fr','es'].includes(document.documentElement.lang)?document.documentElement.lang:'en';
  const localIndex=()=>['zh','en','fr','es'].indexOf(language());
  const palette=()=>{const s=getComputedStyle(document.documentElement);return Object.fromEntries(['bg','surface','text','muted','gold','sage','coral'].map(k=>[k,s.getPropertyValue('--'+k).trim()]));};
  function placeName(point){
    if(stories[point.label]) return stories[point.label].names[localIndex()];
    if(data?.guide[point.label]) return data.guide[point.label].names[localIndex()];
    if(language()==='zh'&&typeof staticZhText!=='undefined') return staticZhText[point.label]||point.label;
    return point.label;
  }
  function allPoints(){return data?Object.entries(data.places).flatMap(([region,p])=>[...p.milestones.map(point=>({...point,region,milestone:true})),...p.cities.map(point=>({...point,region}))]):Object.keys(stories).map(label=>({label}));}
  const currentImage=guide=>photoVariant==='personal'&&guide?.personalImage?guide.personalImage:guide?.image;
  const personalPreviews={
    'Xianxiang · Ningbo':['在父亲的货车上长大，走出去的愿望从这里开始。','My father’s truck, and the first wish to see beyond home.','Le camion de mon père et mes premières envies de départ.','El camión de mi padre y las primeras ganas de salir.'],
    'ZJSU · Hangzhou':['读法语、教英语，也在这里慢慢找回自信。','French studies, English teaching and growing confidence.','Le français, l’enseignement de l’anglais et la confiance retrouvée.','Francés, enseñanza de inglés y confianza recuperada.'],
    'SWUFE · Chengdu':['国际商务、法盟实习和 AI 人才寻访在这里交汇。','International business, Alliance Française and AI talent work.','Commerce international, Alliance française et recrutement IA.','Negocios internacionales, Alianza Francesa y talento IA.'],
    'Paris 1 Panthéon':['一年的国际法交换，也是一年的西班牙语学习。','A year of international law, with a year of Spanish alongside it.','Une année de droit international, et une année d’espagnol.','Un año de Derecho Internacional y otro de español.'],
    'Amsterdam':['荷兰旅行中留下的个人照片。','A photograph from my travels in the Netherlands.','Une photo de mes voyages aux Pays-Bas.','Una foto de mis viajes por los Países Bajos.'],
    'Rome':['首页那张照片，就拍在斗兽场前。','The homepage portrait was taken at the Colosseum.','La photo de l’accueil a été prise au Colisée.','La foto de la portada se tomó ante el Coliseo.'],
    'Rigi':['瑞士山间的旅行片段。','A moment from the Swiss mountains.','Un instant dans les montagnes suisses.','Un instante en las montañas suizas.'],
    'Tromsø':['从宁波海边，走到挪威的北方。','From Ningbo’s coast to northern Norway.','De la côte de Ningbo au nord de la Norvège.','De la costa de Ningbo al norte de Noruega.']
  };
  const readerCopy={
    zh:{open:'展开这一站',memory:'我的这一站',source:'地方资料 ↗',photo:'图源 ↗',story:'相关故事 ↗'},
    en:{open:'Explore this stop',memory:'My stop here',source:'About this place ↗',photo:'Photo ↗',story:'Related story ↗'},
    fr:{open:'Découvrir cette étape',memory:'Mon passage ici',source:'À propos du lieu ↗',photo:'Photo ↗',story:'Récit associé ↗'},
    es:{open:'Ver esta parada',memory:'Mi paso por aquí',source:'Sobre este lugar ↗',photo:'Foto ↗',story:'Historia relacionada ↗'}
  };
  const photoCopy={
    zh:{open:'放大照片',close:'关闭照片',personal:'我的旅行照片',reference:'地点参考图',credit:'影像'},
    en:{open:'Enlarge photo',close:'Close photo',personal:'My travel photo',reference:'Place photograph',credit:'Photo'},
    fr:{open:'Agrandir la photo',close:'Fermer la photo',personal:'Ma photo de voyage',reference:'Photo du lieu',credit:'Photo'},
    es:{open:'Ampliar foto',close:'Cerrar foto',personal:'Mi foto de viaje',reference:'Foto del lugar',credit:'Foto'}
  };
  const photoDialog=document.createElement('dialog');photoDialog.className='atlas-photo-dialog';photoDialog.setAttribute('aria-labelledby','atlas-photo-title');
  photoDialog.innerHTML='<header><h2 id="atlas-photo-title"></h2><button type="button">×</button></header><div class="atlas-place-layout"><figure><img alt=""><figcaption></figcaption></figure><div class="atlas-place-details" hidden></div></div><a class="atlas-dialog-credit" target="_blank" rel="noopener"></a>';
  document.body.append(photoDialog);
  function creditText(media){const t=photoCopy[language()];return media.kind==='personal'?t.personal:t.credit+': '+media.credit.author+' · '+media.credit.license;}
  function showPhoto(withDetails=false){
    const guide=data?.guide[selected],media=currentImage(guide);if(!media)return;
    const i=localIndex(),img=photoDialog.querySelector('img'),t=readerCopy[language()],story=stories[selected];img.src=media.src;img.alt=media.alt[i];img.width=media.width;img.height=media.height;
    photoDialog.classList.toggle('with-details',withDetails);
    const details=photoDialog.querySelector('.atlas-place-details');details.hidden=!withDetails;details.replaceChildren();
    if(withDetails){
      const intro=document.createElement('p');intro.textContent=guide.intro[i];details.append(intro);
      const tags=document.createElement('ul');tags.className='atlas-card-highlights';for(const text of guide.highlights[i]){const li=document.createElement('li');li.textContent=text;tags.append(li);}details.append(tags);
      if(story){const heading=document.createElement('h3'),note=document.createElement('p');heading.textContent=t.memory;note.textContent=story.notes[i];details.append(heading,note);}
      const links=document.createElement('div');links.className='atlas-detail-links';
      const source=document.createElement('a');source.href=guide.source.url;source.target='_blank';source.rel='noopener';source.textContent=t.source;links.append(source);
      if(story?.href){const a=document.createElement('a'),url=new URL(story.href,location.href);url.searchParams.set('lang',language());a.href=url.href;a.textContent=t.story;links.append(a);}details.append(links);
    }
    photoDialog.querySelector('h2').textContent=placeName({label:selected});photoDialog.querySelector('button').setAttribute('aria-label',photoCopy[language()].close);
    photoDialog.querySelector('figcaption').textContent=media.caption?.[i]||guide.names[i];
    const source=photoDialog.querySelector('.atlas-dialog-credit');source.href=media.credit.url;source.textContent=creditText(media)+' ↗';
    if(!photoDialog.open){photoDialog.showModal();photoDialog.scrollTop=0;}
  }
  photoDialog.querySelector('button').addEventListener('click',()=>photoDialog.close());
  photoDialog.addEventListener('click',event=>{if(event.target===photoDialog){const r=photoDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)photoDialog.close();}});
  photoDialog.addEventListener('close',()=>section.querySelector(photoDialog.classList.contains('with-details')?'[data-atlas-details]':'[data-atlas-photo]')?.focus({preventScroll:true}));
  section.querySelector('[data-atlas-art]').addEventListener('click',()=>showPhoto(false));
  section.querySelector('[data-atlas-details]').addEventListener('click',()=>showPhoto(true));
  function postcard(){
    const i=localIndex(),t=copy[language()],story=stories[selected],guide=data?.guide[selected],point=allPoints().find(p=>p.label===selected)||{label:selected};
    const media=currentImage(guide),art=section.querySelector('[data-atlas-art]');art.replaceChildren();art.classList.toggle('is-academic',Boolean(!media&&story?.academic));art.classList.toggle('has-photo',Boolean(media));
    if(media||story?.image){const img=new Image();img.src=media?.src||story.image;img.alt=media?.alt[i]||story.names[i];img.loading='lazy';img.decoding='async';if(media){img.width=media.width;img.height=media.height;img.style.objectPosition=media.position;}
      art.append(img);if(media){const open=document.createElement('button');open.type='button';open.dataset.atlasPhoto='';open.className='atlas-photo-open';open.setAttribute('aria-label',photoCopy[language()].open+' · '+placeName(point));open.textContent='↗';
        const kind=document.createElement('span');kind.className='atlas-photo-kind';kind.textContent=photoCopy[language()][media.kind];art.append(kind,open);}}
    else {const icon=document.createElement('span');icon.textContent=story?.icon||'🧭';icon.setAttribute('aria-hidden','true');art.append(icon);}
    const imageCredit=section.querySelector('[data-atlas-image-credit]');imageCredit.hidden=!media;
    if(media){imageCredit.href=media.credit.url;imageCredit.textContent=readerCopy[language()].photo;imageCredit.title=creditText(media);imageCredit.setAttribute('aria-label',creditText(media));}
    const imageCaption=section.querySelector('[data-atlas-photo-caption]');imageCaption.textContent=media?.caption?.[i]||'';imageCaption.hidden=!media?.caption;
    const choices=section.querySelector('[data-atlas-photo-choices]');choices.hidden=!guide?.personalImage;choices.replaceChildren();
    if(guide?.personalImage){const names=[['地方实景','我的照片'],['The place','My photo'],['Le lieu','Ma photo'],['El lugar','Mi foto']][i];['place','personal'].forEach((value,n)=>{const b=document.createElement('button');b.type='button';b.dataset.atlasPhotoVariant=value;b.textContent=names[n];b.setAttribute('aria-pressed',String(photoVariant===value));choices.append(b);});}
    section.querySelector('[data-atlas-kicker]').textContent=story?.period?(story.period+(guide?.country[i]?' · '+guide.country[i]:'')):(guide?.country[i]||t.place);
    section.querySelector('[data-atlas-place]').textContent=placeName(point);
    section.querySelector('[data-atlas-intro]').textContent=guide?.intro[i]||'';
    const highlights=section.querySelector('[data-atlas-highlights]');highlights.replaceChildren();
    for(const text of guide?.highlights[i]||[]){const li=document.createElement('li');li.textContent=text;highlights.append(li);}
    const memory=section.querySelector('[data-atlas-memory]');memory.hidden=!story;
    section.querySelector('[data-atlas-note]').textContent=personalPreviews[selected]?.[i]||'';
    const more=section.querySelector('[data-atlas-details]');more.textContent=readerCopy[language()].open+' ↗';more.setAttribute('aria-label',readerCopy[language()].open+' · '+placeName(point));more.disabled=!guide;
    section.querySelector('.atlas-postcard').classList.toggle('is-place-only',!story);
    section.querySelector('.atlas-postcard').setAttribute('aria-label',placeName(point));
    section.querySelectorAll('[data-atlas-stop]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.atlasStop===selected)));
  }
  function updateLabels(){
    const t=copy[language()];section.querySelector('[data-atlas-title]').textContent=t[view];container.setAttribute('aria-label',t.map);
    pins.forEach(({point,pin})=>{pin.setTooltipContent(placeName(point));const element=pin.getElement();element?.setAttribute('aria-label',placeName(point));element?.setAttribute('title',placeName(point));});
    section.querySelectorAll('[data-atlas-index] [data-atlas-stop]').forEach(b=>{const point=allPoints().find(p=>p.label===b.dataset.atlasStop);if(point)b.textContent=placeName(point);});
    postcard();
    if(photoDialog.open)showPhoto(photoDialog.classList.contains('with-details'));
  }
  function loadData(){
    if(window.JIAKE_ATLAS_DATA)return Promise.resolve(window.JIAKE_ATLAS_DATA);
    return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('maps/atlas-data.js?v=5',baseURL).href;script.async=true;script.onload=()=>window.JIAKE_ATLAS_DATA?resolve(window.JIAKE_ATLAS_DATA):reject(new Error('Atlas data missing'));script.onerror=()=>reject(new Error('Atlas data unavailable'));document.head.append(script);});
  }
  function styleCountry(feature){const p=palette(),seen=visited.has(feature.properties.iso)||feature.properties.iso==='TWN';return {color:seen?p.sage:p.muted,weight:seen?1.1:.55,opacity:seen?.85:.3,fillColor:seen?p.sage:p.muted,fillOpacity:seen?.3:.07};}
  function styleProvince(){return {color:palette().sage,weight:.7,opacity:.35,fillOpacity:0};}
  function reset(){if(!map)return;pins.forEach(({pin})=>pin.closeTooltip());const bounds={world:[[-27,-30],[73,155]],china:[[20,99],[42,126]],europe:[[38,-9],[71,29]]};map.invalidateSize();map.fitBounds(bounds[view],{padding:[22,22],animate:!reduced.matches,maxZoom:view==='world'?2.5:5});}
  function redrawPins(){
    if(!map||!data)return;pinLayer.clearLayers();pins.clear();const p=palette();
    allPoints().filter(point=>view==='world'||point.region===view).forEach(point=>{
      const pin=L.marker([point.lat,point.lng],{keyboard:true,title:placeName(point),icon:L.divIcon({className:'atlas-marker'+(point.milestone?' atlas-marker--life':''),html:'<i></i>',iconSize:[24,24],iconAnchor:[12,12]})}).bindTooltip(placeName(point),{direction:'top',className:'atlas-tooltip'}).addTo(pinLayer);
      pin.on('click',()=>select(point.label,false));pin.on('add',()=>pin.getElement()?.setAttribute('aria-label',placeName(point)));pins.set(point.label,{point,pin});
    });
    routeLayer.clearLayers();if(view!=='europe'){
      const life=[...data.places.china.milestones,...(view==='world'?data.places.europe.milestones:[])];
      const route=[];for(let i=0;i<life.length-1;i++){const a=life[i],b=life[i+1];for(let step=0;step<=40;step++){const f=step/40;route.push([a.lat+(b.lat-a.lat)*f+Math.sin(Math.PI*f)*(i===2?14:1),a.lng+(b.lng-a.lng)*f]);}}
      L.polyline(route,{color:p.gold,weight:2,opacity:.9,dashArray:'4 7',interactive:false,className:'atlas-route'}).addTo(routeLayer);
    }
    pins.get(selected)?.pin.getElement()?.classList.add('is-selected');
  }
  async function init(){
    if(map)return map;if(ready)return ready;
    ready=(async()=>{try{
      data=await loadData();
      const index=section.querySelector('[data-atlas-index]');if(!index.children.length)allPoints().forEach(point=>{const b=document.createElement('button');b.type='button';b.dataset.atlasStop=point.label;b.textContent=placeName(point);b.setAttribute('aria-pressed',String(point.label===selected));index.append(b);});
      updateLabels();if(!window.L)throw new Error('Map library unavailable');
      map=L.map(container,{zoomControl:false,scrollWheelZoom:false,minZoom:1.5,maxZoom:9,zoomSnap:.25,worldCopyJump:true}).setView([33,55],2);
      map.attributionControl.setPrefix(false);map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a>');L.control.zoom({position:'bottomright'}).addTo(map);
      geometry=L.geoJSON(data.countries,{style:styleCountry,interactive:false}).addTo(map);
      provinces=L.geoJSON(data.provinces,{style:styleProvince,interactive:false});if(view==='china')provinces.addTo(map);
      pinLayer=L.layerGroup().addTo(map);routeLayer=L.layerGroup().addTo(map);gridLayer=L.layerGroup().addTo(map);
      const p=palette();for(let lon=-180;lon<=180;lon+=20)L.polyline([[-80,lon],[80,lon]],{color:p.muted,weight:.5,opacity:.1,interactive:false}).addTo(gridLayer);for(let lat=-60;lat<=80;lat+=20)L.polyline([[lat,-180],[lat,180]],{color:p.muted,weight:.5,opacity:.1,interactive:false}).addTo(gridLayer);
      map.on('move',()=>{const c=map.getCenter();section.querySelector('.atlas-position').textContent=`${Math.abs(c.lat).toFixed(3)}° ${c.lat>=0?'N':'S'} · ${Math.abs(c.lng).toFixed(3)}° ${c.lng>=0?'E':'W'}`;});
      section.querySelector('[data-atlas-loading]').hidden=true;redrawPins();reset();updateLabels();return map;
    }catch(error){section.querySelector('[data-atlas-loading]').textContent=copy[language()].error;ready=null;return null;}})();return ready;
  }
  async function select(name,zoom=true){
    if(name!==selected)photoVariant='place';selected=name;postcard();await init();const item=pins.get(name)||allPoints().find(p=>p.label===name);
    if(map&&item){const point=item.point||item;if(view!=='world'&&point.region!==view)await switchView(point.region);if(zoom)map.flyTo([point.lat,point.lng],point.milestone?5:6,{animate:!reduced.matches,duration:.8});pins.forEach(({pin},label)=>{pin.getElement()?.classList.toggle('is-selected',label===name);if(label!==name)pin.closeTooltip();});pins.get(name)?.pin.openTooltip();}
    postcard();
  }
  async function switchView(next){if(!['world','china','europe'].includes(next))return;view=next;section.querySelectorAll('.map-tab-btn').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-pressed',String(b.dataset.view===view));});updateLabels();await init();if(provinces&&map){if(view==='china')provinces.addTo(map);else map.removeLayer(provinces);}redrawPins();reset();}
  section.querySelectorAll('.map-tab-btn').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
  section.querySelector('[data-atlas-reset]').addEventListener('click',reset);
  section.addEventListener('click',event=>{const choice=event.target.closest('[data-atlas-photo-variant]');if(choice){photoVariant=choice.dataset.atlasPhotoVariant;postcard();section.querySelector('[data-atlas-photo-variant="'+photoVariant+'"]')?.focus({preventScroll:true});}});
  section.addEventListener('click',event=>{
    const button=event.target.closest('[data-atlas-stop]');if(!button)return;
    select(button.dataset.atlasStop).then(()=>{
      if(button.closest('[data-atlas-index]'))section.querySelector(innerWidth<=700?'.atlas-postcard':'.atlas-explorer').scrollIntoView({block:innerWidth<=700?'center':'start',behavior:reduced.matches?'instant':'smooth'});
    });
  });
  section.querySelector('.atlas-index').addEventListener('toggle',()=>{if(section.querySelector('.atlas-index').open)init();});
  window._refreshJourneyMaps=updateLabels;
  document.addEventListener('jiake:languagechange',updateLabels);
  new MutationObserver(()=>{geometry?.setStyle(styleCountry);provinces?.setStyle(styleProvince);if(map)redrawPins();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  new ResizeObserver(()=>map?.invalidateSize()).observe(container);
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){init();observer.disconnect();}},{rootMargin:'150px'});observer.observe(section);
  updateLabels();
})();
