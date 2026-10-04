import fs from 'node:fs';
import path from 'node:path';

const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const regexEscape = value => value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pad = number => String(number).padStart(2,'0');
const format = (value,variables) => value.replace(/\{(\w+)\}/g,(_,key)=>variables[key]);

export function comicDictionaries(base,data) {
  const translations = JSON.parse(fs.readFileSync(path.join(base,'content/story/comic-translations.json'),'utf8'));
  const dictionaries = {};
  for (const language of ['en','zh','fr','es']) {
    const locale = translations.locales[language];
    const ui = translations.ui[language];
    if (!ui || Object.keys(translations.ui.en).some(key=>typeof ui[key]!=='string'||!ui[key])) throw new Error(`Incomplete ${language} comic controls`);
    if (language!=='en' && (!locale?.title || locale.chapters.length!==data.chapters.length || locale.pages.length!==data.pages.length)) throw new Error(`Incomplete ${language} comic translation`);
    const copy = {...ui,bookTitle:locale?.title||data.title};
    data.chapters.forEach((chapter,index)=>{
      copy[`chapter.${index}`] = locale?.chapters[index]||chapter.title;
      copy[`range.${index}`] = format(ui.range,{start:pad(chapter.start),end:pad(chapter.end)});
    });
    data.pages.forEach((page,index)=>{
      const row = locale?.pages[index]||[page.title,page.captions,page.alt,page.closingCaption];
      if (!row[0] || row[1].length!==page.captions.length || row[2].length!==page.alt.length || row[1].some((text,i)=>page.captions[i]===null?text!==null:typeof text!=='string'||!text) || row[2].some(text=>typeof text!=='string'||!text) || (page.closingCaption&&!row[3])) throw new Error(`Incomplete ${language} comic page ${page.page}`);
      const chapterIndex = data.chapters.findIndex(chapter=>page.page>=chapter.start&&page.page<=chapter.end);
      copy[`page.${page.page}.title`] = row[0];
      copy[`page.${page.page}.option`] = `${pad(page.page)} · ${row[0]}`;
      copy[`page.${page.page}.eyebrow`] = `${pad(page.page)} / ${copy[`chapter.${chapterIndex}`]}`;
      row[1].forEach((text,i)=>{if(text!==null) copy[`page.${page.page}.caption.${i}`]=text;});
      row[2].forEach((text,i)=>{copy[`page.${page.page}.alt.${i}`]=text;});
      if (row[3]) copy[`page.${page.page}.closing`]=row[3];
    });
    dictionaries[language] = copy;
  }
  return dictionaries;
}

function markText(html,text,key,attribute='data-comic-i18n') {
  const pattern = new RegExp(`(<(?:a|div|span|p|h[12]|em|small|option)\\b[^>]*>)${regexEscape(escape(text))}(<\\/(?:a|div|span|p|h[12]|em|small|option)>)`,'g');
  return html.replace(pattern,(_,open,close)=>open.includes(`${attribute}=`)?`${open}${escape(text)}${close}`:`${open.slice(0,-1)} ${attribute}="${key}">${escape(text)}${close}`);
}
function markAttribute(html,text,key,name,prefix='data-comic-i18n') {
  return html.replace(new RegExp(` ${name}="${regexEscape(escape(text))}"`,'g'),match=>`${match} ${prefix}-${name==='aria-label'?'aria':'alt'}="${key}"`);
}

export function localizeComic(base,data,dictionaries) {
  const english = dictionaries.en;
  const assets = path.join(base,'assets');
  fs.mkdirSync(assets,{recursive:true});
  fs.writeFileSync(path.join(assets,'growth-comic-i18n.js'),`// Generated from the approved memoir and its complete translations.\nwindow.COMIC_I18N = ${JSON.stringify(dictionaries)};\n`);
  const languages = `<div class="comic-languages" role="group" aria-label="Language" data-comic-i18n-aria="languagesLabel"><button type="button" data-language="en" aria-label="English" aria-pressed="true">EN</button><button type="button" data-language="zh" aria-label="中文" aria-pressed="false">CN</button><button type="button" data-language="fr" aria-label="Français" aria-pressed="false">FR</button><button type="button" data-language="es" aria-label="Español" aria-pressed="false">ES</button></div>`;
  for (const file of ['index.html','transcript.html']) {
    const output = path.join(base,'story/comic',file);
    let html = fs.readFileSync(output,'utf8');
    for (const [key,text] of Object.entries(english)) {
      if (key.includes('.alt.')) html=markAttribute(html,text,key,'alt');
      else html=markText(html,text,key);
    }
    for(const key of ['navLabel','choosePage','previous','next','chaptersLabel']) html=markAttribute(html,english[key],key,'aria-label');
    html=html.replace(/(<a\b[^>]*data-comic-go="(\d+)"[^>]*><small[^>]*>[\s\S]*?<\/small>)([^<]+)(<\/a>)/g,(_,open,number,title,close)=>`${open}<span data-comic-i18n="page.${number}.title">${title}</span>${close}`);
    html=html.replace('</small>Back to my story ↗</a>','</small><span data-comic-i18n="backStory">Back to my story ↗</span></a>');
    html=html.replace('class="comic-reader"',`class="comic-reader" data-comic-view="${file==='index.html'?'reader':'transcript'}"`);
    html=html.replace('</nav>',languages+'</nav>');
    html=html.replace('Page navigation needs JavaScript. ',`<span data-comic-i18n="noScript">${english.noScript}</span> `);
    html=html.replace('growth-comic.css?v=2','growth-comic.css?v=3');
    html=html.replace('<script defer src="../../assets/growth-comic.js?v=2"></script>','<script defer src="../../assets/growth-comic-i18n.js?v=1"></script><script defer src="../../assets/growth-comic-language.js?v=1"></script><script defer src="../../assets/growth-comic.js?v=3"></script>');
    fs.writeFileSync(output,html);
  }

  const entryCopy={};
  for(const [language,copy] of Object.entries(dictionaries)) {
    entryCopy[language]={};
    for(const [key,value] of Object.entries(copy)) if(key.startsWith('entry')||key.startsWith('chapter.')||key.startsWith('range.')||key==='chaptersLabel') entryCopy[language][`comic.${key}`]=value;
  }
  fs.writeFileSync(path.join(assets,'growth-comic-entry-i18n.js'),`// Small dictionary for the existing Story hub.\n(() => { const copy=${JSON.stringify(entryCopy)}; window.STORY_I18N ||= {}; for(const [language,values] of Object.entries(copy)) Object.assign(window.STORY_I18N[language] ||= {},values); })();\n`);
  const storyFile=path.join(base,'story/index.html');
  if(!fs.existsSync(storyFile)) return;
  let story=fs.readFileSync(storyFile,'utf8');
  story=story.replace(/<section id="growth"[\s\S]*?<\/section>/,growth=>{
    growth=growth.replace(' lang="en"','');
    growth=growth.replace(/<h2 class="s-title">[\s\S]*?<\/h2>/,`<h2 class="s-title"><span data-i18n="comic.entryLead">${english.entryLead}</span> <em data-i18n="comic.entryAccent">${english.entryAccent}</em></h2>`);
    growth=growth.replace(/<p class="story-intro">[\s\S]*?<\/p>/,`<p class="story-intro" data-i18n="comic.entryIntro">${english.entryIntro}</p>`);
    for(const [text,key] of [['Life in frames','entryLabel'],['16 CHAPTERS','entryCount'],['LIFE, FRAME BY FRAME','entryLabel'],['English narration · Read at your own pace.','entryReadAtPace']]) growth=markText(growth,text,`comic.${key}`,'data-i18n');
    growth=growth.replace('Read my story<span',`<span data-i18n="comic.entryCoverRead">${english.entryCoverRead}</span><span`);
    data.chapters.forEach((chapter,index)=>{
      growth=markText(growth,chapter.title,`comic.chapter.${index}`,'data-i18n');
      growth=markText(growth,english[`range.${index}`],`comic.range.${index}`,'data-i18n');
    });
    growth=markAttribute(growth,english.entryReadAria,'comic.entryReadAria','aria-label','data-i18n');
    growth=markAttribute(growth,'Comic chapters','comic.chaptersLabel','aria-label','data-i18n');
    growth=markAttribute(growth,english.entryCoverAlt,'comic.entryCoverAlt','alt','data-i18n');
    return growth;
  });
  if(!story.includes('assets/growth-comic-entry-i18n.js')) story=story.replace(/<script src="\.\.\/assets\/reading-pages.js[^>]*>/, '<script src="../assets/growth-comic-entry-i18n.js?v=1"></script>$&');
  story=story.replace(/assets\/reading-pages.js\?v=\d+/g,'assets/reading-pages.js?v=8').replace(/assets\/growth-comic.css\?v=\d+/g,'assets/growth-comic.css?v=3');
  fs.writeFileSync(storyFile,story);
}
