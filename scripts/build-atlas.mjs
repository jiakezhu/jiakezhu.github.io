import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'assets/maps',name),'utf8'));
const data={countries:read('countries.geojson'),provinces:read('china-provinces.geojson'),places:read('places.json'),guide:read('city-guide.json')};
for(const region of Object.values(data.places)) for(const point of [...region.milestones,...region.cities]) {
  const guide=data.guide[point.label];
  if(!guide||['names','intro'].some(key=>!Array.isArray(guide[key])||guide[key].length!==4||guide[key].some(text=>typeof text!=='string'||!text.trim()))||!guide.source?.url?.startsWith('https://')) throw new Error(`Incomplete city guide: ${point.label}`);
}
fs.writeFileSync(path.join(root,'assets/maps/atlas-data.js'),'window.JIAKE_ATLAS_DATA='+JSON.stringify(data).replaceAll('<','\\u003c')+';\n');
console.log('Atlas bundled for HTTP and direct-file reading.');
