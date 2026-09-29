import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { open } from './_open.mjs';
import { PAGES } from '../checks/pages.mjs';

export const name = 'every new page: no sideways scroll at 320-1600px, no console errors';
const WIDTHS = [320, 375, 768, 1280, 1600];

export async function run({ browser, base, screens }) {
  if (screens) mkdirSync('.artifacts/screens', { recursive: true });
  for (const [file, { path }] of Object.entries(PAGES)) {
    for (const width of WIDTHS) {
      // Screenshots use reduced motion so every [data-reveal] block is visible.
      const { page, errors } = await open(browser, base, path, { width, reducedMotion: screens });
      try {
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        assert.ok(overflow <= 0, `${path} at ${width}px scrolls sideways by ${overflow}px`);
        // The 404 page's own document response is a 404, which Chrome logs as a resource error.
        const real = errors.filter((e) => !(path === '/404' && e.includes('404')));
        assert.deepEqual(real, [], `${path} at ${width}px logged errors`);
        if (screens) {
          // Scroll through the page so lazy-loaded images load before the full-page capture.
          await page.evaluate(async () => {
            for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
            window.scrollTo(0, 0);
          });
          await page.waitForNetworkIdle({ idleTime: 300 });
        }
        if (screens) await page.screenshot({ path: `.artifacts/screens/${file.replace('.html', '')}-${width}.png`, fullPage: true });
      } finally {
        await page.close();
      }
    }
  }
}
