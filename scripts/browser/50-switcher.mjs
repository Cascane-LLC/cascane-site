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
}
