(() => {
  const root=document.documentElement, entry=document.querySelector('[data-visits-open]'), dialog=document.querySelector('#story-visits');
  if(!entry||!dialog)return;
  const source='https://raw.githubusercontent.com/jiakezhu/jiakezhu.github.io/site-analytics/visits.json';
  const copy={
    zh:{open:'来访记录',title:'谢谢你来过。',scope:'全站浏览记录',total:'累计浏览',today:'今日浏览',week:'近 7 天',trend:'每天的足迹',close:'关闭来访记录',since:'开始记录',updated:'数据截至',pending:'统计正在连接',error:'暂时无法读取统计',stale:'更新有延迟，以下为最近一次记录。',note:'浏览次数，非实时在线人数。约每 3 小时更新；日期按北京时间。',before:'尚未启用',loading:'正在读取来访记录…',empty:'记录刚刚开始。',views:'次浏览'},
    en:{open:'Visit log',title:'Thanks for stopping by.',scope:'Across the website',total:'Total page views',today:'Today',week:'Last 7 days',trend:'Daily footprints',close:'Close visit log',since:'Tracking since',updated:'Data through',pending:'Connecting statistics',error:'Statistics unavailable',stale:'Updates are delayed. Showing the latest snapshot.',note:'Page views, not people online. Refreshed about every 3 hours. Dates use Beijing time.',before:'Not tracked yet',loading:'Loading the visit log…',empty:'The log has just begun.',views:'page views'},
    fr:{open:'Les visites',title:'Merci d’être passé.',scope:'Sur tout le site',total:'Pages vues au total',today:'Aujourd’hui',week:'7 derniers jours',trend:'Au fil des jours',close:'Fermer les visites',since:'Suivi depuis le',updated:'Données au',pending:'Connexion des statistiques',error:'Statistiques indisponibles',stale:'Mise à jour retardée. Dernier relevé disponible.',note:'Pages vues, pas de personnes en ligne. Actualisation environ toutes les 3 heures. Heure de Pékin.',before:'Pas encore suivi',loading:'Chargement des visites…',empty:'Le suivi vient de commencer.',views:'pages vues'},
    es:{open:'Las visitas',title:'Gracias por pasar.',scope:'En todo el sitio',total:'Páginas vistas en total',today:'Hoy',week:'Últimos 7 días',trend:'Huellas de cada día',close:'Cerrar las visitas',since:'Registro desde',updated:'Datos hasta',pending:'Conectando estadísticas',error:'Estadísticas no disponibles',stale:'Actualización retrasada. Se muestra el último registro.',note:'Páginas vistas, no personas en línea. Se actualiza aproximadamente cada 3 horas. Hora de Pekín.',before:'Sin registro aún',loading:'Cargando las visitas…',empty:'El registro acaba de empezar.',views:'páginas vistas'}
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
  function render(){
    const c=copy[lang()];
    entry.querySelector('[data-visits-label]').textContent=c.open;
    entry.setAttribute('aria-label',c.open+(state?' · '+number(state.daily.reduce((n,r)=>n+r.pageViews,0))+' '+c.views:''));
    for(const key of ['title','scope','total','today','week','trend','note'])$(key).textContent=c[key];
    dialog.querySelector('[data-visits-close]').setAttribute('aria-label',c.close);
    if(!state){$('status').textContent=failed?c.error:c.loading;return;}
    const total=state.daily.reduce((n,r)=>n+r.pageViews,0),today=day(Date.now());
    const weekStart=new Date(Date.parse(today+'T12:00:00+08:00')-6*86400000);
    const week=state.daily.filter(r=>r.date>=day(+weekStart)).reduce((n,r)=>n+r.pageViews,0);
    entry.querySelector('[data-visits-count]').textContent=number(total);
    $('total-value').textContent=number(total);
    $('today-value').textContent=state.daily.find(r=>r.date===today)?number(state.daily.find(r=>r.date===today).pageViews):'—';
    $('week-value').textContent=number(week);
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
  // Avoid live counters and animation; refresh snapshots only when the tab is visible.
  setInterval(()=>{if(!document.hidden)refresh();},15*60000);
})();
