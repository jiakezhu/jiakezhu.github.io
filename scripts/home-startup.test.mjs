import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const homepage=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const bootstrap=homepage.match(/<script id="home-bootstrap">([\s\S]*?)<\/script>/)[1];
const controller=fs.readFileSync(new URL('../assets/intro.js',import.meta.url),'utf8');

function startup({search='',hash='',saved=null,seen=false,reduced=false}={}) {
  const classes=new Set();
  const classList={add:(...names)=>names.forEach(name=>classes.add(name)),remove:(...names)=>names.forEach(name=>classes.delete(name)),contains:name=>classes.has(name)};
  const listeners=new Map(),dialogListeners=new Map(),timers=new Map();
  let nextTimer=0;
  const skip={},replay={},hero={classList};
  const picture={dataset:{introSrc:'images/web/test-400.webp'}};
  const dialog={open:false,classList:{add(){},remove(){}},dataset:{},querySelector:()=>skip,querySelectorAll:selector=>selector==='[data-intro-src]'&&picture.dataset.introSrc?[picture]:[],addEventListener:(name,fn)=>dialogListeners.set(name,fn),showModal(){this.open=true;},close(){this.open=false;dialogListeners.get('close')?.();}};
  skip.addEventListener=(name,fn)=>{skip[name]=fn;};
  replay.addEventListener=(name,fn)=>{replay[name]=fn;};
  const document={documentElement:{classList},readyState:'loading',getElementById:id=>id==='site-intro'?dialog:null,addEventListener:(name,fn)=>listeners.set(name,fn),dispatchEvent:event=>listeners.get(event.type)?.(event)};
  const context=vm.createContext({document,location:{search,hash},navigator:{language:'zh-CN'},URLSearchParams,localStorage:{getItem:()=>saved},sessionStorage:{getItem:()=>seen?'1':null,setItem(){}},matchMedia:()=>({matches:reduced,addEventListener(){}}),HTMLDialogElement:{prototype:{showModal(){}}},setTimeout:(fn,ms)=>{const id=++nextTimer;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id),CustomEvent:class{constructor(type){this.type=type;}}});
  context.window=context;
  vm.runInContext(bootstrap,context);
  return {context,document,classes,dialog,skip,replay,hero,picture,timers,listeners,load:()=>vm.runInContext(controller,context)};
}

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
