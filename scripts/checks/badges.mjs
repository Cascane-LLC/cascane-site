import { PAGES } from './pages.mjs';

const APPLE = 'https://apps.apple.com/app/cascane/id6802686539';
const GOOGLE = 'https://play.google.com/store/apps/details?id=app.cascane.mobile&hl=en';
const TRADEMARK = 'App Store is a service mark of Apple Inc.';

export default function badges(ctx) {
  const errors = [];
  for (const file of Object.keys(PAGES)) {
    if (!ctx.exists(file)) continue;
    const doc = ctx.doc(file);
    doc.querySelectorAll('.store-badge').forEach((a) => {
      if (a.closest('[data-reveal]')) errors.push(`${file}: a store badge is inside an animated [data-reveal] element (Apple forbids animating the badge)`);
      if (a.closest('footer')) errors.push(`${file}: store badges must not appear in the footer`);
    });
    doc.querySelectorAll('[data-store-badges]').forEach((group, n) => {
      const links = [...group.querySelectorAll('a.store-badge')];
      const hrefs = links.map((a) => a.getAttribute('href'));
      if (JSON.stringify(hrefs) !== JSON.stringify([APPLE, GOOGLE])) errors.push(`${file}: badge group ${n} is ${JSON.stringify(hrefs)}; expected App Store then Google Play`);
      const [a, g] = links.map((l) => l.querySelector('img'));
      if (!a || !g) return;
      const [ah, aw, gh, gw] = [a.getAttribute('height'), a.getAttribute('width'), g.getAttribute('height'), g.getAttribute('width')].map(Number);
      if (ah < 40) errors.push(`${file}: App Store badge is ${ah}px tall (minimum 40)`);
      if (gh !== ah || gw < aw) errors.push(`${file}: Google Play badge must be the same height as, and at least as wide as, the App Store badge`);
      if (a.getAttribute('src') !== '/badges/app-store.svg' || g.getAttribute('src') !== '/badges/google-play.svg') errors.push(`${file}: badges must use the official files in /badges/`);
    });
    if (!doc.querySelector('footer')?.textContent.includes(TRADEMARK)) errors.push(`${file}: footer trademark notice missing`);
  }
  return errors;
}
