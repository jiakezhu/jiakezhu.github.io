// Sound samples from Jesse Zhou's Ramen-Shop. Kept local and routed through one mute control.
export function createStoryAudio(button,onState) {
  const base=new URL('../images/story-ramen/sounds/',document.baseURI);
  const volumes={arcade:.15,bloop:.3,click:.3,ding:.14,cooking:.05,whoosh:.6,hologram:.2};
  const buffers=new Map();let context,master,analyser,loading,ambient,meter,enabled=true,unlocked=false,lastHover=0;
  try{enabled=localStorage.getItem('jiake-story-sound')!=='off';}catch{}
  function state(){button.setAttribute('aria-pressed',String(enabled));button.dataset.audioBuffers=String(buffers.size);button.dataset.audioState=unlocked?(enabled?'running':'muted'):(enabled?'waiting':'muted');onState?.();}
  function play(name,{loop=false}={}) {
    if(!enabled||!unlocked||document.hidden||!buffers.has(name))return;
    const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffers.get(name);source.loop=loop;gain.gain.value=volumes[name];source.connect(gain);gain.connect(master);source.start();button.dataset.lastSound=name;return source;
  }
  async function unlock(){
    if(!enabled)return false;
    if(!context){
      const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){enabled=false;state();return false;}
      context=new Audio();master=context.createGain();master.gain.value=.7;analyser=context.createAnalyser();analyser.fftSize=512;master.connect(analyser);analyser.connect(context.destination);
      loading=Promise.all(Object.keys(volumes).map(async name=>{try{const response=await fetch(new URL(name+'.mp3',base));if(!response.ok)throw new Error('Audio unavailable');const data=await response.arrayBuffer();buffers.set(name,await context.decodeAudioData(data));}catch(error){console.warn('Story sound unavailable:',name,error.message);}}));
    }
    if(context.state==='suspended')await context.resume();await loading;unlocked=context.state==='running';
    if(!ambient&&unlocked&&enabled)ambient=play('cooking',{loop:true});
    if(!meter){const samples=new Float32Array(analyser.fftSize);meter=setInterval(()=>{analyser.getFloatTimeDomainData(samples);const rms=Math.sqrt(samples.reduce((n,v)=>n+v*v,0)/samples.length);button.dataset.audioLevel=String(Math.round(rms*1e6));},500);}
    state();return unlocked;
  }
  async function toggle(){enabled=unlocked?!enabled:true;if(enabled){await unlock();master?.gain.setTargetAtTime(.7,context.currentTime,.04);play('ding');}else master?.gain.setTargetAtTime(0,context.currentTime,.025);try{localStorage.setItem('jiake-story-sound',enabled?'on':'off');}catch{}state();}
  button.addEventListener('click',toggle);button.setAttribute('aria-keyshortcuts','m');
  const start=event=>{if(event.target.closest?.('[data-world-audio]'))return;if(enabled&&!unlocked)unlock();};
  document.addEventListener('pointerdown',start,{capture:true});document.addEventListener('keydown',event=>{if(event.target.closest?.('input,textarea,[contenteditable=true]'))return;if(event.key.toLowerCase()==='m')toggle();else if(['Enter',' '].includes(event.key))start(event);},{capture:true});
  document.addEventListener('visibilitychange',()=>{if(master)master.gain.setTargetAtTime(!document.hidden&&enabled?.7:0,context.currentTime,.06);});
  state();
  return {
    async select(id){await unlock();if(!enabled)return;play({journal:'arcade',wechat:'ding',growth:'bloop'}[id]||'click');play('whoosh');},
    hover(id){if(!id||performance.now()-lastHover<180||!unlocked)return;lastHover=performance.now();play('click');},
    async close(){await unlock();play('whoosh');},async effect(name){await unlock();play(name);},unlock,getState:()=>({enabled,unlocked}),refresh:state
  };
}
