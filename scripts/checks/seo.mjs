import { PAGES, LEGACY } from './pages.mjs';

const SITE = 'https://www.cascane.app';
const canonical = (path) => (path === '/' ? `${SITE}/` : `${SITE}${path}`);

export default function seo(ctx) {
  const errors = [];
  if (Object.keys(LEGACY).length) errors.push(`pages still on the old design: ${Object.keys(LEGACY).join(', ')}`);
  if (ctx.exists('css/style.css')) errors.push('old stylesheet css/style.css is still published');
  const titles = new Map();
  const descriptions = new Map();
  for (const f of ctx.htmlFiles()) if (!PAGES[f] && !LEGACY[f]) errors.push(`${f}: published but not listed in scripts/checks/pages.mjs`);
  for (const [file, { path, indexed }] of Object.entries(PAGES)) {
    if (!ctx.exists(file)) { errors.push(`${file}: listed but not built`); continue; }
    const doc = ctx.doc(file);
    const meta = (sel) => doc.querySelector(sel)?.getAttribute('content') ?? null;
    const h1s = doc.querySelectorAll('h1').length;
    if (h1s !== 1) errors.push(`${file}: expected exactly 1 <h1>, found ${h1s}`);
    const title = doc.querySelector('title')?.textContent.trim() ?? '';
    const desc = meta('meta[name="description"]') ?? '';
    if (!title) errors.push(`${file}: missing <title>`);
    if (desc.length < 50 || desc.length > 170) errors.push(`${file}: description is ${desc.length} chars (want 50-170)`);
    if (titles.has(title)) errors.push(`${file}: title duplicates ${titles.get(title)}`);
    if (descriptions.has(desc)) errors.push(`${file}: description duplicates ${descriptions.get(desc)}`);
    titles.set(title, file);
    descriptions.set(desc, file);
    const canon = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
    if (canon !== canonical(path)) errors.push(`${file}: canonical is ${canon}, expected ${canonical(path)}`);
    if (meta('meta[property="og:url"]') !== canonical(path)) errors.push(`${file}: og:url mismatch`);
    for (const p of ['og:title', 'og:description', 'og:image', 'og:site_name']) if (!meta(`meta[property="${p}"]`)) errors.push(`${file}: missing ${p}`);
    if (meta('meta[name="apple-itunes-app"]') !== 'app-id=6802686539') errors.push(`${file}: Smart App Banner meta missing`);
    const noindex = /noindex/.test(meta('meta[name="robots"]') ?? '');
    if (noindex === indexed) errors.push(`${file}: robots noindex is ${noindex}, expected ${!indexed}`);
    if (!doc.querySelector('a.skip[href="#main"]') || !doc.getElementById('main')) errors.push(`${file}: skip link or #main missing`);
    doc.querySelectorAll('img').forEach((img) => {
      if (!img.hasAttribute('alt')) errors.push(`${file}: <img src="${img.getAttribute('src')}"> has no alt`);
    });
    if (file === 'features.html' && !doc.body.textContent.includes('Search people and hashtags')) errors.push('features.html: Explore search claim must match the app (people and hashtags)');
    if (file === 'safety.html') {
      const text = doc.body.textContent;
      for (const phrase of ['Spam or scam', 'Harassment or bullying', 'Hate speech or symbols', 'Violence or threats', 'Inappropriate content', 'Something else']) {
        if (!text.includes(phrase)) errors.push(`safety.html: report category "${phrase}" missing`);
      }
      if (!doc.getElementById('tools')) errors.push('safety.html: #tools section missing');
    }
  }
  if (!ctx.exists('og.png')) errors.push('og.png missing');
  if (!ctx.exists('sitemap-0.xml')) errors.push('sitemap-0.xml missing');
  else {
    const locs = [...ctx.read('sitemap-0.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
    const want = Object.values({ ...PAGES, ...LEGACY }).filter((p) => p.indexed).map((p) => canonical(p.path)).sort();
    if (JSON.stringify(locs) !== JSON.stringify(want)) errors.push(`sitemap lists ${locs.join(', ')}; expected ${want.join(', ')}`);
  }
  const robots = ctx.exists('robots.txt') ? ctx.read('robots.txt') : '';
  if (!/Sitemap: https:\/\/www\.cascane\.app\/sitemap-index\.xml/.test(robots)) errors.push('robots.txt missing sitemap line');
  return errors;
}
