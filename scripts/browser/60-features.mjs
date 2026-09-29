import assert from 'node:assert/strict';
import { open } from './_open.mjs';

export const name = 'features: every section is present, with media and a download band';

export async function run({ browser, base }) {
  const { page } = await open(browser, base, '/features');
  for (const id of ['daily', 'dms', 'groups', 'convos', 'channels', 'details', 'explore', 'profiles']) {
    const ok = await page.$eval(`#${id}`, (el) => !!el.querySelector('h2') && !!el.querySelector('.phone, .illo, .card'));
    assert.ok(ok, `#${id} needs a heading and media`);
  }
  assert.ok(await page.$('.band [data-store-badges]'), 'closing download band with badges');
  await page.close();
}
