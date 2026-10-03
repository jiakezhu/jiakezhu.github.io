(() => {
  const maps = new Map();
  let dataPromise;
  const visited = new Set(['CHN','FRA','CHE','DEU','BEL','NLD','ESP','ITA','VAT','CZE','AUT','HUN','SVK','LUX','NOR','FIN']);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = () => {
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(['bg','surface','text','muted','gold','sage','border-s'].map(name => [name,style.getPropertyValue('--'+name).trim()]));
  };
  const label = text => document.documentElement.lang === 'zh' ? (staticZhText[text] || text) : text;
  const countryStyle = feature => {
    const palette = colors(), highlighted = visited.has(feature.properties.iso);
    return {color:highlighted ? palette.sage : palette.muted,weight:highlighted ? 1 : .6,opacity:highlighted ? .52 : .2,fillColor:highlighted ? palette.sage : palette.muted,fillOpacity:highlighted ? .13 : .055};
  };
  const loadData = () => dataPromise ||= Promise.all([
    fetch('assets/maps/countries.geojson').then(response => {if(!response.ok) throw new Error('Map geometry unavailable');return response.json();}),
    fetch('assets/maps/places.json').then(response => {if(!response.ok) throw new Error('Places unavailable');return response.json();})
  ]).catch(error => {dataPromise = null;throw error;});
  function reset(view) {
    const entry = maps.get(view);
    if (!entry) return;
    entry.pins.forEach(({pin}) => { if (!pin.getTooltip()?.options.permanent) pin.closeTooltip(); });
    const options = {animate:!reducedMotion.matches,padding:[32,35],maxZoom:5};
    entry.map.fitBounds(view === 'china' ? [[26,100],[41,125]] : [[40,-5],[58,24]],options);
    document.querySelectorAll('.jp-tag').forEach(button => button.setAttribute('aria-pressed','false'));
  }
  function marker(point,view,milestone) {
    const entry = maps.get(view), name = label(point.label);
    const icon = L.divIcon({className:'atlas-marker'+(milestone?' atlas-marker--life':''),html:'<i></i>',iconSize:[24,24],iconAnchor:[12,12]});
    const pin = L.marker([point.lat,point.lng],{icon,title:name,keyboard:true});
    const isHangzhou = point.label.startsWith('ZJSU');
    pin.bindTooltip(name,{permanent:milestone && innerWidth>700,direction:isHangzhou?'left':'right',offset:milestone?[12,isHangzhou?-15:12]:[10,0],className:'atlas-tooltip'});
    pin.on('add',() => pin.getElement()?.setAttribute('aria-label',name));
    pin.on('click',() => pin.openTooltip());
    pin.addTo(entry.map);
    entry.pins.set(point.label,{point,pin});
  }
  async function init(view) {
    if (!window.L) return;
    const existing = maps.get(view);
    if (existing) {existing.map.invalidateSize();await existing.ready?.catch(() => {});return;}
    const container = document.getElementById('journey-map-'+view);
    if (!container) return;
    const map = L.map(container,{zoomControl:false,scrollWheelZoom:false,minZoom:2,maxZoom:8,zoomSnap:.5}).setView(view==='china'?[33,112]:[50,9],4);
    const entry = {map,pins:new Map(),grid:[],base:null};
    maps.set(view,entry);
    map.attributionControl.setPrefix(false);
    map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a>');
    L.control.zoom({position:'bottomright'}).addTo(map);
    reset(view);
    try {
      entry.ready = loadData();
      const [geography,places] = await entry.ready;
      // A language switch can replace a map while its shared data is loading.
      if (maps.get(view) !== entry) return;
      entry.base = L.geoJSON(geography,{style:countryStyle,interactive:false}).addTo(map);
      const palette = colors();
      for (let longitude=-180;longitude<=180;longitude+=10) entry.grid.push(L.polyline([[-80,longitude],[80,longitude]],{interactive:false,color:palette.muted,weight:.5,opacity:.1}).addTo(map));
      for (let latitude=-70;latitude<=70;latitude+=10) entry.grid.push(L.polyline([[latitude,-180],[latitude,180]],{interactive:false,color:palette.muted,weight:.5,opacity:.1}).addTo(map));
      const {milestones,cities} = places[view];
      if (view === 'china') {
        entry.route = L.polyline(milestones.map(point => [point.lat,point.lng]),{color:palette.gold,weight:2,opacity:.8,dashArray:'5 7',className:'atlas-route',interactive:false}).addTo(map);
        L.marker([36,109],{interactive:false,keyboard:false,icon:L.divIcon({className:'atlas-label',html:document.documentElement.lang==='zh'?'中国 / CHINA':'CHINA',iconSize:[110,24]})}).addTo(map);
      }
      cities.forEach(point => marker(point,view,false));
      milestones.forEach(point => marker(point,view,true));
    } catch {
      if (maps.get(view) !== entry) return;
      const notice = document.createElement('p');
      notice.className = 'atlas-load-error';
      notice.textContent = document.documentElement.lang==='zh'?'地图暂时未能加载，足迹列表仍可阅读。':'The map could not load. The list of places is still available.';
      container.append(notice);
    }
  }
  window.switchJourneyView = view => {
    if (!['china','europe'].includes(view)) return;
    document.querySelectorAll('.map-tab-btn').forEach(button => {button.classList.toggle('active',button.dataset.view===view);button.setAttribute('aria-pressed',String(button.dataset.view===view));});
    document.querySelectorAll('.journey-panel').forEach(panel => panel.classList.toggle('active',panel.id==='jp-'+view));
    init(view);
  };
  window._refreshJourneyMaps = () => {
    const hadMaps = maps.size > 0;
    maps.forEach(entry => entry.map.remove());maps.clear();
    if (hadMaps) init(document.querySelector('.map-tab-btn.active')?.dataset.view || 'china');
  };
  document.querySelectorAll('[data-map-reset]').forEach(button => button.addEventListener('click',() => reset(button.dataset.mapReset)));
  document.querySelectorAll('.jp-tag').forEach(button => {
    button.setAttribute('aria-pressed','false');
    button.addEventListener('click',async () => {
      await init('china');
      const entry = maps.get('china');
      const aliases = {'West Sichuan':'W. Sichuan','Hangzhou':'ZJSU · Hangzhou','Chengdu':'SWUFE · Chengdu'};
      const selected = entry?.pins.get(aliases[button.dataset.place] || button.dataset.place);
      if (!selected) return;
      document.querySelectorAll('.jp-tag').forEach(chip => chip.setAttribute('aria-pressed',String(chip===button)));
      entry.map.setView([selected.point.lat,selected.point.lng],6,{animate:!reducedMotion.matches});selected.pin.openTooltip();
    });
  });
  new MutationObserver(() => {
    const palette = colors();
    maps.forEach(entry => {entry.base?.setStyle(countryStyle);entry.grid.forEach(line => line.setStyle({color:palette.muted}));entry.route?.setStyle({color:palette.gold});});
  }).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const section = document.getElementById('journey');
  if (section) {
    const observer = new IntersectionObserver(entries => {if(entries[0].isIntersecting){init(document.querySelector('.map-tab-btn.active')?.dataset.view || 'china');observer.disconnect();}},{threshold:.05});
    observer.observe(section);
  }
})();
