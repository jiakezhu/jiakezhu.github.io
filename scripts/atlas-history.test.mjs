import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {root,parsePost,loadTranslations} from './build-journal.mjs';

test('every travel stop has a sourced introduction in all four site languages',()=>{
  const places=JSON.parse(fs.readFileSync(path.join(root,'assets/maps/places.json'),'utf8'));
  const guide=JSON.parse(fs.readFileSync(path.join(root,'assets/maps/city-guide.json'),'utf8'));
  const labels=Object.values(places).flatMap(region=>[...region.milestones,...region.cities]).map(p=>p.label);
  assert.equal(labels.length,65);assert.equal(new Set(labels).size,labels.length);
  assert.deepEqual(Object.keys(guide).sort(),labels.sort());
  for(const label of labels){
    assert.equal(guide[label].names.length,4,label);assert.equal(guide[label].intro.length,4,label);
    for(const text of guide[label].intro)assert(text.trim().length>=16,`${label}: factual introduction`);
    assert.equal(guide[label].summary.length,4,label);
    guide[label].summary.forEach((text,index)=>assert(text.trim().length>=8&&text.length<=[48,150,160,160][index],`${label}: concise translated summary`));
    for(const text of guide[label].names)assert(text.trim(),`${label}: translated place name`);
    assert.equal(new URL(guide[label].source.url).protocol,'https:');
    assert.equal(guide[label].country.length,4,label);
    assert.equal(guide[label].highlights.length,4,label);
    for(const items of guide[label].highlights){assert.equal(items.length,3,label);for(const text of items)assert(text.trim(),label);}
    const image=guide[label].image;
    assert(['personal','reference'].includes(image.kind),label);
    assert.equal(image.alt.length,4,label);for(const text of image.alt)assert(text.trim(),label);
    assert(image.width>=400&&image.height>=300,label);
    const bytes=fs.readFileSync(path.join(root,image.src));
    assert.equal(bytes.subarray(0,4).toString(),'RIFF',label);assert.equal(bytes.subarray(8,12).toString(),'WEBP',label);
    assert(image.credit.author.trim()&&image.credit.license.trim(),label);
    assert.equal(new URL(image.credit.url).protocol,'https:',label);
    if(image.kind==='reference'){
      const credit=image.credit,host=new URL(credit.url).hostname;
      const openLicense=/CC|Public domain|Attribution|FAL/i.test(credit.license);
      const unsplash=credit.license==='Unsplash License'&&host==='unsplash.com'&&credit.licenseUrl==='https://unsplash.com/license';
      const pexels=credit.license==='Pexels License'&&['pexels.com','www.pexels.com'].includes(host)&&credit.licenseUrl==='https://www.pexels.com/license/';
      assert(openLicense||unsplash||pexels,`${label}: verified photo source and license`);
    }
  }
  const bundle=JSON.parse(fs.readFileSync(path.join(root,'assets/maps/atlas-data.js'),'utf8').replace('window.JIAKE_ATLAS_DATA=','').replace(/;\s*$/,''));
  assert.deepEqual(bundle.guide,guide,'the lazy bundle contains current introductions');
  assert.equal(new Set(Object.values(guide).map(item=>item.image.src)).size,65,'each stop has a distinct relevant photo');
  for(const label of ['Amsterdam','Rome','Rigi','Tromsø','Vatican','Budapest'])assert.equal((guide[label].personalImage||guide[label].image).kind,'personal',label);
});

test('the historical snapshot remains byte-for-byte identical to its captured manifest',()=>{
  const archive=path.join(root,'history/2026-08-26');
  const manifest=JSON.parse(fs.readFileSync(path.join(archive,'snapshot.json'),'utf8'));
  assert.equal(manifest.commit,'6a98c9919e5b3316fd119eaddaf90409b32d0aec');
  assert.equal(manifest.files.length,64);assert.equal(manifest.liveHomepageMatched,true);
  for(const entry of manifest.files){
    assert(entry.path.startsWith('site/')&&!entry.path.includes('..'));
    const bytes=fs.readFileSync(path.join(archive,entry.path));
    assert.equal(bytes.length,entry.bytes,entry.path);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256,entry.path);
  }
  const homepage=manifest.files.find(entry=>entry.path==='site/index.html');
  assert.equal(homepage.sha256,manifest.homepageSha256);
  for(const entry of manifest.files.filter(file=>file.path.endsWith('.html'))){
    const file=path.join(archive,entry.path),html=fs.readFileSync(file,'utf8');
    for(const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
      const url=match[1];if(/^(?:[a-z]+:|\/\/|#|\/)/i.test(url))continue;
      const target=decodeURIComponent(url.split(/[?#]/)[0]);
      if(!target)continue;
      assert(fs.existsSync(path.resolve(path.dirname(file),target)),`${entry.path}: missing archived resource ${target}`);
    }
  }
});

test('one journal entry combines both versions with previews and working archive links in every language',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'journal/manifest.json'),'utf8'));
  assert.deepEqual(manifest.filter(slug=>slug.startsWith('personal-website-')),['personal-website-redesign']);
  assert(!fs.existsSync(path.join(root,'journal/posts/personal-website-archive/index.html')));
  assert(!fs.readFileSync(path.join(root,'journal/feed.xml'),'utf8').includes('/posts/personal-website-archive/'));
  assert(!fs.readFileSync(path.join(root,'assets/journal-data.js'),'utf8').includes('personal-website-archive'));
  for(const slug of ['personal-website-redesign']){
    const source=fs.readFileSync(path.join(root,'content/posts',slug+'.md'),'utf8');
    const post=parsePost(source,slug+'.md','2026-10-04'),translations=loadTranslations(post,root);
    for(const [language,html] of [['zh',post.html],...Object.entries(translations).map(([lang,t])=>[lang,t.html])]){
      assert(html.includes('../../../history/2026-08-26/index.html'),`${slug} ${language}: archive entrance`);
      for(const version of ['2026-08-26','2026-10-04'])assert(html.includes(`images/site-history/${version}-desktop.webp`),`${language}: both version previews`);
      const articleDir=path.join(root,'journal/posts',slug);
      for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
        if(/^[a-z]+:/i.test(match[1]))continue;
        assert(fs.existsSync(path.resolve(articleDir,match[1])),`${slug} ${language}: broken link ${match[1]}`);
      }
    }
  }
});
