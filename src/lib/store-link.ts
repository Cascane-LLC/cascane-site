import { APP_STORE_URL, PLAY_STORE_URL } from './site.ts';

/** Where "Get the app" should go for this device: the right store on phones, the download section elsewhere. */
export function storeLinkFor(userAgent: string, maxTouchPoints = 0): string {
  if (/android/i.test(userAgent)) return PLAY_STORE_URL;
  // iPadOS 13+ reports a desktop Mac user agent; touch support gives it away.
  if (/iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && maxTouchPoints > 1)) return APP_STORE_URL;
  return '/#download';
}
