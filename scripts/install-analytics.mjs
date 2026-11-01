import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {withAnalytics} from './site-analytics.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixed=['index.html','story/index.html','story/comic/index.html','story/comic/transcript.html','sales-buddy.html','sales-buddy-deck/index.html'];
export function publicAnalyticsPages(base=root) {
  const files=fixed.filter(file=>fs.existsSync(path.join(base,file)));
  const articles=path.join(base,'journal/posts');
  if(fs.existsSync(articles)) for(const folder of fs.readdirSync(articles,{withFileTypes:true})) {
    const file=`journal/posts/${folder.name}/index.html`;
    if(folder.isDirectory() && fs.existsSync(path.join(base,file))) files.push(file);
  }
  return files.sort();
}
export function installAnalytics(base=root) {
  const updates=publicAnalyticsPages(base).map(file=>{
    const original=fs.readFileSync(path.join(base,file),'utf8');
    const depth=file.split('/').length-1;
    return {file,original,html:withAnalytics(original,'../'.repeat(depth)+'assets/')};
  });
  // Validate every document first; never leave a partial install after bad HTML.
  for(const update of updates) if(update.html!==update.original) fs.writeFileSync(path.join(base,update.file),update.html);
  return updates.map(({file})=>file);
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) console.log(`Analytics entry installed on ${installAnalytics().length} public pages.`);
