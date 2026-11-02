// Public aggregates only. The read-only Cloudflare token stays in Actions secrets.
export const HOST = 'jiakezhu.github.io';
export const START_DATE = '2026-11-01';
export const TIME_ZONE = 'Asia/Shanghai';
export const DATA_BRANCH = 'site-analytics';
export const DATA_PATH = 'visits.json';
export const DAY = 86400000;
export const dateKey = ms => new Date(ms + 8 * 3600000).toISOString().slice(0, 10);
export const dayStart = day => Date.parse(`${day}T00:00:00+08:00`);
export function validateState(state) {
  if (state.version !== 1 || state.hostname !== HOST || state.startDate !== START_DATE || state.timeZone !== TIME_ZONE || !Array.isArray(state.daily)) throw new Error('Unexpected statistics state');
  let expected = dayStart(START_DATE);
  for (const row of state.daily) {
    if (row.date !== dateKey(expected) || !Number.isSafeInteger(row.pageViews) || row.pageViews < 0) throw new Error('Invalid or missing daily aggregate');
    expected += DAY;
  }
  if (state.daily.length && (!Number.isFinite(Date.parse(state.updatedAt)) || dateKey(Date.parse(state.updatedAt)) !== state.daily.at(-1).date)) throw new Error('Invalid aggregate timestamp');
  return state;
}
export function emptyState() { return { version: 1, provider: 'Cloudflare Web Analytics', hostname: HOST, startDate: START_DATE, timeZone: TIME_ZONE, updatedAt: null, daily: [] }; }
export function queryDays(state, asOf) {
  validateState(state);
  const today = dayStart(dateKey(asOf));
  const firstMissing = dayStart(START_DATE) + state.daily.length * DAY;
  const first = Math.max(dayStart(START_DATE), Math.min(firstMissing, today - 6 * DAY));
  // Stop rather than silently losing a gap outside the conservative recovery window.
  if (today - first > 30 * DAY) throw new Error('Statistics gap exceeds 30 days; manual recovery required');
  const days = [];
  for (let ms = first; ms <= today; ms += DAY) days.push({ date: dateKey(ms), since: new Date(ms).toISOString(), until: new Date(Math.min(ms + DAY, asOf)).toISOString() });
  return days;
}
export function pageViewsQuery(account, siteTag, day) {
  // Half-open Shanghai calendar days; this query returns only a daily total.
  const f = { siteTag, requestHost: HOST, datetime_geq: day.since, datetime_lt: day.until };
  const input = Object.entries(f).map(([k,v]) => `${k}:${JSON.stringify(v)}`).join(',');
  return `{viewer{accounts(filter:{accountTag:${JSON.stringify(account)}}){rumPageloadEventsAdaptiveGroups(limit:1,filter:{${input}}){count}}}}`;
}
export function parsePageViews(payload) {
  if (payload.errors?.length) throw new Error('Cloudflare analytics query rejected; previous totals retained');
  const accounts = payload.data?.viewer?.accounts;
  const groups = accounts?.[0]?.rumPageloadEventsAdaptiveGroups;
  if (accounts?.length !== 1 || !Array.isArray(groups) || groups.length > 1) throw new Error('Unexpected Cloudflare aggregate response');
  const count = groups.length ? groups[0].count : 0;
  if (typeof count !== 'number' || !Number.isFinite(count) || count < 0 || count > Number.MAX_SAFE_INTEGER) throw new Error('Invalid Cloudflare page view count');
  return Math.round(count);
}
export function mergeDays(state, rows, asOf) {
  const daily = new Map(state.daily.map(x => [x.date, x]));
  for (const row of rows) daily.set(row.date, {date:row.date,pageViews:row.pageViews});
  return validateState({ ...state, updatedAt: new Date(asOf).toISOString(), daily: [...daily.values()].sort((a,b)=>a.date.localeCompare(b.date)) });
}

// Every breakdown is a separate aggregate; no visitor-level records are saved.
export const DETAIL_LIMIT = 250;
export function detailsWindow(asOf) {
  const first = Math.max(dayStart(START_DATE), dayStart(dateKey(asOf)) - 29 * DAY);
  return { since: new Date(first).toISOString(), until: new Date(asOf).toISOString() };
}
export function detailsQuery(account, siteTag, window) {
  const f = { siteTag, requestHost: HOST, datetime_geq: window.since, datetime_lt: window.until };
  const filter = Object.entries(f).map(([key,value]) => `${key}:${JSON.stringify(value)}`).join(',');
  const group = (name, selection, order='count_DESC', limit=DETAIL_LIMIT) => `${name}:rumPageloadEventsAdaptiveGroups(limit:${limit},filter:{${filter}},orderBy:[${order}]){${selection}}`;
  return `{viewer{accounts(filter:{accountTag:${JSON.stringify(account)}}){${[
    group('summary','count sum{visits}','count_DESC',1),
    group('pages','count dimensions{requestPath}'),
    group('countries','count dimensions{countryName}'),
    group('devices','count dimensions{deviceType}'),
    group('sources','sum{visits} dimensions{refererHost}','sum_visits_DESC')
  ].join(' ')}}}}`;
}
export function publicPathSet(files) {
  return new Set(files.map(file => file === 'index.html' ? '/' : '/'+file.replace(/index\.html$/, '')));
}
function pathKey(input, paths) {
  if (typeof input !== 'string' || input.length > 300 || !input.startsWith('/') || /[?#\\\u0000-\u001f]/.test(input)) return 'other';
  let p=input.replace(/\/index\.html$/, '/');
  if(p==='/index.html')p='/';
  if(!paths.has(p) && paths.has(p+'/'))p+='/';
  return paths.has(p)?p:'other';
}
function countryKey(input) {
  if(typeof input!=='string')return 'unknown';
  const key=input.trim();
  return /^[A-Za-z][A-Za-z .'-]{0,79}$/.test(key)?key:'unknown';
}
function deviceKey(input) {
  const value=typeof input==='string'?input.toLowerCase():'';
  return ['desktop','mobile','tablet'].includes(value)?value:'other';
}
function sourceKey(input) {
  if(typeof input!=='string'||!input.trim()||/^(none|direct|null|unknown)$/i.test(input.trim()))return 'direct';
  const host=input.trim().toLowerCase().replace(/\.$/,'');
  if(host===HOST)return 'internal';
  if(host.length>253 || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(host) || /^[0-9.]+$/.test(host))return 'other';
  return host;
}
function metric(value) {
  if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>Number.MAX_SAFE_INTEGER)throw new Error('Invalid Cloudflare aggregate');
  return Math.round(value);
}
function aggregate(rows, dimension, keyFn, metricFn, unit) {
  if(!Array.isArray(rows)||rows.length>DETAIL_LIMIT)throw new Error('Unexpected analytics breakdown');
  const values=new Map();
  for(const row of rows) {
    const value=metric(metricFn(row)), key=keyFn(row?.dimensions?.[dimension]);
    if(value)values.set(key,(values.get(key)||0)+value);
  }
  return [...values].map(([key,value])=>({key,[unit]:value})).sort((a,b)=>b[unit]-a[unit]||a.key.localeCompare(b.key));
}
function topGroups(rows, unit, total, wasLimited) {
  const known=rows.filter(row=>row.key!=='other');
  const head=known.slice(0,5);
  const sum=rows.reduce((n,row)=>n+row[unit],0);
  const tail=known.slice(5).reduce((n,row)=>n+row[unit],0)+rows.filter(row=>row.key==='other').reduce((n,row)=>n+row[unit],0)+(wasLimited?Math.max(0,total-sum):0);
  return tail?[...head,{key:'other',[unit]:tail}]:head;
}
export function parseDetails(payload, window, publicFiles) {
  if(payload.errors?.length)throw new Error('Cloudflare details query rejected; previous statistics retained');
  const accounts=payload.data?.viewer?.accounts, data=accounts?.[0];
  if(accounts?.length!==1||!data||!Array.isArray(data.summary)||data.summary.length>1)throw new Error('Unexpected analytics summary');
  const total=data.summary[0];
  const pageViews=total?metric(total.count):0, visits=total?metric(total.sum?.visits):0;
  const paths=publicPathSet(publicFiles);
  return {since:window.since,until:window.until,pageViews,visits,
    pages:topGroups(aggregate(data.pages,'requestPath',x=>pathKey(x,paths),r=>r?.count,'pageViews'),'pageViews',pageViews,data.pages.length===DETAIL_LIMIT),
    countries:topGroups(aggregate(data.countries,'countryName',countryKey,r=>r?.count,'pageViews'),'pageViews',pageViews,data.countries.length===DETAIL_LIMIT),
    devices:topGroups(aggregate(data.devices,'deviceType',deviceKey,r=>r?.count,'pageViews'),'pageViews',pageViews,data.devices.length===DETAIL_LIMIT),
    sources:topGroups(aggregate(data.sources,'refererHost',sourceKey,r=>r?.sum?.visits,'visits'),'visits',visits,data.sources.length===DETAIL_LIMIT)};
}
