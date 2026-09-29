import { norm } from './context.mjs';

// Compare block by block: Astro drops whitespace between elements in some
// places, so a single textContent could run paragraphs together.
const blocks = (root) => [...root.querySelectorAll('h2, p')].map((el) => norm(el.textContent)).join('\n');

export default function legalText(ctx) {
  const errors = [];
  for (const f of ['privacy.html', 'terms.html']) {
    if (!ctx.exists(f)) { errors.push(`${f} missing`); continue; }
    const sel = '[data-custom-class="body"]';
    const before = norm(ctx.legacy(f).querySelector(sel).textContent);
    const afterEl = ctx.doc(f).querySelector(sel);
    if (!afterEl) { errors.push(`${f}: Termly body missing`); continue; }
    if (norm(afterEl.textContent) !== before) errors.push(`${f}: legal text differs from ${f} at the live commit`);
  }
  if (!ctx.exists('child-safety.html')) return [...errors, 'child-safety.html missing'];
  const csBefore = blocks(ctx.legacy('child-safety.html').querySelector('main .container'));
  const cs = ctx.doc('child-safety.html');
  const csAfter = blocks(cs.querySelector('[data-doc-body]') ?? cs.querySelector('main .container'));
  if (csAfter !== csBefore) errors.push('child-safety.html: body text differs from the live commit');
  return errors;
}
