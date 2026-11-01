export const ANALYTICS_VERSION=1;

export function withAnalytics(html,assetsPrefix) {
  if(/<script\b[^>]*\bsrc=["'][^"']*\banalytics\.js(?:\?[^"']*)?["']/i.test(html)) return html;
  const closing=[...html.matchAll(/<\/body\s*>/gi)].at(-1);
  if(!closing) throw new Error('Analytics requires a complete HTML document');
  const tag=`<script defer data-site-analytics src="${assetsPrefix}analytics.js?v=${ANALYTICS_VERSION}"></script>`;
  return html.slice(0,closing.index)+tag+html.slice(closing.index);
}
