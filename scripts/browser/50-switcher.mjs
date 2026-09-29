import assert from 'node:assert/strict';
import { open } from './_open.mjs';

export const name = 'home: five-ways switcher works by click and keyboard';

export async function run({ browser, base }) {
  const { page } = await open(browser, base, '/');
  const state = () => page.evaluate(() => ({
    selected: [...document.querySelectorAll('#ways [role=tab]')].map((t) => t.getAttribute('aria-selected')).join(','),
    visible: [...document.querySelectorAll('#ways [role=tabpanel]')].filter((p) => !p.hidden).map((p) => p.id).join(','),
    focused: document.activeElement?.id ?? '',
  }));
  assert.deepEqual(await state(), { selected: 'true,false,false,false,false', visible: 'panel-daily', focused: '' });
  await page.click('#tab-convos');
  assert.equal((await state()).visible, 'panel-convos');
  await page.focus('#tab-channels');
  await page.keyboard.press('ArrowRight');
  assert.deepEqual(await state(), { selected: 'true,false,false,false,false', visible: 'panel-daily', focused: 'tab-daily' });
  await page.keyboard.press('End');
  assert.equal((await state()).visible, 'panel-channels');
  await page.keyboard.press('Home');
  assert.equal((await state()).focused, 'tab-daily');
  const tabindexes = await page.$$eval('#ways [role=tab]', (ts) => ts.map((t) => t.tabIndex));
  assert.deepEqual(tabindexes, [0, -1, -1, -1, -1], 'only the selected tab is in the Tab order');
  await page.close();

  // Without JavaScript every panel is readable and the inert tab bar is hidden.
  const nojs = await open(browser, base, '/', { javascript: false });
  const shown = await nojs.page.$$eval('#ways [role=tabpanel]', (ps) => ps.filter((p) => getComputedStyle(p).display !== 'none').length);
  assert.equal(shown, 5, `no-JS: ${shown} of 5 panels visible`);
  assert.equal(await nojs.page.$eval('#ways [role=tablist]', (t) => getComputedStyle(t).display), 'none', 'no-JS: tab bar should be hidden');
  await nojs.page.close();

  // On phones the tab bar hints that it scrolls (edge fade).
  const phone = await open(browser, base, '/', { width: 375 });
  const mask = await phone.page.$eval('#ways [role=tablist]', (t) => getComputedStyle(t).maskImage || getComputedStyle(t).webkitMaskImage);
  assert.match(mask, /gradient/, 'phone: tab bar needs an edge fade so hidden tabs are discoverable');
  await phone.page.close();
}
