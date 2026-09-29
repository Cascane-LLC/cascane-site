import assert from 'node:assert/strict';
import { open } from './_open.mjs';

export const name = 'details: bento of six illustrated tiles on home and features, one column on phones';

export async function run({ browser, base }) {
  for (const path of ['/', '/features']) {
    const { page } = await open(browser, base, path, { reducedMotion: true });
    try {
      const tiles = await page.$$eval('.bento .tile', (ts) => ts.map((t) => ({
        wide: t.classList.contains('wide'),
        title: t.querySelector('h3')?.textContent.trim() ?? '',
        art: !!t.querySelector('.art') && t.querySelector('.art').children.length > 0,
      })));
      assert.equal(tiles.length, 6, `${path}: expected 6 tiles, got ${tiles.length}`);
      assert.equal(tiles.filter((t) => t.wide).length, 3, `${path}: expected 3 wide tiles`);
      for (const t of tiles) assert.ok(t.title && t.art, `${path}: tile "${t.title}" needs a title and an illustration`);
      const heading = await page.$eval('.bento-section h2', (h) => h.textContent.trim());
      assert.ok(!/Small things|feel alive/.test(heading), `${path}: old heading still shown: ${heading}`);
    } finally {
      await page.close();
    }
  }
  const { page } = await open(browser, base, '/features', { width: 375 });
  try {
    const widths = await page.$$eval('.bento .tile', (ts) => [...new Set(ts.map((t) => Math.round(t.getBoundingClientRect().width)))]);
    assert.equal(widths.length, 1, `phone: tiles should share one full width, got ${widths.join(', ')}`);
  } finally {
    await page.close();
  }
}
