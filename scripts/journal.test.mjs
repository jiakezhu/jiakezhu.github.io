import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {parsePost, renderMarkdown, build, loadTranslations, root} from './build-journal.mjs';
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
    fs.mkdirSync(path.join(dir,'content/posts'),{recursive:true});fs.mkdirSync(path.join(dir,'assets'));fs.mkdirSync(path.join(dir,'journal'));fs.mkdirSync(path.join(dir,'story'));
    fs.writeFileSync(path.join(dir,'index.html'),'<!-- JOURNAL_PREVIEW_START --><!-- JOURNAL_PREVIEW_END -->');
    fs.writeFileSync(path.join(dir,'story/index.html'),'<!-- JOURNAL_LIST_START --><!-- JOURNAL_LIST_END -->');
    fs.writeFileSync(path.join(dir,'content/posts/example.md'),source());
    fs.writeFileSync(path.join(dir,'content/posts/secret.md'),source('draft: true','TOP_SECRET'));
    fs.mkdirSync(path.join(dir,'content/post-translations'));
    fs.writeFileSync(path.join(dir,'content/post-translations/example.json'),JSON.stringify(Object.fromEntries(['en','fr','es'].map(language => [language,{title:`${language} title`,summary:`${language} summary`,body:`## ${language} section\n\nA translated explanation with [a source](https://example.org).`}]))));
    assert.equal(build(dir).length,1);
    const article=fs.readFileSync(path.join(dir,'journal/posts/example/index.html'),'utf8');
    assert(article.includes('<h1 class="article-title">一篇记录</h1>'));
    for(const language of ['zh','en','fr','es']) {
      assert(article.includes(`data-article-version="${language}"`));
      assert(article.includes(`href="#${language}-section-1"`));
      assert(article.includes(`id="${language}-section-1"`));
    }
    const data=JSON.parse(fs.readFileSync(path.join(dir,'assets/journal-data.js'),'utf8').replace('window.JOURNAL_POSTS = ','').replace(/;\s*$/,''));
    assert(data[0].translations.en.searchText.includes('translated explanation'));
    assert(!('html' in data[0].translations.en));
    assert(!data[0].translations.en.searchText.includes('https://example.org'));
    assert(fs.readFileSync(path.join(dir,'assets/journal-data.js'),'utf8').includes('AI 实践'));
    const story = fs.readFileSync(path.join(dir,'story/index.html'),'utf8');
    assert(story.includes('../journal/posts/example/'));
    assert(!story.includes('TOP_SECRET'));
    assert(fs.readFileSync(path.join(dir,'journal/posts/example/index.html'),'utf8').includes('../../../story/index.html#journal'));
    assert(!fs.readFileSync(path.join(dir,'assets/journal-data.js'),'utf8').includes('TOP_SECRET'));
    assert(fs.readFileSync(path.join(dir,'journal/feed.xml'),'utf8').includes('/posts/example/'));
    const homepage = fs.readFileSync(path.join(dir,'index.html'),'utf8');
    assert(homepage.includes('1 篇记录'));
    assert(!homepage.includes('一篇记录'));
    assert(!homepage.includes('AI 实践'));
    fs.writeFileSync(path.join(dir,'content/posts/example.md'),source('draft: true'));
    assert.equal(build(dir).length,0);
    assert(!fs.existsSync(path.join(dir,'journal/posts/example/index.html')));
    assert(!fs.readFileSync(path.join(dir,'story/index.html'),'utf8').includes('id="post-example"'));
    assert(!fs.readFileSync(path.join(dir,'assets/journal-data.js'),'utf8').includes('一篇记录'));
    assert(!fs.readFileSync(path.join(dir,'journal/feed.xml'),'utf8').includes('/posts/example/'));
    assert(fs.readFileSync(path.join(dir,'index.html'),'utf8').includes('0 篇记录'));
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('missing or incomplete translations fail before output is generated',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jiake-translations-test-'));
  try {
    fs.mkdirSync(path.join(dir,'content/posts'),{recursive:true});
    fs.writeFileSync(path.join(dir,'content/posts/example.md'),source());
    assert.throws(()=>build(dir),/missing article translations/);
    assert(!fs.existsSync(path.join(dir,'journal')));
    fs.mkdirSync(path.join(dir,'content/post-translations'));
    fs.writeFileSync(path.join(dir,'content/post-translations/example.json'),JSON.stringify({en:{title:'Title',summary:'Summary',body:'Body'}}));
    assert.throws(()=>build(dir),/incomplete fr translation/);
    assert(!fs.existsSync(path.join(dir,'journal')));
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('every published source has full translated bodies with sections and source links',()=>{
  const today='2026-10-04';
  for(const file of fs.readdirSync(path.join(root,'content/posts')).filter(name=>name.endsWith('.md'))) {
    const post=parsePost(fs.readFileSync(path.join(root,'content/posts',file),'utf8'),file,today);
    if(!post) continue;
    for(const [language,t] of Object.entries(loadTranslations(post,root))) {
      assert(t.searchText.split(/\s+/).length>=300,`${post.slug} ${language}: substantive body`);
      assert(t.headings.length>=4,`${post.slug} ${language}: article structure`);
      if(post.html.includes('https://github.com/')) assert(t.html.includes('https://github.com/'),`${post.slug} ${language}: source retained`);
    }
  }
});
