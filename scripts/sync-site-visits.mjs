import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { emptyState, validateState, queryDays, pageViewsQuery, parsePageViews, mergeDays, detailsWindow, detailsQuery, parseDetails, DATA_BRANCH, DATA_PATH } from './site-visits.mjs';
import { publicAnalyticsPages } from './install-analytics.mjs';
export async function syncVisits({state, account, siteTag, token, now=Date.now(), fetchImpl=fetch}) {
  // Leave five minutes for beacon processing. This is a periodically refreshed snapshot.
  const asOf=now-5*60000;
  const rows=[];
  for(const day of queryDays(state,asOf)) {
    const response=await fetchImpl('https://api.cloudflare.com/client/v4/graphql', {method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({query:pageViewsQuery(account,siteTag,day)}),signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error(`Cloudflare analytics HTTP ${response.status}; previous totals retained`);
    rows.push({date:day.date,pageViews:parsePageViews(await response.json())});
  }
  const window=detailsWindow(asOf);
  const detailsResponse=await fetchImpl('https://api.cloudflare.com/client/v4/graphql', {method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({query:detailsQuery(account,siteTag,window)}),signal:AbortSignal.timeout(30000)});
  if(!detailsResponse.ok)throw new Error(`Cloudflare details HTTP ${detailsResponse.status}; previous statistics retained`);
  const detail=parseDetails(await detailsResponse.json(),window,publicAnalyticsPages());
  return { ...mergeDays(state,rows,asOf), detail };
}
async function main() {
  const token=process.env.CF_WEB_ANALYTICS_TOKEN;
  const account=process.env.CF_ACCOUNT_ID;
  // GraphQL uses site_tag, which differs from the public beacon site_token.
  const siteTag=process.env.CF_SITE_TAG;
  if(!token||!account||!siteTag)throw new Error('Missing read-only Cloudflare analytics credentials or site identifier');
  if(!/^[a-f0-9]{32}$/.test(siteTag))throw new Error('Invalid Cloudflare analytics site identifier');
  const repository=process.env.GITHUB_REPOSITORY||'jiakezhu/jiakezhu.github.io';
  if(repository!=='jiakezhu/jiakezhu.github.io')throw new Error('Unexpected repository');
  const output=process.env.VISITS_OUTPUT;
  const ghToken=process.env.GITHUB_TOKEN;
  const headers={Accept:'application/vnd.github+json',Authorization:`Bearer ${ghToken}`,'X-GitHub-Api-Version':'2022-11-28'};
  let state=emptyState(),sha;
  if(process.env.VISITS_INPUT) state=validateState(JSON.parse(await readFile(process.env.VISITS_INPUT,'utf8')));
  else if(ghToken) {
    const r=await fetch(`https://api.github.com/repos/${repository}/contents/${DATA_PATH}?ref=${DATA_BRANCH}`,{headers,signal:AbortSignal.timeout(30000)});
    if(!r.ok)throw new Error(`Cannot read previous statistics: GitHub HTTP ${r.status}`);
    const file=await r.json();sha=file.sha;
    state=validateState(JSON.parse(Buffer.from(file.content,'base64').toString('utf8')));
  } else throw new Error('Provide a previous aggregate file or GitHub authentication');
  const next=await syncVisits({state,account,siteTag,token});
  const contents=JSON.stringify(next,null,2)+'\n';
  if(output)await writeFile(output,contents);
  else {
    if(!ghToken||!sha)throw new Error('Missing statistics publishing credentials');
    const r=await fetch(`https://api.github.com/repos/${repository}/contents/${DATA_PATH}`,{method:'PUT',headers,body:JSON.stringify({message:'Update public visit aggregates',branch:DATA_BRANCH,sha,content:Buffer.from(contents).toString('base64')}),signal:AbortSignal.timeout(30000)});
    if(!r.ok)throw new Error(`Cannot publish statistics: GitHub HTTP ${r.status}`);
  }
  console.log(`Updated public daily aggregates through ${next.updatedAt}; ${next.daily.length} days.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
