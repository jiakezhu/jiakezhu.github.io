import {projectPoint,greatCircle,wrapLongitude} from './orbital-geometry.mjs';
const canvas=document.getElementById('station-globe');
if(canvas) {
  const ctx=canvas.getContext('2d'),root=document.documentElement,motion=matchMedia('(prefers-reduced-motion: reduce)');
  const source=new URL('maps/atlas-data.js?v=2',import.meta.url);
  let atlas,visible=false,frame=0,last=0,size=320,centerLng=70,centerLat=28,dragging=false,active='Xianxiang · Ningbo',paused=false;
  const copy={en:{label:'Illustrated Earth with my study route. Drag horizontally or use the arrow keys to turn it.',loading:'Preparing the globe…',hint:'Choose a stop to turn the globe and read its story.'},zh:{label:'标出求学路线的漫画地球。可横向拖动或用方向键旋转。',loading:'正在展开地球…',hint:'选择一站，转动地球，也打开那一段故事。'},fr:{label:'Terre illustrée et parcours d’études. Glissez horizontalement ou utilisez les flèches.',loading:'Préparation du globe…',hint:'Choisissez une étape pour tourner le globe et lire son histoire.'},es:{label:'Tierra ilustrada con mi ruta de estudios. Arrastra horizontalmente o usa las flechas.',loading:'Preparando el globo…',hint:'Elige una parada para girar el globo y leer su historia.'}};
  const theme=()=>{const s=getComputedStyle(root);return Object.fromEntries(['bg','surface','text','muted','gold','sage','ink'].map(key=>[key,s.getPropertyValue('--'+key).trim()]));};
  function labels(){const t=copy[root.lang]||copy.en;canvas.setAttribute('aria-label',t.label);document.querySelector('.station-chart-hint').textContent=atlas?t.hint:t.loading;}
  function line(points,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();let started=false;for(const point of points){const p=projectPoint(point.lng,point.lat,centerLng,centerLat,size*.38);if(p.depth<0){started=false;continue;}if(!started){ctx.moveTo(size/2+p.x,size/2+p.y);started=true;}else ctx.lineTo(size/2+p.x,size/2+p.y);}ctx.stroke();}
  function draw(){
    if(!ctx)return;const t=theme(),r=size*.38,c=size/2;ctx.clearRect(0,0,size,size);
    ctx.strokeStyle=t.gold;ctx.globalAlpha=.35;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(c,c,r*1.2,r*.25,-.3,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle=root.dataset.theme==='light'?'#b7d9d9':'#245066';ctx.strokeStyle=t.ink;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(c,c,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.save();ctx.beginPath();ctx.arc(c,c,r-1,0,Math.PI*2);ctx.clip();
    ctx.globalAlpha=.25;
    for(let lat=-60;lat<=60;lat+=30)line(Array.from({length:73},(_,i)=>({lng:i*5-180,lat})),t.sage,.7);
    for(let lng=-180;lng<180;lng+=30)line(Array.from({length:37},(_,i)=>({lng,lat:i*5-90})),t.sage,.7);
    ctx.globalAlpha=1;
    for(const country of atlas?.countries.features||[]) {
      const polygons=country.geometry.type==='Polygon'?[country.geometry.coordinates]:country.geometry.coordinates;
      for(const polygon of polygons) {
        const ring=polygon[0],projected=ring.map(([lng,lat])=>projectPoint(lng,lat,centerLng,centerLat,r));
        if(projected.every(p=>p.depth>=0)){ctx.beginPath();projected.forEach((p,i)=>i?ctx.lineTo(c+p.x,c+p.y):ctx.moveTo(c+p.x,c+p.y));ctx.closePath();ctx.fillStyle=root.dataset.theme==='light'?'#6faaa4':'#6faca7';ctx.fill();}
        line(ring.map(([lng,lat])=>({lng,lat})),root.dataset.theme==='light'?'#315b64':'#183c4b',.9);
      }
    }
    const milestones=atlas?[...atlas.places.china.milestones,...atlas.places.europe.milestones]:[];
    for(let i=1;i<milestones.length;i++)line(greatCircle(milestones[i-1],milestones[i]),t.gold,1.8);
    const activePoint=atlas?Object.values(atlas.places).flatMap(region=>[...region.milestones,...region.cities]).find(p=>p.label===active):null;
    const pins=activePoint&&!milestones.some(p=>p.label===active)?[...milestones,activePoint]:milestones;
    for(const point of pins){const p=projectPoint(point.lng,point.lat,centerLng,centerLat,r);if(p.depth<0)continue;ctx.fillStyle=point.label===active?t.gold:t.text;ctx.strokeStyle=t.ink;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(c+p.x,c+p.y,point.label===active?4:2.7,0,Math.PI*2);ctx.fill();ctx.stroke();}
    ctx.restore();ctx.strokeStyle=t.text;ctx.globalAlpha=.25;ctx.lineWidth=1;ctx.beginPath();ctx.arc(c,c,r-4,.9,2.2);ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle=t.gold;ctx.beginPath();ctx.arc(c+r*1.12,c-r*.27,3,0,Math.PI*2);ctx.fill();
  }
  function tick(time){frame=0;if(!visible||document.hidden||motion.matches||paused)return;if(time-last>=66){centerLng=wrapLongitude(centerLng-.065);last=time;draw();}frame=requestAnimationFrame(tick);}
  function restart(){cancelAnimationFrame(frame);frame=0;draw();if(visible&&!document.hidden&&!motion.matches&&!paused)frame=requestAnimationFrame(tick);}
  function resize(){size=canvas.getBoundingClientRect().width||320;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(size*dpr);canvas.height=Math.round(size*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);restart();}
  async function load(){
    if(!window.JIAKE_ATLAS_DATA&&!window.JIAKE_ATLAS_LOADING)window.JIAKE_ATLAS_LOADING=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=source.href;script.onload=()=>resolve(window.JIAKE_ATLAS_DATA);script.onerror=()=>reject(new Error('Atlas unavailable'));document.head.append(script);});
    try {atlas=window.JIAKE_ATLAS_DATA||await window.JIAKE_ATLAS_LOADING;labels();restart();}catch{document.querySelector('.station-chart-hint').textContent=(copy[root.lang]||copy.en).hint;}
  }
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!atlas)load();restart();},{rootMargin:'100px'}).observe(canvas);
  new ResizeObserver(resize).observe(canvas);
  document.addEventListener('visibilitychange',restart);motion.addEventListener('change',restart);
  new MutationObserver(restart).observe(root,{attributes:true,attributeFilter:['data-theme']});
  document.addEventListener('jiake:languagechange',labels);
  document.addEventListener('jiake:placechange',event=>{const point=event.detail;if(point){active=point.label;centerLng=point.lng;centerLat=point.lat;paused=true;restart();}});
  let pointer;
  canvas.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')return;dragging=true;paused=true;pointer=event.clientX;canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{if(!dragging)return;centerLng=wrapLongitude(centerLng-(event.clientX-pointer)*.55);pointer=event.clientX;draw();});
  const stop=()=>{dragging=false;};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
  canvas.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();paused=true;centerLng=wrapLongitude(centerLng+(event.key==='ArrowLeft'?10:-10));restart();});
  labels();resize();
}
