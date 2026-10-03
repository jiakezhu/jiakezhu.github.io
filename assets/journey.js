(() => {
  const maps = new Map();
  let dataPromise;
  const visited = new Set(['CHN','FRA','CHE','DEU','BEL','NLD','ESP','ITA','VAT','CZE','AUT','HUN','SVK','LUX','NOR','FIN']);
  const visitedProvinces = new Set(['Beijing','Shanghai','Jiangsu','Zhejiang','Anhui','Chongqing','Sichuan','Hunan','Ningxia','Guangdong']);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = () => {
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(['bg','surface','text','muted','gold','sage','coral','border-s'].map(name => [name,style.getPropertyValue('--'+name).trim()]));
  };
  const label = text => document.documentElement.lang === 'zh' ? (staticZhText[text] || text) : text;
  const countryStyle = feature => {
    const palette = colors(), highlighted = visited.has(feature.properties.iso) || feature.properties.iso === 'TWN';
    return {color:highlighted ? palette.sage : palette.muted,weight:highlighted ? 1.1 : .6,opacity:highlighted ? .6 : .22,fillColor:highlighted ? palette.sage : palette.muted,fillOpacity:highlighted ? .19 : .045};
  };
  const provinceStyle = feature => {
    const palette = colors(), name = feature.properties.name;
    const hue = [...name].reduce((sum,char) => sum + char.charCodeAt(0),0) % 3;
    return {color:palette.sage,weight:.7,opacity:.33,fillColor:palette[['sage','gold','coral'][hue]],fillOpacity:visitedProvinces.has(name) ? .2 : .075};
  };
  const drawings = {
    mountains:'<path d="M4 66L29 20L55 66M39 66L63 31L86 66M20 36L29 40L36 34M55 45L63 48L69 43M7 74H82"/>',
    boat:'<path d="M14 58H75L64 72H27ZM44 12V58M38 20L18 49H38ZM50 23L69 50H50M9 79Q19 73 29 79T49 79T69 79T89 79"/>',
    pagoda:'<path d="M18 72H72M26 72V54H64V72M24 53H66L60 46H30ZM30 46V32H60V46M25 32H65L54 24H36ZM38 24V15H52V24M45 6V15M38 61V72M52 61V72"/>',
    abbey:'<path d="M8 72L18 62H27V47H34V37H41V22L45 8L49 22V37H56V47H63V62H73L84 72ZM20 62V55H27M63 55H71V65M34 47H56M41 37H49M40 57V68H50V57ZM45 3V11M41 7H49M6 80Q17 74 28 80T50 80T72 80T88 80"/>',
    windmill:'<path d="M33 40L27 74H61L55 40ZM43 23V40M37 56H49V74M43 30L17 14L12 23L39 35M43 30L62 6L70 13L48 35M43 30L67 48L61 56L40 35M43 30L25 55L17 49L39 25M12 79H77"/>'
  };
  const drawing = name => `<svg viewBox="0 0 90 90" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawings[name]}</svg>`;
  const loadData = () => dataPromise ||= Promise.all([
    fetch('assets/maps/countries.geojson').then(response => {if(!response.ok) throw new Error('Map geometry unavailable');return response.json();}),
    fetch('assets/maps/places.json?v=2').then(response => {if(!response.ok) throw new Error('Places unavailable');return response.json();}),
    fetch('assets/maps/china-provinces.geojson?v=1').then(response => {if(!response.ok) throw new Error('Province geometry unavailable');return response.json();}).catch(() => null)
  ]).catch(error => {dataPromise = null;throw error;});
  function reset(view) {
    const entry = maps.get(view);
    if (!entry) return;
    if (entry.selectionCallback) entry.map.off('moveend',entry.selectionCallback);
    entry.selectionCallback=null;
    entry.pins.forEach(({pin}) => { if (!pin.getTooltip()?.options.permanent) pin.closeTooltip(); });
    const options = {animate:!reducedMotion.matches,padding:[32,35],maxZoom:5};
    entry.map.fitBounds(view === 'china' ? [[21.5,100],[41.5,124]] : [[40,-5],[58,24]],options);
    document.querySelectorAll('.jp-tag').forEach(button => button.setAttribute('aria-pressed','false'));
    document.querySelectorAll('[data-map-focus]').forEach(button => button.setAttribute('aria-pressed','false'));
    entry.pins.forEach(({pin}) => pin.getElement()?.classList.remove('is-selected'));
  }
  function marker(point,view,milestone) {
    const entry = maps.get(view), name = label(point.label);
    const landmark = point.landmark;
    const icon = L.divIcon({className:'atlas-marker'+(milestone?' atlas-marker--life':'')+(landmark?' atlas-marker--landmark':'')+(point.region?' atlas-marker--region':''),html:landmark?drawing(landmark):'<i></i>',iconSize:landmark?[44,48]:[24,24],iconAnchor:landmark?[22,43]:[12,12]});
    const pin = L.marker([point.lat,point.lng],{icon,title:name,keyboard:true});
    const isHangzhou = point.label.startsWith('ZJSU');
    const shortName = milestone ? label(point.label.includes('Ningbo')?'Ningbo':isHangzhou?'Hangzhou':point.label.includes('Chengdu')?'Chengdu':'Paris') : name;
    pin.bindTooltip(shortName,{permanent:(milestone || landmark) && innerWidth>700,direction:isHangzhou?'left':'right',offset:landmark?[20,-12]:milestone?[12,isHangzhou?-15:12]:[10,0],className:'atlas-tooltip'});
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
    const entry = {map,pins:new Map(),grid:[],base:null,decorations:[]};
    maps.set(view,entry);
    map.attributionControl.setPrefix(false);
    map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a>');
    L.control.zoom({position:'bottomright'}).addTo(map);
    reset(view);
    try {
      entry.ready = loadData();
      const [geography,places,provinces] = await entry.ready;
      // A language switch can replace a map while its shared data is loading.
      if (maps.get(view) !== entry) return;
      entry.baseStyle = feature => view === 'china' && provinces && feature.properties.iso === 'CHN' ? {opacity:0,fillOpacity:0} : countryStyle(feature);
      entry.base = L.geoJSON(geography,{style:entry.baseStyle,interactive:false}).addTo(map);
      if (view === 'china' && provinces) entry.provinces = L.geoJSON(provinces,{style:provinceStyle,interactive:false}).addTo(map);
      const palette = colors();
      for (let longitude=-180;longitude<=180;longitude+=10) entry.grid.push(L.polyline([[-80,longitude],[80,longitude]],{interactive:false,color:palette.muted,weight:.5,opacity:.1}).addTo(map));
      for (let latitude=-70;latitude<=70;latitude+=10) entry.grid.push(L.polyline([[latitude,-180],[latitude,180]],{interactive:false,color:palette.muted,weight:.5,opacity:.1}).addTo(map));
      const {milestones,cities} = places[view];
      if (view === 'china') {
        entry.route = L.polyline(milestones.map(point => [point.lat,point.lng]),{color:palette.gold,weight:2,opacity:.8,dashArray:'5 7',className:'atlas-route',interactive:false}).addTo(map);
        L.marker([37,109],{interactive:false,keyboard:false,icon:L.divIcon({className:'atlas-label',html:document.documentElement.lang==='zh'?'中国 / CHINA':'CHINA',iconSize:[110,24]})}).addTo(map);
      }
      const sketches = view === 'china' ? [['mountains',33,99.8],['boat',28,126],['pagoda',27.5,107.5]] : [['mountains',45.5,9.6],['boat',44,-4],['windmill',54,5]];
      sketches.forEach(([name,lat,lng]) => entry.decorations.push(L.marker([lat,lng],{interactive:false,keyboard:false,icon:L.divIcon({className:'atlas-sketch atlas-sketch--'+name,html:drawing(name),iconSize:[70,70],iconAnchor:[35,35]})}).addTo(map)));
      cities.forEach(point => marker(point,view,false));
      milestones.forEach(point => marker(point,view,true));
      if (view === 'china') {
        entry.cluster = L.marker([22.95,113.75],{title:label('Guangdong stops'),icon:L.divIcon({className:'atlas-cluster',html:'<span>5</span><small>'+label('Lingnan')+'</small>',iconSize:[64,54],iconAnchor:[32,27]})});
        entry.cluster.on('add',() => entry.cluster.getElement()?.setAttribute('aria-label',label('Explore Guangdong')));
        entry.cluster.on('click',() => focus('lingnan'));
      }
      const updateZoom = () => {
        const close = map.getZoom() >= 6;
        entry.decorations.forEach(pin => {if(close && map.hasLayer(pin)) map.removeLayer(pin);else if(!close && !map.hasLayer(pin)) pin.addTo(map);});
        if (!entry.cluster) return;
        entry.pins.forEach(({point,pin}) => {if(point.group !== 'lingnan') return;if(close && !map.hasLayer(pin)) pin.addTo(map);else if(!close && map.hasLayer(pin)) map.removeLayer(pin);});
        if (close && map.hasLayer(entry.cluster)) map.removeLayer(entry.cluster);
        else if (!close && !map.hasLayer(entry.cluster)) entry.cluster.addTo(map);
      };
      map.on('zoomend',updateZoom);updateZoom();
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
  async function focus(place) {
    const view = place === 'lingnan' ? 'china' : 'europe';
    await init(view);
    const entry = maps.get(view);
    if (!entry) return;
    if (entry.selectionCallback) entry.map.off('moveend',entry.selectionCallback);
    entry.selectionCallback=null;
    document.querySelectorAll('.jp-tag').forEach(button => button.setAttribute('aria-pressed','false'));
    entry.pins.forEach(({pin}) => pin.getElement()?.classList.remove('is-selected'));
    if (place === 'lingnan') {
      entry.map.fitBounds([[22.5,113.05],[23.22,114.42]],{padding:[55,55],maxZoom:8,animate:!reducedMotion.matches});
    } else if (place === 'north') entry.map.fitBounds([[59,16],[70.3,26]],{padding:[40,40],maxZoom:5,animate:!reducedMotion.matches});
    else {
      const selected = entry.pins.get('Mont-Saint-Michel');
      if (selected) {entry.map.setView([selected.point.lat,selected.point.lng],6,{animate:!reducedMotion.matches});selected.pin.openTooltip();}
    }
    document.querySelectorAll('[data-map-focus]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.mapFocus === place)));
  }
  document.querySelectorAll('[data-map-focus]').forEach(button => button.addEventListener('click',() => focus(button.dataset.mapFocus)));
  document.querySelectorAll('.jp-tag').forEach(button => {
    button.setAttribute('aria-pressed','false');
    button.addEventListener('click',async () => {
      await init('china');
      const entry = maps.get('china');
      const aliases = {'West Sichuan':'W. Sichuan','Hangzhou':'ZJSU · Hangzhou','Chengdu':'SWUFE · Chengdu'};
      const selected = entry?.pins.get(aliases[button.dataset.place] || button.dataset.place);
      if (!selected) return;
      document.querySelectorAll('[data-map-focus]').forEach(button => button.setAttribute('aria-pressed','false'));
      document.querySelectorAll('.jp-tag').forEach(chip => chip.setAttribute('aria-pressed',String(chip===button)));
      const highlight = () => {
        entry.map.off('moveend',highlight);entry.selectionCallback=null;
        selected.pin.openTooltip();
        entry.pins.forEach(({pin}) => pin.getElement()?.classList.toggle('is-selected',pin===selected.pin));
      };
      if (entry.selectionCallback) entry.map.off('moveend',entry.selectionCallback);
      entry.selectionCallback=highlight;entry.map.once('moveend',highlight);
      entry.map.setView([selected.point.lat,selected.point.lng],selected.point.region?5.5:selected.point.group?8:6,{animate:!reducedMotion.matches});
      // setView may be a no-op when a selected place is already centred.
      if (entry.map.hasLayer(selected.pin)) highlight();
    });
  });
  new MutationObserver(() => {
    const palette = colors();
    maps.forEach(entry => {entry.base?.setStyle(entry.baseStyle);entry.provinces?.setStyle(provinceStyle);entry.grid.forEach(line => line.setStyle({color:palette.muted}));entry.route?.setStyle({color:palette.gold});});
  }).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const section = document.getElementById('journey');
  if (section) {
    const observer = new IntersectionObserver(entries => {if(entries[0].isIntersecting){init(document.querySelector('.map-tab-btn.active')?.dataset.view || 'china');observer.disconnect();}},{threshold:.05});
    observer.observe(section);
  }
})();
