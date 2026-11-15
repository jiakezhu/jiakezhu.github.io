import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const controller=fs.readFileSync(new URL('../assets/home-media.js',import.meta.url),'utf8');

function media({lazy=false,below=false,logo=false,intro=false}={}) {
  const timers=new Map(),events=new Map(),created=[];let timerId=0,intersection;
  class Image {
    constructor(){this.attrs=new Map();this.dataset={};this.handlers=new Map();this.style={removeProperty:()=>{}};this.complete=false;this.naturalWidth=0;this.loading='eager';this.top=10;created.push(this);}
    get src(){return this.attrs.has('src')?new URL(this.attrs.get('src'),'https://site.test/').href:'';}
    set src(value){this.attrs.set('src',value);this.complete=false;}
    get currentSrc(){return this.src;}
    getAttribute(name){return this.attrs.get(name)??null;}
    removeAttribute(name){this.attrs.delete(name);}
    addEventListener(name,fn){this.handlers.set(name,fn);}
    closest(){return this.intro?{}:null;}
    getBoundingClientRect(){return {width:300,height:200,top:this.top,bottom:this.top+200};}
    fail(){this.complete=true;this.naturalWidth=0;this.handlers.get('error')?.();}
  }
  const photo=new Image();photo.src='images/web/photo.webp';photo.attrs.set('onerror',"this.style.display='none'");photo.loading=lazy?'lazy':'eager';photo.top=below?5000:10;
  const images=[photo];
  if(logo){const original=new Image();original.src='data:image/webp;base64,V0VCUA==';original.dataset.inlineSrc='images/web/logo.webp';const copy=new Image();copy.src='images/web/logo.webp';images.push(original,copy);}
  if(intro){const introImage=new Image();introImage.src='images/web/logo.webp';introImage.intro=true;images.push(introImage);}
  const document={currentScript:{src:'https://site.test/assets/home-media.js'},body:{},getElementById:()=>({textContent:JSON.stringify({'images/web/photo.webp':'images/web/fallback/photo.jpg'})}),querySelectorAll:selector=>images.filter(i=>selector==='img'||selector==='img[src]'&&i.getAttribute('src')||selector==='img[data-inline-src]'&&i.dataset.inlineSrc)};
  const context=vm.createContext({URL,Image,document,innerHeight:800,setTimeout:(fn,delay)=>{const id=++timerId;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),IntersectionObserver:class{constructor(fn){intersection=fn;}observe(){}},MutationObserver:class{observe(){}},addEventListener:(type,fn)=>events.set(type,fn)});
  context.window=context;vm.runInContext(controller,context);
  const fire=delay=>{const found=[...timers].find(([,t])=>t.delay===delay);assert(found,`Missing ${delay} ms timer`);timers.delete(found[0]);found[1].fn();};
  return {photo,images,created,timers,events,fire,context,enter:()=>intersection([{target:photo,isIntersecting:true}])};
}

test('a failed WebP switches to its JPEG fallback without hiding the image',()=>{
  const page=media();assert.equal(page.photo.getAttribute('onerror'),null);
  page.photo.fail();page.fire(200);
  assert.equal(new URL(page.photo.src).pathname,'/images/web/fallback/photo.jpg');
  assert.equal(page.photo.dataset.mediaState,'retrying');
  page.photo.naturalWidth=800;page.photo.handlers.get('load')();
  assert.equal(page.photo.dataset.mediaState,'loaded');assert.equal(page.timers.size,0);
});

test('a stalled image falls back after six seconds rather than waiting for a browser timeout',()=>{
  const page=media();page.fire(6000);page.fire(200);
  assert(page.photo.src.includes('/fallback/photo.jpg'));
});

test('retry attempts are bounded and reconnecting makes a new request',()=>{
  const page=media();page.photo.fail();page.fire(200);page.photo.fail();page.fire(900);page.photo.fail();
  assert.equal(page.photo.dataset.mediaState,'failed');assert.equal(page.timers.size,0);
  const previous=page.photo.src;page.events.get('online')();page.fire(200);
  assert.notEqual(page.photo.src,previous);assert.equal(new URL(page.photo.src).searchParams.get('media-retry'),'3');
});

test('an offscreen lazy image is retried only when approaching the viewport',()=>{
  const page=media({lazy:true,below:true});assert.equal(page.timers.size,0);page.photo.fail();assert.equal(page.timers.size,0);
  page.photo.top=100;page.enter();page.fire(200);assert(page.photo.src.includes('/fallback/photo.jpg'));
});

test('changing an image after a failure gives the new picture its own retry attempts',()=>{
  const page=media();page.photo.fail();page.fire(200);page.photo.fail();page.fire(900);page.photo.fail();
  page.photo.src='images/web/photo.webp';page.context.JIAKE_HOME_MEDIA.watch(page.photo);page.photo.fail();page.fire(200);
  assert.equal(new URL(page.photo.src).pathname,'/images/web/fallback/photo.jpg');
});

test('repeated brand images reuse the original inline logo',()=>{
  const page=media({logo:true});assert.equal(page.images[2].src,page.images[1].src);
  assert.equal(page.images[2].dataset.mediaOriginal,'images/web/logo.webp');
});

test('homepage logo reuse never changes the source of a running intro image',()=>{
  const page=media({logo:true,intro:true});
  assert.equal(page.images[3].src,'https://site.test/images/web/logo.webp');
});

test('desk and portrait preloads recover through the same image fallback',async()=>{
  const page=media();const result=page.context.JIAKE_HOME_MEDIA.load('images/web/photo.webp');
  const image=page.created.at(-1);image.onerror();assert(image.src.endsWith('/fallback/photo.jpg'));
  image.naturalWidth=800;image.onload();assert.equal(await result,image.src);
});

test('preloads that never respond resolve and cancel their image within the deadline',async()=>{
  const page=media();const result=page.context.JIAKE_HOME_MEDIA.load('images/web/photo.webp');
  const image=page.created.at(-1);page.fire(6500);assert.equal(await result,null);assert.equal(image.getAttribute('src'),null);
});
