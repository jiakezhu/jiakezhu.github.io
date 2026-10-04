import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {comicDictionaries,localizeComic} from './localize-comic.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = value => String(value).padStart(2,'0');
export function buildComic(base=root) {
  const data = JSON.parse(fs.readFileSync(path.join(base,'content/story/comic-manifest.json'),'utf8'));
  const metadata = JSON.parse(fs.readFileSync(path.join(base,'images/comic/metadata.json'),'utf8'));
  if (data.language !== 'en' || data.pages.length !== 16) throw new Error('Expected the approved 16-page English comic');
  for (const [index,page] of data.pages.entries()) {
    if (page.page !== index+1 || page.frames.length !== page.captions.length || page.alt.length !== page.frames.length) throw new Error(`Invalid page ${page.page}`);
    for (const file of [page.image,page.smallImage]) if (!fs.existsSync(path.join(base,'images/comic',file))) throw new Error(`Missing comic asset: ${file}`);
  }
  const dictionaries = comicDictionaries(base,data);
  const head = title => `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · Jiake Zhu</title><meta name="description" content="A personal story in sixteen illustrated chapters: growing up on the coast, finding confidence, learning languages, teaching, Paris and building with AI."><link rel="canonical" href="https://jiakezhu.github.io/story/comic/"><script src="../../assets/theme.js?v=6"></script><link rel="stylesheet" href="../../assets/refinement.css?v=3"><link rel="stylesheet" href="../../assets/growth-comic.css?v=2"><link rel="stylesheet" href="../../assets/orbital.css?v=1"><link rel="stylesheet" href="../../assets/orbital-comic.css?v=1">`;
  const nav = `<a class="skip-link" href="#comic-pages">Skip to the comic</a><nav class="comic-nav" aria-label="Main navigation"><a class="nav-logo" href="../../index.html">Jiake ZHU</a><a href="../index.html#growth">← My story</a></nav>`;
  const introduction = `<header class="comic-intro"><p class="comic-eyebrow">Life, frame by frame · A personal memoir</p><h1>${escape(data.title)}</h1><p>From a coastal village in Ningbo to Paris, teaching, and building with AI. The moments that shaped me, told in sixteen illustrated chapters.</p><button id="comic-resume" class="comic-resume" type="button" hidden>Continue reading →</button></header>`;
  const frame = (page,rect,index) => {
    const image = metadata.pages.find(item=>item.page===page.page);
    if (!image) throw new Error(`Missing image metadata for page ${page.page}`);
    const ratio = image.width/image.height*rect.w/rect.h;
    const style = `--panel-ratio:${ratio};--image-width:${100/rect.w}%;--image-height:${100/rect.h}%;--image-left:${-rect.x/rect.w*100}%;--image-top:${-rect.y/rect.h*100}%`;
    const srcset = `../../images/comic/${page.smallImage} ${image.smallWidth}w, ../../images/comic/${page.image} ${image.width}w`;
    const caption = page.captions[index];
    const closing = page.closingCaption && index===page.frames.length-1 ? `<p>${escape(page.closingCaption)}</p>` : '';
    const sizes = rect.w===1?'(max-width: 600px) calc(100vw - 32px), 860px':'(max-width: 600px) calc(200vw - 64px), 860px';
    return `<figure class="comic-panel"><div class="comic-frame" style="${style}"><picture><source type="image/webp" data-srcset="${srcset}" sizes="${sizes}"><img data-src="../../images/comic/${page.image}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async" alt="${escape(page.alt[index])}"></picture></div>${caption||closing?`<figcaption class="comic-caption">${caption?`<p${page.page===15&&index===2?' class="comic-key-line"':''}>${escape(caption)}</p>`:''}${closing}</figcaption>`:''}</figure>`;
  };
  const pageMarkup = data.pages.map(page=>{
    const chapter = data.chapters.find(c=>page.page>=c.start&&page.page<=c.end);
    const previous = page.page>1 ? `<a href="#page-${pad(page.page-1)}" data-comic-go="${page.page-1}"><small>← Previous page</small>${escape(data.pages[page.page-2].title)}</a>` : '';
    const next = page.page<data.pages.length ? `<a href="#page-${pad(page.page+1)}" data-comic-go="${page.page+1}"><small>Next page →</small>${escape(data.pages[page.page].title)}</a>` : `<a href="../index.html#growth"><small>The story continues</small>Back to my story ↗</a>`;
    return `<section id="page-${pad(page.page)}" class="comic-page" data-comic-page="${page.page}" aria-labelledby="page-title-${page.page}"${page.page===1?'':' hidden'}><header class="comic-page-heading"><div><span class="comic-eyebrow">${pad(page.page)} / ${escape(chapter.title)}</span><h2 id="page-title-${page.page}" tabindex="-1">${escape(page.title)}</h2></div><span class="comic-folio" aria-hidden="true">${pad(page.page)} / ${data.pages.length}</span></header><div class="comic-panels comic-panels--${page.layout}">${page.frames.map((rect,index)=>frame(page,rect,index)).join('')}</div><div class="comic-page-turn">${previous}${next}</div></section>`;
  }).join('\n');
  const toolbar = `<div class="comic-toolbar"><div class="comic-toolbar-inner"><label><span class="sr-only">Choose a comic page</span><select id="comic-page-select">${data.pages.map(page=>`<option value="${page.page}">${pad(page.page)} · ${escape(page.title)}</option>`).join('')}</select></label><span id="comic-counter" class="comic-counter">01 / 16</span><div class="comic-arrows"><button class="comic-arrow" type="button" data-comic-direction="previous" aria-label="Previous page" disabled>←</button><button class="comic-arrow" type="button" data-comic-direction="next" aria-label="Next page">→</button></div></div><div class="comic-progress" aria-hidden="true"><span></span></div></div>`;
  const chapters = `<div class="comic-chapter-nav" aria-label="Story chapters">${data.chapters.map(c=>`<a href="#page-${pad(c.start)}" data-comic-go="${c.start}" data-comic-chapter data-start="${c.start}" data-end="${c.end}">${escape(c.title)}</a>`).join('')}</div>`;
  const footer = `<footer class="comic-footer"><span>Jiake ZHU · Always Day One.</span><a href="transcript.html">Read the text version ↗</a></footer>`;
  const dir = path.join(base,'story/comic');
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),`<!doctype html>\n<html lang="en"><head>${head(data.title)}</head><body class="comic-reader orbital-theme">${nav}${introduction}<noscript><div class="comic-noscript">Page navigation needs JavaScript. <a href="transcript.html">Read the complete text version.</a></div></noscript>${toolbar}${chapters}<main id="comic-pages" class="comic-pages">${pageMarkup}<p class="comic-status sr-only" id="comic-status" role="status" aria-live="polite"></p></main>${footer}<script defer src="../../assets/growth-comic.js?v=2"></script><script src="../../assets/orbital.js?v=1"></script></body></html>\n`);
  const transcript = data.pages.map(page=>`<section id="page-${pad(page.page)}"><p class="comic-eyebrow">${pad(page.page)} / 16</p><h2>${escape(page.title)}</h2>${page.captions.filter(Boolean).map(c=>`<p>${escape(c)}</p>`).join('')}${page.closingCaption?`<p>${escape(page.closingCaption)}</p>`:''}<a href="./#page-${pad(page.page)}">See this chapter in frames ↗</a></section>`).join('\n');
  fs.writeFileSync(path.join(dir,'transcript.html'),`<!doctype html>\n<html lang="en"><head>${head('The story in words').replace('href="https://jiakezhu.github.io/story/comic/"','href="https://jiakezhu.github.io/story/comic/transcript.html"')}</head><body class="comic-reader orbital-theme">${nav}<header class="comic-intro"><p class="comic-eyebrow">The story in words</p><h1>${escape(data.title)}</h1><p><a href="index.html">← Read the illustrated version</a></p></header><main class="comic-transcript" id="comic-pages">${transcript}</main>${footer.replace('href="transcript.html">Read the text version','href="index.html">Read the illustrated version')}<script defer src="../../assets/growth-comic.js?v=2"></script><script src="../../assets/orbital.js?v=1"></script></body></html>\n`);
  const storyFile = path.join(base,'story/index.html');
  if (fs.existsSync(storyFile)) {
    const growth = `<section id="growth" class="story-section story-page-section story-panel" role="tabpanel" tabindex="0" aria-labelledby="tab-growth" lang="en" hidden><div class="si"><div data-chapter="03" class="s-label">Life in frames</div><h2 class="s-title">I wanted to see <em>the world.</em></h2><p class="story-intro">A coastal village, the long road to confidence, and the languages that opened my world.<br>Sixteen illustrated chapters, from childhood to what I am building today.</p><div class="story-layout"><a class="story-cover" href="comic/index.html" aria-label="Read I Wanted to See the World"><span class="story-cover-label" aria-hidden="true"><span>LIFE, FRAME BY FRAME</span><span>16 CHAPTERS</span></span><img class="story-cover-image" src="../images/comic/page-01-small.webp" width="${metadata.pages[0].smallWidth}" height="${metadata.pages[0].smallHeight}" loading="lazy" decoding="async" alt="A cargo truck leaving a coastal village in Ningbo"><span class="story-cover-bottom">Read my story<span class="story-cover-arrow" aria-hidden="true">↗</span></span></a><div class="story-chapters" role="group" aria-label="Comic chapters">${data.chapters.map((c,i)=>`<a class="story-chapter" href="comic/index.html#page-${pad(c.start)}"><span class="story-chapter-number" aria-hidden="true">${pad(i+1)}</span><span class="story-chapter-name">${escape(c.title)}</span><span class="story-chapter-status">Pages ${pad(c.start)}–${pad(c.end)} ↗</span></a>`).join('')}<p class="story-waiting">English narration · Read at your own pace.</p></div></div></div></section>`;
    let story = fs.readFileSync(storyFile,'utf8');
    story = story.replace('<!-- GROWTH COMIC: actual life stories will be supplied by the owner. -->','<!-- GROWTH COMIC: author-provided memoir; English HTML narration. -->');
    if (!/<section id="growth"[\s>]/.test(story)) throw new Error('The existing Story growth entry was not found');
    story = story.replace(/<section id="growth"[\s\S]*?<\/section>/,growth).replace(/<dialog id="story-dialog"[\s\S]*?<\/dialog>\s*/,'');
    if (!story.includes('href="../assets/growth-comic.css')) story = story.replace('</head>','<link rel="stylesheet" href="../assets/growth-comic.css?v=2"></head>');
    story = story.replace(/assets\/growth-comic.css\?v=\d+/g,'assets/growth-comic.css?v=2');
    story = story.replace('assets/story.js?v=5','assets/story.js?v=6');
    fs.writeFileSync(storyFile,story);
  }
  localizeComic(base,data,dictionaries);
  console.log(`Comic built: ${data.pages.length} pages, ${data.pages.reduce((n,p)=>n+p.frames.length,0)} illustrated frames, 4 languages.`);
  return data;
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) buildComic();
