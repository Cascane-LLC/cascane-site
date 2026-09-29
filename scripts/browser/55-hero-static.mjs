import assert from 'node:assert/strict';
import { open } from './_open.mjs';

export const name = 'home: the hero phone is static (no float, no pointer tilt)';

export async function run({ browser, base }) {
  const { page } = await open(browser, base, '/');
  try {
    const anim = await page.$eval('.hero .phone', (fig) => [fig, ...fig.querySelectorAll('*')].map((el) => getComputedStyle(el).animationName).filter((n) => n !== 'none'));
    assert.deepEqual(anim, [], `hero phone is animated: ${anim.join(', ')}`);
    const before = await page.$eval('.hero .phone', (el) => getComputedStyle(el).transform);
    await page.mouse.move(50, 50);
    await page.mouse.move(1200, 850, { steps: 5 });
    await new Promise((r) => setTimeout(r, 700));
    const after = await page.$eval('.hero .phone', (el) => getComputedStyle(el).transform);
    assert.equal(after, before, 'hero phone moves with the pointer');
  } finally {
    await page.close();
  }
}
