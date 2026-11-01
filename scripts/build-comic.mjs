import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {COMIC_ASSET_VERSION,comicDictionaries,localizeComic} from './localize-comic.mjs';
import {withAnalytics} from './site-analytics.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=value=>String(value).padStart(2,'0');
const present=value=>typeof value==='string' && value.trim().length>0;

function validateComic(base,data,metadata) {
  if(data.language!=='en' || !present(data.title) || !Array.isArray(data.pages) || !data.pages.length) throw new Error('Expected a nonempty English comic');
  if(!Array.isArray(data.chapters) || !data.chapters.length) throw new Error('Invalid comic chapters');
  let next=1;
  for(const chapter of data.chapters) {
    if(!present(chapter.title) || !Number.isInteger(chapter.start) || !Number.isInteger(chapter.end) || chapter.start!==next || chapter.end<chapter.start || chapter.end>data.pages.length) throw new Error('Invalid comic chapter coverage');
    next=chapter.end+1;
  }
  if(next!==data.pages.length+1) throw new Error('Invalid comic chapter coverage');
  if(!Array.isArray(metadata.pages)) throw new Error('Invalid comic image metadata');
  const images=new Map();
  for(const image of metadata.pages) {
    if(!image || !Number.isInteger(image.page) || image.page<1) throw new Error('Invalid comic image metadata');
    if(images.has(image.page)) throw new Error(`Duplicate image metadata for page ${image.page}`);
    images.set(image.page,image);
  }
  for(const [index,page] of data.pages.entries()) {
    const composed=page.layout==='composed';
    if(page.page!==index+1 || !present(page.title) || !['composed','strips3','grid4','grid5'].includes(page.layout) || !Array.isArray(page.frames) || !page.frames.length || !Array.isArray(page.captions) || !page.captions.length || page.captions.some(value=>value!==null && !present(value)) || !Array.isArray(page.alt) || page.alt.length!==page.frames.length || page.alt.some(value=>!present(value)) || (!composed && page.frames.length!==page.captions.length) || (page.closingCaption!=null && !present(page.closingCaption))) throw new Error(`Invalid page ${page.page}`);
    for(const rect of page.frames) {
      if(!rect || ['x','y','w','h'].some(key=>!Number.isFinite(rect[key])) || rect.x<0 || rect.y<0 || rect.w<=0 || rect.h<=0 || rect.x+rect.w>1.000001 || rect.y+rect.h>1.000001) throw new Error(`Invalid frame on page ${page.page}`);
    }
    if(composed && (page.frames.length!==1 || ['x','y'].some(key=>page.frames[0][key]!==0) || ['w','h'].some(key=>page.frames[0][key]!==1))) throw new Error(`Invalid composed artwork on page ${page.page}`);
    const image=images.get(page.page);
    if(!image || ['width','height','smallWidth','smallHeight'].some(key=>!Number.isInteger(image[key]) || image[key]<=0)) throw new Error(`Invalid image metadata for page ${page.page}`);
    for(const file of [page.image,page.smallImage]) {
      if(!present(file) || path.isAbsolute(file) || file.split(/[\\/]/).includes('..') || !fs.existsSync(path.join(base,'images/comic',file)) || !fs.statSync(path.join(base,'images/comic',file)).isFile()) throw new Error(`Missing comic asset: ${file}`);
    }
  }
  return images;
}

export function buildComic(base=root) {
  const data=JSON.parse(fs.readFileSync(path.join(base,'content/story/comic-manifest.json'),'utf8'));
  const metadata=JSON.parse(fs.readFileSync(path.join(base,'images/comic/metadata.json'),'utf8'));
  const images=validateComic(base,data,metadata);
  const dictionaries=comicDictionaries(base,data);
  const english=dictionaries.en;
  const total=data.pages.length;
  const edition=Number(data.version)>=2 ? 2 : 1;
  const query=edition===2 ? '?edition=2' : '';
  const pageLink=number=>`${query}#page-${pad(number)}`;
  const t=(key,tag='span',attributes='')=>`<${tag}${attributes} data-comic-i18n="${key}">${escape(english[key])}</${tag}>`;
  const aria=key=>`aria-label="${escape(english[key])}" data-comic-i18n-aria="${key}"`;
  const scripts=`<script defer src="../../assets/growth-comic-i18n.js?v=${COMIC_ASSET_VERSION}"></script><script defer src="../../assets/growth-comic-language.js?v=${COMIC_ASSET_VERSION}"></script><script defer src="../../assets/growth-comic.js?v=${COMIC_ASSET_VERSION}"></script>`;
  const head=(title,transcript=false)=>`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · Jiake Zhu</title><meta name="description" content="${escape(english.description)}"><link rel="canonical" href="https://jiakezhu.github.io/story/comic/${transcript?'transcript.html':''}"><script src="../../assets/theme.js?v=4"></script><link rel="stylesheet" href="../../assets/refinement.css?v=3"><link rel="stylesheet" href="../../assets/growth-comic.css?v=${COMIC_ASSET_VERSION}">`;
  const languages=`<div class="comic-languages" role="group" ${aria('languagesLabel')}>${[['en','EN','English'],['zh','CN','中文'],['fr','FR','Français'],['es','ES','Español']].map(([language,label,name])=>`<button type="button" data-language="${language}" aria-label="${name}" aria-pressed="${language==='en'}">${label}</button>`).join('')}</div>`;
  const nav=`${t('skip','a',' class="skip-link" href="#comic-pages"')}<nav class="comic-nav" ${aria('navLabel')}><a class="nav-logo" href="../../index.html">Jiake ZHU</a>${t('myStory','a',' href="../index.html#growth"')}${languages}</nav>`;
  const title=t('bookTitle','h1');
  const intro=`<header class="comic-intro">${t('eyebrow','p',' class="comic-eyebrow"')}${title}${t('intro','p')}<button id="comic-resume" class="comic-resume" type="button" hidden></button></header>`;
  const paragraph=(page,index)=>page.captions[index]===null ? '' : t(`page.${page.page}.caption.${index}`,'p',page.emphasisCaption===index ? ' class="comic-key-line"' : '');
  const closing=page=>page.closingCaption ? t(`page.${page.page}.closing`,'p') : '';
  const picture=(page,index,sizes)=>{
    const image=images.get(page.page);
    return `<picture><source type="image/webp" data-srcset="../../images/comic/${escape(page.smallImage)} ${image.smallWidth}w, ../../images/comic/${escape(page.image)} ${image.width}w" sizes="${sizes}"><img data-src="../../images/comic/${escape(page.image)}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async" alt="${escape(page.alt[index])}" data-comic-i18n-alt="page.${page.page}.alt.${index}"></picture>`;
  };
  const artwork=page=>{
    if(page.layout==='composed') return `<figure class="comic-panel comic-panel--composed"><a class="comic-artwork-link" href="../../images/comic/${escape(page.image)}" target="_blank" rel="noopener" ${aria('openArtwork')}>${picture(page,0,'(max-width: 600px) calc(100vw - 32px), 864px')}</a><figcaption class="comic-caption comic-narration">${page.captions.map((_,index)=>paragraph(page,index)).join('')}${closing(page)}</figcaption></figure>`;
    return page.frames.map((rect,index)=>{
      const image=images.get(page.page);
      const ratio=image.width/image.height*rect.w/rect.h;
      const style=`--panel-ratio:${ratio};--image-width:${100/rect.w}%;--image-height:${100/rect.h}%;--image-left:${-rect.x/rect.w*100}%;--image-top:${-rect.y/rect.h*100}%`;
      const caption=paragraph(page,index)+(index===page.frames.length-1 ? closing(page) : '');
      return `<figure class="comic-panel"><div class="comic-frame" style="${style}">${picture(page,index,rect.w===1?'(max-width: 600px) calc(100vw - 32px), 864px':'(max-width: 600px) calc(200vw - 64px), 864px')}</div>${caption?`<figcaption class="comic-caption">${caption}</figcaption>`:''}</figure>`;
    }).join('');
  };
  const pages=data.pages.map(page=>{
    const previous=page.page>1 ? `<a href="${pageLink(page.page-1)}" data-comic-go="${page.page-1}">${t('previousLink','small')}${t(`page.${page.page-1}.title`)}</a>` : '';
    const next=page.page<total ? `<a href="${pageLink(page.page+1)}" data-comic-go="${page.page+1}">${t('nextLink','small')}${t(`page.${page.page+1}.title`)}</a>` : `<a href="../index.html#growth">${t('continues','small')}${t('backStory')}</a>`;
    return `<section id="page-${pad(page.page)}" class="comic-page" data-comic-page="${page.page}" aria-labelledby="page-title-${page.page}"${page.page===1?'':' hidden'}><header class="comic-page-heading"><div>${t(`page.${page.page}.eyebrow`,'span',' class="comic-eyebrow"')}${t(`page.${page.page}.title`,'h2',` id="page-title-${page.page}" tabindex="-1"`)}</div><span class="comic-folio" aria-hidden="true">${pad(page.page)} / ${total}</span></header><div class="comic-panels comic-panels--${page.layout}">${artwork(page)}</div><div class="comic-page-turn">${previous}${next}</div></section>`;
  }).join('\n');
  const toolbar=`<div class="comic-toolbar"><div class="comic-toolbar-inner"><label>${t('choosePage','span',' class="sr-only"')}<select id="comic-page-select" ${aria('choosePage')}>${data.pages.map(page=>t(`page.${page.page}.option`,'option',` value="${page.page}"`)).join('')}</select></label><span id="comic-counter" class="comic-counter">01 / ${total}</span><div class="comic-arrows"><button class="comic-arrow" type="button" data-comic-direction="previous" ${aria('previous')} disabled>←</button><button class="comic-arrow" type="button" data-comic-direction="next" ${aria('next')}${total===1?' disabled':''}>→</button></div></div><div class="comic-progress" aria-hidden="true"><span style="width:${100/total}%"></span></div></div>`;
  const chapters=`<div class="comic-chapter-nav" ${aria('chaptersLabel')}>${data.chapters.map((chapter,index)=>t(`chapter.${index}`,'a',` href="${pageLink(chapter.start)}" data-comic-go="${chapter.start}" data-comic-chapter data-start="${chapter.start}" data-end="${chapter.end}"`)).join('')}</div>`;
  const footer=transcript=>`<footer class="comic-footer"><span>Jiake ZHU · Always Day One.</span>${t(transcript?'illustratedVersion':'textVersion','a',` href="${transcript?'index.html':'transcript.html'}${query}"`)}</footer>`;
  const document=(view,content,documentTitle)=>withAnalytics(`<!doctype html>\n<html lang="en"><head>${head(documentTitle,view==='transcript')}</head><body class="comic-reader" data-comic-view="${view}" data-comic-edition="${edition}" data-comic-total="${total}">${nav}${content}${footer(view==='transcript')}${scripts}</body></html>\n`,'../../assets/');
  const reader=document('reader',`${intro}<noscript><div class="comic-noscript">${t('noScript')} ${t('noScriptLink','a',` href="transcript.html${query}"`)}</div></noscript>${toolbar}${chapters}<main id="comic-pages" class="comic-pages">${pages}<p class="comic-status sr-only" id="comic-status" role="status" aria-live="polite"></p></main>`,data.title);
  const transcriptPages=data.pages.map(page=>`<section id="page-${pad(page.page)}"><p class="comic-eyebrow">${pad(page.page)} / ${total}</p>${t(`page.${page.page}.title`,'h2')}${page.captions.map((_,index)=>paragraph(page,index)).join('')}${closing(page)}${t('seeFrames','a',` href="./${pageLink(page.page)}"`)}</section>`).join('\n');
  const transcript=document('transcript',`<header class="comic-intro">${t('wordsEyebrow','p',' class="comic-eyebrow"')}${title}<p>${t('backIllustrated','a',` href="index.html${query}"`)}</p></header><main class="comic-transcript" id="comic-pages">${transcriptPages}</main>`,english.wordsTitle);

  // Prepare the existing Story edit before any writes. Never replace its other panels.
  const storyFile=path.join(base,'story/index.html');
  let story;
  if(fs.existsSync(storyFile)) {
    story=fs.readFileSync(storyFile,'utf8');
    if((story.match(/<section id="growth"[\s>]/g)||[]).length!==1) throw new Error('The existing Story growth entry was not found exactly once');
    const first=data.pages[0];
    const image=images.get(first.page);
    const entry=(key,tag='span',attributes='')=>`<${tag}${attributes} data-i18n="comic.${key}">${escape(english[key])}</${tag}>`;
    const growth=`<section id="growth" class="story-section story-page-section story-panel" role="tabpanel" tabindex="0" aria-labelledby="tab-growth" hidden><div class="si">${entry('entryLabel','div',' data-chapter="03" class="s-label"')}<h2 class="s-title">${entry('entryLead')} ${entry('entryAccent','em')}</h2>${entry('entryIntro','p',' class="story-intro"')}<div class="story-layout"><a class="story-cover" href="comic/index.html${query}" aria-label="${escape(english.entryReadAria)}" data-i18n-aria="comic.entryReadAria"><span class="story-cover-label" aria-hidden="true">${entry('entryLabel')}${entry('entryCount')}</span><img class="story-cover-image" src="../images/comic/${escape(first.smallImage)}" width="${image.smallWidth}" height="${image.smallHeight}" loading="lazy" decoding="async" alt="${escape(english.entryCoverAlt)}" data-i18n-alt="comic.entryCoverAlt"><span class="story-cover-bottom">${entry('entryCoverRead')}<span class="story-cover-arrow" aria-hidden="true">↗</span></span></a><div class="story-chapters" role="group" aria-label="${escape(english.chaptersLabel)}" data-i18n-aria="comic.chaptersLabel">${data.chapters.map((chapter,index)=>`<a class="story-chapter" href="comic/index.html${pageLink(chapter.start)}"><span class="story-chapter-number" aria-hidden="true">${pad(index+1)}</span>${entry(`chapter.${index}`,'span',' class="story-chapter-name"')}${entry(`range.${index}`,'span',' class="story-chapter-status"')}</a>`).join('')}${entry('entryReadAtPace','p',' class="story-waiting"')}</div></div></div></section>`;
    story=story.replace(/<section id="growth"[\s\S]*?<\/section>/,growth);
    if(/href="\.\.\/assets\/growth-comic\.css(?:\?[^"\s]*)?"/.test(story)) story=story.replace(/(href="\.\.\/assets\/growth-comic\.css)(?:\?[^"\s]*)?"/g,`$1?v=${COMIC_ASSET_VERSION}"`);
    else story=story.replace('</head>',`<link rel="stylesheet" href="../assets/growth-comic.css?v=${COMIC_ASSET_VERSION}"></head>`);
    if(/src="\.\.\/assets\/growth-comic-entry-i18n\.js(?:\?[^"\s]*)?"/.test(story)) story=story.replace(/(src="\.\.\/assets\/growth-comic-entry-i18n\.js)(?:\?[^"\s]*)?"/g,`$1?v=${COMIC_ASSET_VERSION}"`);
    else {
      const script=`<script src="../assets/growth-comic-entry-i18n.js?v=${COMIC_ASSET_VERSION}"></script>`;
      story=/<script\b[^>]*src="\.\.\/assets\/reading-pages\.js/.test(story) ? story.replace(/<script\b[^>]*src="\.\.\/assets\/reading-pages\.js[^>]*>/,script+'$&') : story.replace('</body>',script+'</body>');
    }
  }
  // Keep the vending-machine card on the same edition as the reader and Story cover.
  const projectsFile=path.join(base,'assets/story-projects.json');
  let projects;
  if(fs.existsSync(projectsFile)) {
    projects=JSON.parse(fs.readFileSync(projectsFile,'utf8'));
    if(!Array.isArray(projects)) throw new Error('Invalid Story project collection');
    for(const project of projects) {
      if(!/^(?:\.\/)?comic\/index\.html(?:[?#].*)?$/.test(project.href || '')) continue;
      project.image=`../images/comic/${data.pages[0].smallImage}`;
      project.href=`./comic/index.html${query}`;
      project.tags=`${total} pages · 4 languages`;
      project.description=Object.fromEntries(Object.entries(dictionaries).map(([language,copy])=>[language,copy.entryIntro]));
    }
  }
  const directory=path.join(base,'story/comic');
  fs.mkdirSync(directory,{recursive:true});
  fs.writeFileSync(path.join(directory,'index.html'),reader);
  fs.writeFileSync(path.join(directory,'transcript.html'),transcript);
  if(story!==undefined) fs.writeFileSync(storyFile,story);
  if(projects) fs.writeFileSync(projectsFile,JSON.stringify(projects,null,2)+'\n');
  localizeComic(base,data,dictionaries);
  console.log(`Comic built: ${total} pages, ${data.pages.filter(page=>page.layout==='composed').length} composed artworks, 4 languages.`);
  return data;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) buildComic();
