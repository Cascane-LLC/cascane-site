import { posix } from 'node:path';

const SKIP = /^(https?:|mailto:|tel:|data:|javascript:)/;

// In-page links that were already broken in the Termly-generated Terms on the
// live site (commit e9f8589). The legal text must not change, so these are
// tolerated -- but only these, and only on terms.html.
const KNOWN_BROKEN = { 'terms.html': new Set(['products', 'software', 'reviews', 'socialmedia', 'thirdparty', 'advertisers', 'ppyes', 'ppno', 'dmca']) };

// Map a site path to the dist file Netlify would serve for it.
export function fileForPath(path, ctx) {
  const clean = decodeURIComponent(path.split(/[?#]/)[0]);
  if (clean === '/' || clean === '') return 'index.html';
  const rel = clean.replace(/^\//, '');
  if (ctx.exists(rel)) return rel;
  if (ctx.exists(`${rel}.html`)) return `${rel}.html`;
  return null;
}

export default function internalLinks(ctx) {
  const errors = [];
  for (const page of ctx.htmlFiles()) {
    const doc = ctx.doc(page);
    const refs = [];
    doc.querySelectorAll('a[href], link[href]').forEach((el) => refs.push(el.getAttribute('href')));
    doc.querySelectorAll('img[src], script[src], source[src]').forEach((el) => refs.push(el.getAttribute('src')));
    doc.querySelectorAll('[srcset]').forEach((el) => el.getAttribute('srcset').split(',').forEach((c) => refs.push(c.trim().split(/\s+/)[0])));
    for (const ref of refs) {
      if (!ref || SKIP.test(ref)) continue;
      if (ref.startsWith('#')) {
        const id = ref.slice(1);
        if (id && !doc.getElementById(id) && !KNOWN_BROKEN[page]?.has(id)) errors.push(`${page}: anchor ${ref} has no target`);
        continue;
      }
      const abs = ref.startsWith('/') ? ref : posix.join('/', posix.dirname(page), ref);
      const target = fileForPath(abs, ctx);
      if (!target) { errors.push(`${page}: broken link ${ref}`); continue; }
      const hash = ref.includes('#') ? ref.split('#')[1] : '';
      if (hash && target.endsWith('.html') && !ctx.doc(target).getElementById(hash)) errors.push(`${page}: ${ref} points to a missing anchor`);
    }
  }
  return errors;
}
