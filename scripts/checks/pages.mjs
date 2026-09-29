// Every page the site publishes: canonical path and whether Google should index it.
// PAGES are built on the new design. LEGACY pages are still the verbatim port
// from Task 1; each page task moves its entry from LEGACY to PAGES *before*
// rebuilding the page, and Task 7 requires LEGACY to be empty.
export const PAGES = {
  'index.html': { path: '/', indexed: true },
  'features.html': { path: '/features', indexed: true },
  'safety.html': { path: '/safety', indexed: true },
  'terms.html': { path: '/terms', indexed: true },
  'privacy.html': { path: '/privacy', indexed: true },
  'child-safety.html': { path: '/child-safety', indexed: true },
  'contact.html': { path: '/contact', indexed: true },
  'delete-account.html': { path: '/delete-account', indexed: true },
  'delete-account-received.html': { path: '/delete-account-received', indexed: false },
  '404.html': { path: '/404', indexed: false },
};

export const LEGACY = {
};
