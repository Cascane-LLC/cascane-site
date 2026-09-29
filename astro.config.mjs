import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Pages Google should not index; kept out of the sitemap.
const UNLISTED = ['/404', '/delete-account-received', '/details-options'];

export default defineConfig({
  site: 'https://www.cascane.app',
  // Emit privacy.html (not privacy/index.html) so every URL keeps its current form.
  build: { format: 'file' },
  // Astro's compression deletes the newline between text and an inline element
  // that starts on the next source line ("at<a>support@…"). Netlify compresses
  // responses anyway.
  compressHTML: false,
  integrations: [
    sitemap({
      serialize: (item) => ({ ...item, url: item.url.replace(/\.html$/, '') }),
      filter: (page) => !UNLISTED.includes(new URL(page).pathname.replace(/\.html$/, '')),
    }),
  ],
});
