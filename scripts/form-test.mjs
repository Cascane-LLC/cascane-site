// Submits the delete-account form once on a deployed copy, as a real browser would.
// Usage: node scripts/form-test.mjs https://host
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const base = process.argv[2];
if (!base) throw new Error('usage: node scripts/form-test.mjs https://host');
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
  const page = await browser.newPage();
  await page.goto(`${base}/delete-account`, { waitUntil: 'networkidle0' });
  await page.type('#email', 'test+deletion-form@cascane.app');
  await page.type('#message', 'TEST — ignore (automated check of the redesigned form)');
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.click('form[name="delete-account"] button[type="submit"]')]);
  assert.match(new URL(page.url()).pathname, /^\/delete-account-received(\.html)?$/, `landed on ${page.url()}`);
  assert.equal(await page.$eval('h1', (h) => h.textContent.trim()), 'Request received');
  console.log('✓ form submitted and landed on', page.url());
} finally {
  await browser.close();
}
