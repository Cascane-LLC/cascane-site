import assert from 'node:assert/strict';
import { open } from './_open.mjs';

export const name = 'keyboard: every Tab stop on the home page shows a visible focus ring';

export async function run({ browser, base }) {
  const { page } = await open(browser, base, '/', { reducedMotion: true });
  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      return { key: el.outerHTML.slice(0, 80), outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 };
    });
    if (!info || seen.has(info.key)) break;
    seen.add(info.key);
    assert.ok(info.outline, `no visible focus ring on ${info.key}`);
  }
  assert.ok(seen.size > 10, `expected many Tab stops, got ${seen.size}`);
  await page.close();
}
