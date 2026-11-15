import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const homepage=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const bootstrap=homepage.match(/<script id="home-bootstrap">([\s\S]*?)<\/script>/)[1];
const controller=fs.readFileSync(new URL('../assets/intro.js',import.meta.url),'utf8');

function startup({search='',hash='',saved=null,seen=false,reduced=false,decoding='ready',mobile=false}={}) {
  const classes=new Set();
  const classList={add:(...names)=>names.forEach(name=>classes.add(name)),remove:(...names)=>names.forEach(name=>classes.delete(name)),contains:name=>classes.has(name)};
  const listeners=new Map(),dialogListeners=new Map(),timers=new Map();
  let nextTimer=0;
  const skip={},replay={},hero={classList};
  let resolvePicture;
  const decoded=decoding==='pending'?new Promise(resolve=>{resolvePicture=resolve;}):Promise.resolve();
  const card={dataset:{},display:'block'},hiddenCard={dataset:{},display:'none'};
  const picture={dataset:{introSrc:'images/web/test-400.webp',introMobileSrc:'images/web/test-mobile.webp'},naturalWidth:decoding==='failed'?0:400,closest:()=>card,decode:()=>decoded};
  const hiddenPicture={dataset:{introSrc:'images/web/desktop-only.webp'},naturalWidth:160,closest:()=>hiddenCard,decode:()=>Promise.resolve()};
  const dialogClasses=new Set();
  const dialog={open:false,classList:{add:(...names)=>names.forEach(name=>dialogClasses.add(name)),remove:(...names)=>names.forEach(name=>dialogClasses.delete(name))},dataset:{},querySelector:()=>skip,querySelectorAll:selector=>selector==='.intro-fragment img'?[picture,hiddenPicture]:selector==='.intro-fragment'?[card,hiddenCard]:[],addEventListener:(name,fn)=>dialogListeners.set(name,fn),showModal(){this.open=true;},close(){this.open=false;dialogListeners.get('close')?.();}};
  skip.addEventListener=(name,fn)=>{skip[name]=fn;};
  replay.addEventListener=(name,fn)=>{replay[name]=fn;};
  const document={documentElement:{classList},readyState:'loading',getElementById:id=>id==='site-intro'?dialog:null,addEventListener:(name,fn)=>listeners.set(name,fn),dispatchEvent:event=>listeners.get(event.type)?.(event)};
  const context=vm.createContext({document,location:{search,hash},navigator:{language:'zh-CN'},URLSearchParams,localStorage:{getItem:()=>saved},sessionStorage:{getItem:()=>seen?'1':null,setItem(){}},getComputedStyle:card=>({display:card.display}),matchMedia:query=>({matches:query.includes('reduced-motion')?reduced:mobile,addEventListener(){}}),HTMLDialogElement:{prototype:{showModal(){}}},setTimeout:(fn,ms)=>{const id=++nextTimer;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id),CustomEvent:class{constructor(type){this.type=type;}}});
  context.window=context;
  vm.runInContext(bootstrap,context);
  return {context,document,classes,dialog,dialogClasses,skip,replay,hero,picture,hiddenPicture,card,hiddenCard,resolvePicture,timers,listeners,load:()=>vm.runInContext(controller,context)};
}

async function settle(){for(let i=0;i<10;i++)await Promise.resolve();}

test('first visit defaults to English regardless of browser locale, behind an immediate intro cover',()=>{
  const page=startup();
  assert.equal(page.document.documentElement.lang,'en');
  assert(page.classes.has('intro-pending'));
  page.load(); // Hero and replay button have not been parsed yet.
  assert(page.dialog.open);
  assert(page.classes.has('intro-playing'));
  assert(!page.classes.has('intro-pending'));
});

test('intro pictures are requested only when the animation actually starts',()=>{
  const first=startup();first.load();
  assert.equal(first.picture.src,'images/web/test-400.webp');
  const returning=startup({seen:true});returning.load();
  assert.equal(returning.picture.src,undefined);
  assert.equal(returning.picture.dataset.introSrc,'images/web/test-400.webp');
});

test('language links override the remembered preference, and a returning visitor keeps their choice',()=>{
  assert.equal(startup({saved:'fr'}).document.documentElement.lang,'fr');
  assert.equal(startup({saved:'fr',search:'?lang=es'}).document.documentElement.lang,'es');
  assert.equal(startup({saved:'invalid',search:'?lang=invalid'}).document.documentElement.lang,'en');
});

test('chapter links, reduced motion and an already-seen intro open directly on the page',()=>{
  for(const options of [{hash:'#experience'},{reduced:true},{seen:true}]) {
    const page=startup(options);
    assert(!page.classes.has('intro-pending'));
    page.load();
    assert(!page.dialog.open);
    assert(!page.classes.has('intro-playing'));
  }
});

test('a delayed or failed controller releases the cover and cannot interrupt the homepage later',()=>{
  const page=startup();
  [...page.timers.values()].find(timer=>timer.ms===5000).fn();
  assert(!page.classes.has('intro-pending'));
  page.load();
  assert(!page.dialog.open);
  assert(!page.classes.has('intro-playing'));
});

test('skip works before the homepage exists; replay binds when the homepage finishes parsing',()=>{
  const page=startup();
  page.load();
  page.skip.click();
  assert(!page.dialog.open);
  assert(!page.classes.has('intro-playing'));
  assert.equal(page.timers.size,0);
  page.document.getElementById=id=>({'site-intro':page.dialog,'hero':page.hero,'intro-replay':page.replay}[id]);
  page.listeners.get('DOMContentLoaded')();
  page.replay.click();
  assert(page.dialog.open);
});

test('the photo sequence starts only after the visible images have decoded',async()=>{
  const page=startup({decoding:'pending'});page.load();
  assert.equal(page.dialog.dataset.phase,'preparing');
  assert(!page.dialogClasses.has('is-ready'));
  assert(![...page.timers.values()].some(timer=>timer.ms===4300));
  assert.equal(page.hiddenPicture.src,undefined,'CSS-hidden desktop images must not download on mobile');
  page.resolvePicture();await settle();
  assert(page.dialogClasses.has('is-ready'));
  assert.equal(page.dialog.dataset.phase,'portrait');
  assert.equal(page.card.dataset.imageReady,'true');
  assert.equal(page.hiddenCard.dataset.imageReady,undefined);
  assert([...page.timers.values()].some(timer=>timer.ms===4300));
});

test('phones load the smaller photo atlas without requesting desktop-only cards',async()=>{
  const page=startup({mobile:true});page.load();await settle();
  assert.equal(page.picture.src,'images/web/test-mobile.webp');
  assert.equal(page.hiddenPicture.src,undefined);
  assert.equal(page.card.dataset.imageReady,'true');
});

test('skip cancels image preparation and late decoding cannot reopen the intro',async()=>{
  const page=startup({decoding:'pending'});page.load();page.skip.click();
  page.resolvePicture();await settle();
  assert(!page.dialog.open);
  assert(!page.dialogClasses.has('is-ready'));
  assert(!page.classes.has('intro-playing'));
  assert.equal(page.timers.size,0);
});

test('failed or indefinitely slow images release the homepage within the preparation deadline',async()=>{
  const failed=startup({decoding:'failed'});failed.load();await settle();
  assert(!failed.dialog.open);
  const slow=startup({decoding:'pending'});slow.load();
  [...slow.timers.values()].find(timer=>timer.ms===1800).fn();await settle();
  assert(!slow.dialog.open);
  assert(!slow.classes.has('intro-playing'));
  slow.resolvePicture();await settle();assert(!slow.dialog.open);
});

test('homepage enhancements wait for the intro to finish, including its preparation',async()=>{
  const page=startup({decoding:'pending'});let calls=0;
  page.context.JIAKE_HOME_BOOT.afterIntro(()=>{calls++;});page.load();
  assert.equal(calls,0);
  assert(![...page.timers.values()].some(timer=>timer.ms===0));
  page.resolvePicture();await settle();assert.equal(calls,0);
  page.skip.click();
  [...page.timers.values()].find(timer=>timer.ms===0).fn();
  assert.equal(calls,1);
});

test('replay after a wider resize also loads the newly visible desktop cards',async()=>{
  const page=startup();page.load();await settle();page.skip.click();
  page.hiddenCard.display='block';
  page.document.getElementById=id=>({'site-intro':page.dialog,'hero':page.hero,'intro-replay':page.replay}[id]);
  page.listeners.get('DOMContentLoaded')();page.replay.click();await settle();
  assert.equal(page.hiddenPicture.src,'images/web/desktop-only.webp');
  assert.equal(page.hiddenCard.dataset.imageReady,'true');
});
