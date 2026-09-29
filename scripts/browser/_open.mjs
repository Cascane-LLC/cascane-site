/** Opens path in a fresh tab and collects page errors. */
export async function open(browser, base, path, { width = 1280, height = 900, reducedMotion = false, javascript = true, userAgent } = {}) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await page.setViewport({ width, height });
  if (userAgent) await page.setUserAgent(userAgent);
  if (reducedMotion) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setJavaScriptEnabled(javascript);
  const res = await page.goto(base + path, { waitUntil: 'networkidle0' });
  return { page, errors, status: res?.status() };
}
