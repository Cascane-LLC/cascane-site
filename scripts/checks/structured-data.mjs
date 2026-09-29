const APPLE = 'https://apps.apple.com/app/cascane/id6802686539';
const GOOGLE = 'https://play.google.com/store/apps/details?id=app.cascane.mobile&hl=en';

export default function structuredData(ctx) {
  const errors = [];
  if (!ctx.exists('index.html')) return ['index.html missing'];
  const blocks = [...ctx.doc('index.html').querySelectorAll('script[type="application/ld+json"]')]
    .map((s) => { try { return JSON.parse(s.textContent); } catch (e) { errors.push(`index.html: invalid JSON-LD (${e.message})`); return null; } })
    .filter(Boolean);
  const byType = Object.fromEntries(blocks.map((b) => [b['@type'], b]));
  if (byType.WebSite?.name !== 'Cascane' || byType.WebSite?.url !== 'https://www.cascane.app/') errors.push('WebSite JSON-LD must have name "Cascane" and url "https://www.cascane.app/"');
  if (!byType.Organization?.logo) errors.push('Organization JSON-LD needs a logo');
  const app = byType.MobileApplication;
  if (!app) errors.push('MobileApplication JSON-LD missing');
  else {
    if (app.aggregateRating) errors.push('MobileApplication must not claim an aggregateRating');
    if (!app.installUrl?.includes(APPLE) || !app.installUrl?.includes(GOOGLE)) errors.push('MobileApplication installUrl must list both stores');
  }
  for (const f of ctx.htmlFiles()) {
    if (f !== 'index.html' && ctx.doc(f).querySelector('script[type="application/ld+json"]')) errors.push(`${f}: JSON-LD belongs on the home page only`);
  }
  return errors;
}
