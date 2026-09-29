import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storeLinkFor } from '../src/lib/store-link.ts';
import { APP_STORE_URL, PLAY_STORE_URL } from '../src/lib/site.ts';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

test('iPhone goes to the App Store', () => assert.equal(storeLinkFor(IPHONE), APP_STORE_URL));
test('Android goes to Google Play', () => assert.equal(storeLinkFor(ANDROID), PLAY_STORE_URL));
test('iPad posing as a Mac (touch) goes to the App Store', () => assert.equal(storeLinkFor(MAC, 5), APP_STORE_URL));
test('a real Mac goes to the download section', () => assert.equal(storeLinkFor(MAC, 0), '/#download'));
test('Windows goes to the download section', () => assert.equal(storeLinkFor(WINDOWS), '/#download'));
