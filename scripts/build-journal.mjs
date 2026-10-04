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
const covers = {
  'personal-website-redesign':['history','site-history/2026-10-04-desktop.webp','WEBSITE / THEN & NOW'],
  'wechat-ai-and-philosophy':['writing','xiaozhu-brand/avatar-reading-pig.png','THINK & WRITE'],
  'language-house-preparation':['education','tutoring-prep-app-icon-v3.png','LANGUAGE HOUSE'],
  'lessonfold-workflow':['education','tutoring-prep-app-icon-v3.png','LESSONFOLD'],
  'ai-compute-field-guide':['compute',null,'AI FIELD GUIDE','AI','COMPUTE'],
  'sales-buddy-next-action':['sales','sales-buddy-deck/sales-buddy-logo-v4-light-transparent.png','SALES BUDDY'],
  'cloud-sales-shared-record':['memory',null,'A SHARED MEMORY','{ }','CLOUD SALES'],
  'feishu-notes-find-again':['notes','feishu-kb-app-icon-v3.png','KNOWLEDGE NOTES'],
  'habit-orbit-small-days':['orbit','jiake-orbit-app-icon-v2.png','HABIT ORBIT'],
  'lesson-prep-continuity':['education','tutoring-prep-app-icon-v3.png','LESSON NOTES'],
  'train-window-travel-skill':['travel','budget-travel-app-icon-v3.png','ON THE ROAD'],
  'lingovibe-paris-language':['language','lingovibe-app-icon-v3.png','LINGOVIBE']
};
export function card(post, prefix='./posts/') {
  const [style,image,label,type='Notes',subtitle='A PERSONAL COLLECTION'] = covers[post.slug] || ['notes',null,'A NEW NOTE'];
  const visual = image ? `<img src="../images/${image}" width="512" height="512" loading="lazy" decoding="async" alt="">` : `<span class="journal-cover-type">${type}<small>${subtitle}</small></span>`;
  return `<a id="post-${post.slug}" class="journal-card journal-card--${style}" data-category="${post.category}" href="${prefix}${post.slug}/index.html"><div class="journal-card-cover" aria-hidden="true"><span class="journal-cover-label">${label}</span>${visual}</div><div class="journal-card-content"><time datetime="${post.date}">${post.date.replaceAll('-',' / ')}</time><div class="journal-meta"><span>${categoryName(post)}</span><span>${post.minutes} 分钟阅读</span></div><h3>${escape(post.title)}</h3><p>${escape(post.summary)}</p><div class="journal-tags">${post.tags.map(t=>`<span># ${escape(t)}</span>`).join('')}</div></div><span class="journal-arrow" aria-hidden="true">↗</span></a>`;
}
const empty = `<div class="journal-empty"><div><p class="journal-eyebrow">A page to begin</p><h2>下一篇，<br>从一个想法开始。</h2><p>这里将收录技术博客与日常日记。第一篇记录还在路上，先看看我正在做的项目。</p><a href="{{HOME}}#projects">探索 AI 作品集 ↗</a></div><div class="empty-art" aria-hidden="true"><div class="art-number">01 /</div><div class="art-line"></div><div class="art-line"></div><div class="art-caption">Notes on building & living</div></div></div>`;
function replaceRegion(file, name, html) {
  const start = `<!-- ${name}_START -->`, end = `<!-- ${name}_END -->`;
  const source = fs.readFileSync(file,'utf8');
  if (!source.includes(start) || !source.includes(end)) throw new Error(`Missing ${name} markers in ${file}`);
  fs.writeFileSync(file, source.slice(0,source.indexOf(start)+start.length)+'\n'+html+'\n'+source.slice(source.indexOf(end)));
}
const readingCopy={
  zh:{category:{tech:'技术博客',diary:'日记'},nav:'主导航',story:'我的故事',back:'← 返回我的故事',toc:'文章目录',minutes:'分钟阅读',more:'← 更多故事',permalink:'文章永久链接 ↗',home:'返回主页',languages:'文章语言'},
  en:{category:{tech:'Building',diary:'Life notes'},nav:'Main navigation',story:'My story',back:'← Back to my stories',toc:'In this article',minutes:'min read',more:'← More stories',permalink:'Permanent link ↗',home:'Back to home',languages:'Article language'},
  fr:{category:{tech:'Projets',diary:'Au quotidien'},nav:'Navigation principale',story:'Mon histoire',back:'← Retour aux récits',toc:'Dans cet article',minutes:'min de lecture',more:'← Autres récits',permalink:'Lien permanent ↗',home:'Retour à l’accueil',languages:'Langue de l’article'},
  es:{category:{tech:'Proyectos',diary:'Vida cotidiana'},nav:'Navegación principal',story:'Mi historia',back:'← Volver a mis historias',toc:'En este artículo',minutes:'min de lectura',more:'← Más historias',permalink:'Enlace permanente ↗',home:'Volver al inicio',languages:'Idioma del artículo'}
};
export function loadTranslations(post,base){
  const file=path.join(base,'content/post-translations',post.slug+'.json');
  if(!fs.existsSync(file)) throw new Error(`${post.slug}: missing article translations`);
  const source=JSON.parse(fs.readFileSync(file,'utf8')),translations={};
  for(const language of ['en','fr','es']){
    const t=source[language];
    if(!t||['title','summary','body'].some(key=>typeof t[key]!=='string'||!t[key].trim()))throw new Error(`${post.slug}: incomplete ${language} translation`);
    const {html,headings}=renderMarkdown(t.body);
    const text=t.body.replace(/[#*_>`~]/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').trim();
    translations[language]={title:t.title,summary:t.summary,html,headings,minutes:Math.max(1,Math.ceil(text.split(/\s+/).length/210)),searchText:text};
  }
  return translations;
}
function article(post) {
  const url = `${origin}/journal/posts/${post.slug}/`;
  const variants={zh:post,...post.translations};
  const versions=Object.entries(variants).map(([language,p])=>{
    const t=readingCopy[language];
    const toc=p.headings.length?`<details class="article-toc"><summary>${t.toc}</summary><ul>${p.headings.map(h=>`<li><a href="#${language}-${h.id}">${escape(h.text)}</a></li>`).join('')}</ul></details>`:'';
    const html=p.html.replace(/id="(section-\d+)"/g,`id="${language}-$1"`);
    return `<article class="article-language" data-article-version="${language}" lang="${language}"${language==='zh'?'':' hidden'}><header class="article-header"><div class="journal-meta"><span>${t.category[post.category]}</span><time datetime="${post.date}">${post.date}</time><span>${p.minutes} ${t.minutes}</span></div><h1 class="article-title">${escape(p.title)}</h1><p class="article-summary">${escape(p.summary)}</p></header>${toc}<div class="article-body">${html}</div></article>`;
  }).join('\n');
  const ui=JSON.stringify(Object.fromEntries(Object.entries(variants).map(([l,p])=>[l,{...readingCopy[l],title:p.title,summary:p.summary}]))).replaceAll('<','\\u003c');
  return `<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(post.title)} · Jiake Zhu</title><meta name="description" content="${escape(post.summary)}"><link rel="canonical" href="${url}"><meta property="og:title" content="${escape(post.title)}"><meta property="og:description" content="${escape(post.summary)}"><meta property="og:type" content="article"><meta property="og:url" content="${url}"><meta property="article:published_time" content="${post.date}T00:00:00+08:00"><link rel="alternate" type="application/rss+xml" href="../../feed.xml" title="Jiake Zhu · Journal"><script src="../../../assets/theme.js?v=5"></script><link rel="stylesheet" href="../../../assets/refinement.css"><link rel="stylesheet" href="../../../assets/journal.css?v=5"><link rel="stylesheet" href="../../../assets/article.css?v=1"></head><body class="article-page"><nav class="journal-nav" aria-label="主导航"><a class="nav-logo" href="../../../index.html">Jiake ZHU</a><div class="article-nav-tools"><a class="article-story-link" href="../../../story/index.html#journal" data-reading-text="story">我的故事</a><div class="article-languages" role="group" aria-label="文章语言"><button type="button" data-article-language="zh" aria-pressed="true">CN</button><button type="button" data-article-language="en" aria-pressed="false">EN</button><button type="button" data-article-language="fr" aria-pressed="false">FR</button><button type="button" data-article-language="es" aria-pressed="false">ES</button></div><div class="nav-tools"></div></div></nav><main class="article-shell"><a class="article-back" href="../../../story/index.html#journal" data-reading-text="back">← 返回我的故事</a>${versions}<div class="article-bottom"><a href="../../../story/index.html#journal" data-reading-text="more">← 更多故事</a><a class="article-permalink" href="${url}" data-reading-text="permalink">文章永久链接 ↗</a></div></main><footer class="journal-footer"><span>Jiake ZHU</span><a href="../../../index.html" data-reading-text="home">返回主页</a></footer><script id="article-ui" type="application/json">${ui}</script><script src="../../../assets/article-language.js?v=2"></script></body></html>`;
}
export function build(base = root) {
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const sourceDir = path.join(base,'content/posts');
  const posts = fs.readdirSync(sourceDir).filter(f=>f.endsWith('.md')).map(f=>parsePost(fs.readFileSync(path.join(sourceDir,f),'utf8'),f,today)).filter(Boolean).sort((a,b)=>b.date.localeCompare(a.date)||a.slug.localeCompare(b.slug));
  if (new Set(posts.map(p=>p.slug)).size !== posts.length) throw new Error('Duplicate article slugs');
  posts.forEach(post=>{post.translations=loadTranslations(post,base);});
  const postsDir = path.join(base,'journal/posts');
  fs.mkdirSync(postsDir,{recursive:true});
  const manifestFile = path.join(base,'journal/manifest.json');
  const old = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile,'utf8')) : [];
  posts.forEach(p=>{const dir=path.join(postsDir,p.slug);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),article(p));});
  // Remove only previously generated article pages, never other journal files.
  old.filter(s=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)&&!posts.some(p=>p.slug===s)).forEach(s=>fs.rmSync(path.join(postsDir,s,'index.html'),{force:true}));
  fs.writeFileSync(manifestFile,JSON.stringify(posts.map(p=>p.slug),null,2)+'\n');
  const publicData = posts.map(({html, headings, translations, ...p})=>({...p,translations:Object.fromEntries(Object.entries(translations).map(([language,{html,headings,...t}])=>[language,t]))}));
  fs.writeFileSync(path.join(base,'assets/journal-data.js'),'window.JOURNAL_POSTS = '+JSON.stringify(publicData).replaceAll('<','\\u003c')+';\n');
  replaceRegion(path.join(base,'story/index.html'),'JOURNAL_LIST',posts.length ? posts.map(p=>card(p,'../journal/posts/')).join('\n') : empty.replace('{{HOME}}','../'));
  const homeSummary = `<span class="il en show">${posts.length} entries</span><span class="il zh">${posts.length} 篇记录</span><span class="il fr">${posts.length} notes</span><span class="il es">${posts.length} entradas</span>${posts.length ? `<time datetime="${posts[0].date}">${posts[0].date.replaceAll('-',' / ')}</time>` : ''}`;
  replaceRegion(path.join(base,'index.html'),'JOURNAL_PREVIEW',homeSummary);
  const items = posts.map(p=>`<item><title>${escape(p.title)}</title><link>${origin}/journal/posts/${p.slug}/</link><guid isPermaLink="true">${origin}/journal/posts/${p.slug}/</guid><description>${escape(p.summary)}</description><category>${categoryName(p)}</category><pubDate>${new Date(p.date+'T00:00:00+08:00').toUTCString()}</pubDate></item>`).join('');
  fs.writeFileSync(path.join(base,'journal/feed.xml'),`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Jiake Zhu · 我的故事</title><link>${origin}/story/</link><description>技术实践与日常记录</description><language>zh-CN</language>${items}</channel></rss>\n`);
  fs.copyFileSync(path.join(root,'node_modules/markdown-it/dist/markdown-it.min.js'),path.join(base,'assets/markdown-it.min.js'));
  console.log(`Journal built: ${posts.length} published articles.`);
  return posts;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) build();
