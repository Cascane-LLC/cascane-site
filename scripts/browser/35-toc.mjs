import assert from 'node:assert/strict';
import { open } from './_open.mjs';

export const name = 'child safety: table of contents is open on desktop, collapsed on phones, and links work';

export async function run({ browser, base }) {
  const desk = await open(browser, base, '/child-safety', { width: 1280 });
  const links = await desk.page.$$eval('[data-toc] a', (as) => as.map((a) => a.getAttribute('href')));
  assert.deepEqual(links, ['#prohibited', '#reporting', '#next-steps', '#contact']);
  assert.equal(await desk.page.$eval('[data-toc] details', (d) => d.open), true, 'TOC open on desktop');
  await desk.page.click('[data-toc] a[href="#next-steps"]');
  await desk.page.waitForFunction(() => document.querySelector('[data-toc] a[href="#next-steps"]')?.getAttribute('aria-current') === 'location');
  await desk.page.close();
  const phone = await open(browser, base, '/child-safety', { width: 375 });
  assert.equal(await phone.page.$eval('[data-toc] details', (d) => d.open), false, 'TOC collapsed on phones');
  await phone.page.close();
  for (const path of ['/privacy', '/terms']) {
    const { page } = await open(browser, base, path);
    assert.equal(await page.$('[data-toc]'), null, `${path} must not add a second table of contents`);
    await page.close();
  }
}
