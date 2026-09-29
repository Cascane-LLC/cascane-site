// Drives the built site in headless Chrome. Each scripts/browser/NN-*.mjs exports
// { name, run({ browser, base, screens }) } and throws (node:assert) on failure.
// Usage: npm run build && npm run browser [-- --screens]
import puppeteer from 'puppeteer-core';
import { readdirSync } from 'node:fs';
import { withPreview } from './lib/preview-server.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const dir = new URL('./browser/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort();
const screens = process.argv.includes('--screens');
let failed = 0;
await withPreview(async (base) => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  try {
    for (const f of files) {
      const { name, run } = await import(new URL(f, dir));
      try {
        await run({ browser, base, screens });
        console.log(`✓ ${name}`);
      } catch (e) {
        failed++;
        console.log(`✗ ${name}\n    ${String(e.message).split('\n').join('\n    ')}`);
      }
    }
  } finally {
    await browser.close();
  }
});
if (failed) { console.log(`\n${failed} browser check(s) failed`); process.exit(1); }
console.log('\nall browser checks passed');
