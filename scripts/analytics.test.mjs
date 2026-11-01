import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {withAnalytics} from './site-analytics.mjs';
import {installAnalytics,publicAnalyticsPages} from './install-analytics.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'assets/analytics.js'),'utf8');
function browser({host='jiakezhu.github.io',protocol='https:',frame=false,ready='complete',config={provider:'cloudflare',hostname:'jiakezhu.github.io',token:'test-public-site-token'},failure=false,ok=true}={}) {
  const requests=[],scripts=[],events={};const window={};window.self=window;window.top=frame?{}:window;
  const document={readyState:ready,currentScript:{src:`${protocol}//${host}/assets/analytics.js?v=1`},
    getElementById:id=>scripts.find(script=>script.id===id),
    createElement:()=>({attributes:{},setAttribute(name,value){this.attributes[name]=value;}}),
    head:{append:script=>scripts.push(script)},addEventListener:(name,fn)=>{events[name]=fn;}};
  const context=vm.createContext({window,document,location:{hostname:host,protocol},URL,fetch:async(url,options)=>{requests.push({url:String(url),options});if(failure)throw new Error('unavailable');return {ok,json:async()=>config};}});
  return {requests,scripts,events,run:()=>vm.runInContext(source,context)};
}
test('local, file and embedded previews make no analytics requests',async()=>{
  for(const settings of [{host:'localhost',protocol:'http:'},{host:'127.0.0.1',protocol:'http:'},{host:'',protocol:'file:'},{host:'other.example'},{frame:true}]) {
    const page=browser(settings);await page.run();assert.equal(page.requests.length,0);assert.equal(page.scripts.length,0);
  }
});
test('production loads one official beacon with document-only measurement',async()=>{
  const page=browser();const first=page.run();await page.run();await first;
  assert.equal(page.requests.length,1);assert.equal(page.scripts.length,1);
  assert.equal(page.requests[0].url,'https://jiakezhu.github.io/assets/analytics-config.json?v=1');
  assert.equal(page.requests[0].options.credentials,'omit');
  assert.equal(page.scripts[0].src,'https://static.cloudflareinsights.com/beacon.min.js');
  assert.equal(page.scripts[0].type,'module');
  assert.deepEqual(JSON.parse(page.scripts[0].attributes['data-cf-beacon']),{token:'test-public-site-token',spa:false});
});
test('missing settings and endpoint failures never block the page',async()=>{
  for(const settings of [{config:{provider:'cloudflare',hostname:'jiakezhu.github.io',token:''}},{config:{provider:'other',hostname:'jiakezhu.github.io',token:'token'}},{config:{provider:'cloudflare',hostname:'other.example',token:'token'}},{failure:true},{ok:false}]) {
    const page=browser(settings);await assert.doesNotReject(async()=>page.run());assert.equal(page.scripts.length,0);
  }
});
test('analytics waits for document readiness when needed',async()=>{
  const page=browser({ready:'loading'});await page.run();assert.equal(page.requests.length,0);
  await page.events.DOMContentLoaded();assert.equal(page.requests.length,1);assert.equal(page.scripts.length,1);
});
test('entry insertion preserves content, resolves nested paths and is idempotent',()=>{
  const original='<html><head><title>Keep</title></head><body><main>Keep the design</main></body></html>';
  for(const [page,prefix] of [['index.html','assets/'],['story/comic/index.html','../../assets/'],['journal/posts/example/index.html','../../../assets/']]) {
    const result=withAnalytics(original,prefix);
    assert.equal(result.replace(/<script defer data-site-analytics[^>]*><\/script>/,''),original);
    assert.equal(withAnalytics(result,prefix),result);
    const src=result.match(/data-site-analytics src="([^"]+)"/)[1];
    assert.equal(new URL(src,'https://jiakezhu.github.io/'+page).pathname,'/assets/analytics.js');
  }
});
test('public coverage excludes the editor, redirect, asset demos and archive',()=>{
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'jiake-analytics-'));
  try {
    const tracked=['index.html','story/index.html','story/comic/index.html','story/comic/transcript.html','sales-buddy.html','sales-buddy-deck/index.html','journal/posts/new/index.html'];
    const excluded=['journal/write.html','journal/index.html','images/demo.html','history/2026-08-26/site/index.html'];
    const original='<html><body>Existing content</body></html>';
    for(const file of [...tracked,...excluded]){fs.mkdirSync(path.dirname(path.join(base,file)),{recursive:true});fs.writeFileSync(path.join(base,file),original);}
    assert.deepEqual(publicAnalyticsPages(base),tracked.sort());installAnalytics(base);installAnalytics(base);
    for(const file of tracked)assert.equal((fs.readFileSync(path.join(base,file),'utf8').match(/data-site-analytics/g)||[]).length,1);
    for(const file of excluded)assert.equal(fs.readFileSync(path.join(base,file),'utf8'),original);
  }finally{fs.rmSync(base,{recursive:true,force:true});}
});

test('an embedded HTML example inside JavaScript is never edited',()=>{
  const original='<html><body><script>const demo="<body>demo</body>";</script></body></html>';
  const result=withAnalytics(original,'assets/');
  assert.ok(result.includes('<script>const demo="<body>demo</body>";</script>'));
  assert.match(result,/<\/script><script defer data-site-analytics[^>]*><\/script><\/body>/);
});
