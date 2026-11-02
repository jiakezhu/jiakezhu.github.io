(() => {
  const root=document.documentElement, entry=document.querySelector('[data-visits-open]'), dialog=document.querySelector('#story-visits');
  if(!entry||!dialog)return;
  const source='https://raw.githubusercontent.com/jiakezhu/jiakezhu.github.io/site-analytics/visits.json';
  const copy={
    zh:{open:'来访记录',title:'谢谢你来过。',scope:'全站浏览记录',total:'累计浏览',today:'今日浏览',week:'近 7 天浏览',entries:'近 30 天访问',trend:'每天的足迹',insights:'来访的轨迹',pages:'热门页面',countries:'国家与地区',devices:'使用设备',sources:'访问来源',viewUnit:'浏览',entryUnit:'访问',close:'关闭来访记录',since:'开始记录',updated:'数据截至',error:'暂时无法读取统计',stale:'更新有延迟，以下为最近一次记录。',note:'浏览为页面打开次数；访问为直接或从其他网站进入的次数，并非独立访客数。约每 3 小时更新，日期按北京时间。',before:'尚未启用',loading:'正在读取来访记录…',collecting:'明细正在汇总',none:'暂无数据',empty:'记录刚刚开始。',views:'次浏览',entryCount:'次访问',other:'其他',unknown:'未知',direct:'直接访问',internal:'站内访问',desktop:'电脑',mobile:'手机',tablet:'平板',home:'个人主页',story:'我的故事',comic:'成长漫画',transcript:'漫画文字版',sales:'Sales Buddy',deck:'Sales Buddy 展示'},
    en:{open:'Visit log',title:'Thanks for stopping by.',scope:'Across the website',total:'Total page views',today:'Views today',week:'Views · 7 days',entries:'Visits · 30 days',trend:'Daily footprints',insights:'A closer look',pages:'Popular pages',countries:'Countries & regions',devices:'Devices',sources:'Traffic sources',viewUnit:'views',entryUnit:'visits',close:'Close visit log',since:'Tracking since',updated:'Data through',error:'Statistics unavailable',stale:'Updates are delayed. Showing the latest snapshot.',note:'Views are page loads. Visits are direct or external entries, not unique people. Updated about every 3 hours; dates use Beijing time.',before:'Not tracked yet',loading:'Loading the visit log…',collecting:'Preparing details',none:'No data yet',empty:'The log has just begun.',views:'page views',entryCount:'visits',other:'Other',unknown:'Unknown',direct:'Direct',internal:'Within site',desktop:'Desktop',mobile:'Mobile',tablet:'Tablet',home:'Home',story:'My story',comic:'Life in frames',transcript:'Comic transcript',sales:'Sales Buddy',deck:'Sales Buddy presentation'},
    fr:{open:'Les visites',title:'Merci d’être passé.',scope:'Sur tout le site',total:'Pages vues au total',today:'Pages vues aujourd’hui',week:'Pages vues · 7 jours',entries:'Visites · 30 jours',trend:'Au fil des jours',insights:'En détail',pages:'Pages populaires',countries:'Pays et régions',devices:'Appareils',sources:'Sources des visites',viewUnit:'vues',entryUnit:'visites',close:'Fermer les visites',since:'Suivi depuis le',updated:'Données au',error:'Statistiques indisponibles',stale:'Mise à jour retardée. Dernier relevé disponible.',note:'Vues : chargements de pages. Visites : arrivées directes ou externes, pas des personnes uniques. Actualisation environ toutes les 3 heures ; heure de Pékin.',before:'Pas encore suivi',loading:'Chargement des visites…',collecting:'Détails en cours',none:'Pas encore de données',empty:'Le suivi vient de commencer.',views:'pages vues',entryCount:'visites',other:'Autres',unknown:'Inconnu',direct:'Accès direct',internal:'Depuis le site',desktop:'Ordinateur',mobile:'Mobile',tablet:'Tablette',home:'Accueil',story:'Mon histoire',comic:'Ma vie en images',transcript:'Texte de la BD',sales:'Sales Buddy',deck:'Présentation Sales Buddy'},
    es:{open:'Las visitas',title:'Gracias por pasar.',scope:'En todo el sitio',total:'Páginas vistas en total',today:'Vistas hoy',week:'Vistas · 7 días',entries:'Visitas · 30 días',trend:'Huellas de cada día',insights:'Una mirada más cercana',pages:'Páginas populares',countries:'Países y regiones',devices:'Dispositivos',sources:'Origen de visitas',viewUnit:'vistas',entryUnit:'visitas',close:'Cerrar las visitas',since:'Registro desde',updated:'Datos hasta',error:'Estadísticas no disponibles',stale:'Actualización retrasada. Se muestra el último registro.',note:'Vistas: cargas de página. Visitas: entradas directas o externas, no personas únicas. Se actualiza cada 3 horas aproximadamente; hora de Pekín.',before:'Sin registro aún',loading:'Cargando las visitas…',collecting:'Preparando detalles',none:'Aún no hay datos',empty:'El registro acaba de empezar.',views:'páginas vistas',entryCount:'visitas',other:'Otros',unknown:'Desconocido',direct:'Acceso directo',internal:'Desde el sitio',desktop:'Ordenador',mobile:'Móvil',tablet:'Tableta',home:'Inicio',story:'Mi historia',comic:'La vida en viñetas',transcript:'Texto del cómic',sales:'Sales Buddy',deck:'Presentación Sales Buddy'}
  };
  const $=key=>dialog.querySelector(`[data-visits-${key}]`);
  let state=null,failed=false;
  const lang=()=>copy[root.lang]?root.lang:'en';
  const day=ms=>new Date(ms+8*3600000).toISOString().slice(0,10);
  const number=n=>new Intl.NumberFormat(lang()).format(n);
  const date=(value,short=false)=>new Intl.DateTimeFormat(lang(),{timeZone:'Asia/Shanghai',month:short?'numeric':'short',day:'numeric',...(short?{}:{year:'numeric'})}).format(new Date(value));
  function valid(data){
    if(data?.version!==1||data.hostname!=='jiakezhu.github.io'||data.timeZone!=='Asia/Shanghai'||data.startDate!=='2026-11-01'||!Array.isArray(data.daily)||!data.daily.length||!Number.isFinite(Date.parse(data.updatedAt))||Date.parse(data.updatedAt)>Date.now()+3600000) return false;
    let ms=Date.parse(data.startDate+'T00:00:00+08:00');
    for(const row of data.daily){if(row.date!==day(ms)||!Number.isSafeInteger(row.pageViews)||row.pageViews<0)return false;ms+=86400000;}
    return data.daily.at(-1).date===day(Date.parse(data.updatedAt));
  }
  function validDetail(detail){
    if(!detail||!Number.isFinite(Date.parse(detail.since))||!Number.isFinite(Date.parse(detail.until))||Date.parse(detail.since)>Date.parse(detail.until)||!Number.isSafeInteger(detail.visits)||detail.visits<0||!Number.isSafeInteger(detail.pageViews)||detail.pageViews<0)return false;
    return ['pages','countries','devices','sources'].every(name=>Array.isArray(detail[name])&&detail[name].length<=250&&detail[name].every(row=>typeof row.key==='string'&&row.key.length<=300&&Number.isSafeInteger(row[name==='sources'?'visits':'pageViews'])&&row[name==='sources'?'visits':'pageViews']>=0));
  }
  function label(name,key,c){
    if(key==='other')return c.other;
    if(key==='unknown')return c.unknown;
    if(name==='devices'||name==='sources')return c[key]||key;
    if(name==='countries'){
      try{return /^[A-Za-z]{2}$/.test(key)?new Intl.DisplayNames([lang()],{type:'region'}).of(key.toUpperCase())||key:key;}catch{return key;}
    }
    if(name==='pages'){
      const routes={'/':'home','/story/':'story','/story/comic/':'comic','/story/comic/transcript.html':'transcript','/sales-buddy.html':'sales','/sales-buddy-deck/':'deck'};
      if(routes[key])return c[routes[key]];
      const slug=key.match(/^\/journal\/posts\/([a-z0-9-]+)\/$/)?.[1];
      const post=(window.JOURNAL_POSTS||[]).find(item=>item.slug===slug);
      return post?(post.translations?.[lang()]?.title||post.title):key;
    }
    return key;
  }
  function topRows(rows,unit){
    const ordinary=rows.filter(row=>row.key!=='other').slice().sort((a,b)=>b[unit]-a[unit]);
    const top=ordinary.slice(0,5),other=ordinary.slice(5).reduce((n,row)=>n+row[unit],0)+rows.filter(row=>row.key==='other').reduce((n,row)=>n+row[unit],0);
    if(other)top.push({key:'other',[unit]:other});
    return top;
  }
  function drawBreakdown(name,detail,c){
    const list=$(name);list.replaceChildren();
    if(!detail||!detail[name].length){const row=document.createElement('li');row.className='visits-no-data';row.textContent=detail?c.none:c.collecting;list.append(row);return;}
    const unit=name==='sources'?'visits':'pageViews', rows=topRows(detail[name],unit),max=Math.max(1,...rows.map(row=>row[unit]));
    for(const row of rows){
      const item=document.createElement('li'),line=document.createElement('div'),value=document.createElement('strong'),meter=document.createElement('div'),fill=document.createElement('i');
      const text=label(name,row.key,c),safePath=name==='pages'&&/^\/(?:[A-Za-z0-9_-]+\/)*(?:[A-Za-z0-9_-]+\.html)?$/.test(row.key);
      const heading=document.createElement(safePath?'a':'span');
      heading.textContent=text;heading.title=text;
      if(safePath){const url=new URL(row.key,location.origin);url.searchParams.set('lang',lang());heading.href=url.href;}
      line.className='visits-row';value.textContent=number(row[unit]);line.append(heading,value);
      item.setAttribute('aria-label',text+' · '+number(row[unit])+' '+(name==='sources'?c.entryCount:c.views));
      meter.className='visits-row-meter';meter.setAttribute('aria-hidden','true');fill.style.width=(row[unit]/max*100)+'%';meter.append(fill);item.append(line,meter);list.append(item);
    }
  }
  function render(){
    const c=copy[lang()];
    entry.querySelector('[data-visits-label]').textContent=c.open;
    entry.setAttribute('aria-label',c.open+(state?' · '+number(state.daily.reduce((n,r)=>n+r.pageViews,0))+' '+c.views:''));
    for(const key of ['title','scope','total','today','week','entries','trend','insights','note'])$(key).textContent=c[key];
    for(const name of ['pages','countries','devices','sources'])$(name+'-title').textContent=c[name];
    dialog.querySelectorAll('[data-visits-views-unit]').forEach(el=>el.textContent=c.viewUnit);
    dialog.querySelector('[data-visits-entry-unit]').textContent=c.entryUnit;
    dialog.querySelector('[data-visits-close]').setAttribute('aria-label',c.close);
    const detail=validDetail(state?.detail)?state.detail:null;
    for(const name of ['pages','countries','devices','sources'])drawBreakdown(name,detail,c);
    if(!state){$('status').textContent=failed?c.error:c.loading;return;}
    const total=state.daily.reduce((n,r)=>n+r.pageViews,0),today=day(Date.now());
    const weekStart=new Date(Date.parse(today+'T12:00:00+08:00')-6*86400000);
    const week=state.daily.filter(r=>r.date>=day(+weekStart)).reduce((n,r)=>n+r.pageViews,0);
    entry.querySelector('[data-visits-count]').textContent=number(total);
    $('total-value').textContent=number(total);
    $('today-value').textContent=state.daily.find(r=>r.date===today)?number(state.daily.find(r=>r.date===today).pageViews):'—';
    $('week-value').textContent=number(week);
    $('entries-value').textContent=detail?number(detail.visits):'—';
    $('range').textContent=detail?date(detail.since,true)+' – '+date(detail.until,true):'';
    $('since').textContent=c.since+' '+date(state.startDate+'T00:00:00+08:00');
    $('updated').textContent=c.updated+' '+new Intl.DateTimeFormat(lang(),{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(state.updatedAt));
    $('status').textContent=Date.now()-Date.parse(state.updatedAt)>12*3600000?c.stale:(total===0?c.empty:'');
    const chart=$('chart');chart.replaceChildren();
    const rows=Array.from({length:7},(_,i)=>{const d=day(+weekStart+i*86400000);return{date:d,value:state.daily.find(r=>r.date===d)?.pageViews??null};});
    const max=Math.max(1,...rows.map(r=>r.value||0));
    for(const row of rows){
      const column=document.createElement('li'),value=document.createElement('span'),track=document.createElement('span'),bar=document.createElement('i'),label=document.createElement('time');
      column.className='visits-day'+(row.value===null?' visits-day--untracked':'')+(row.date===today?' visits-day--today':'');
      value.className='visits-day-value';value.textContent=row.value===null?'—':number(row.value);
      track.className='visits-day-track';bar.style.height=(row.value===null?0:row.value/max*100)+'%';track.append(bar);
      label.dateTime=row.date;label.textContent=date(row.date+'T12:00:00+08:00',true);
      column.setAttribute('aria-label',label.textContent+' · '+(row.value===null?c.before:number(row.value)+' '+c.views));
      column.append(value,track,label);chart.append(column);
    }
  }
  entry.addEventListener('click',()=>{render();dialog.showModal();});
  dialog.querySelector('[data-visits-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  document.addEventListener('jiake:languagechange',render);render();
  async function refresh(){
    try{
      const response=await fetch(source+'?v='+Math.floor(Date.now()/300000),{credentials:'omit',signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw new Error('Unavailable');
      const data=await response.json();if(!valid(data))throw new Error('Invalid statistics');
      state=data;failed=false;
    }catch{failed=true;}
    render();
  }
  refresh();
  setInterval(()=>{if(!document.hidden)refresh();},15*60000);
})();
