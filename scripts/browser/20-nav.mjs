import assert from 'node:assert/strict';
import { open } from './_open.mjs';

export const name = 'nav: mobile menu traps focus and closes on Esc; solid on scroll; Get the app routes by device';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';

export async function run({ browser, base }) {
  // Mobile menu
  const { page } = await open(browser, base, '/features', { width: 375, height: 800 });
  assert.equal(await page.$eval('[data-menu]', (m) => m.hidden), true, 'menu starts hidden');
  await page.click('[data-menu-open]');
  assert.equal(await page.$eval('[data-menu]', (m) => m.hidden), false, 'menu opens');
  assert.equal(await page.$eval('[data-menu-open]', (b) => b.getAttribute('aria-expanded')), 'true');
  const inside = () => page.evaluate(() => !!document.activeElement?.closest('[data-menu]'));
  assert.ok(await inside(), 'focus moves into the menu');
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    assert.ok(await inside(), 'Tab escaped the open menu');
  }
  await page.keyboard.press('Escape');
  assert.equal(await page.$eval('[data-menu]', (m) => m.hidden), true, 'Esc closes the menu');
  assert.ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-menu-open')), 'focus returns to the menu button');
  await page.close();

  // Skip link is the first Tab stop and targets #main
  const desk = await open(browser, base, '/features');
  await desk.page.keyboard.press('Tab');
  assert.equal(await desk.page.evaluate(() => document.activeElement?.getAttribute('href')), '#main', 'skip link is the first Tab stop');

  // Solid nav after scrolling
  assert.equal(await desk.page.$eval('[data-nav]', (n) => n.classList.contains('is-scrolled')), false);
  await desk.page.evaluate(() => window.scrollTo(0, 400));
  await desk.page.waitForFunction(() => document.querySelector('[data-nav]')?.classList.contains('is-scrolled'));
  assert.equal(await desk.page.$eval('[data-get-app]', (a) => a.getAttribute('href')), '/#download', 'desktop Get the app goes to #download');
  await desk.page.close();

  // Get the app on phones
  for (const [ua, want] of [[IPHONE, 'https://apps.apple.com/app/cascane/id6802686539'], [ANDROID, 'https://play.google.com/store/apps/details?id=app.cascane.mobile&hl=en']]) {
    const { page: p } = await open(browser, base, '/features', { width: 375, userAgent: ua });
    assert.equal(await p.$eval('[data-get-app]', (a) => a.getAttribute('href')), want);
    await p.close();
  }
}
