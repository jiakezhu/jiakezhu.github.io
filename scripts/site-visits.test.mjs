import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,queryDays,mergeDays,parsePageViews,pageViewsQuery,dayStart} from './site-visits.mjs';
import {syncVisits} from './sync-site-visits.mjs';
const asOf=Date.parse('2026-11-10T04:00:00Z');
const payload=count=>({data:{viewer:{accounts:[{rumPageloadEventsAdaptiveGroups:[{count}]}]}}});
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
test('successful refresh retains only daily counts and the snapshot timestamp',async()=>{
 const result=await syncVisits({state:emptyState(),account:'a',siteTag:'s',token:'test-only',now:Date.parse('2026-11-01T12:00Z'),fetchImpl:async(url,opts)=>{assert.equal(url,'https://api.cloudflare.com/client/v4/graphql');assert.equal(opts.headers.Authorization,'Bearer test-only');return{ok:true,json:async()=>payload(5)}}});
 assert.equal(result.updatedAt,'2026-11-01T11:55:00.000Z');assert.deepEqual(result.daily,[{date:'2026-11-01',pageViews:5}]);assert.doesNotMatch(JSON.stringify(result),/test-only|accountTag|siteTag|country/);
});
