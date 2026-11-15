import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const sharp = require('sharp');
const { createCanvas } = require('@napi-rs/canvas');
const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const manifest = JSON.parse(read('assets/web-images.json'));
const originals = new Map(Object.entries(manifest.images).flatMap(([source,item])=>item.variants.map(v=>[v.src,source])));
const attribute = (tag,name)=>tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
let html = read('index.html');
const logos = new Set(['paris1.png','swufe.png','zjsu.png','bytedance.png','alliance.png','marketunion.png','mingle.png','redcross.png','expo.png','campusfrance.png','swufe志愿.png']);
const inline = new Map(), fallbacks = {};
const tags = [...html.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]);
for (const tag of tags) {
  if(attribute(tag,'data-intro-src')) continue;
  const src = attribute(tag,'data-inline-src') || attribute(tag,'src') || attribute(tag,'data-src') || attribute(tag,'data-modal-src');
  if(!src?.startsWith('images/web/')) continue;
  const original = originals.get(src) || src, basename = path.basename(original);
  const isLogo = logos.has(basename) || /app-icon.*\.png$/.test(basename)&&Number(attribute(tag,'width'))<=200;
  if(isLogo && !inline.has(src)) {
    inline.set(src,'data:image/webp;base64,'+fs.readFileSync(path.join(root,src)).toString('base64'));
  }
  fallbacks[src] = '';
}
for(const theme of ['day','night']) for(const part of ['', 'cat-', 'wave-', 'personal-']) fallbacks[`images/web/desk/${part}${theme}.webp`] = '';
fs.mkdirSync(path.join(root,'images/web/fallback'),{recursive:true});
for (const src of Object.keys(fallbacks)) {
  const image = sharp(path.join(root,src));
  const meta = await image.metadata();
  const alpha = meta.hasAlpha;
  const dest = `images/web/fallback/${path.basename(src,'.webp')}.${alpha?'png':'jpg'}`;
  const resized = image.resize({width:Math.min(meta.width,800),withoutEnlargement:true});
  if(alpha) await resized.png({palette:true,effort:10}).toFile(path.join(root,dest));
  else await resized.jpeg({quality:82,mozjpeg:true}).toFile(path.join(root,dest));
  fallbacks[src] = dest;
}

const document = { documentElement:{dataset:{}}, createElement:()=>createCanvas(1,1) };
const context = vm.createContext({window:{},document,Math});
vm.runInContext(read('assets/verse-city.js'),context);
const City = context.window.VerseCity;
const styles = [];
for(const theme of ['dark','light']) {
  document.documentElement.dataset.theme=theme;
  const width=640,height=960,sky=height,unit=.7,pal=City.palette();
  const canvas=createCanvas(width,height),g=canvas.getContext('2d');
  City.haze(g,pal,0,0,width,height);
  const sun=City.sun(170,pal,1,false);
  g.drawImage(sun.canvas,width*.73-sun.size/2,height*.44-sun.size/2,sun.size,sun.size);
  for(let index=0;index<3;index++) {
    const layer=City.strip({index,width,tileH:height,ground:height,sky,unit,dpr:1,pal});
    g.drawImage(layer.body,0,0);g.globalAlpha=pal.glass?.9:.4+index*.15;g.drawImage(layer.lights,0,0);g.globalAlpha=1;
  }
  const poster=await sharp(canvas.toBuffer('image/png')).resize(384).flatten({background:theme==='dark'?'#151719':'#f2f1eb'}).webp({quality:58,effort:6}).toBuffer();
  styles.push(`--home-sky-${theme}:url("data:image/webp;base64,${poster.toString('base64')}")`);
}
for(const theme of ['day','night']) {
  const preview=await sharp(path.join(root,`images/web/desk/${theme}.webp`)).resize(192).webp({quality:45,effort:6}).toBuffer();
  styles.push(`--home-desk-${theme}:url("data:image/webp;base64,${preview.toString('base64')}")`);
}
const tencent='images/web/6945a9ec5c4d-160.webp';
const tencentPng=await sharp(path.join(root,tencent)).png({palette:true,effort:10}).toBuffer();
styles.push(`--home-tencent:url("data:image/png;base64,${tencentPng.toString('base64')}")`);
const block=`<!-- HOME_MEDIA_START -->\n  <style id="home-critical-media">:root{${styles.join(';')}}</style>\n  <script id="home-media-fallbacks" type="application/json">${JSON.stringify(fallbacks)}</script>\n  <!-- HOME_MEDIA_END -->`;
if(html.includes('<!-- HOME_MEDIA_START -->')) html=html.replace(/<!-- HOME_MEDIA_START -->[\s\S]*?<!-- HOME_MEDIA_END -->/,block);
else html=html.replace('</head>',block+'\n</head>');
const included=new Set();
html=html.replace(/<img\b[^>]*>/g,tag=>{
  if(attribute(tag,'data-intro-src')) return tag;
  const src=attribute(tag,'data-inline-src')||attribute(tag,'src');
  if(!inline.has(src)) return attribute(tag,'data-inline-src')?tag.replace(/\ssrc="[^"]*"/,` src="${src}"`).replace(/\sdata-inline-src="[^"]*"/,'').replace(/\sloading="eager"/,' loading="lazy"'):tag;
  if(included.has(src)) return tag.replace(/\ssrc="[^"]*"/,` src="${src}"`).replace(/\sdata-inline-src="[^"]*"/,'').replace(/\sloading="eager"/,' loading="lazy"');
  included.add(src);
  let result=tag.replace(/\ssrc="[^"]*"/,` src="${inline.get(src)}"`);
  if(!attribute(result,'data-inline-src')) result=result.replace(/>$/,` data-inline-src="${src}">`);
  result=result.replace(/\sloading="lazy"/,' loading="eager"');
  return result;
});
fs.writeFileSync(path.join(root,'index.html'),html);
console.log(`Inlined ${inline.size} original logos; prepared ${Object.keys(fallbacks).length} image fallbacks and static scene previews.`);
