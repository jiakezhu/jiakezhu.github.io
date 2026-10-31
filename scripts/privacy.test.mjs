import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const document=JSON.parse(fs.readFileSync(path.join(root,'assets/document-redactions.json'),'utf8')).documents.find(item=>item.id==='bytedance-recommendation');
const regions=[{x:328,y:260,width:128,height:25},{x:516,y:597,width:132,height:25}];
const capturedHash='e30aba495e79a43d75d08619b0550d80531b190d71b7ee7ef02fb8dc56dc5ad8';
const read=file=>fs.readFileSync(path.join(root,file));

// Decode the actual public PNG using only Node's built-in zlib, including PNG row filters.
function rgbPng(bytes){
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  let width,height,compressed=[];
  for(let offset=8;offset<bytes.length;){
    const length=bytes.readUInt32BE(offset),type=bytes.subarray(offset+4,offset+8).toString(),data=bytes.subarray(offset+8,offset+8+length);
    assert(['IHDR','IDAT','IEND'].includes(type),'the redacted copy must not embed an original, EXIF, or extra image data');
    if(type==='IHDR'){
      width=data.readUInt32BE(0);height=data.readUInt32BE(4);
      assert.equal(data[8],8);assert.equal(data[9],2,'flat RGB pixels, no transparency');assert.equal(data[12],0);
    }
    if(type==='IDAT')compressed.push(data);
    offset+=length+12;
  }
  const rows=zlib.inflateSync(Buffer.concat(compressed)),stride=width*3,pixels=Buffer.alloc(stride*height);
  assert.equal(rows.length,(stride+1)*height);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++){
    const filter=rows[y*(stride+1)];assert(filter<=4);
    for(let x=0;x<stride;x++){
      const index=y*stride+x,a=x>=3?pixels[index-3]:0,b=y?pixels[index-stride]:0,c=y&&x>=3?pixels[index-stride-3]:0;
      const correction=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];
      pixels[index]=(rows[y*(stride+1)+1+x]+correction)&255;
    }
  }
  return {width,height,pixels};
}

test('both ID regions are flattened opaque black while the letter and seal remain visible',()=>{
  assert.deepEqual(document.regions,regions);assert.equal(document.color,'#000000');
  const {width,height,pixels}=rgbPng(read(document.fullSize));
  assert.deepEqual([width,height],[876,1280]);
  for(const region of regions)for(let y=region.y;y<region.y+region.height;y++)for(let x=region.x;x<region.x+region.width;x++){
    const pixel=(y*width+x)*3;assert.equal(pixels[pixel]+pixels[pixel+1]+pixels[pixel+2],0,'unmasked pixels inside an ID region');
  }
  let bodyInk=0,sealRed=0;
  for(let y=290;y<1020;y++)for(let x=160;x<740;x++){
    if(regions.some(r=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height))continue;
    const p=(y*width+x)*3;if(pixels[p]<100&&pixels[p+1]<100&&pixels[p+2]<100)bodyInk++;
  }
  for(let y=990;y<1180;y++)for(let x=490;x<690;x++){
    const p=(y*width+x)*3;if(pixels[p]>120&&pixels[p]>pixels[p+1]*1.5&&pixels[p]>pixels[p+2]*1.5)sealRed++;
  }
  assert(bodyInk>10000,'retain the certificate body');assert(sealRed>1000,'retain the original red seal');
});

test('all current, archived, and legacy public copies match the reviewed redacted files',()=>{
  const web=JSON.parse(read('assets/web-images.json')).images[document.fullSize];
  const expected=['images/bytedance1.jpeg','history/2026-08-26/site/images/bytedance1.jpeg',
    ...[400,800,876].map(width=>`images/web/64132b292ab9-${width}.webp`),document.fullSize,...web.variants.map(v=>v.src)];
  assert.deepEqual(document.assets.map(a=>a.src).sort(),expected.sort());assert.equal(expected.length,9);
  for(const asset of document.assets){
    const bytes=read(asset.src),hash=crypto.createHash('sha256').update(bytes).digest('hex');
    assert.equal(bytes.length,asset.bytes,asset.src);assert.equal(hash,asset.sha256,asset.src);assert.notEqual(hash,capturedHash,'the private original must not be restored');
  }
});

test('the modal and full-size link use newly named redacted copies rather than cached legacy URLs',()=>{
  const html=read('index.html').toString(),start=html.indexOf('<div id="modal-bytedance-rec"'),end=html.indexOf('<div id="modal-',start+10),modal=html.slice(start,end);
  assert(modal.includes(`href="${document.fullSize}"`));assert(!modal.includes('64132b292ab9-'));assert(!modal.includes('href="images/bytedance1.jpeg"'));
  const web=JSON.parse(read('assets/web-images.json')).images[document.fullSize];
  for(const variant of web.variants)assert(modal.includes(variant.src));
  const config=JSON.parse(read('assets/web-image-sources.json'));
  assert.equal(config.images.filter(image=>image.source===document.fullSize).length,1);
  assert(!config.images.some(image=>image.source==='images/bytedance1.jpeg'),'future derivative builds must use the flattened source');
});
