(() => {
  // The beacon token is a public site identifier, configured after account setup.
  // Track real document visits; local previews and embedded project previews stay out.
  if(location.hostname!=='jiakezhu.github.io' || location.protocol!=='https:' || window.top!==window.self || window.__jiakeAnalyticsStarted) return;
  const entry=document.currentScript;
  if(!entry) return;
  const settings=new URL('analytics-config.json?v=1',entry.src);
  window.__jiakeAnalyticsStarted=true;
  async function start() {
    try {
      const response=await fetch(settings,{cache:'no-cache',credentials:'omit'});
      if(!response.ok) return;
      const config=await response.json();
      if(config.provider!=='cloudflare' || config.hostname!==location.hostname || typeof config.token!=='string' || !config.token.trim() || document.getElementById('jiake-web-analytics')) return;
      const beacon=document.createElement('script');
      beacon.id='jiake-web-analytics';
      beacon.type='module';
      beacon.src='https://static.cloudflareinsights.com/beacon.min.js';
      // Hash-based chapter navigation and language changes are not new visits.
      beacon.setAttribute('data-cf-beacon',JSON.stringify({token:config.token.trim(),spa:false}));
      document.head.append(beacon);
    } catch {
      // Analytics is optional: a blocked or unavailable endpoint never blocks reading.
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else return start();
})();
