/* Owner-supplied full track: try autoplay, then resume within a real user gesture. */
(() => {
  const source=document.currentScript.dataset.audioSrc;if(!source)return;
  const copy={
    zh:{play:'播放 Sunflower',pause:'关闭音乐',details:'音乐设置',close:'关闭音乐设置',idle:'背景音乐',loading:'正在加载…',playing:'正在播放',paused:'已关闭',blocked:'等待点击开启',error:'音频暂不可用 · 点击重试',hint:'Sunflower · 完整歌曲循环播放。',volume:'音量',loop:'单曲循环',player:'Sunflower 音乐播放器',noticePaused:'想边看边听？可以在这里打开 Sunflower。',noticePlaying:'Sunflower 正在播放，可以随时关闭。',noticeBlocked:'点一下页面，开启 Sunflower 背景音乐。',dismiss:'收起音乐提示'},
    en:{play:'Play Sunflower',pause:'Turn music off',details:'Music settings',close:'Close music settings',idle:'Background music',loading:'Loading…',playing:'Playing',paused:'Off',blocked:'Tap to start',error:'Audio unavailable · Try again',hint:'Sunflower · The full track on repeat.',volume:'Volume',loop:'On repeat',player:'Sunflower music player',noticePaused:'Music for your visit? Turn on Sunflower here.',noticePlaying:'Sunflower is playing. Turn it off any time.',noticeBlocked:'Tap the page to start Sunflower.',dismiss:'Dismiss music tip'},
    fr:{play:'Écouter Sunflower',pause:'Couper la musique',details:'Réglages de musique',close:'Fermer les réglages',idle:'Musique de fond',loading:'Chargement…',playing:'En cours',paused:'Coupée',blocked:'Cliquer pour écouter',error:'Audio indisponible · Réessayer',hint:'Sunflower · Le morceau complet en boucle.',volume:'Volume',loop:'En boucle',player:'Lecteur de Sunflower',noticePaused:'Envie de musique ? Écoutez Sunflower ici.',noticePlaying:'Sunflower est en cours. Vous pouvez couper la musique.',noticeBlocked:'Cliquez sur la page pour écouter Sunflower.',dismiss:'Masquer le conseil'},
    es:{play:'Reproducir Sunflower',pause:'Apagar la música',details:'Ajustes de música',close:'Cerrar ajustes',idle:'Música de fondo',loading:'Cargando…',playing:'Reproduciendo',paused:'Apagada',blocked:'Toca para escuchar',error:'Audio no disponible · Reintentar',hint:'Sunflower · La canción completa en bucle.',volume:'Volumen',loop:'En bucle',player:'Reproductor de Sunflower',noticePaused:'¿Música para tu visita? Activa Sunflower aquí.',noticePlaying:'Sunflower está sonando. Puedes apagarlo cuando quieras.',noticeBlocked:'Toca la página para escuchar Sunflower.',dismiss:'Ocultar el aviso'}
  };
  const dock=document.createElement('aside');dock.className='music-dock';
  dock.innerHTML=`<section class="music-panel" id="music-panel" hidden>
    <div class="music-panel-header"><strong>🌻 Sunflower</strong><button class="music-close" type="button">×</button></div>
    <p class="music-artist">Post Malone &amp; Swae Lee<span class="music-state" aria-live="polite"></span></p>
    <button class="music-toggle" type="button"></button><div class="music-embed"><p class="music-placeholder"></p></div>
    <p class="music-playback"><span class="music-loop-label"></span><time class="music-time">0:00</time></p>
    <label class="music-volume"><span></span><input type="range" min="0" max="100" step="1"><output></output></label>
  </section><button class="music-details" type="button" aria-controls="music-panel" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 18V5l12-2v13M9 8l12-2"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="18" cy="16" rx="3" ry="2.5"/></svg></button>
  <div class="music-notice" hidden><button class="music-notice-dismiss" type="button">×</button><p aria-live="polite"></p><button class="music-notice-action" type="button"></button></div>`;
  const navTools=document.querySelector('.nav-tools');if(!navTools)return;navTools.prepend(dock);
  const panel=dock.querySelector('.music-panel'),toggle=dock.querySelector('.music-toggle');
  const details=dock.querySelector('.music-details'),close=dock.querySelector('.music-close');
  const notice=dock.querySelector('.music-notice'),noticeAction=dock.querySelector('.music-notice-action');
  const slider=dock.querySelector('input'),output=dock.querySelector('output');
  let language=document.documentElement.lang,state='idle',audio,timer,noticeTimer,pending,attempt=0;
  let duration=0,position=0,volume=18,wanted=true,awaitingGesture=false;
  let introPlaying=Boolean(document.getElementById('site-intro')?.open);
  try{
    wanted=localStorage.getItem('jiake-music-enabled')!=='off';
    const value=localStorage.getItem('jiake-music-volume');
    if(value!==null&&Number.isFinite(Number(value)))volume=Math.max(0,Math.min(100,Number(value)));
  }catch{}
  slider.value=volume;output.value=`${volume}%`;
  const format=ms=>`${Math.floor(ms/60000)}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`;
  function renderTime(){dock.querySelector('.music-time').textContent=`${format(position)}${duration?` / ${format(duration)}`:''}`;}
  function render(){
    const t=copy[language]||copy.en,playing=audio&&!audio.paused;
    dock.dataset.state=state;toggle.setAttribute('aria-label',playing?t.pause:t.play);
    toggle.innerHTML=(playing?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2h3v12H3zM10 2h3v12h-3z"/></svg>':'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2v12l10-6z"/></svg>')+`<span>${playing?t.pause:t.play}</span>`;
    details.setAttribute('aria-label',`${t.details} · Sunflower`);details.title=`Sunflower · ${t[state]}`;close.setAttribute('aria-label',t.close);
    dock.querySelector('.music-state').textContent=t[state];dock.querySelector('.music-volume span').textContent=t.volume;
    dock.querySelector('.music-loop-label').textContent=t.loop;
    const placeholder=dock.querySelector('.music-placeholder');if(placeholder)placeholder.textContent=t.hint;
    notice.querySelector('p').textContent=state==='playing'?t.noticePlaying:state==='blocked'?t.noticeBlocked:state==='error'?t.error:t.noticePaused;
    noticeAction.textContent=state==='playing'?t.pause:t.play;
    dock.querySelector('.music-notice-dismiss').setAttribute('aria-label',t.dismiss);
    if(audio)audio.setAttribute('aria-label',t.player);renderTime();
  }
  function setState(next){state=next;render();}
  function expand(open){panel.hidden=!open;details.setAttribute('aria-expanded',String(open));}
  function savePreference(){try{localStorage.setItem('jiake-music-enabled',wanted?'on':'off');}catch{}}
  function saveVolume(){try{localStorage.setItem('jiake-music-volume',String(volume));}catch{}}
  function hideNotice(){notice.hidden=true;clearTimeout(noticeTimer);}
  function showNotice(){
    if(introPlaying||!['playing','blocked','paused','error'].includes(state))return;
    notice.hidden=false;render();clearTimeout(noticeTimer);noticeTimer=setTimeout(hideNotice,12000);
  }
  function removeGesture(){
    awaitingGesture=false;document.removeEventListener('pointerup',resume,true);document.removeEventListener('click',resume,true);document.removeEventListener('keydown',resume,true);
  }
  function waitForGesture(){
    awaitingGesture=true;document.addEventListener('pointerup',resume,true);document.addEventListener('click',resume,true);document.addEventListener('keydown',resume,true);
  }
  function resume(event){
    if(!awaitingGesture||!wanted||event.target.closest?.('.music-dock')||['Shift','Control','Alt','Meta','Escape'].includes(event.key))return;
    startPlayback(true);
  }
  function fail(automatic=false){clearTimeout(timer);removeGesture();setState('error');if(automatic)showNotice();else {hideNotice();expand(true);}}
  function ensureAudio(){
    if(audio)return;audio=new Audio();audio.preload='metadata';audio.loop=true;audio.controls=true;
    audio.className='music-native';audio.volume=volume/100;dock.querySelector('.music-embed').replaceChildren(audio);
    audio.addEventListener('loadedmetadata',()=>{duration=Number.isFinite(audio.duration)?audio.duration*1000:0;renderTime();});
    audio.addEventListener('play',()=>setState('loading'));
    audio.addEventListener('playing',()=>{clearTimeout(timer);removeGesture();setState('playing');showNotice();});
    audio.addEventListener('waiting',()=>setState('loading'));
    audio.addEventListener('pause',()=>{
      // A rejected autoplay attempt can emit pause; it is not a visitor opting out.
      if(wanted&&['loading','blocked'].includes(state))return;
      clearTimeout(timer);if(state!=='error'){wanted=false;savePreference();removeGesture();setState('paused');hideNotice();}
    });
    audio.addEventListener('timeupdate',()=>{const next=audio.currentTime*1000;if(position>duration-1000&&next+1000<position)dock.dataset.loops=String(Number(dock.dataset.loops||0)+1);position=next;renderTime();});
    audio.addEventListener('volumechange',()=>{volume=Math.round(audio.volume*100);slider.value=volume;output.value=`${volume}%`;saveVolume();});
    audio.addEventListener('error',()=>fail(true));audio.src=source;
  }
  function startPlayback(automatic=false){
    if(!wanted||pending)return;ensureAudio();if(!audio.paused)return;
    if(state==='error')audio.load();const token=++attempt;setState('loading');
    clearTimeout(timer);timer=setTimeout(()=>fail(automatic),20000);
    const request=audio.play();pending=request;
    request.catch(error=>{
      if(token!==attempt||!wanted)return;clearTimeout(timer);
      if(error.name==='NotAllowedError'){setState('blocked');waitForGesture();showNotice();}
      else if(error.name!=='AbortError')fail(automatic);
    }).finally(()=>{if(pending===request)pending=null;});
  }
  function turnOff(){wanted=false;attempt++;pending=null;savePreference();removeGesture();hideNotice();clearTimeout(timer);audio?.pause();setState('paused');}
  function togglePlayback(){
    if(audio&&!audio.paused){turnOff();return;}
    wanted=true;savePreference();startPlayback();
  }
  toggle.addEventListener('click',togglePlayback);
  noticeAction.addEventListener('click',()=>{if(state==='playing')turnOff();else togglePlayback();});
  dock.querySelector('.music-notice-dismiss').addEventListener('click',hideNotice);
  details.addEventListener('click',()=>{hideNotice();expand(panel.hidden);});
  close.addEventListener('click',()=>{expand(false);details.focus();});
  document.addEventListener('click',event=>{if(!event.composedPath().includes(dock))expand(false);});
  dock.addEventListener('keydown',event=>{if(event.key==='Escape'){expand(false);hideNotice();details.focus();}});
  slider.addEventListener('input',()=>{volume=Number(slider.value);output.value=`${volume}%`;if(audio)audio.volume=volume/100;saveVolume();});
  document.addEventListener('jiake:languagechange',event=>{language=event.detail.language;render();});
  document.addEventListener('jiake:introstart',()=>{introPlaying=true;hideNotice();if(wanted)startPlayback(true);});
  document.addEventListener('jiake:introend',()=>{introPlaying=false;showNotice();});
  render();if(wanted)startPlayback(true);else {setState('paused');showNotice();}
})();
