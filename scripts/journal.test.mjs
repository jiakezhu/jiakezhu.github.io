import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {parsePost, renderMarkdown, build} from './build-journal.mjs';
const source = (extra='',body='## 正文\n\n记录一个 AI 实践。') => `---\ntitle: "一篇记录"\ndate: "2026-01-01"\ncategory: tech\ntags: [AI]\n${extra}\n---\n${body}`;
test('draft and future content never becomes public',()=>{
  assert.equal(parsePost(source('draft: true'),'secret.md','2026-10-02'),null);
  assert.equal(parsePost(source().replace('2026-01-01','2099-01-01'),'future.md','2026-10-02'),null);
  assert.throws(()=>parsePost(source('draft: "false"'),'invalid.md','2026-10-02'),/draft/);
});
test('invalid metadata cannot create paths or broken articles',()=>{
  for(const [before,after] of [['category: tech','category: unknown'],['2026-01-01','2026-02-31'],['tags: [AI]','tags: [42]']]) assert.throws(()=>parsePost(source().replace(before,after),'invalid.md','2026-10-02'));
  assert.throws(()=>parsePost(source('slug: ../../escape'),'invalid.md','2026-10-02'),/slug/);
});
test('Markdown renders rich content and blocks HTML and executable links',()=>{
  const {html,headings}=renderMarkdown('# Title\n\n## Section\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n```js\nconst a = 1;\n```');
  assert(!html.includes('<script>'));assert(!html.includes('href="javascript:'));assert(html.includes('language-js'));
  assert.equal(headings[0].id,'section-2');assert(html.includes('id="section-1"'));
});
test('build generates searchable static pages and removes withdrawn posts everywhere',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jiake-journal-test-'));
  try {
    fs.mkdirSync(path.join(dir,'content/posts'),{recursive:true});fs.mkdirSync(path.join(dir,'assets'));fs.mkdirSync(path.join(dir,'journal'));
    fs.writeFileSync(path.join(dir,'index.html'),'<!-- JOURNAL_PREVIEW_START --><!-- JOURNAL_PREVIEW_END -->');
    fs.writeFileSync(path.join(dir,'journal/index.html'),'<!-- JOURNAL_LIST_START --><!-- JOURNAL_LIST_END -->');
    fs.writeFileSync(path.join(dir,'content/posts/example.md'),source());
    fs.writeFileSync(path.join(dir,'content/posts/secret.md'),source('draft: true','TOP_SECRET'));
    assert.equal(build(dir).length,1);
    assert(fs.readFileSync(path.join(dir,'journal/posts/example/index.html'),'utf8').includes('<h1 class="article-title">一篇记录</h1>'));
    assert(fs.readFileSync(path.join(dir,'assets/journal-data.js'),'utf8').includes('AI 实践'));
    assert(!fs.readFileSync(path.join(dir,'assets/journal-data.js'),'utf8').includes('TOP_SECRET'));
    assert(fs.readFileSync(path.join(dir,'journal/feed.xml'),'utf8').includes('/posts/example/'));
    fs.writeFileSync(path.join(dir,'content/posts/example.md'),source('draft: true'));
    assert.equal(build(dir).length,0);
    assert(!fs.existsSync(path.join(dir,'journal/posts/example/index.html')));
    assert(!fs.readFileSync(path.join(dir,'journal/feed.xml'),'utf8').includes('/posts/example/'));
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
