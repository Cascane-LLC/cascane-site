// Mobile Lighthouse on key pages against the local preview. Fails below the spec's thresholds.
// Usage: npm run build && npm run lighthouse
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, readFileSync } from 'node:fs';
import { withPreview } from './lib/preview-server.mjs';

const run = promisify(execFile);
const PAGES = ['/', '/features', '/safety', '/privacy'];
const MIN = { performance: 95, accessibility: 100, 'best-practices': 95, seo: 100 };

mkdirSync('.artifacts/lighthouse', { recursive: true });
let failed = false;
await withPreview(async (base) => {
  for (const p of PAGES) {
    const out = `.artifacts/lighthouse/${p === '/' ? 'home' : p.slice(1)}.json`;
    // Async on purpose: the preview server runs in this process and must keep serving.
    await run('node_modules/.bin/lighthouse', [
      base + p, '--quiet', '--form-factor=mobile',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--chrome-flags=--headless=new', '--output=json', `--output-path=${out}`,
    ], { maxBuffer: 1 << 26 });
    const report = JSON.parse(readFileSync(out, 'utf8'));
    const scores = Object.fromEntries(Object.entries(report.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
    const low = Object.entries(MIN).filter(([k, min]) => scores[k] < min);
    console.log(`${low.length ? '✗' : '✓'} ${p}`, scores);
    for (const [k] of low) {
      const audits = report.categories[k].auditRefs.map((r) => report.audits[r.id]).filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative');
      audits.slice(0, 6).forEach((a) => console.log(`    ${k}: ${a.id} — ${a.title}`));
    }
    if (low.length) failed = true;
  }
});
process.exit(failed ? 1 : 0);
