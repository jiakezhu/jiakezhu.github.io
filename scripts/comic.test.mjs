import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {buildComic} from './build-comic.mjs';
import {COMIC_ASSET_VERSION,comicDictionaries} from './localize-comic.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const baseline=path.resolve(root,'../baseline');
const source=fs.existsSync(path.join(root,'content/story/comic-manifest.json')) ? root : baseline;
const read=(base,file)=>JSON.parse(fs.readFileSync(path.join(base,file),'utf8'));
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initialStory='<html><head><link rel="stylesheet" href="../assets/growth-comic.css?v=5"></head><body><section id="world"><canvas>Keep the 3D shop</canvas></section><section id="projects">Keep project cards</section><!-- JOURNAL_LIST_START --><article id="keep-this-note">Existing journal content</article><!-- JOURNAL_LIST_END --><section id="growth"><p>Old placeholder</p></section><dialog id="story-dialog">Keep unrelated dialog</dialog><footer>Keep credits</footer><script src="../assets/story-i18n.js?v=5"></script><script src="../assets/growth-comic-entry-i18n.js?v=1"></script><script src="../assets/reading-pages.js?v=8"></script><script src="../assets/story-world.js?v=8"></script></body></html>';
function fixture({count,legacy=false}={}) {
  const origin=legacy && fs.existsSync(path.join(baseline,'content/story/comic-manifest.json')) ? baseline : source;
  const data=read(origin,'content/story/comic-manifest.json');
  const translations=read(origin,'content/story/comic-translations.json');
  if(count) {
    data.pages=data.pages.slice(0,count);
    data.chapters=[{title:data.chapters[0].title,start:1,end:count}];
    for(const locale of Object.values(translations.locales)) {locale.pages=locale.pages.slice(0,count);locale.chapters=locale.chapters.slice(0,1);}
  }
  if(!legacy) {
    data.version=2;
    data.pages.forEach(page=>{page.layout='composed';page.frames=[{x:0,y:0,w:1,h:1}];page.alt=page.alt.slice(0,1);});
    for(const locale of Object.values(translations.locales)) locale.pages.forEach(row=>{row[2]=row[2].slice(0,1);});
  } else if(data.pages.some(page=>page.layout==='composed')) {
    data.version=1;
    data.pages.forEach(page=>{page.layout='strips3';page.frames=page.captions.map((_,index,all)=>({x:0,y:index/all.length,w:1,h:1/all.length}));page.alt=page.captions.map(()=>page.alt[0]);});
    for(const locale of Object.values(translations.locales)) locale.pages.forEach(row=>{row[2]=row[1].map(()=>row[2][0]);});
  }
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'jiake-comic-test-'));
  for(const folder of ['content/story','images/comic','story']) fs.mkdirSync(path.join(base,folder),{recursive:true});
  fs.writeFileSync(path.join(base,'content/story/comic-manifest.json'),JSON.stringify(data));
  fs.writeFileSync(path.join(base,'content/story/comic-translations.json'),JSON.stringify(translations));
  fs.writeFileSync(path.join(base,'images/comic/metadata.json'),JSON.stringify({pages:data.pages.map(page=>({page:page.page,width:1024,height:1536,smallWidth:640,smallHeight:960}))}));
  for(const page of data.pages) for(const name of [page.image,page.smallImage]) {const file=path.join(base,'images/comic',name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'fixture');}
  fs.writeFileSync(path.join(base,'story/index.html'),initialStory);
  return {base,data,translations};
}
function withFixture(options,callback) {
  if(typeof options==='function') {callback=options;options={};}
  const context=fixture(options);
  try {return callback(context);} finally {fs.rmSync(context.base,{recursive:true,force:true});}
}
const output=(base,file='index.html')=>fs.readFileSync(path.join(base,'story/comic',file),'utf8');
const writeData=({base,data})=>fs.writeFileSync(path.join(base,'content/story/comic-manifest.json'),JSON.stringify(data));

test('the ink memoir retains every original story item exactly once',()=>{
  const data=read(root,'content/story/comic-manifest.json');
  if(data.version!==3) return;
  const counts=[3,4,4,4,4,4,4,5,4,4,3,4,4,4,3,4];
  const original=counts.flatMap((count,index)=>Array.from({length:count},(_,frame)=>`p${String(index+1).padStart(2,'0')}.${frame}`));
  original.push('p15.closing');
  const used=data.pages.flatMap(page=>page.sourceIds||[]);
  assert.equal(used.length,63);assert.equal(new Set(used).size,63);assert.deepEqual([...used].sort(),original.sort());
});
test('composed pages render each complete artwork once with all real HTML narration',()=>withFixture(({base,data})=>{
  buildComic(base);const reader=output(base),transcript=output(base,'transcript.html');
  for(const html of [reader,transcript]) assert.match(html,/data-site-analytics src="\.\.\/\.\.\/assets\/analytics\.js/);
  assert.equal((reader.match(/data-comic-page=/g)||[]).length,data.pages.length);
  assert.equal((reader.match(/<picture>/g)||[]).length,data.pages.length);
  assert.equal((reader.match(/class="comic-artwork-link"/g)||[]).length,data.pages.length);
  assert.doesNotMatch(reader,/--image-left|--image-top/);
  for(const page of data.pages) for(const [index,caption] of page.captions.entries()) {
    if(caption===null) continue;
    const key=`data-comic-i18n="page.${page.page}.caption.${index}"`;
    for(const html of [reader,transcript]) {assert.ok(html.includes(escape(caption)));assert.equal(html.split(key).length-1,1);}
  }
  assert.match(reader,/data-comic-edition="2"/);
  assert.match(reader,/<noscript>[\s\S]*transcript\.html\?edition=2/);
  assert.ok(!/<img\b/.test(transcript),'Text version must not depend on artwork');
}));
test('page counts, chapter links, transcript folios and first/last controls are derived from data',()=>withFixture({count:3},({base,data})=>{
  buildComic(base);const html=output(base),transcript=output(base,'transcript.html');
  assert.equal((html.match(/data-comic-page=/g)||[]).length,3);
  assert.match(html,/id="comic-counter"[^>]*>01 \/ 3</);
  assert.match(transcript,/>03 \/ 3</);
  assert.match(html,/href="\?edition=2#page-03"/);
  const final=html.split('data-comic-page="3"')[1];
  assert.match(final,/The story continues/);assert.doesNotMatch(final,/data-comic-go="4"/);
  assert.match(comicDictionaries(base,data).en.entryCount,/^3\b/);
}));
test('legacy atlas layouts still render their frame sequence and use the old edition',()=>withFixture({legacy:true},({base,data})=>{
  buildComic(base);const html=output(base);
  assert.equal((html.match(/<picture>/g)||[]).length,data.pages.reduce((sum,page)=>sum+page.frames.length,0));
  assert.match(html,/--image-left/);assert.match(html,/data-comic-edition="1"/);
}));
test('all artwork sources are deferred, with full-size artwork links independent of loading',()=>withFixture(({base,data})=>{
  buildComic(base);const html=output(base);
  const images=[...html.matchAll(/<img\b[^>]*>/g)].map(match=>match[0]);
  assert.ok(images.every(image=>/data-src=/.test(image) && !/\ssrc=/.test(image)));
  assert.doesNotMatch(html,/<source\b[^>]*\ssrcset=/);
  assert.ok(html.includes(`href="../../images/comic/${data.pages[0].image}" target="_blank"`));
}));
test('four-language dictionaries cover both reader formats without literal-text key collisions',()=>withFixture(context=>{
  const {base,data,translations}=context;
  data.pages[0].captions[0]=data.pages[1].captions[0]='The same English sentence.';
  writeData(context);
  translations.locales.fr.pages[0][1][0]='Première traduction.';translations.locales.fr.pages[1][1][0]='Deuxième traduction.';
  fs.writeFileSync(path.join(base,'content/story/comic-translations.json'),JSON.stringify(translations));
  buildComic(base);const copies=comicDictionaries(base,data);
  for(const language of ['en','zh','fr','es']) assert.deepEqual(Object.keys(copies[language]).sort(),Object.keys(copies.en).sort());
  assert.equal(copies.fr['page.1.caption.0'],'Première traduction.');assert.equal(copies.fr['page.2.caption.0'],'Deuxième traduction.');
  for(const file of ['index.html','transcript.html']) {
    const html=output(base,file);
    for(const language of ['en','zh','fr','es']) assert.ok(html.includes(`data-language="${language}"`));
    for(const number of [1,2]) assert.ok(html.includes(`data-comic-i18n="page.${number}.caption.0">The same English sentence.</p>`));
  }
}));
test('null narration and the final closing line retain their indices in both formats',()=>withFixture(context=>{
  const {base,data,translations}=context;data.pages[0].captions[0]=null;data.pages[0].captions[1]='A second visible narration paragraph.';
  for(const locale of Object.values(translations.locales)) {locale.pages[0][1][0]=null;locale.pages[0][1][1]='A localized narration paragraph.';}
  const final=data.pages.at(-1);final.closingCaption='The next chapter is still unwritten.';
  for(const locale of Object.values(translations.locales)) locale.pages.at(-1)[3]='Localized closing line.';
  writeData(context);fs.writeFileSync(path.join(base,'content/story/comic-translations.json'),JSON.stringify(translations));buildComic(base);
  for(const file of ['index.html','transcript.html']) {const html=output(base,file);assert.ok(!html.includes('data-comic-i18n="page.1.caption.0"'));assert.ok(html.includes('data-comic-i18n="page.1.caption.1"'));assert.equal(html.split(`data-comic-i18n="page.${final.page}.closing"`).length-1,1);}
}));
test('the Story patch preserves all unrelated panels, credits, dialogs and scripts byte-for-byte',()=>withFixture(({base})=>{
  buildComic(base);const story=fs.readFileSync(path.join(base,'story/index.html'),'utf8');
  const strip=html=>html.replace(/<section id="growth"[\s\S]*?<\/section>/,'GROWTH').replace(/growth-comic\.css\?v=\d+/g,'growth-comic.css').replace(/growth-comic-entry-i18n\.js\?v=\d+/g,'growth-comic-entry-i18n.js');
  assert.equal(strip(story),strip(initialStory));
  assert.match(story,/comic\/index.html\?edition=2/);assert.ok(story.includes(`growth-comic.css?v=${COMIC_ASSET_VERSION}`));
  const firstReader=output(base);buildComic(base);assert.equal(fs.readFileSync(path.join(base,'story/index.html'),'utf8'),story);assert.equal(output(base),firstReader);
}));
test('empty, unordered and uncovered pages fail before any outputs are written',()=>{
  for(const corrupt of [data=>{data.pages=[];},data=>{data.pages[1].page=1;},data=>{data.chapters[0].start=2;}]) withFixture(context=>{corrupt(context.data);writeData(context);assert.throws(()=>buildComic(context.base),/English comic|Invalid page|chapter coverage/);assert.ok(!fs.existsSync(path.join(context.base,'story/comic')));});
});
test('missing image assets, bad dimensions and cropped composed frames fail before writing',()=>{
  withFixture(({base,data})=>{fs.rmSync(path.join(base,'images/comic',data.pages.at(-1).image));assert.throws(()=>buildComic(base),/Missing comic asset/);assert.ok(!fs.existsSync(path.join(base,'story/comic')));});
  withFixture(({base})=>{const file=path.join(base,'images/comic/metadata.json'),metadata=read(base,'images/comic/metadata.json');metadata.pages[0].height=0;fs.writeFileSync(file,JSON.stringify(metadata));assert.throws(()=>buildComic(base),/Invalid image metadata/);assert.ok(!fs.existsSync(path.join(base,'story/comic')));});
  withFixture(context=>{context.data.pages[0].frames[0].h=.5;writeData(context);assert.throws(()=>buildComic(context.base),/Invalid composed artwork/);assert.ok(!fs.existsSync(path.join(context.base,'story/comic')));});
});
test('incomplete final-page translations fail before any generated HTML or dictionaries are written',()=>withFixture(({base,translations,data})=>{
  translations.locales.fr.pages.at(-1)[1][0]='';fs.writeFileSync(path.join(base,'content/story/comic-translations.json'),JSON.stringify(translations));
  assert.throws(()=>buildComic(base),new RegExp(`Incomplete fr comic page ${data.pages.length}`));assert.ok(!fs.existsSync(path.join(base,'story/comic')));assert.ok(!fs.existsSync(path.join(base,'assets/growth-comic-i18n.js')));
}));

// A small DOM harness executes the real runtime, including URL/storage migration and
// data-src promotion. Actual browser network/visual checks remain part of release QA.
class Element {
  constructor(attributes={}) {this.attributes={};this.dataset={};this.events={};this.style={};this.hidden=false;this.textContent='';for(const [key,value] of Object.entries(attributes)) this.setAttribute(key,value);}
  setAttribute(key,value) {this.attributes[key]=String(value);if(key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g,(_,char)=>char.toUpperCase())]=String(value);}
  getAttribute(key) {return this.attributes[key] ?? null;}
  removeAttribute(key) {delete this.attributes[key];if(key.startsWith('data-')) delete this.dataset[key.slice(5).replace(/-([a-z])/g,(_,char)=>char.toUpperCase())];}
  addEventListener(type,listener) {(this.events[type] ||= []).push(listener);}
  emit(type,event={}) {(this.events[type]||[]).forEach(listener=>listener(event));}
  set src(value) {this.setAttribute('src',value);} set srcset(value) {this.setAttribute('srcset',value);}
  focus() {this.focused=true;} scrollIntoView() {this.scrolled=true;}
}
function runtime({url='https://example.test/story/comic/?edition=2',stored={},edition=2,transcript=false,count=8}={}) {
  const windowEvents={},documentEvents={},storage=new Map(Object.entries(stored));let currentURL=new URL(url);
  const pages=Array.from({length:count},(_,index)=>{
    const page=new Element({'data-comic-page':index+1}),source=new Element({'data-srcset':`page-${index+1}-small.webp 640w, page-${index+1}.webp 1024w`}),image=new Element({'data-src':`page-${index+1}.webp`}),heading=new Element();heading.textContent=`Title ${index+1}`;
    page.source=source;page.image=image;page.heading=heading;
    page.querySelector=()=>heading;
    page.querySelectorAll=selector=>{
      const element=selector.startsWith('source')?source:image;
      const attribute=selector.match(/\[([^\]]+)\]/)[1];return element.getAttribute(attribute)!==null ? [element] : [];
    };
    return page;
  });
  const select=new Element(),counter=new Element(),progress=new Element(),resume=new Element(),status=new Element();resume.hidden=true;
  const arrows=['previous','next'].map(direction=>new Element({'data-comic-direction':direction}));
  const links=pages.map((_,index)=>new Element({'data-comic-go':index+1}));
  const chapter=new Element({'data-start':1,'data-end':count});
  const copy={language:'en',text(key){return `${this.language}:${key}`;},format(key,variables){return `${this.language}:${key}:${Object.values(variables).join('|')}`;}};
  const document={body:{dataset:{comicEdition:String(edition),comicTotal:String(count)}},querySelectorAll:selector=>({'[data-comic-page]':transcript?[]:pages,'[data-comic-direction]':arrows,'[data-comic-chapter]':[chapter],'[data-comic-go]':links}[selector]||[]),querySelector:()=>progress,getElementById:id=>({'comic-page-select':select,'comic-counter':counter,'comic-resume':resume,'comic-status':status}[id] || pages[Number(id.slice(5))-1]),addEventListener:(type,listener)=>{documentEvents[type]=listener;}};
  const window={COMIC_LANGUAGE:copy,addEventListener:(type,listener)=>{windowEvents[type]=listener;}};
  const location={get href(){return currentURL.href;},get hash(){return currentURL.hash;}};
  const history={replaceState(_,__,url){currentURL=new URL(url,currentURL);},pushState(_,__,url){currentURL=new URL(url,currentURL);}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'assets/growth-comic.js'),'utf8'),{window,document,location,history,URL,localStorage:{getItem:key=>storage.get(key) ?? null,setItem:(key,value)=>storage.set(key,String(value))}});
  return {pages,select,counter,progress,resume,status,arrows,links,copy,storage,get url(){return currentURL;},event(type,event){documentEvents[type]?.(event);},history(url,type='popstate'){currentURL=new URL(url);windowEvents[type]?.();}};
}
test('all 16 legacy deep links map to their approved new pages and canonical edition query',()=>{
  const mapping=[2,2,2,3,3,4,4,5,4,5,5,8,6,6,7,8];
  mapping.forEach((expected,index)=>{const app=runtime({url:`https://example.test/story/comic/?from=story#page-${String(index+1).padStart(2,'0')}`});assert.equal(app.select.value,String(expected));assert.equal(app.url.searchParams.get('edition'),'2');assert.equal(app.url.searchParams.get('from'),'story');assert.equal(app.url.hash,`#page-${String(expected).padStart(2,'0')}`);});
});
test('edition-2 deep links load only the selected complete artwork, then unload on navigation',()=>{
  const app=runtime({url:'https://example.test/story/comic/?edition=2#page-05'});
  assert.equal(app.select.value,'5');assert.ok(app.pages[4].image.getAttribute('src'));
  assert.ok(app.pages.filter((_,index)=>index!==4).every(page=>page.image.getAttribute('src')===null && page.source.getAttribute('srcset')===null));
  app.links[7].emit('click',{preventDefault(){}});assert.equal(app.select.value,'8');assert.equal(app.pages[4].image.getAttribute('src'),null);assert.ok(app.pages[7].source.getAttribute('srcset'));assert.equal(app.url.hash,'#page-08');assert.ok(app.arrows[1].disabled);
  app.history('https://example.test/story/comic/?edition=2#page-05');assert.equal(app.select.value,'5');
});
test('legacy progress migrates without initial page-one rendering overwriting the resume target',()=>{
  const app=runtime({url:'https://example.test/story/comic/',stored:{'jiake-comic-last-page':'14'}});
  assert.equal(app.storage.get('jiake-comic-v2-last-page'),'6');assert.equal(app.select.value,'1');assert.equal(app.resume.hidden,false);assert.match(app.resume.textContent,/06/);
  app.resume.emit('click');assert.equal(app.select.value,'6');assert.equal(app.resume.hidden,true);assert.equal(app.storage.get('jiake-comic-last-page'),'14');
  const existing=runtime({stored:{'jiake-comic-v2-last-page':'8','jiake-comic-last-page':'14'}});assert.match(existing.resume.textContent,/08/);
});
test('language changes keep the selected page and keyboard navigation respects input fields and bounds',()=>{
  const app=runtime({url:'https://example.test/story/comic/?edition=2#page-08'});
  app.copy.language='zh';app.event('jiake:languagechange');assert.match(app.status.textContent,/^zh:pageStatus:8\|8/);assert.equal(app.select.value,'8');
  const key=(value,tagName='BODY')=>({key:value,target:{tagName},preventDefault(){}});
  app.event('keydown',key('ArrowRight'));assert.equal(app.select.value,'8');app.event('keydown',key('ArrowLeft','INPUT'));assert.equal(app.select.value,'8');app.event('keydown',key('ArrowLeft'));assert.equal(app.select.value,'7');
  app.pages[6].image.emit('error');assert.equal(app.status.textContent,'zh:loadError');
});
test('legacy transcript anchors are mapped too, without attempting reader controls or image loading',()=>{
  const app=runtime({url:'https://example.test/story/comic/transcript.html#page-13',transcript:true});assert.equal(app.url.hash,'#page-06');assert.equal(app.url.searchParams.get('edition'),'2');assert.equal(app.pages[5].scrolled,true);assert.ok(app.pages.every(page=>page.image.getAttribute('src')===null));
});
test('the ink edition keeps bookmarks from both earlier editions on the matching life stage',()=>{
  const original=[1,2,4,6,7,9,10,11,14,15,17,18,21,22,24,26];
  const second=[21,1,6,9,11,22,24,26];
  for(const [edition,mapping] of [['',original],['?edition=2',second]]) mapping.forEach((expected,index)=>{
    const app=runtime({edition:3,count:28,url:`https://example.test/story/comic/${edition}#page-${String(index+1).padStart(2,'0')}`});
    assert.equal(app.select.value,String(expected));assert.equal(app.url.searchParams.get('edition'),'3');assert.equal(app.url.hash,`#page-${String(expected).padStart(2,'0')}`);
  });
  const current=runtime({edition:3,count:28,url:'https://example.test/story/comic/?edition=3#page-23'});assert.equal(current.select.value,'23');
});
test('ink edition offers the prior reading position without overwriting it',()=>{
  const app=runtime({edition:3,count:28,url:'https://example.test/story/comic/',stored:{'jiake-comic-v2-last-page':'6','jiake-comic-last-page':'14'}});
  assert.equal(app.select.value,'1');assert.equal(app.storage.get('jiake-comic-v3-last-page'),'22');assert.equal(app.storage.get('jiake-comic-v2-last-page'),'6');assert.match(app.resume.textContent,/22/);
  app.resume.emit('click');assert.equal(app.select.value,'22');assert.equal(app.url.searchParams.get('edition'),'3');
  const original=runtime({edition:3,count:28,url:'https://example.test/story/comic/',stored:{'jiake-comic-last-page':'15'}});assert.match(original.resume.textContent,/24/);
});
test('ink transcript translates an older bookmarked scene without loading artwork',()=>{
  const app=runtime({edition:3,count:28,url:'https://example.test/story/comic/transcript.html?edition=2#page-06',transcript:true});
  assert.equal(app.url.searchParams.get('edition'),'3');assert.equal(app.url.hash,'#page-22');assert.equal(app.pages[21].scrolled,true);assert.ok(app.pages.every(page=>page.image.getAttribute('src')===null));
});
test('document skip anchors do not reset the current page while page hash changes still navigate',()=>{
  const app=runtime({url:'https://example.test/story/comic/?edition=2#page-04'});
  app.history('https://example.test/story/comic/?edition=2#comic-pages','hashchange');assert.equal(app.select.value,'4');
  app.history('https://example.test/story/comic/?edition=2#page-08','hashchange');assert.equal(app.select.value,'8');
});

test('the vending-machine comic card follows the built edition and preserves every other project',()=>withFixture({count:3},({base,data})=>{
  const projects=[{id:'keep',title:'Existing AI project',href:'https://example.test/app',description:{en:'Keep this text.'},image:'keep.webp'},
    {id:'comic',title:'Life in Frames',href:'./comic/index.html',image:'../images/comic/old.webp',tags:'16 pages · 4 languages',description:{en:'Old edition'}}];
  fs.mkdirSync(path.join(base,'assets'),{recursive:true});
  fs.writeFileSync(path.join(base,'assets/story-projects.json'),JSON.stringify(projects));
  buildComic(base);const next=read(base,'assets/story-projects.json');
  assert.deepEqual(next[0],projects[0]);assert.equal(next[1].title,projects[1].title);
  assert.equal(next[1].tags,'3 pages · 4 languages');assert.equal(next[1].href,'./comic/index.html?edition=2');
  assert.equal(next[1].image,`../images/comic/${data.pages[0].smallImage}`);
  const copies=comicDictionaries(base,data);
  for(const language of ['en','zh','fr','es']) assert.equal(next[1].description[language],copies[language].entryIntro);
  const once=fs.readFileSync(path.join(base,'assets/story-projects.json'),'utf8');buildComic(base);
  assert.equal(fs.readFileSync(path.join(base,'assets/story-projects.json'),'utf8'),once);
}));

function languageRuntime({url='https://example.test/story/comic/?edition=2#page-07',saved='zh',blocked=false,edition=2}={}) {
  let currentURL=new URL(url);
  const storage=new Map(saved===null?[]:[['jiake-language',saved]]),events={};
  const heading=new Element({'data-comic-i18n':'bookTitle'}),meta=new Element();
  const buttons=['en','zh','fr','es'].map(value=>new Element({'data-language':value}));
  const links=[{href:'https://example.test/story/index.html#growth'},
    {href:'https://example.test/story/comic/transcript.html?edition=2#page-07'},
    {href:'https://example.test/images/comic/v2/page-07.webp'},
    {href:'https://other.test/story/'}];
  const copies=Object.fromEntries(['en','zh','fr','es'].map(value=>[value,{bookTitle:`Title ${value}`,wordsTitle:`Words ${value}`,description:`Description ${value}`} ]));
  const document={documentElement:{dataset:{},lang:''},body:{dataset:{comicView:'reader',comicEdition:String(edition)}},readyState:'complete',
    querySelectorAll:selector=>({'[data-comic-i18n]':[heading],'[data-language]':buttons,'a[href]':links}[selector]||[]),
    querySelector:selector=>selector==='meta[name="description"]'?meta:null,
    addEventListener(){},dispatchEvent(){}};
  const context={COMIC_I18N:copies,document,navigator:{language:'zh-CN'},URL,URLSearchParams,
    location:{get href(){return currentURL.href;},get origin(){return currentURL.origin;},get search(){return currentURL.search;}},
    history:{replaceState(_,__,value){currentURL=new URL(value,currentURL);}},
    localStorage:{getItem(key){if(blocked)throw new Error('blocked');return storage.get(key)??null;},setItem(key,value){if(blocked)throw new Error('blocked');storage.set(key,value);}},
    addEventListener:(name,listener)=>{events[name]=listener;},MutationObserver:class{observe(){}},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}};
  context.window=context;
  vm.runInNewContext(fs.readFileSync(path.join(root,'assets/growth-comic-language.js'),'utf8'),context);
  return {document,heading,meta,links,storage,get url(){return currentURL;},choose(value){buttons.find(b=>b.dataset.language===value).emit('click');},back(value){currentURL=new URL(value);events.popstate?.();}};
}
test('a shared comic language link overrides the visitor’s remembered language, even without storage',()=>{
  for(const blocked of [false,true]) {
    const app=languageRuntime({url:'https://example.test/story/comic/?edition=2&lang=fr#page-07',saved:'zh',blocked});
    assert.equal(app.document.documentElement.lang,'fr');assert.equal(app.heading.textContent,'Title fr');
    assert.equal(app.meta.getAttribute('content'),'Description fr');assert.equal(app.url.hash,'#page-07');
    assert.equal(app.url.searchParams.get('edition'),'2');
  }
  assert.equal(languageRuntime({url:'https://example.test/story/comic/?lang=invalid',saved:'es'}).document.documentElement.lang,'es');
});
test('changing comic language updates share links and reading links while preserving artwork and external URLs',()=>{
  const app=languageRuntime();app.choose('es');
  assert.equal(app.url.searchParams.get('lang'),'es');assert.equal(app.url.searchParams.get('edition'),'2');assert.equal(app.url.hash,'#page-07');
  assert.equal(app.storage.get('jiake-language'),'es');assert.equal(app.heading.textContent,'Title es');
  for(const link of app.links.slice(0,2)) assert.equal(new URL(link.href).searchParams.get('lang'),'es');
  assert.equal(new URL(app.links[1].href).searchParams.get('edition'),'2');
  assert.equal(app.links[2].href,'https://example.test/images/comic/v2/page-07.webp');assert.equal(app.links[3].href,'https://other.test/story/');
});
test('browser Back restores the language encoded in the older comic URL',()=>{
  const app=languageRuntime();app.choose('es');
  app.back('https://example.test/story/comic/?edition=2&lang=fr#page-02');
  assert.equal(app.document.documentElement.lang,'fr');assert.equal(app.url.hash,'#page-02');
  assert.equal(new URL(app.links[0].href).searchParams.get('lang'),'fr');
});


test('restoring the original edition keeps its 16 existing page addresses unchanged',()=>{
  for(const page of [1,8,13,16]) {
    const app=runtime({edition:1,count:16,url:`https://example.test/story/comic/?lang=fr#page-${String(page).padStart(2,'0')}`});
    assert.equal(app.select.value,String(page));assert.equal(app.url.searchParams.get('lang'),'fr');
  }
});
test('links from the withdrawn eight-page edition open the corresponding restored scene',()=>{
  const mapping=[13,1,4,6,8,14,15,16];
  mapping.forEach((expected,index)=>{
    const app=runtime({edition:1,count:16,url:`https://example.test/story/comic/?edition=2&lang=zh#page-${String(index+1).padStart(2,'0')}`});
    assert.equal(app.select.value,String(expected));assert.equal(app.url.searchParams.has('edition'),false);
    assert.equal(app.url.searchParams.get('lang'),'zh');assert.equal(app.url.hash,`#page-${String(expected).padStart(2,'0')}`);
  });
});

test('restored reader links do not inherit the withdrawn edition marker from an incoming URL',()=>{
  const app=languageRuntime({edition:1,url:'https://example.test/story/comic/?edition=2&lang=fr#page-07'});
  assert.equal(app.url.searchParams.get('edition'),'2','Reader migration still needs the incoming marker');
  assert.equal(new URL(app.links[1].href).searchParams.has('edition'),false);
  assert.equal(new URL(app.links[1].href).searchParams.get('lang'),'fr');
});
