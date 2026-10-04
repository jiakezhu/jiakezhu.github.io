import test from 'node:test';
import assert from 'node:assert/strict';
import {projectPoint,greatCircle,wrapLongitude} from '../assets/orbital-geometry.mjs';
const close=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('the selected city faces the viewer, while the far side stays hidden',()=>{
  const p=projectPoint(121.783,29.739,121.783,29.739,160);
  close(p.x,0);close(p.y,0);close(p.depth,1);
  assert(projectPoint(-58.217,-29.739,121.783,29.739).depth<0);
});
test('longitude wraps smoothly across the date line and all visible points stay inside Earth',()=>{
  close(wrapLongitude(181),-179);close(wrapLongitude(-181),179);
  for(let lng=-180;lng<180;lng+=10)for(let lat=-80;lat<=80;lat+=10){const p=projectPoint(lng,lat,70,28,160);assert(p.x*p.x+p.y*p.y<=160*160+1e-7);}
});
test('study routes follow a continuous great circle with exact endpoints across the date line',()=>{
  const from={lng:170,lat:30},to={lng:-170,lat:45},route=greatCircle(from,to,40);
  close(route[0].lng,from.lng);close(route[0].lat,from.lat);close(route.at(-1).lng,to.lng);close(route.at(-1).lat,to.lat);
  assert(route.slice(1,-1).every(point=>Math.abs(point.lng)>169));
  assert(route.every(point=>Number.isFinite(point.lng)&&Number.isFinite(point.lat)));
});
