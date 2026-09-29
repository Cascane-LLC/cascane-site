import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalUrl } from '../src/lib/site.ts';

test('home canonical keeps the trailing slash', () => {
  assert.equal(canonicalUrl('/'), 'https://www.cascane.app/');
  assert.equal(canonicalUrl('/index.html'), 'https://www.cascane.app/');
});
test('pages are extensionless on www', () => {
  assert.equal(canonicalUrl('/privacy'), 'https://www.cascane.app/privacy');
  assert.equal(canonicalUrl('/privacy.html'), 'https://www.cascane.app/privacy');
  assert.equal(canonicalUrl('/features/'), 'https://www.cascane.app/features');
});
test('rejects relative paths', () => {
  assert.throws(() => canonicalUrl('privacy'));
});
