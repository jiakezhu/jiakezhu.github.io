import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import MarkdownIt from 'markdown-it';
import matter from 'gray-matter';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://jiakezhu.github.io';
export const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderMarkdown(content) {
  const md = new MarkdownIt({html:false, linkify:true, typographer:true});
  const headings = [];
  let headingCount = 0;
  const tokens = md.parse(content, {});
  tokens.forEach((token, i) => {
    if (token.type === 'heading_open') {
      const id = `section-${++headingCount}`;
      token.attrSet('id', id);
      if (['h2','h3'].includes(token.tag)) headings.push({id, text:tokens[i+1].content});
    }
  });
  return {html:md.renderer.render(tokens, md.options, {}), headings};
}
export function parsePost(source, filename, today) {
  if (!/^---\r?\n/.test(source)) throw new Error(`${filename}: use YAML front matter beginning with ---`);
  const {data, content} = matter(source);
  if (data.draft !== undefined && typeof data.draft !== 'boolean') throw new Error(`${filename}: draft must be true or false`);
  // Draft files are never included in pages, the search index, or RSS.
  if (data.draft === true) return null;
  const date = data.date instanceof Date ? data.date.toISOString().slice(0,10) : String(data.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date) throw new Error(`${filename}: invalid date`);
  if (date > today) return null;
  const slug = data.slug || path.basename(filename, '.md');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`${filename}: slug must use lowercase letters, numbers and hyphens`);
  if (typeof data.title !== 'string' || !data.title.trim()) throw new Error(`${filename}: title is required`);
  if (!['tech','diary'].includes(data.category)) throw new Error(`${filename}: category must be tech or diary`);
  if (data.tags !== undefined && (!Array.isArray(data.tags) || data.tags.some(t => typeof t !== 'string'))) throw new Error(`${filename}: tags must be a list of strings`);
  if (data.summary !== undefined && typeof data.summary !== 'string') throw new Error(`${filename}: summary must be a string`);
  if (!content.trim()) throw new Error(`${filename}: article body is empty`);
  const {html, headings} = renderMarkdown(content);
  const text = content.replace(/```[\s\S]*?```/g,'').replace(/[#*_>`~]/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').trim();
  return {slug, date, title:data.title.trim(), category:data.category, tags:data.tags || [], summary:data.summary || text.slice(0,140), minutes:Math.max(1,Math.ceil(content.length/500)), searchText:text, html, headings};
}
const categoryName = p => p.category === 'tech' ? '技术博客' : '日记';
export function card(post, prefix='./posts/') {
  return `<a id="post-${post.slug}" class="journal-card" data-category="${post.category}" href="${prefix}${post.slug}/"><time datetime="${post.date}">${post.date.replaceAll('-',' / ')}</time><div><div class="journal-meta"><span>${categoryName(post)}</span><span>${post.minutes} 分钟阅读</span></div><h3>${escape(post.title)}</h3><p>${escape(post.summary)}</p><div class="journal-tags">${post.tags.map(t=>`<span># ${escape(t)}</span>`).join('')}</div></div><span class="journal-arrow" aria-hidden="true">↗</span></a>`;
}
const empty = `<div class="journal-empty"><div><p class="journal-eyebrow">A page to begin</p><h2>下一篇，<br>从一个想法开始。</h2><p>这里将收录技术博客与日常日记。第一篇记录还在路上，先看看我正在做的项目。</p><a href="{{HOME}}#projects">探索 AI 作品集 ↗</a></div><div class="empty-art" aria-hidden="true"><div class="art-number">01 /</div><div class="art-line"></div><div class="art-line"></div><div class="art-caption">Notes on building & living</div></div></div>`;
function replaceRegion(file, name, html) {
  const start = `<!-- ${name}_START -->`, end = `<!-- ${name}_END -->`;
  const source = fs.readFileSync(file,'utf8');
  if (!source.includes(start) || !source.includes(end)) throw new Error(`Missing ${name} markers in ${file}`);
  fs.writeFileSync(file, source.slice(0,source.indexOf(start)+start.length)+'\n'+html+'\n'+source.slice(source.indexOf(end)));
}
function article(post) {
  const url = `${origin}/journal/posts/${post.slug}/`;
  const toc = post.headings.length ? `<details class="article-toc"><summary>文章目录</summary><ul>${post.headings.map(h=>`<li><a href="#${h.id}">${escape(h.text)}</a></li>`).join('')}</ul></details>` : '';
  return `<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(post.title)} · Jiake Zhu</title><meta name="description" content="${escape(post.summary)}"><link rel="canonical" href="${url}"><meta property="og:title" content="${escape(post.title)}"><meta property="og:description" content="${escape(post.summary)}"><meta property="og:type" content="article"><meta property="og:url" content="${url}"><meta property="article:published_time" content="${post.date}T00:00:00+08:00"><link rel="alternate" type="application/rss+xml" href="../../feed.xml" title="Jiake Zhu · 日志"><script src="../../../assets/theme.js"></script><link rel="stylesheet" href="../../../assets/refinement.css"><link rel="stylesheet" href="../../../assets/journal.css?v=4"></head><body><nav class="journal-nav" aria-label="主导航"><a class="nav-logo" href="../../../">Jiake ZHU</a><div class="journal-nav-links"><a href="../../../story/#journal">Story</a><a href="../../feed.xml">RSS ↗</a></div></nav><main class="article-shell"><a class="article-back" href="../../../story/#journal">← 返回 Story</a><article><header class="article-header"><div class="journal-meta"><span>${categoryName(post)}</span><time datetime="${post.date}">${post.date}</time><span>${post.minutes} 分钟阅读</span></div><h1 class="article-title">${escape(post.title)}</h1><p class="article-summary">${escape(post.summary)}</p><div class="journal-tags">${post.tags.map(t=>`<span># ${escape(t)}</span>`).join('')}</div></header>${toc}<div class="article-body">${post.html}</div></article><div class="article-bottom"><a href="../../../story/#journal">← 更多故事</a><a href="${url}">文章永久链接 ↗</a></div></main><footer class="journal-footer"><span>Jiake ZHU · 朱佳科</span><a href="../../../">返回主页</a></footer></body></html>`;
}
export function build(base = root) {
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const sourceDir = path.join(base,'content/posts');
  const posts = fs.readdirSync(sourceDir).filter(f=>f.endsWith('.md')).map(f=>parsePost(fs.readFileSync(path.join(sourceDir,f),'utf8'),f,today)).filter(Boolean).sort((a,b)=>b.date.localeCompare(a.date)||a.slug.localeCompare(b.slug));
  if (new Set(posts.map(p=>p.slug)).size !== posts.length) throw new Error('Duplicate article slugs');
  const postsDir = path.join(base,'journal/posts');
  fs.mkdirSync(postsDir,{recursive:true});
  const manifestFile = path.join(base,'journal/manifest.json');
  const old = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile,'utf8')) : [];
  posts.forEach(p=>{const dir=path.join(postsDir,p.slug);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),article(p));});
  // Remove only previously generated article pages, never other journal files.
  old.filter(s=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)&&!posts.some(p=>p.slug===s)).forEach(s=>fs.rmSync(path.join(postsDir,s,'index.html'),{force:true}));
  fs.writeFileSync(manifestFile,JSON.stringify(posts.map(p=>p.slug),null,2)+'\n');
  const publicData = posts.map(({html, headings, ...p})=>p);
  fs.writeFileSync(path.join(base,'assets/journal-data.js'),'window.JOURNAL_POSTS = '+JSON.stringify(publicData).replaceAll('<','\\u003c')+';\n');
  replaceRegion(path.join(base,'story/index.html'),'JOURNAL_LIST',posts.length ? posts.map(p=>card(p,'../journal/posts/')).join('\n') : empty.replace('{{HOME}}','../'));
  const homeSummary = `<span class="il en show">${posts.length} entries</span><span class="il zh">${posts.length} 篇记录</span><span class="il fr">${posts.length} notes</span><span class="il es">${posts.length} entradas</span>${posts.length ? `<time datetime="${posts[0].date}">${posts[0].date.replaceAll('-',' / ')}</time>` : ''}`;
  replaceRegion(path.join(base,'index.html'),'JOURNAL_PREVIEW',homeSummary);
  const items = posts.map(p=>`<item><title>${escape(p.title)}</title><link>${origin}/journal/posts/${p.slug}/</link><guid isPermaLink="true">${origin}/journal/posts/${p.slug}/</guid><description>${escape(p.summary)}</description><category>${categoryName(p)}</category><pubDate>${new Date(p.date+'T00:00:00+08:00').toUTCString()}</pubDate></item>`).join('');
  fs.writeFileSync(path.join(base,'journal/feed.xml'),`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Jiake Zhu · Story</title><link>${origin}/story/</link><description>技术实践与日常记录</description><language>zh-CN</language>${items}</channel></rss>\n`);
  fs.copyFileSync(path.join(root,'node_modules/markdown-it/dist/markdown-it.min.js'),path.join(base,'assets/markdown-it.min.js'));
  console.log(`Journal built: ${posts.length} published articles.`);
  return posts;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) build();
