import assert from 'node:assert/strict';
import { open } from './_open.mjs';

export const name = 'details: text-only numbered list of six features on home and features';

export async function run({ browser, base }) {
  for (const path of ['/', '/features']) {
    const { page } = await open(browser, base, path, { reducedMotion: true });
    try {
      const items = await page.$$eval('.details-text .textlist > li', (lis) => lis.map((li) => ({
        num: li.querySelector('.num')?.textContent.trim(),
        title: li.querySelector('h3')?.textContent.trim() ?? '',
        text: li.querySelector('p')?.textContent.trim() ?? '',
        media: !!li.querySelector('img, svg, .pill'),
      })));
      assert.equal(items.length, 6, `${path}: expected 6 features, got ${items.length}`);
      items.forEach((it, i) => {
        assert.equal(it.num, `0${i + 1}`, `${path}: item ${i + 1} numbering`);
        assert.ok(it.title && it.text, `${path}: item ${i + 1} needs a title and text`);
        assert.ok(!it.media, `${path}: "${it.title}" must be text only`);
      });
    } finally {
      await page.close();
    }
  }
}
