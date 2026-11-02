import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,queryDays,mergeDays,parsePageViews,pageViewsQuery,dayStart,detailsWindow,detailsQuery,parseDetails} from './site-visits.mjs';
import {syncVisits} from './sync-site-visits.mjs';
const asOf=Date.parse('2026-11-10T04:00:00Z');
const payload=count=>({data:{viewer:{accounts:[{rumPageloadEventsAdaptiveGroups:[{count}]}]}}});
const detailPayload={data:{viewer:{accounts:[{summary:[{count:5,sum:{visits:2}}],pages:[{count:3,dimensions:{requestPath:'/'}},{count:2,dimensions:{requestPath:'/private/user-id'}}],countries:[{count:5,dimensions:{countryName:'China'}}],devices:[{count:5,dimensions:{deviceType:'desktop'}}],sources:[{sum:{visits:2},dimensions:{refererHost:''}}]}]}}};
test('calendar windows use Shanghai midnight and half-open bounds',()=>{
 const days=queryDays(emptyState(),Date.parse('2026-11-01T17:00:00Z'));
 assert.equal(days.length,2);assert.equal(days[0].since,'2026-10-31T16:00:00.000Z');assert.equal(days[0].until,days[1].since);assert.equal(days[1].until,'2026-11-01T17:00:00.000Z');
 const q=pageViewsQuery('account','site',days[0]);assert.match(q,/siteTag:"site"/);assert.match(q,/requestHost:"jiakezhu.github.io"/);assert.match(q,/datetime_lt:/);assert.doesNotMatch(q,/requestPath|country|userAgent/);
});
test('merge replaces revised buckets and preserves older history without double-counting',()=>{
 let state=mergeDays(emptyState(),Array.from({length:10},(_,i)=>({date:`2026-11-${String(i+1).padStart(2,'0')}`,pageViews:i+1})),asOf);
 const rows=[{date:'2026-11-10',pageViews:20}];
 const next=mergeDays(state,rows,asOf);assert.equal(next.daily.length,10);assert.equal(next.daily[0].pageViews,1);assert.equal(next.daily.at(-1).pageViews,20);
 assert.deepEqual(mergeDays(next,rows,asOf),next);assert.equal(queryDays(next,asOf).length,7);
});
test('empty data is zero, API errors and malformed data cannot overwrite totals',()=>{
 assert.equal(parsePageViews({data:{viewer:{accounts:[{rumPageloadEventsAdaptiveGroups:[]}]}}}),0);
 assert.equal(parsePageViews(payload(2.1)),2);
 for(const bad of [{errors:[{message:'denied'}]},payload(-1),payload(null),payload(Infinity),{data:{viewer:{accounts:[]}}}])assert.throws(()=>parsePageViews(bad));
});
test('missing days cannot silently disappear from cumulative count',()=>{
 assert.throws(()=>mergeDays(emptyState(),[{date:'2026-11-02',pageViews:1}],asOf));
 assert.throws(()=>queryDays(emptyState(),dayStart('2026-12-10')),/manual recovery/);
});
test('a failed multi-day refresh leaves the prior state intact',async()=>{
 const state=mergeDays(emptyState(),[{date:'2026-11-01',pageViews:3}],Date.parse('2026-11-01T12:00Z'));
 const before=JSON.stringify(state);let calls=0;
 await assert.rejects(syncVisits({state,account:'a',siteTag:'s',token:'test-only',now:Date.parse('2026-11-02T12:00Z'),fetchImpl:async()=>({ok:true,json:async()=>++calls===1?payload(4):{errors:[{message:'denied'}]}})}));
 assert.equal(JSON.stringify(state),before);
});
test('successful refresh keeps daily totals and grouped details without credentials',async()=>{
 let calls=0;const result=await syncVisits({state:emptyState(),account:'a',siteTag:'s',token:'test-only',now:Date.parse('2026-11-01T12:00Z'),fetchImpl:async(url,opts)=>{assert.equal(url,'https://api.cloudflare.com/client/v4/graphql');assert.equal(opts.headers.Authorization,'Bearer test-only');return{ok:true,json:async()=>++calls===1?payload(5):detailPayload}}});
 assert.equal(result.updatedAt,'2026-11-01T11:55:00.000Z');assert.deepEqual(result.daily,[{date:'2026-11-01',pageViews:5}]);assert.equal(result.detail.visits,2);assert.doesNotMatch(JSON.stringify(result),/test-only|accountTag|siteTag|private\/user-id/);
});

test('the 30-day breakdown has independent dimensions and counts entry visits separately',()=>{
 const window=detailsWindow(Date.parse('2027-01-15T04:00:00Z'));
 assert.equal(window.since,'2026-12-16T16:00:00.000Z');
 const q=detailsQuery('a','s',window);
 for(const key of ['summary:','pages:','countries:','devices:','sources:','sum{visits}'])assert.ok(q.includes(key));
 assert.doesNotMatch(q,/refererPath|clientIP|requestQuery/);
 const parsed=parseDetails(detailPayload,window,['index.html','story/index.html']);
 assert.equal(parsed.visits,2);assert.equal(parsed.pageViews,5);
 assert.deepEqual(parsed.pages,[{key:'/',pageViews:3},{key:'other',pageViews:2}]);
 assert.deepEqual(parsed.sources,[{key:'direct',visits:2}]);
});
test('breakdowns group unrecognized routes and unsafe sources rather than publishing identifiers',()=>{
 const d=structuredClone(detailPayload),a=d.data.viewer.accounts[0];
 a.pages.push({count:4,dimensions:{requestPath:'/private/one-person?token=x'}});
 a.sources=[{sum:{visits:1},dimensions:{refererHost:'10.0.0.1'}},{sum:{visits:1},dimensions:{refererHost:'search.example.com'}},{sum:{visits:1},dimensions:{refererHost:'example.com/secret'}}];
 const out=parseDetails(d,detailsWindow(Date.parse('2026-11-02T04:00:00Z')),['index.html']);
 assert.deepEqual(out.pages.find(r=>r.key==='other'),{key:'other',pageViews:6});
 assert.deepEqual(out.sources,[{key:'search.example.com',visits:1},{key:'other',visits:2}]);
 assert.doesNotMatch(JSON.stringify(out),/one-person|10\.0\.0\.1|secret/);
});
test('a details API error fails the refresh without changing the prior good snapshot',async()=>{
 const state=mergeDays(emptyState(),[{date:'2026-11-01',pageViews:3}],Date.parse('2026-11-01T12:00Z'));
 const before=JSON.stringify(state);let calls=0;
 await assert.rejects(syncVisits({state,account:'a',siteTag:'s',token:'test',now:Date.parse('2026-11-01T12:30Z'),fetchImpl:async()=>({ok:true,json:async()=>++calls===1?payload(4):{errors:[{message:'denied'}]}})}),/details query/);
 assert.equal(JSON.stringify(state),before);
});

test('the public snapshot limits breakdowns to five rows plus a combined remainder',()=>{
 const d=structuredClone(detailPayload),a=d.data.viewer.accounts[0],files=['index.html'];
 a.pages=Array.from({length:8},(_,i)=>{const name=`p${i}.html`;files.push(name);return {count:8-i,dimensions:{requestPath:'/'+name}};});
 const pages=parseDetails(d,detailsWindow(Date.parse('2026-11-02T04:00:00Z')),files).pages;
 assert.equal(pages.length,6);assert.deepEqual(pages.at(-1),{key:'other',pageViews:6});
 assert.ok(!JSON.stringify(pages).includes('p5.html'));
});
