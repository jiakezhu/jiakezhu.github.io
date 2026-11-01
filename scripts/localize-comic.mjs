import fs from 'node:fs';
import path from 'node:path';

export const COMIC_ASSET_VERSION = 7;
const languages = ['en','zh','fr','es'];
const pad = number => String(number).padStart(2,'0');
const present = value => typeof value === 'string' && value.trim().length > 0;
const format = (value,variables) => value.replace(/\{(\w+)\}/g,(match,key)=>variables[key] ?? match);
const openArtwork = {
  en:'Open the complete artwork at full size',zh:'查看完整大图',
  fr:'Ouvrir l’illustration complète en grand format',es:'Abrir la ilustración completa a tamaño original'
};
const pageCounts = {en:'{pages} illustrated pages',zh:'{pages}页成长故事',fr:'{pages} pages illustrées',es:'{pages} páginas ilustradas'};
const required = ['eyebrow','intro','description','skip','navLabel','myStory','languagesLabel','choosePage','previous','next','previousLink','nextLink','chaptersLabel','continues','backStory','textVersion','wordsEyebrow','wordsTitle','illustratedVersion','backIllustrated','seeFrames','noScript','noScriptLink','resume','pageStatus','loadError','darkTheme','lightTheme','entryLabel','entryLead','entryAccent','entryIntro','entryCoverRead','entryReadAria','entryCoverAlt','entryReadAtPace','range'];

export function comicDictionaries(base,data) {
  const translations = JSON.parse(fs.readFileSync(path.join(base,'content/story/comic-translations.json'),'utf8'));
  const dictionaries = {};
  const controls = new Set([...required,...Object.keys(translations.ui?.en || {})]);
  const counts = {pages:data.pages.length,chapters:data.chapters.length};
  for (const language of languages) {
    const locale = translations.locales?.[language];
    const ui = translations.ui?.[language];
    if (!ui || [...controls].some(key=>key!=='entryCount' && !present(ui[key]))) throw new Error(`Incomplete ${language} comic controls`);
    if ((language!=='en' || locale) && (!present(locale?.title) || !Array.isArray(locale.chapters) || locale.chapters.length!==data.chapters.length || locale.chapters.some(value=>!present(value)) || !Array.isArray(locale.pages) || locale.pages.length!==data.pages.length)) throw new Error(`Incomplete ${language} comic translation`);
    const copy = Object.fromEntries(Object.entries(ui).filter(([,value])=>typeof value==='string').map(([key,value])=>[key,format(value,counts)]));
    copy.bookTitle=locale?.title || data.title;
    copy.entryCount=format(ui.entryCount?.includes('{') ? ui.entryCount : pageCounts[language],counts);
    copy.openArtwork=ui.openArtwork || openArtwork[language];
    data.chapters.forEach((chapter,index)=>{
      copy[`chapter.${index}`] = locale?.chapters[index] || chapter.title;
      copy[`range.${index}`] = format(ui.range,{start:pad(chapter.start),end:pad(chapter.end)});
    });
    data.pages.forEach((page,index)=>{
      const row = locale?.pages[index] || [page.title,page.captions,page.alt,page.closingCaption];
      if (!Array.isArray(row) || !present(row[0]) || !Array.isArray(row[1]) || !Array.isArray(row[2]) || row[1].length!==page.captions.length || row[2].length!==page.alt.length || row[1].some((value,i)=>page.captions[i]===null ? value!==null : !present(value)) || row[2].some(value=>!present(value)) || (page.closingCaption && !present(row[3]))) throw new Error(`Incomplete ${language} comic page ${page.page}`);
      const chapterIndex = data.chapters.findIndex(chapter=>page.page>=chapter.start && page.page<=chapter.end);
      copy[`page.${page.page}.title`] = row[0];
      copy[`page.${page.page}.option`] = `${pad(page.page)} · ${row[0]}`;
      copy[`page.${page.page}.eyebrow`] = `${pad(page.page)} / ${copy[`chapter.${chapterIndex}`]}`;
      row[1].forEach((value,i)=>{if(value!==null) copy[`page.${page.page}.caption.${i}`]=value;});
      row[2].forEach((value,i)=>{copy[`page.${page.page}.alt.${i}`]=value;});
      if (page.closingCaption) copy[`page.${page.page}.closing`]=row[3];
    });
    dictionaries[language] = copy;
  }
  return dictionaries;
}

// All reader/entry markup is keyed explicitly by build-comic; never match English text.
export function localizeComic(base,data,dictionaries) {
  const assets=path.join(base,'assets');
  const entryCopy={};
  for(const [language,copy] of Object.entries(dictionaries)) {
    entryCopy[language]={};
    for(const [key,value] of Object.entries(copy)) if(key.startsWith('entry') || key.startsWith('chapter.') || key.startsWith('range.') || key==='chaptersLabel') entryCopy[language][`comic.${key}`]=value;
  }
  fs.mkdirSync(assets,{recursive:true});
  fs.writeFileSync(path.join(assets,'growth-comic-i18n.js'),`// Generated from the memoir and its complete translations.\nwindow.COMIC_I18N = ${JSON.stringify(dictionaries)};\n`);
  fs.writeFileSync(path.join(assets,'growth-comic-entry-i18n.js'),`// Small dictionary for the existing Story hub.\n(() => { const copy=${JSON.stringify(entryCopy)}; window.STORY_I18N ||= {}; for(const [language,values] of Object.entries(copy)) Object.assign(window.STORY_I18N[language] ||= {},values); })();\n`);
}
