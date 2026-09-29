import assert from 'node:assert/strict';
import { open } from './_open.mjs';

export const name = 'delete-account form: the browser blocks empty and malformed emails';

export async function run({ browser, base }) {
  const { page } = await open(browser, base, '/delete-account');
  const url = page.url();
  await page.click('form[name="delete-account"] button[type="submit"]');
  assert.equal(page.url(), url, 'an empty form must not submit');
  assert.equal(await page.$eval('#email', (el) => el.validity.valueMissing), true);
  await page.type('#email', 'not-an-email');
  await page.click('form[name="delete-account"] button[type="submit"]');
  assert.equal(page.url(), url, 'a malformed email must not submit');
  assert.equal(await page.$eval('#email', (el) => el.validity.typeMismatch), true);
  assert.equal(await page.$eval('input[name="bot-field"]', (el) => el.offsetParent === null), true, 'honeypot must be invisible');
  await page.close();
}
