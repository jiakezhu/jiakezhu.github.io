const radians=Math.PI/180;
export const wrapLongitude=value=>((value+180)%360+360)%360-180;
export function projectPoint(lng,lat,centerLng,centerLat,radius=1) {
  const a=lat*radians,b=centerLat*radians,d=wrapLongitude(lng-centerLng)*radians;
  return {x:radius*Math.cos(a)*Math.sin(d),y:-radius*(Math.cos(b)*Math.sin(a)-Math.sin(b)*Math.cos(a)*Math.cos(d)),depth:Math.sin(b)*Math.sin(a)+Math.cos(b)*Math.cos(a)*Math.cos(d)};
}
export function greatCircle(from,to,steps=40) {
  const vector=point=>{const lat=point.lat*radians,lng=point.lng*radians;return [Math.cos(lat)*Math.cos(lng),Math.cos(lat)*Math.sin(lng),Math.sin(lat)];};
  const a=vector(from),b=vector(to),angle=Math.acos(Math.max(-1,Math.min(1,a.reduce((s,v,i)=>s+v*b[i],0))));
  if(angle<1e-8)return Array.from({length:steps+1},()=>({lng:from.lng,lat:from.lat}));
  return Array.from({length:steps+1},(_,i)=>{const t=i/steps,s=Math.sin(angle),p=Math.sin((1-t)*angle)/s,q=Math.sin(t*angle)/s,v=a.map((value,index)=>p*value+q*b[index]);return {lng:Math.atan2(v[1],v[0])/radians,lat:Math.atan2(v[2],Math.hypot(v[0],v[1]))/radians};});
}
