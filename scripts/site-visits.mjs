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
  // Half-open Shanghai calendar days; no path, location, IP or visitor data published.
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
