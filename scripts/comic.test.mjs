import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildComic} from './build-comic.mjs';
import {comicDictionaries} from './localize-comic.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const original = JSON.parse(fs.readFileSync(path.join(root,'content/story/comic-manifest.json'),'utf8'));
function fixture() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(),'jiake-comic-test-'));
  fs.mkdirSync(path.join(base,'content/story'),{recursive:true});
  fs.mkdirSync(path.join(base,'images/comic'),{recursive:true});
  fs.mkdirSync(path.join(base,'story'),{recursive:true});
  fs.writeFileSync(path.join(base,'content/story/comic-manifest.json'),JSON.stringify(original));
  fs.copyFileSync(path.join(root,'content/story/comic-translations.json'),path.join(base,'content/story/comic-translations.json'));
  fs.writeFileSync(path.join(base,'images/comic/metadata.json'),JSON.stringify({pages:original.pages.map(p=>({page:p.page,width:1024,height:p.layout==='grid4'?1024:1536,smallWidth:640,smallHeight:p.layout==='grid4'?640:960}))}));
  original.pages.forEach(p=>{fs.writeFileSync(path.join(base,'images/comic',p.image),'fixture');fs.writeFileSync(path.join(base,'images/comic',p.smallImage),'fixture');});
  fs.writeFileSync(path.join(base,'story/index.html'),'<html><head></head><body><!-- JOURNAL_LIST_START --><article id="keep-this-note">Existing journal content</article><!-- JOURNAL_LIST_END --><section id="growth"><p>Old placeholder</p></section><dialog id="story-dialog">Old cover</dialog><script src="../assets/story.js?v=5"></script></body></html>');
  return base;
}
function withFixture(callback) { const base=fixture(); try { callback(base); } finally { fs.rmSync(base,{recursive:true,force:true}); } }

test('build preserves the existing journal while replacing only the comic placeholder',()=>withFixture(base=>{
  buildComic(base);
  const story=fs.readFileSync(path.join(base,'story/index.html'),'utf8');
  assert.match(story,/<!-- JOURNAL_LIST_START --><article id="keep-this-note">Existing journal content<\/article><!-- JOURNAL_LIST_END -->/);
  assert.match(story,/href="comic\/index\.html#page-09"/);
  assert.doesNotMatch(story,/Old placeholder|Old cover|STORIES TO COME/);
  buildComic(base);
  assert.equal(fs.readFileSync(path.join(base,'story/index.html'),'utf8'),story,'Rebuilding must not duplicate links or reader content');
}));
test('deep-link readers do not eagerly request any unselected page image',()=>withFixture(base=>{
  buildComic(base);
  const html=fs.readFileSync(path.join(base,'story/comic/index.html'),'utf8');
  const images=[...html.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]);
  assert.equal(images.length,original.pages.reduce((n,p)=>n+p.frames.length,0));
  assert.ok(images.every(img=>/data-src=/.test(img)&&! /\ssrc=/.test(img)));
  assert.doesNotMatch(html,/<source\b[^>]*\ssrcset=/);
  assert.equal((html.match(/data-comic-page=/g)||[]).length,16);
}));
test('English narration remains real text and has a complete no-JavaScript reading alternative',()=>withFixture(base=>{
  buildComic(base);
  const reader=fs.readFileSync(path.join(base,'story/comic/index.html'),'utf8');
  const transcript=fs.readFileSync(path.join(base,'story/comic/transcript.html'),'utf8');
  for(const page of original.pages) for(const caption of page.captions.filter(Boolean)) {
    const escaped=caption.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    assert.ok(reader.includes(escaped));
    assert.ok(transcript.includes(escaped));
  }
  assert.match(reader,/<html lang="en">/);
  assert.match(reader,/<noscript>[\s\S]*transcript.html/);
  assert.doesNotMatch([...reader.matchAll(/<figcaption[\s\S]*?<\/figcaption>/g)].map(match=>match[0]).join(''),/[\u4e00-\u9fff]/);
}));
test('all four languages cover the full story and both reader formats have language controls',()=>withFixture(base=>{
  buildComic(base);
  const copies=comicDictionaries(base,original);
  for(const language of ['en','zh','fr','es']) {
    assert.deepEqual(Object.keys(copies[language]).sort(),Object.keys(copies.en).sort());
    assert.ok(copies[language]['page.15.caption.0']);
    assert.ok(copies[language]['page.16.caption.2']);
  }
  for(const file of ['index.html','transcript.html']) {
    const html=fs.readFileSync(path.join(base,'story/comic',file),'utf8');
    for(const language of ['en','zh','fr','es']) assert.match(html,new RegExp(`data-language="${language}"`));
    assert.match(html,/growth-comic-language.js/);
    assert.match(html,/data-comic-i18n="page.15.caption.0"/);
    assert.match(html,/data-comic-i18n="page.16.caption.2"/);
  }
  const story=fs.readFileSync(path.join(base,'story/index.html'),'utf8');
  assert.doesNotMatch(story,/id="growth"[^>]*lang="en"/);
  assert.match(story,/<div[^>]*data-i18n="comic.entryLabel">Life in frames<\/div>/);
}));
test('an incomplete translation prevents writing a partial multilingual reader',()=>withFixture(base=>{
  const file=path.join(base,'content/story/comic-translations.json');
  const copy=JSON.parse(fs.readFileSync(file,'utf8'));
  copy.locales.fr.pages[14][1][0]='';
  fs.writeFileSync(file,JSON.stringify(copy));
  assert.throws(()=>buildComic(base),/Incomplete fr comic page 15/);
  assert.ok(!fs.existsSync(path.join(base,'story/comic/index.html')));
}));
test('a missing illustration prevents publishing an incomplete reader',()=>withFixture(base=>{
  fs.rmSync(path.join(base,'images/comic',original.pages[8].image));
  assert.throws(()=>buildComic(base),/Missing comic asset/);
  assert.ok(!fs.existsSync(path.join(base,'story/comic/index.html')));
}));
test('a mismatched frame/caption sequence is rejected before writing pages',()=>withFixture(base=>{
  const bad=structuredClone(original); bad.pages[7].captions.pop();
  fs.writeFileSync(path.join(base,'content/story/comic-manifest.json'),JSON.stringify(bad));
  assert.throws(()=>buildComic(base),/Invalid page 8/);
}));
