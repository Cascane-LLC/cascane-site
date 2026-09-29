import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

function png(path: string) {
  const b = readFileSync(path);
  assert.equal(b.toString('latin1', 1, 4), 'PNG', `${path} is not a PNG`);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), rgba: b[25] === 6 };
}

test('phone screens are cropped panels with transparent corners', () => {
  const names = readdirSync('src/assets/screens').sort();
  assert.deepEqual(names, ['channel_info_page.png', 'chat_page.png', 'convos_page.png', 'inbox_page.png', 'profile_page.png']);
  for (const n of names) assert.deepEqual(png(`src/assets/screens/${n}`), { w: 991, h: 2092, rgba: true }, n);
});

test('avatars are 160px circles', () => {
  const names = readdirSync('src/assets/avatars').sort();
  assert.deepEqual(names, ['anna.png', 'austin.png', 'ethan.png', 'natalie.png', 'nate.png', 'tyler.png']);
  for (const n of names) assert.deepEqual(png(`src/assets/avatars/${n}`), { w: 160, h: 160, rgba: true }, n);
});

test('brand mark and icons have the right sizes', () => {
  assert.deepEqual(png('src/assets/mark.png'), { w: 256, h: 256, rgba: true });
  const sizes: [string, number][] = [['favicon-48.png', 48], ['favicon-96.png', 96], ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]];
  for (const [f, s] of sizes) {
    const { w, h } = png(`public/${f}`);
    assert.deepEqual([w, h], [s, s], f);
  }
  const ico = readFileSync('public/favicon.ico');
  assert.equal(ico.readUInt16LE(2), 1, 'favicon.ico has an ICO header');
});

test('tab icons are circles (transparent corners); home-screen icons stay square', () => {
  for (const f of ['favicon-48.png', 'favicon-96.png']) assert.equal(png(`public/${f}`).rgba, true, `${f} needs an alpha channel for its round shape`);
  for (const f of ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) assert.equal(png(`public/${f}`).rgba, false, `${f} must stay square and opaque (iOS turns transparency black)`);
});

test('official badges are the expected artwork', () => {
  assert.match(readFileSync('public/badges/app-store.svg', 'utf8'), /viewBox="0 0 119\.66407 40"/);
  assert.match(readFileSync('public/badges/google-play.svg', 'utf8'), /viewBox="0 0 238\.96 70\.87"/);
});

test('manifest and robots are present', () => {
  const manifest = JSON.parse(readFileSync('public/site.webmanifest', 'utf8'));
  assert.equal(manifest.name, 'Cascane');
  assert.match(readFileSync('public/robots.txt', 'utf8'), /^Sitemap: https:\/\/www\.cascane\.app\/sitemap-index\.xml$/m);
});
