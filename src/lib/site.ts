// Facts about the site shared by pages, components and structured data.
export const SITE_URL = 'https://www.cascane.app';
export const APP_STORE_URL = 'https://apps.apple.com/app/cascane/id6802686539';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.cascane.mobile&hl=en';
export const APP_STORE_ID = '6802686539';
export const SUPPORT_EMAIL = 'support@cascane.app';

/** Extensionless, www-host canonical URL for a page path ("/", "/privacy", "/features"). */
export function canonicalUrl(path: string): string {
  if (!path.startsWith('/')) throw new Error(`canonicalUrl: path must start with "/": ${path}`);
  const clean = path.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  return clean === '/' ? `${SITE_URL}/` : `${SITE_URL}${clean.replace(/\/$/, '')}`;
}
