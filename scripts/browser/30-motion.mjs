import assert from 'node:assert/strict';
import { open } from './_open.mjs';
import { PAGES } from '../checks/pages.mjs';

export const name = 'content is visible with reduced motion and with JavaScript disabled';

export async function run({ browser, base }) {
  for (const { path } of Object.values(PAGES)) {
    for (const opts of [{ reducedMotion: true }, { javascript: false }]) {
      // Visibility here doesn't depend on scrolling, so a normal viewport is enough.
      const { page } = await open(browser, base, path, opts);
      try {
        const hidden = await page.$$eval('[data-reveal]', (els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length);
        assert.equal(hidden, 0, `${path} ${JSON.stringify(opts)}: ${hidden} [data-reveal] element(s) not visible`);
      } finally {
        await page.close();
      }
    }
  }
}
