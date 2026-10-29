import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const homepage=fs.readFileSync(path.join(root,'index.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/web-images.json'),'utf8'));
const tags=[...homepage.matchAll(/<img\b[^>]*>/g)].map(match=>match[0]);
const attribute=(tag,name)=>tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

test('web derivatives are genuine WebP files with complete, accurate size metadata',()=>{
  for(const [source,image] of Object.entries(manifest.images)) {
    assert.equal(fs.statSync(path.join(root,source)).size,image.originalBytes,source);
    for(const variant of image.variants) {
      const bytes=fs.readFileSync(path.join(root,variant.src));
      assert.equal(bytes.subarray(0,4).toString(),'RIFF',variant.src);
      assert.equal(bytes.subarray(8,12).toString(),'WEBP',variant.src);
      assert.equal(bytes.length,variant.bytes,variant.src);
      assert(variant.width<=image.width);
      assert(Math.abs(variant.height/variant.width-image.height/image.width)<.01);
    }
  }
});

test('first-screen images including the intro stay below 450 KB at the largest responsive size',()=>{
  const files=new Set();
  for(const tag of tags) {
    if(attribute(tag,'data-intro-src')) files.add(attribute(tag,'data-intro-src'));
    else if(attribute(tag,'src')&&attribute(tag,'loading')!=='lazy') {
      const srcset=attribute(tag,'srcset');
      files.add(srcset?srcset.split(',').at(-1).trim().split(/\s+/)[0]:attribute(tag,'src'));
    }
  }
  for(const match of homepage.matchAll(/url\('(images\/web\/[^']+)'\)/g))files.add(match[1]);
  const bytes=[...files].reduce((total,file)=>total+fs.statSync(path.join(root,file)).size,0);
  assert(bytes<450*1024,`${bytes} bytes exceeds the first-screen image budget`);
  assert(bytes<manifest.baseline.homepageEagerUniqueBytes*.03,'retain at least a 97% reduction in upfront image bytes');
});

test('hidden intro and modal pictures have no image source before the visitor opens them',()=>{
  const deferred=tags.filter(tag=>attribute(tag,'data-intro-src')||attribute(tag,'data-modal-src'));
  assert.equal(deferred.length,50);
  for(const tag of deferred) {
    assert(!attribute(tag,'src'),tag);
    assert(!attribute(tag,'srcset'),tag);
    assert(attribute(tag,'width')&&attribute(tag,'height'),tag);
    assert(fs.existsSync(path.join(root,attribute(tag,'data-intro-src')||attribute(tag,'data-modal-src'))));
  }
});

test('desk illustration is preloaded while the optional real portrait stays deferred',()=>{
  const hero=tags.find(tag=>attribute(tag,'class')==='dk-room');
  const photo=tags.find(tag=>attribute(tag,'class')==='hero-photo');
  const preload=[...homepage.matchAll(/<link\b[^>]*>/g)].map(m=>m[0]).find(tag=>attribute(tag,'as')==='image');
  assert.equal(attribute(hero,'loading'),'eager');
  assert.equal(attribute(hero,'fetchpriority'),'high');
  assert.equal(attribute(hero,'src'),attribute(preload,'href'));
  assert.equal(attribute(photo,'src'),undefined);
  assert.equal(attribute(photo,'loading'),'lazy');
  assert(fs.existsSync(path.join(root,attribute(photo,'data-src'))));
});

test('all desk lighting and pose assets are genuine WebP and together stay under 400 KB',()=>{
  let bytes=0;
  for(const name of ['night','day','cat-night','cat-day','wave-night','wave-day']) {
    const data=fs.readFileSync(path.join(root,'images/web/desk',name+'.webp'));
    assert.equal(data.subarray(0,4).toString(),'RIFF',name);
    assert.equal(data.subarray(8,12).toString(),'WEBP',name);
    bytes+=data.length;
  }
  assert(bytes<400*1024,bytes+' bytes exceeds the complete desk asset budget');
});
