import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'assets/maps',name),'utf8'));
const data={countries:read('countries.geojson'),provinces:read('china-provinces.geojson'),places:read('places.json'),guide:read('city-guide.json')};
for(const region of Object.values(data.places)) for(const point of [...region.milestones,...region.cities]) {
  const guide=data.guide[point.label];
  if(!guide||['names','intro'].some(key=>!Array.isArray(guide[key])||guide[key].length!==4||guide[key].some(text=>typeof text!=='string'||!text.trim()))||!guide.source?.url?.startsWith('https://')) throw new Error(`Incomplete city guide: ${point.label}`);
  if(!Array.isArray(guide.country)||guide.country.length!==4||guide.country.some(text=>!text.trim())||!Array.isArray(guide.highlights)||guide.highlights.length!==4||guide.highlights.some(items=>!Array.isArray(items)||items.length!==3||items.some(text=>!text.trim()))) throw new Error(`Incomplete place details: ${point.label}`);
  for(const image of [guide.image,...(guide.personalImage?[guide.personalImage]:[])]) {
  if(!image||!['personal','reference'].includes(image.kind)||!Array.isArray(image.alt)||image.alt.length!==4||image.alt.some(text=>!text.trim())||image.width<400||image.height<300||!image.src.startsWith('images/')) throw new Error(`Incomplete place photo: ${point.label}`);
  const file=path.resolve(root,image.src);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)) throw new Error(`Missing local photo: ${point.label}`);
  const bytes=fs.readFileSync(file);
  if(bytes.subarray(0,4).toString()!=='RIFF'||bytes.subarray(8,12).toString()!=='WEBP') throw new Error(`Invalid photo format: ${point.label}`);
  if(!image.credit?.author?.trim()||!image.credit.url?.startsWith('https://')||!image.credit.license?.trim()) throw new Error(`Incomplete photo credit: ${point.label}`);
  }
}
fs.writeFileSync(path.join(root,'assets/maps/atlas-data.js'),'window.JIAKE_ATLAS_DATA='+JSON.stringify(data).replaceAll('<','\\u003c')+';\n');
console.log('Atlas bundled for HTTP and direct-file reading.');
