# cascane.app Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild https://www.cascane.app as a polished, dark, big-tech-grade Astro site (home, features, safety, contact, delete-account, legal) without breaking any existing URL, the Netlify delete-account form, or a word of the legal text.

**Architecture:** Astro 7 static output (`build.format: 'file'`, so pages keep their current `privacy.html`-style file names), deployed by Netlify from `dist/`. Pages are composed from small single-purpose `.astro` components. Client JS is a few dependency-free TypeScript modules. A post-build checker (`scripts/verify.mjs` + `scripts/checks/*.mjs`), Node unit tests (`tests/*.test.ts`) and a headless-Chrome suite (`scripts/browser-check.mjs` + `scripts/browser/*.mjs`) are the tests. Each is extended *before* the code that satisfies it.

**Tech Stack:** Astro 7.3.5, @astrojs/sitemap 3.7.4, @fontsource-variable/inter 5.3.0, lucide-static 1.48.0; dev: linkedom 0.18.13, puppeteer-core 25.12.0 (drives the installed Google Chrome), lighthouse 13.5.0; Python 3 + Pillow (asset prep); Node 25 locally, Node 22 on Netlify.

**Spec:** `docs/superpowers/specs/2026-09-29-website-redesign-design.md`

**Repo / branch:** `~/Downloads/cascane-site`, branch `redesign-astro` (already created; the spec commits are on it). Every command below runs from the repo root unless it says otherwise.

**Every technical step in this plan was prototyped in a throwaway project on 2026-09-29.** The crop coordinates, badge URLs, legal-body extraction, checker code, `compressHTML` fix, preview-server helper and user-agent emulation below are the versions that worked there.

## Global Constraints

- Every legacy path keeps returning its page: `/`, `/index.html`, `/privacy`, `/privacy.html`, `/terms`, `/terms.html`, `/contact`, `/contact.html`, `/child-safety`, `/child-safety.html`, `/delete-account`, `/delete-account.html`, `/delete-account-received`, `/delete-account-received.html`.
- The delete-account form keeps exactly: `name="delete-account" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/delete-account-received"`, hidden `form-name=delete-account`, hidden `subject=Account Deletion Request`, honeypot `bot-field`, fields `email` (type=email, required), `username`, `message` (textarea).
- Privacy and Terms bodies are the Termly HTML from commit `e9f8589`, byte-for-byte. The Child Safety text is word-for-word from `e9f8589`.
- Originals in `~/Desktop/app store photos dupe` are opened read-only, never written.
- `CNAME` (`www.cascane.app`) and the Google verification meta (`YebptMeSaMRmH9P3XirwODk8zuesbpQQuMm41_QLcAE`, home page) must survive.
- Store links, exactly: `https://apps.apple.com/app/cascane/id6802686539` and `https://play.google.com/store/apps/details?id=app.cascane.mobile&hl=en`.
- Store badges: official artwork only; App Store first; Google Play the same height as and at least as wide as Apple's; never animated/tilted; never inside `[data-reveal]`; never in the footer; ≥ 40px tall.
- Canonical URLs are extensionless on `https://www.cascane.app`; exactly one `<h1>` per page; descriptions 50–170 chars; `noindex` only on `/404` and `/delete-account-received`.
- `astro.config.mjs` keeps `compressHTML: false` (Astro 7's compression glues text to inline links: "at<a>support@…").
- Hero headline is **"Social, out loud."**
- No fabricated social proof: no invented user counts, ratings, testimonials or press logos. Demo names and numbers inside product imagery and illustrations are fine.
- Colours: `--bg #08080A`, `--surface-1 #111114`, `--surface-2 #18181C`, `--text #FFFFFF`, `--text-2 #A1A1AA`, `--text-3 #8A8A93`, `--accent #00D9FF`, `--accent-2 #00FFD1`, `--accent-3 #11FF00`. Inter Variable. Dark only.
- `prefers-reduced-motion: reduce` disables all motion; content is fully visible with JavaScript disabled.
- Git: commit freely on `redesign-astro`. **Never push to or merge into `main` without the user's explicit go-ahead.** End every commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Old links typed by hand or cached by other sites** (`/privacy/` with a trailing slash, `/privacy.html`, `/index.html`) must still land on the right page on Netlify → Task 11's `check-remote.sh` requests each with and without `.html` and `/privacy/`.
2. **JavaScript disabled or a script error.** Every section must still be visible (the reveal animation hides content only once `html.js` is set), and the footer must reach every page even though the mobile menu needs JS → Task 3's `30-motion.mjs` loads pages with JS off and asserts `[data-reveal]` content is visible.
3. **The narrowest phones (320px)**, where the five-tab switcher, badges and long headings are most likely to force sideways scrolling → Task 3's `10-layout.mjs` checks every page at 320/375/768/1280/1600 for horizontal overflow.
4. **Keyboard-only and screen-reader users**: skip link, visible focus, the tablist's arrow keys, and the mobile menu trapping focus and closing on Esc → Task 3's `20-nav.mjs` and Task 8's `50-switcher.mjs`.
5. **Someone submitting the deletion form empty or with a malformed email** must be stopped by the browser before anything is sent → Task 5's `40-form.mjs`.

---

## File map

| Path | Responsibility | Task |
|---|---|---|
| `package.json`, `astro.config.mjs`, `netlify.toml`, `.nvmrc`, `.gitignore`, `tsconfig.json` | Toolchain and Netlify build | 1 |
| `scripts/verify.mjs`, `scripts/checks/{context,legacy-urls,delete-form,legal-text,internal-links,index}.mjs` | Post-build checker core | 1 |
| `scripts/extract-legal.mjs`, `src/content/legal/{privacy,terms}.html` | Verbatim Termly bodies | 1 |
| `scripts/prepare-assets.py`, `scripts/fetch-badges.sh`, `src/assets/**`, `public/{favicons,badges,site.webmanifest,robots.txt}`, `tests/assets.test.ts` | Images, icons, badges | 2 |
| `src/lib/{site,store-link}.ts`, `src/styles/{tokens,base}.css`, `src/layouts/Base.astro`, `src/components/{Seo,Icon,Mark,StoreBadges,Nav,Footer}.astro`, `src/scripts/{nav,reveal}.ts` | Page shell | 3 |
| `scripts/checks/{pages,seo,badges}.mjs`, `scripts/og/og.html`, `scripts/render-og.sh`, `public/og.png` | SEO checks, link preview | 3 |
| `scripts/lib/preview-server.mjs`, `scripts/browser-check.mjs`, `scripts/browser/*.mjs` | Headless-Chrome suite | 3+ |
| `src/layouts/DocLayout.astro`, `src/components/Toc.astro`, `src/scripts/toc.ts`, `src/styles/legal.css` | Document pages | 4 |
| `src/pages/{contact,delete-account,delete-account-received,404}.astro` | Utility pages | 5 |
| `src/pages/safety.astro` | Safety Center | 6 |
| `src/components/{Phone,FeatureRow,Waveform,DownloadBand}.astro`, `src/scripts/tilt.ts`, `scripts/checks/structured-data.mjs`, `src/pages/index.astro` | Home (part 1) | 7 |
| `src/components/{AvatarBubble,VoicePill,TypeSwitcher,DetailGrid}.astro`, `src/components/illustrations/*.astro`, `src/styles/illo.css`, `src/lib/tabs.ts` | Home (part 2) | 8 |
| `src/pages/features.astro` | Features | 9 |
| `scripts/lighthouse.mjs` | Quality gate | 10 |
| `scripts/check-remote.sh`, `scripts/form-test.mjs` | Deploy Preview checks | 11 |

---

### Task 1: Astro scaffold, post-build checker, verbatim port of the current site

The site keeps looking exactly as it does today, but it is now built by Astro and guarded by a checker. This task proves the infrastructure before any design work starts.

**Files:**
- Create: `package.json`, `package-lock.json`, `astro.config.mjs`, `netlify.toml`, `.nvmrc`, `.gitignore`, `tsconfig.json`
- Create: `scripts/verify.mjs`, `scripts/checks/context.mjs`, `scripts/checks/legacy-urls.mjs`, `scripts/checks/delete-form.mjs`, `scripts/checks/legal-text.mjs`, `scripts/checks/internal-links.mjs`, `scripts/checks/index.mjs`
- Create: `scripts/extract-legal.mjs`, `src/content/legal/privacy.html`, `src/content/legal/terms.html`
- Create: `src/pages/{index,privacy,terms,contact,child-safety,delete-account,delete-account-received}.astro` (verbatim port), `public/css/style.css`
- Move: `CNAME` → `public/CNAME`
- Delete: root `index.html privacy.html terms.html contact.html child-safety.html delete-account.html delete-account-received.html css/style.css`

**Interfaces:**
- Produces: `makeContext(dist)` → `{ dist, exists(f), read(f), doc(f), htmlFiles(), legacy(f) }` and `norm(s)` from `scripts/checks/context.mjs`; `LIVE_REF = 'e9f8589'`. Each check is `export default function (ctx): string[]` (list of problems). `scripts/checks/index.mjs` default-exports `{ name: checkFn }`. `fileForPath(path, ctx)` from `internal-links.mjs`.

- [ ] **Step 1: Toolchain files**

`package.json`:
```json
{
  "name": "cascane-site",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "verify": "node scripts/verify.mjs",
    "check": "npm run build && npm run verify"
  }
}
```

`.nvmrc`:
```
22
```

`netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
```

`.gitignore`:
```
node_modules/
dist/
.astro/
.artifacts/
.netlify/
.DS_Store
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": { "allowImportingTsExtensions": true, "noEmit": true },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Pages Google should not index; kept out of the sitemap.
const UNLISTED = ['/404', '/delete-account-received'];

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
```

Install exact versions:
```bash
npm i astro@7.3.5 @astrojs/sitemap@3.7.4 @fontsource-variable/inter@5.3.0 lucide-static@1.48.0
npm i -D linkedom@0.18.13 puppeteer-core@25.12.0 lighthouse@13.5.0
```
Expected: `found 0 vulnerabilities` (or only advisories in dev dependencies) and a `package-lock.json`.

- [ ] **Step 2: Write the checker (the test)**

`scripts/checks/context.mjs`:
```js
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseHTML } from 'linkedom';

export const LIVE_REF = 'e9f8589'; // last commit of the hand-written site (live on 2026-09-29)

export function makeContext(dist) {
  const docs = new Map();
  return {
    dist,
    exists: (f) => existsSync(join(dist, f)),
    read: (f) => readFileSync(join(dist, f), 'utf8'),
    doc(f) {
      if (!docs.has(f)) docs.set(f, parseHTML(readFileSync(join(dist, f), 'utf8')).document);
      return docs.get(f);
    },
    htmlFiles: () => readdirSync(dist).filter((f) => f.endsWith('.html')),
    legacy(f) {
      const html = execFileSync('git', ['show', `${LIVE_REF}:${f}`], { encoding: 'utf8', maxBuffer: 1 << 26 });
      return parseHTML(html).document;
    },
  };
}

export const norm = (s) => s.replace(/\s+/g, ' ').trim();
```

`scripts/checks/legacy-urls.mjs`:
```js
export const LEGACY_FILES = ['index.html', 'privacy.html', 'terms.html', 'contact.html', 'child-safety.html', 'delete-account.html', 'delete-account-received.html'];

export default function legacyUrls(ctx) {
  const errors = LEGACY_FILES.filter((f) => !ctx.exists(f)).map((f) => `missing legacy page ${f}`);
  if (!ctx.exists('CNAME') || ctx.read('CNAME').trim() !== 'www.cascane.app') errors.push('CNAME missing or changed');
  const verify = ctx.exists('index.html') && ctx.doc('index.html').querySelector('meta[name="google-site-verification"]');
  if (verify?.getAttribute('content') !== 'YebptMeSaMRmH9P3XirwODk8zuesbpQQuMm41_QLcAE') errors.push('google-site-verification meta missing on index.html');
  return errors;
}
```

`scripts/checks/delete-form.mjs`:
```js
const FORM_ATTRS = { name: 'delete-account', method: 'POST', 'data-netlify': 'true', 'netlify-honeypot': 'bot-field', action: '/delete-account-received' };
const HIDDEN = { 'form-name': 'delete-account', subject: 'Account Deletion Request' };

export default function deleteForm(ctx) {
  if (!ctx.exists('delete-account.html')) return ['delete-account.html missing'];
  const errors = [];
  const forms = ctx.doc('delete-account.html').querySelectorAll('form');
  if (forms.length !== 1) return [`delete-account.html: expected 1 form, found ${forms.length}`];
  const form = forms[0];
  for (const [k, v] of Object.entries(FORM_ATTRS)) {
    if (form.getAttribute(k) !== v) errors.push(`form[${k}] is ${JSON.stringify(form.getAttribute(k))}, expected ${JSON.stringify(v)}`);
  }
  for (const [name, value] of Object.entries(HIDDEN)) {
    const el = form.querySelector(`input[type="hidden"][name="${name}"]`);
    if (el?.getAttribute('value') !== value) errors.push(`hidden input ${name} missing or wrong`);
  }
  if (!form.querySelector('input[name="bot-field"]')) errors.push('honeypot input bot-field missing');
  const email = form.querySelector('input[name="email"]');
  if (email?.getAttribute('type') !== 'email' || !email.hasAttribute('required')) errors.push('email input must be type=email and required');
  if (!form.querySelector('input[name="username"]')) errors.push('username input missing');
  if (!form.querySelector('textarea[name="message"]')) errors.push('message textarea missing');
  if (!form.querySelector('button[type="submit"]')) errors.push('submit button missing');
  return errors;
}
```

`scripts/checks/legal-text.mjs`:
```js
import { norm } from './context.mjs';

// Compare block by block: Astro drops whitespace between elements in some
// places, so a single textContent could run paragraphs together.
const blocks = (root) => [...root.querySelectorAll('h2, p')].map((el) => norm(el.textContent)).join('\n');

export default function legalText(ctx) {
  const errors = [];
  for (const f of ['privacy.html', 'terms.html']) {
    if (!ctx.exists(f)) { errors.push(`${f} missing`); continue; }
    const sel = '[data-custom-class="body"]';
    const before = norm(ctx.legacy(f).querySelector(sel).textContent);
    const afterEl = ctx.doc(f).querySelector(sel);
    if (!afterEl) { errors.push(`${f}: Termly body missing`); continue; }
    if (norm(afterEl.textContent) !== before) errors.push(`${f}: legal text differs from ${f} at the live commit`);
  }
  if (!ctx.exists('child-safety.html')) return [...errors, 'child-safety.html missing'];
  const csBefore = blocks(ctx.legacy('child-safety.html').querySelector('main .container'));
  const cs = ctx.doc('child-safety.html');
  const csAfter = blocks(cs.querySelector('[data-doc-body]') ?? cs.querySelector('main .container'));
  if (csAfter !== csBefore) errors.push('child-safety.html: body text differs from the live commit');
  return errors;
}
```

`scripts/checks/internal-links.mjs`:
```js
import { posix } from 'node:path';

const SKIP = /^(https?:|mailto:|tel:|data:|javascript:)/;

// In-page links that were already broken in the Termly-generated Terms on the
// live site (commit e9f8589). The legal text must not change, so these are
// tolerated -- but only these, and only on terms.html.
const KNOWN_BROKEN = { 'terms.html': new Set(['products', 'software', 'reviews', 'socialmedia', 'thirdparty', 'advertisers', 'ppyes', 'ppno', 'dmca']) };

// Map a site path to the dist file Netlify would serve for it.
export function fileForPath(path, ctx) {
  const clean = decodeURIComponent(path.split(/[?#]/)[0]);
  if (clean === '/' || clean === '') return 'index.html';
  const rel = clean.replace(/^\//, '');
  if (ctx.exists(rel)) return rel;
  if (ctx.exists(`${rel}.html`)) return `${rel}.html`;
  return null;
}

export default function internalLinks(ctx) {
  const errors = [];
  for (const page of ctx.htmlFiles()) {
    const doc = ctx.doc(page);
    const refs = [];
    doc.querySelectorAll('a[href], link[href]').forEach((el) => refs.push(el.getAttribute('href')));
    doc.querySelectorAll('img[src], script[src], source[src]').forEach((el) => refs.push(el.getAttribute('src')));
    doc.querySelectorAll('[srcset]').forEach((el) => el.getAttribute('srcset').split(',').forEach((c) => refs.push(c.trim().split(/\s+/)[0])));
    for (const ref of refs) {
      if (!ref || SKIP.test(ref)) continue;
      if (ref.startsWith('#')) {
        const id = ref.slice(1);
        if (id && !doc.getElementById(id) && !KNOWN_BROKEN[page]?.has(id)) errors.push(`${page}: anchor ${ref} has no target`);
        continue;
      }
      const abs = ref.startsWith('/') ? ref : posix.join('/', posix.dirname(page), ref);
      const target = fileForPath(abs, ctx);
      if (!target) { errors.push(`${page}: broken link ${ref}`); continue; }
      const hash = ref.includes('#') ? ref.split('#')[1] : '';
      if (hash && target.endsWith('.html') && !ctx.doc(target).getElementById(hash)) errors.push(`${page}: ${ref} points to a missing anchor`);
    }
  }
  return errors;
}
```

`scripts/checks/index.mjs`:
```js
import legacyUrls from './legacy-urls.mjs';
import deleteForm from './delete-form.mjs';
import legalText from './legal-text.mjs';
import internalLinks from './internal-links.mjs';

export default { legacyUrls, deleteForm, legalText, internalLinks };
```

`scripts/verify.mjs`:
```js
// Post-build checks over dist/. Usage: npm run build && npm run verify
import { existsSync } from 'node:fs';
import { makeContext } from './checks/context.mjs';
import checks from './checks/index.mjs';

const dist = process.argv[2] ?? 'dist';
if (!existsSync(dist)) {
  console.error(`${dist}/ not found - run \`npm run build\` first`);
  process.exit(1);
}
const ctx = makeContext(dist);
let failed = 0;
for (const [name, check] of Object.entries(checks)) {
  const errors = check(ctx);
  console.log(`${errors.length ? '✗' : '✓'} ${name}`);
  errors.forEach((e) => console.log(`    ${e}`));
  failed += errors.length;
}
if (failed) {
  console.log(`\n${failed} problem(s)`);
  process.exit(1);
}
console.log('\nall checks passed');
```

- [ ] **Step 3: Run the checker to see it fail**

Run: `npm run verify`
Expected: exit 1 with `dist/ not found - run \`npm run build\` first`.

- [ ] **Step 4: Extract the Termly bodies**

`scripts/extract-legal.mjs`:
```js
// Writes the Termly-generated bodies of privacy.html / terms.html, exactly as
// they were live at commit e9f8589, to src/content/legal/. Run once; the output
// is committed and must never be hand-edited.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { parseHTML } from 'linkedom';

const REF = 'e9f8589';
mkdirSync('src/content/legal', { recursive: true });
for (const name of ['privacy', 'terms']) {
  const html = execFileSync('git', ['show', `${REF}:${name}.html`], { encoding: 'utf8', maxBuffer: 1 << 26 });
  const body = parseHTML(html).document.querySelector('.legal-content > [data-custom-class="body"]');
  if (!body) throw new Error(`${name}: Termly body not found`);
  writeFileSync(`src/content/legal/${name}.html`, `${body.outerHTML}\n`);
  console.log(name, body.outerHTML.length, 'chars');
}
```
Run: `node scripts/extract-legal.mjs`
Expected: `privacy 101543 chars` and `terms 92663 chars`.

- [ ] **Step 5: Port the seven pages verbatim**

```bash
mkdir -p src/pages public/css
for f in index contact child-safety delete-account delete-account-received; do git show e9f8589:$f.html > src/pages/$f.astro; done
git show e9f8589:css/style.css > public/css/style.css
python3 - <<'EOF'
import subprocess
for name in ['privacy', 'terms']:
    src = subprocess.run(['git', 'show', f'e9f8589:{name}.html'], capture_output=True, text=True, check=True).stdout
    lines = src.split('\n')
    i = next(k for k, l in enumerate(lines) if l.strip() == '<div data-custom-class="body">')
    j = next(k for k in range(i + 1, len(lines)) if lines[k] == '        </div>')
    out = ['---', f"import body from '../content/legal/{name}.html?raw';", '---'] + lines[:i] + ['        <Fragment set:html={body} />'] + lines[j + 1:]
    open(f'src/pages/{name}.astro', 'w').write('\n'.join(out).replace('<style>', '<style is:inline>', 1))
    print(name, 'body lines', i + 1, '-', j + 1)
EOF
git mv CNAME public/CNAME
git rm -q index.html privacy.html terms.html contact.html child-safety.html delete-account.html delete-account-received.html css/style.css
```
Expected: `privacy body lines 96 - 98` and `terms body lines 96 - 173`.

- [ ] **Step 6: Build and run the checker**

Run: `npm run check`
Expected: the build ends with `[build] Complete!`, then:
```
✓ legacyUrls
✓ deleteForm
✓ legalText
✓ internalLinks

all checks passed
```

- [ ] **Step 7: Confirm Netlify's builder accepts the config (Node 22)**

Run: `npx -y node@22 node_modules/astro/bin/astro.mjs build 2>&1 | tail -1`
Expected: `[build] Complete!`.

Run: `npx -y netlify-cli@latest build --offline 2>&1 | grep -E "Netlify Build Complete|Error"`
Expected: `Netlify Build Complete`. The CLI writes its working files under `.netlify/`, which is git-ignored; confirm `git status --short` shows no new tracked files from it.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "build: move the site to Astro with a post-build checker (no visual change)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Product images, icons and store badges

**Files:**
- Create: `scripts/prepare-assets.py`, `scripts/fetch-badges.sh`
- Create (generated, committed): `src/assets/screens/{chat_page,convos_page,inbox_page,channel_info_page,profile_page}.png`, `src/assets/avatars/{ethan,natalie,austin,anna,nate,tyler}.png`, `src/assets/mark.png`, `public/{favicon.ico,favicon-48.png,favicon-96.png,apple-touch-icon.png,icon-192.png,icon-512.png}`, `public/badges/{app-store,google-play}.svg`
- Create: `public/site.webmanifest`, `public/robots.txt`
- Create: `tests/assets.test.ts`
- Modify: `package.json` (add `test` script, extend `check`)

**Interfaces:**
- Produces: `src/assets/screens/*.png` (991×2092 RGBA, transparent rounded corners), `src/assets/avatars/*.png` (160×160 RGBA circles), `src/assets/mark.png` (256×256 RGBA, rounded cyan tile), `/badges/app-store.svg` (viewBox 119.66407×40), `/badges/google-play.svg` (viewBox 238.96×70.87).

- [ ] **Step 1: Write the failing test**

`tests/assets.test.ts`:
```ts
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

test('official badges are the expected artwork', () => {
  assert.match(readFileSync('public/badges/app-store.svg', 'utf8'), /viewBox="0 0 119\.66407 40"/);
  assert.match(readFileSync('public/badges/google-play.svg', 'utf8'), /viewBox="0 0 238\.96 70\.87"/);
});

test('manifest and robots are present', () => {
  const manifest = JSON.parse(readFileSync('public/site.webmanifest', 'utf8'));
  assert.equal(manifest.name, 'Cascane');
  assert.match(readFileSync('public/robots.txt', 'utf8'), /^Sitemap: https:\/\/www\.cascane\.app\/sitemap-index\.xml$/m);
});
```

In `package.json` `scripts`, add `"test": "node --test \"tests/**/*.test.ts\""` and change `check` to `"npm run build && npm run verify && npm test"`.

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL, with `ENOENT: no such file or directory, scandir 'src/assets/screens'`.

- [ ] **Step 3: Asset scripts and static files**

`scripts/prepare-assets.py`:
```python
"""Copy + crop the store images and the app icon into the site.

Originals are only ever opened for reading:
  ~/Desktop/app store photos dupe/app store files/*.png   (1320x2868 store images)
  ~/Downloads/cascane/assets/icons/app_icon.png           (1024x1024 app icon)
Outputs are written inside this repo. Re-running is safe (overwrites outputs).
"""
from pathlib import Path
from PIL import Image, ImageDraw

HOME = Path.home()
STORE = HOME / 'Desktop/app store photos dupe/app store files'
ICON = HOME / 'Downloads/cascane/assets/icons/app_icon.png'
ROOT = Path(__file__).resolve().parent.parent
SCREENS = ROOT / 'src/assets/screens'
AVATARS = ROOT / 'src/assets/avatars'
PUBLIC = ROOT / 'public'

# The phone panel sits at the same place in every store image (measured 2026-09-29).
PANEL = (164, 614, 1155, 2706)  # left, top, right, bottom -> 991 x 2092
PANEL_RADIUS = 122
SS = 4  # supersampling factor for anti-aliased masks

SCREEN_NAMES = ['chat_page', 'convos_page', 'inbox_page', 'channel_info_page', 'profile_page']

# Avatar centres in chat_page.png (full-res px), chosen so a radius-80 crop stays
# inside each photo circle, clear of the ring and the reaction badges.
AVATAR_CENTRES = {
    'ethan': (659, 1148), 'natalie': (933, 1371), 'austin': (659, 1585),
    'anna': (376, 1808), 'nate': (659, 2037), 'tyler': (933, 2254),
}
AVATAR_RADIUS = 80
AVATAR_SIZE = 160


def rounded_mask(size, radius, inset=0):
    w, h = size
    m = Image.new('L', (w * SS, h * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        (inset * SS, inset * SS, (w - inset) * SS - 1, (h - inset) * SS - 1),
        radius=radius * SS, fill=255)
    return m.resize(size, Image.LANCZOS)


def circle_mask(size):
    m = Image.new('L', (size * SS, size * SS), 0)
    ImageDraw.Draw(m).ellipse((0, 0, size * SS - 1, size * SS - 1), fill=255)
    return m.resize((size, size), Image.LANCZOS)


def screens():
    SCREENS.mkdir(parents=True, exist_ok=True)
    for name in SCREEN_NAMES:
        with Image.open(STORE / f'{name}.png') as src:
            assert src.size == (1320, 2868), f'{name}: unexpected size {src.size}'
            panel = src.convert('RGB').crop(PANEL)
        panel.putalpha(rounded_mask(panel.size, PANEL_RADIUS, inset=1))
        panel.save(SCREENS / f'{name}.png', optimize=True)
        print('screen', name, panel.size)


def avatars():
    AVATARS.mkdir(parents=True, exist_ok=True)
    with Image.open(STORE / 'chat_page.png') as src:
        rgb = src.convert('RGB')
    for name, (cx, cy) in AVATAR_CENTRES.items():
        r = AVATAR_RADIUS
        face = rgb.crop((cx - r, cy - r, cx + r, cy + r)).resize((AVATAR_SIZE, AVATAR_SIZE), Image.LANCZOS)
        face.putalpha(circle_mask(AVATAR_SIZE))
        face.save(AVATARS / f'{name}.png', optimize=True)
        print('avatar', name)


def icons():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    with Image.open(ICON) as src:
        icon = src.convert('RGB')
    assert icon.size == (1024, 1024)
    icon.save(PUBLIC / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    for size, name in [(48, 'favicon-48.png'), (96, 'favicon-96.png'), (180, 'apple-touch-icon.png'),
                       (192, 'icon-192.png'), (512, 'icon-512.png')]:
        icon.resize((size, size), Image.LANCZOS).save(PUBLIC / name, optimize=True)
    # Rounded mark used in the nav, footer and download band (cyan tile, five dots).
    mark = icon.resize((256, 256), Image.LANCZOS)
    mark.putalpha(rounded_mask(mark.size, 58))
    mark.save(ROOT / 'src/assets/mark.png', optimize=True)
    print('icons ok')


if __name__ == '__main__':
    screens()
    avatars()
    icons()
```

`scripts/fetch-badges.sh`:
```bash
#!/usr/bin/env bash
# Downloads the official store badge artwork into public/badges/.
# Apple: black "Download on the App Store" (US English), from Apple's marketing guidelines.
# Google: "Get it on Google Play" (English, web colour), from Google's badge package.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/badges"; TMP="$(mktemp -d)"; mkdir -p "$OUT"
curl -fsSL -o "$OUT/app-store.svg" "https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
# Google's package sits behind a signed link that expires, so read the current link from the badges page.
ZIP_URL="$(curl -fsSL "https://play.google.com/intl/en_us/badges/" | grep -oE 'https://storage.googleapis.com/[^"]+\.zip[^"]*' | head -1 | sed 's/&amp;/\&/g')"
curl -fsSL -o "$TMP/gp.zip" "$ZIP_URL"
unzip -o -j -q "$TMP/gp.zip" "Google Play Badge guidelines/Get it on Google Play Badges/Digital/svg/GetItOnGooglePlay_Badge_Web_color_English.svg" -d "$TMP"
cp "$TMP/GetItOnGooglePlay_Badge_Web_color_English.svg" "$OUT/google-play.svg"
chmod 644 "$OUT/app-store.svg" "$OUT/google-play.svg"
rm -rf "$TMP"
grep -q 'viewBox="0 0 119.66407 40"' "$OUT/app-store.svg"
grep -q 'viewBox="0 0 238.96 70.87"' "$OUT/google-play.svg"
echo "badges ok"
```

`public/site.webmanifest`:
```json
{
  "name": "Cascane",
  "short_name": "Cascane",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#08080A",
  "background_color": "#08080A",
  "display": "browser"
}
```

`public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://www.cascane.app/sitemap-index.xml
```

Run:
```bash
chmod +x scripts/fetch-badges.sh
python3 scripts/prepare-assets.py
scripts/fetch-badges.sh
```
Expected: five `screen … (991, 2092)` lines, six `avatar …` lines, `icons ok`, `badges ok`.

- [ ] **Step 4: Run the tests and confirm the originals were not touched**

Run: `npm test`
Expected: `ℹ pass 5`, `ℹ fail 0`.

Run: `stat -f "%Sm %N" -t "%Y-%m-%d %H:%M" ~/Desktop/"app store photos dupe/app store files"/*.png`
Expected: every file still shows `2026-08-18 17:07`.

- [ ] **Step 5: Eyeball the avatars**

```bash
python3 - <<'EOF'
from PIL import Image
names = ['ethan', 'natalie', 'austin', 'anna', 'nate', 'tyler']
sheet = Image.new('RGB', (len(names) * 180, 180), (8, 8, 10))
for i, n in enumerate(names):
    im = Image.open(f'src/assets/avatars/{n}.png')
    sheet.paste(im, (i * 180 + 10, 10), im)
sheet.save('/tmp/avatars-check.png')
EOF
```
Open `/tmp/avatars-check.png` (Read tool). Expected: six clean circular faces, with no grey ring and no reaction-badge fragment at the bottom of Austin or Anna. If a fragment shows, move that avatar's centre up 4px in `AVATAR_CENTRES`, re-run the script, and re-check.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(assets): cropped app screens, avatars, favicons and official store badges

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Page shell: design tokens, layout, SEO head, nav, mobile menu, footer, badges

After this task, new pages can be built on `Base.astro`. `/features` and `/safety` exist as skeleton pages (their final content arrives in Tasks 9 and 6), so every nav and footer link resolves.

**Files:**
- Create: `src/lib/site.ts`, `src/lib/store-link.ts`, `tests/site.test.ts`, `tests/store-link.test.ts`
- Create: `src/styles/tokens.css`, `src/styles/base.css`
- Create: `src/components/Seo.astro`, `src/components/Icon.astro`, `src/components/Mark.astro`, `src/components/StoreBadges.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`
- Create: `src/layouts/Base.astro`, `src/scripts/nav.ts`, `src/scripts/reveal.ts`
- Create: `src/pages/features.astro`, `src/pages/safety.astro` (skeletons)
- Modify: `src/pages/index.astro` (add a `#download` anchor to the ported page)
- Create: `scripts/checks/pages.mjs`, `scripts/checks/seo.mjs`, `scripts/checks/badges.mjs`; Modify: `scripts/checks/index.mjs`
- Create: `scripts/og/og.html`, `scripts/render-og.sh`, `public/og.png`
- Create: `scripts/lib/preview-server.mjs`, `scripts/browser-check.mjs`, `scripts/browser/_open.mjs`, `scripts/browser/10-layout.mjs`, `scripts/browser/20-nav.mjs`, `scripts/browser/30-motion.mjs`
- Modify: `package.json` (add `browser` script, extend `check`)

**Interfaces:**
- Produces (TS): `SITE_URL`, `APP_STORE_URL`, `PLAY_STORE_URL`, `APP_STORE_ID`, `SUPPORT_EMAIL`, `canonicalUrl(path: string): string` from `src/lib/site.ts`; `storeLinkFor(userAgent: string, maxTouchPoints?: number): string` from `src/lib/store-link.ts`.
- Produces (components):
  - `<Base title description path noindex? jsonLd?>` with a default slot and a `head` slot.
  - `<Icon name size? class?>`: any `lucide-static` icon name; it throws at build time for an unknown name.
  - `<Mark size? class?>`
  - `<StoreBadges size?: 'lg'|'md'>`: renders `[data-store-badges] > a.store-badge[data-store=apple|google] > img`.
- Produces (CSS classes, global): `.container .section .page-top .eyebrow .display .display-sm .h2 .h3 .lead .muted .link .btn .btn-primary .btn-secondary .btn-sm .card .sr-only`; attribute `data-reveal` with optional `style="--i:N"` stagger.
- Produces (checks): `PAGES` / `LEGACY` maps (`file → { path, indexed }`) in `scripts/checks/pages.mjs`. Page tasks move entries from `LEGACY` to `PAGES`.
- Produces (browser suite): `open(browser, base, path, opts)` → `{ page, errors, status }` from `scripts/browser/_open.mjs`, where `opts` = `{ width=1280, height=900, reducedMotion=false, javascript=true, userAgent }`. Each `scripts/browser/NN-*.mjs` exports `name` and `run({ browser, base, screens })`.

- [ ] **Step 1: Write the failing unit tests**

`tests/site.test.ts`:
```ts
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
```

`tests/store-link.test.ts`:
```ts
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
```

Run: `npm test`
Expected: FAIL, `Cannot find module '…/src/lib/site.ts'`.

- [ ] **Step 2: Implement the two libraries**

`src/lib/site.ts`:
```ts
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
```

`src/lib/store-link.ts`:
```ts
import { APP_STORE_URL, PLAY_STORE_URL } from './site.ts';

/** Where "Get the app" should go for this device: the right store on phones, the download section elsewhere. */
export function storeLinkFor(userAgent: string, maxTouchPoints = 0): string {
  if (/android/i.test(userAgent)) return PLAY_STORE_URL;
  // iPadOS 13+ reports a desktop Mac user agent; touch support gives it away.
  if (/iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && maxTouchPoints > 1)) return APP_STORE_URL;
  return '/#download';
}
```

Run: `npm test`
Expected: `ℹ pass 13` (5 asset tests + 3 site + 5 store-link), `ℹ fail 0`.

- [ ] **Step 3: Write the failing page checks**

`scripts/checks/pages.mjs`:
```js
// Every page the site publishes: canonical path and whether Google should index it.
// PAGES are built on the new design. LEGACY pages are still the verbatim port
// from Task 1; each page task moves its entry from LEGACY to PAGES *before*
// rebuilding the page, and Task 7 requires LEGACY to be empty.
export const PAGES = {
  'features.html': { path: '/features', indexed: true },
  'safety.html': { path: '/safety', indexed: true },
};

export const LEGACY = {
  'index.html': { path: '/', indexed: true },
  'contact.html': { path: '/contact', indexed: true },
  'child-safety.html': { path: '/child-safety', indexed: true },
  'delete-account.html': { path: '/delete-account', indexed: true },
  'delete-account-received.html': { path: '/delete-account-received', indexed: false },
  'privacy.html': { path: '/privacy', indexed: true },
  'terms.html': { path: '/terms', indexed: true },
};
```

`scripts/checks/seo.mjs`:
```js
import { PAGES, LEGACY } from './pages.mjs';

const SITE = 'https://www.cascane.app';
const canonical = (path) => (path === '/' ? `${SITE}/` : `${SITE}${path}`);

export default function seo(ctx) {
  const errors = [];
  const titles = new Map();
  const descriptions = new Map();
  for (const f of ctx.htmlFiles()) if (!PAGES[f] && !LEGACY[f]) errors.push(`${f}: published but not listed in scripts/checks/pages.mjs`);
  for (const [file, { path, indexed }] of Object.entries(PAGES)) {
    if (!ctx.exists(file)) { errors.push(`${file}: listed but not built`); continue; }
    const doc = ctx.doc(file);
    const meta = (sel) => doc.querySelector(sel)?.getAttribute('content') ?? null;
    const h1s = doc.querySelectorAll('h1').length;
    if (h1s !== 1) errors.push(`${file}: expected exactly 1 <h1>, found ${h1s}`);
    const title = doc.querySelector('title')?.textContent.trim() ?? '';
    const desc = meta('meta[name="description"]') ?? '';
    if (!title) errors.push(`${file}: missing <title>`);
    if (desc.length < 50 || desc.length > 170) errors.push(`${file}: description is ${desc.length} chars (want 50-170)`);
    if (titles.has(title)) errors.push(`${file}: title duplicates ${titles.get(title)}`);
    if (descriptions.has(desc)) errors.push(`${file}: description duplicates ${descriptions.get(desc)}`);
    titles.set(title, file);
    descriptions.set(desc, file);
    const canon = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
    if (canon !== canonical(path)) errors.push(`${file}: canonical is ${canon}, expected ${canonical(path)}`);
    if (meta('meta[property="og:url"]') !== canonical(path)) errors.push(`${file}: og:url mismatch`);
    for (const p of ['og:title', 'og:description', 'og:image', 'og:site_name']) if (!meta(`meta[property="${p}"]`)) errors.push(`${file}: missing ${p}`);
    if (meta('meta[name="apple-itunes-app"]') !== 'app-id=6802686539') errors.push(`${file}: Smart App Banner meta missing`);
    const noindex = /noindex/.test(meta('meta[name="robots"]') ?? '');
    if (noindex === indexed) errors.push(`${file}: robots noindex is ${noindex}, expected ${!indexed}`);
    if (!doc.querySelector('a.skip[href="#main"]') || !doc.getElementById('main')) errors.push(`${file}: skip link or #main missing`);
    doc.querySelectorAll('img').forEach((img) => {
      if (!img.hasAttribute('alt')) errors.push(`${file}: <img src="${img.getAttribute('src')}"> has no alt`);
    });
  }
  if (!ctx.exists('og.png')) errors.push('og.png missing');
  if (!ctx.exists('sitemap-0.xml')) errors.push('sitemap-0.xml missing');
  else {
    const locs = [...ctx.read('sitemap-0.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
    const want = Object.values({ ...PAGES, ...LEGACY }).filter((p) => p.indexed).map((p) => canonical(p.path)).sort();
    if (JSON.stringify(locs) !== JSON.stringify(want)) errors.push(`sitemap lists ${locs.join(', ')}; expected ${want.join(', ')}`);
  }
  const robots = ctx.exists('robots.txt') ? ctx.read('robots.txt') : '';
  if (!/Sitemap: https:\/\/www\.cascane\.app\/sitemap-index\.xml/.test(robots)) errors.push('robots.txt missing sitemap line');
  return errors;
}
```

`scripts/checks/badges.mjs`:
```js
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
```

Update `scripts/checks/index.mjs`:
```js
import legacyUrls from './legacy-urls.mjs';
import deleteForm from './delete-form.mjs';
import legalText from './legal-text.mjs';
import internalLinks from './internal-links.mjs';
import seo from './seo.mjs';
import badges from './badges.mjs';

export default { legacyUrls, deleteForm, legalText, internalLinks, seo, badges };
```

Run: `npm run build && npm run verify`
Expected: FAIL. `seo` reports `features.html: listed but not built`, `safety.html: listed but not built`, `og.png missing`, and a sitemap mismatch.

- [ ] **Step 4: Design tokens and base styles**

`src/styles/tokens.css`:
```css
:root {
  color-scheme: dark;
  --bg: #08080A;
  --surface-1: #111114;
  --surface-2: #18181C;
  --line: rgba(255, 255, 255, 0.08);
  --line-strong: rgba(255, 255, 255, 0.14);
  --text: #FFFFFF;
  --text-2: #A1A1AA;
  --text-3: #8A8A93;
  --accent: #00D9FF;
  --accent-2: #00FFD1;
  --accent-3: #11FF00;
  --font: 'Inter Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --max: 1200px;
  --read: 720px;
  --gutter: clamp(20px, 4vw, 32px);
  --section: clamp(96px, 12vw, 160px);
  --nav-h: 64px;
  --r-card: 20px;
  --r-panel: 28px;
  --r-pill: 999px;
  --ease: cubic-bezier(0.2, 0.7, 0.2, 1);
}
```

`src/styles/base.css`:
```css
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; scroll-padding-top: calc(var(--nav-h) + 16px); }
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  font-size: 1rem;
  line-height: 1.6;
  font-feature-settings: 'cv11', 'ss01';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: clip;
}
img, picture, svg { display: block; max-width: 100%; }
img { height: auto; }
a { color: inherit; text-decoration: none; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
ul[class], ol[class] { list-style: none; padding: 0; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 6px; }
::selection { background: rgba(0, 217, 255, 0.3); }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.skip { position: absolute; left: 16px; top: -100px; z-index: 300; background: var(--text); color: #000; padding: 10px 18px; border-radius: var(--r-pill); font-weight: 600; }
.skip:focus { top: 12px; }

.container { width: 100%; max-width: calc(var(--max) + 2 * var(--gutter)); margin-inline: auto; padding-inline: var(--gutter); }
.section { padding-block: var(--section); }
.page-top { padding-top: calc(var(--nav-h) + clamp(48px, 9vw, 112px)); }

.eyebrow { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }
.display { font-size: clamp(2.75rem, 6.5vw, 5.5rem); font-weight: 700; letter-spacing: -0.035em; line-height: 1.02; text-wrap: balance; }
.display-sm { font-size: clamp(2.25rem, 5vw, 3.75rem); font-weight: 700; letter-spacing: -0.03em; line-height: 1.05; text-wrap: balance; }
.h2 { font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 650; letter-spacing: -0.03em; line-height: 1.08; text-wrap: balance; }
.h3 { font-size: 1.25rem; font-weight: 600; letter-spacing: -0.01em; line-height: 1.3; }
.lead { font-size: clamp(1.0625rem, 1.4vw, 1.25rem); color: var(--text-2); line-height: 1.6; text-wrap: pretty; }
.muted { color: var(--text-3); }
.link { color: var(--accent); }
.link:hover { text-decoration: underline; text-underline-offset: 3px; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 48px; padding: 0 22px; border-radius: var(--r-pill); font-weight: 600; font-size: 0.9375rem; white-space: nowrap; transition: transform 0.2s var(--ease), background-color 0.2s; }
.btn:active { transform: scale(0.98); }
.btn-primary { background: var(--text); color: #000; }
.btn-primary:hover { background: #E4E4E8; }
.btn-secondary { background: var(--surface-2); color: var(--text); box-shadow: inset 0 0 0 1px var(--line-strong); }
.btn-secondary:hover { background: #202026; }
.btn-sm { height: 38px; padding: 0 16px; font-size: 0.875rem; }

.card { background: var(--surface-1); border-radius: var(--r-card); box-shadow: inset 0 0 0 1px var(--line); }

/* Motion. Content is only hidden for the reveal once JS has marked <html class="js">. */
@view-transition { navigation: auto; }
.js [data-reveal] { opacity: 0; transform: translateY(16px); transition: opacity 0.6s var(--ease), transform 0.6s var(--ease); transition-delay: calc(var(--i, 0) * 60ms); }
.js [data-reveal].is-in { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  @view-transition { navigation: none; }
  .js [data-reveal] { opacity: 1; transform: none; transition: none; }
  *, *::before, *::after { animation-duration: 0s !important; animation-iteration-count: 1 !important; transition-duration: 0s !important; scroll-behavior: auto !important; }
}
```

- [ ] **Step 5: Shell components**

`src/components/Icon.astro`:
```astro
---
// Lucide line icons (ISC licence), inlined so they inherit currentColor.
const icons = import.meta.glob<string>('/node_modules/lucide-static/icons/*.svg', { query: '?raw', import: 'default', eager: true });

interface Props { name: string; size?: number; class?: string }
const { name, size = 24, class: cls } = Astro.props;
const raw = icons[`/node_modules/lucide-static/icons/${name}.svg`];
if (!raw) throw new Error(`Icon: unknown lucide icon "${name}"`);
const svg = raw
  .replace(/<!--[\s\S]*?-->/, '')
  .replace(/width="24"/, `width="${size}"`)
  .replace(/height="24"/, `height="${size}"`)
  .replace(/class="[^"]*"/, `class="icon${cls ? ` ${cls}` : ''}" aria-hidden="true" focusable="false"`);
---
<Fragment set:html={svg} />
```

`src/components/Mark.astro`:
```astro
---
import { Image } from 'astro:assets';
import mark from '../assets/mark.png';

interface Props { size?: number; class?: string }
const { size = 28, class: cls } = Astro.props;
---
<Image src={mark} alt="" width={size} height={size} densities={[1, 2]} class={cls} />
```

`src/components/Seo.astro`:
```astro
---
import { canonicalUrl, APP_STORE_ID } from '../lib/site.ts';

interface Props {
  title: string;
  description: string;
  path: string;        // canonical path, e.g. "/" or "/privacy"
  noindex?: boolean;
  jsonLd?: object[];   // structured data blocks (home page only)
}
const { title, description, path, noindex = false, jsonLd = [] } = Astro.props;
const url = canonicalUrl(path);
const ogImage = new URL('/og.png', Astro.site).href;
---
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={url} />
{noindex && <meta name="robots" content="noindex" />}
<meta name="apple-itunes-app" content={`app-id=${APP_STORE_ID}`} />
<meta property="og:site_name" content="Cascane" />
<meta property="og:type" content="website" />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={url} />
<meta property="og:image" content={ogImage} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" href="/favicon-96.png" type="image/png" sizes="96x96" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#08080A" />
{jsonLd.map((block) => <script type="application/ld+json" is:inline set:html={JSON.stringify(block)} />)}
```

`src/components/StoreBadges.astro`:
```astro
---
import { APP_STORE_URL, PLAY_STORE_URL } from '../lib/site.ts';

// Official artwork: Apple 119.66407 x 40, Google 238.96 x 70.87 (no padding).
// Both render at the same height, which makes Google's the wider of the two
// ("same size or larger", Google). Order: App Store first (Apple).
interface Props { size?: 'lg' | 'md' }
const { size = 'lg' } = Astro.props;
const h = size === 'lg' ? 48 : 44;
const appleW = Math.round((h * 119.66407) / 40);
const googleW = Math.round((h * 238.96) / 70.87);
---
<div class="store-badges" data-store-badges>
  <a class="store-badge" href={APP_STORE_URL} data-store="apple">
    <img src="/badges/app-store.svg" width={appleW} height={h} alt="Download Cascane on the App Store" />
  </a>
  <a class="store-badge" href={PLAY_STORE_URL} data-store="google">
    <img src="/badges/google-play.svg" width={googleW} height={h} alt="Get Cascane on Google Play" />
  </a>
</div>
<style>
  /* Clear space: at least a quarter of the badge height on every side (both brands). */
  .store-badges { display: flex; flex-wrap: wrap; gap: 16px; padding-block: 12px; }
  .store-badge { display: block; border-radius: 8px; }
  .store-badge img { height: auto; }
</style>
```

`src/components/Nav.astro`:
```astro
---
import Mark from './Mark.astro';
import Icon from './Icon.astro';
import StoreBadges from './StoreBadges.astro';

const links = [
  { href: '/features', label: 'Features' },
  { href: '/safety', label: 'Safety' },
  { href: '/contact', label: 'Contact' },
];
const current = Astro.url.pathname.replace(/\.html$/, '').replace(/^\/index$/, '/');
---
<header class="nav" data-nav>
  <div class="container nav-inner">
    <a href="/" class="brand"><Mark size={28} /><span>Cascane</span></a>
    <nav class="nav-links" aria-label="Main">
      {links.map((l) => <a href={l.href} aria-current={current === l.href ? 'page' : undefined}>{l.label}</a>)}
    </nav>
    <a href="/#download" class="btn btn-primary btn-sm nav-cta" data-get-app>Get the app</a>
    <button type="button" class="menu-btn" aria-expanded="false" aria-controls="mobile-menu" data-menu-open>
      <Icon name="menu" /><span class="sr-only">Open menu</span>
    </button>
  </div>
</header>

<div class="menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" hidden data-menu>
  <div class="container menu-top">
    <a href="/" class="brand"><Mark size={28} /><span>Cascane</span></a>
    <button type="button" class="menu-btn" data-menu-close>
      <Icon name="x" /><span class="sr-only">Close menu</span>
    </button>
  </div>
  <nav class="container menu-links" aria-label="Mobile">
    <a href="/">Home</a>
    {links.map((l) => <a href={l.href}>{l.label}</a>)}
  </nav>
  <div class="container menu-badges"><StoreBadges size="md" /></div>
</div>

<script>import '../scripts/nav.ts';</script>

<style>
  .nav { position: fixed; inset: 0 0 auto; z-index: 100; height: var(--nav-h); transition: background-color 0.3s, box-shadow 0.3s; }
  .nav:global(.is-scrolled) { background: rgba(8, 8, 10, 0.72); backdrop-filter: saturate(160%) blur(20px); -webkit-backdrop-filter: saturate(160%) blur(20px); box-shadow: 0 1px 0 var(--line); }
  .nav-inner { height: 100%; display: flex; align-items: center; gap: 32px; }
  .brand { display: flex; align-items: center; gap: 10px; font-weight: 650; font-size: 1.125rem; letter-spacing: -0.02em; }
  .brand :global(img) { border-radius: 8px; }
  .nav-links { display: flex; gap: 28px; margin-inline: auto; }
  .nav-links a { font-size: 0.9375rem; color: var(--text-2); transition: color 0.2s; }
  .nav-links a:hover, .nav-links a[aria-current='page'] { color: var(--text); }
  .menu-btn { display: none; width: 44px; height: 44px; place-items: center; border-radius: 12px; }
  .menu { position: fixed; inset: 0; z-index: 200; background: var(--bg); display: flex; flex-direction: column; overflow-y: auto; }
  .menu[hidden] { display: none; }
  .menu-top { height: var(--nav-h); display: flex; align-items: center; justify-content: space-between; flex: none; }
  .menu-top .menu-btn { display: grid; }
  .menu-links { display: flex; flex-direction: column; gap: 4px; padding-top: 24px; }
  .menu-links a { font-size: 2rem; font-weight: 650; letter-spacing: -0.02em; padding: 8px 0; }
  .menu-badges { margin-top: auto; padding-top: 32px; padding-bottom: 40px; }
  :global(body.menu-open) { overflow: hidden; }
  @media (max-width: 859px) {
    .nav-links, .nav-cta { display: none; }
    .menu-btn { display: grid; margin-left: auto; }
  }
</style>
```

`src/components/Footer.astro`:
```astro
---
import Mark from './Mark.astro';
import { APP_STORE_URL, PLAY_STORE_URL } from '../lib/site.ts';

const columns = [
  { title: 'Product', links: [['Features', '/features'], ['Daily', '/features#daily'], ['Convos', '/features#convos'], ['Channels', '/features#channels'], ['Download for iPhone', APP_STORE_URL], ['Download for Android', PLAY_STORE_URL]] },
  { title: 'Company', links: [['Contact', '/contact'], ['Safety Center', '/safety']] },
  { title: 'Legal', links: [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Child Safety', '/child-safety'], ['Delete Account', '/delete-account']] },
];
---
<footer class="footer">
  <div class="container footer-top">
    <div class="footer-brand">
      <a href="/" class="brand"><Mark size={28} /><span>Cascane</span></a>
      <p>Social, out loud. Voice-first messaging for iPhone and Android.</p>
    </div>
    {columns.map((c) => (
      <nav class="footer-col" aria-label={c.title}>
        <h2>{c.title}</h2>
        <ul>{c.links.map(([label, href]) => <li><a href={href}>{label}</a></li>)}</ul>
      </nav>
    ))}
  </div>
  <div class="container footer-bottom">
    <p>© 2026 Cascane LLC · 522 W Riverside Ave Ste N, Spokane, WA 99201</p>
    <p class="tm">Apple and the Apple logo are trademarks of Apple Inc., registered in the U.S. and other countries. App Store is a service mark of Apple Inc. Google Play and the Google Play logo are trademarks of Google LLC.</p>
  </div>
</footer>
<style>
  .footer { border-top: 1px solid var(--line); padding-top: 72px; padding-bottom: 40px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.015), transparent 40%); }
  .footer-top { display: grid; grid-template-columns: 2fr repeat(3, 1fr); gap: 40px; }
  .brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 650; font-size: 1.125rem; letter-spacing: -0.02em; }
  .brand :global(img) { border-radius: 8px; }
  .footer-brand p { margin-top: 16px; color: var(--text-3); max-width: 300px; }
  .footer-col h2 { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-3); margin-bottom: 16px; }
  .footer-col ul { list-style: none; padding: 0; display: grid; gap: 10px; }
  .footer-col a { color: var(--text-2); font-size: 0.9375rem; transition: color 0.2s; }
  .footer-col a:hover { color: var(--text); }
  .footer-bottom { margin-top: 56px; padding-top: 24px; border-top: 1px solid var(--line); display: grid; gap: 8px; font-size: 0.8125rem; color: var(--text-3); }
  .tm { font-size: 0.75rem; }
  @media (max-width: 859px) { .footer-top { grid-template-columns: 1fr 1fr; } .footer-brand { grid-column: 1 / -1; } }
  @media (max-width: 479px) { .footer-top { grid-template-columns: 1fr; } }
</style>
```

`src/scripts/nav.ts`:
```ts
import { storeLinkFor } from '../lib/store-link.ts';

// Solid nav background once the page scrolls.
const nav = document.querySelector<HTMLElement>('[data-nav]');
const onScroll = () => nav?.classList.toggle('is-scrolled', window.scrollY > 8);
onScroll();
addEventListener('scroll', onScroll, { passive: true });

// "Get the app" goes straight to the right store on phones.
const target = storeLinkFor(navigator.userAgent, navigator.maxTouchPoints);
document.querySelectorAll<HTMLAnchorElement>('[data-get-app]').forEach((a) => { a.href = target; });

// Full-screen mobile menu: focus moves in, Tab stays inside, Esc closes.
const menu = document.querySelector<HTMLElement>('[data-menu]');
const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');
const closeBtn = document.querySelector<HTMLButtonElement>('[data-menu-close]');
let lastFocus: HTMLElement | null = null;
const focusables = () => [...(menu?.querySelectorAll<HTMLElement>('a[href], button') ?? [])];

function open() {
  if (!menu) return;
  lastFocus = document.activeElement as HTMLElement | null;
  menu.hidden = false;
  document.body.classList.add('menu-open');
  openBtn?.setAttribute('aria-expanded', 'true');
  focusables()[0]?.focus();
}
function close() {
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  document.body.classList.remove('menu-open');
  openBtn?.setAttribute('aria-expanded', 'false');
  (lastFocus ?? openBtn)?.focus();
}
openBtn?.addEventListener('click', open);
closeBtn?.addEventListener('click', close);
menu?.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) close(); });
document.addEventListener('keydown', (e) => {
  if (!menu || menu.hidden) return;
  if (e.key === 'Escape') { close(); return; }
  if (e.key !== 'Tab') return;
  const f = focusables();
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
addEventListener('resize', () => { if (innerWidth >= 860) close(); });
```

`src/scripts/reveal.ts`:
```ts
// Fade-up on first view. Everything is visible without JS (see base.css).
const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce || !('IntersectionObserver' in window)) {
  els.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((el) => io.observe(el));
}
```

`src/layouts/Base.astro`:
```astro
---
import '@fontsource-variable/inter';
import '../styles/tokens.css';
import '../styles/base.css';
import Seo from '../components/Seo.astro';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';

interface Props { title: string; description: string; path: string; noindex?: boolean; jsonLd?: object[] }
const props = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script is:inline>document.documentElement.classList.add('js');</script>
    <Seo {...props} />
    <link rel="sitemap" href="/sitemap-index.xml" />
    <slot name="head" />
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>
    <Nav />
    <main id="main"><slot /></main>
    <Footer />
    <script>import '../scripts/reveal.ts';</script>
  </body>
</html>
```

- [ ] **Step 6: Skeleton pages and the home `#download` anchor**

`src/pages/features.astro` (Task 9 replaces the body and keeps every `id`):
```astro
---
import Base from '../layouts/Base.astro';

const sections = [
  ['daily', 'Daily', 'Voice posts from the people you follow, gone in 24 hours.'],
  ['dms', 'DMs', 'One-on-one voice conversations.'],
  ['groups', 'Groups', 'Named group chats where everyone talks.'],
  ['convos', 'Convos', 'Topic threads everyone answers by voice.'],
  ['channels', 'Channels', 'One-way broadcasts to your subscribers.'],
  ['details', 'The details', 'Reactions, voice replies, who listened, photos and disappearing messages.'],
  ['explore', 'Explore', 'Trending Convos and Channels, Popular Voices and hashtags.'],
  ['profiles', 'Profiles', 'Followers, mutuals and your Cascane Score.'],
];
---
<Base title="Features · Cascane" description="Daily voice posts, DMs, group chats, Convos and Channels, plus reactions, voice replies and disappearing messages. See everything Cascane can do." path="/features">
  <div class="container page-top section">
    <p class="eyebrow">Features</p>
    <h1 class="display" data-reveal>Everything you can say with Cascane.</h1>
    {sections.map(([id, title, text]) => (
      <section id={id} style="margin-top:48px"><h2 class="h3">{title}</h2><p class="lead">{text}</p></section>
    ))}
  </div>
</Base>
```

`src/pages/safety.astro` (Task 6 replaces the body and keeps `id="reporting"`):
```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Safety Center · Cascane" description="How Cascane keeps you in control: block, mute, hide your Daily, private Convos and Channels, reporting, and our child safety standards." path="/safety">
  <div class="container page-top section">
    <p class="eyebrow">Safety Center</p>
    <h1 class="display" data-reveal>Tools to keep Cascane yours.</h1>
    <section id="reporting" style="margin-top:48px">
      <h2 class="h3">How reporting works</h2>
      <p class="lead">Report any message, thread or profile straight from the app.</p>
    </section>
  </div>
</Base>
```

In the ported `src/pages/index.astro`, insert this line immediately before `  <!-- ========== Footer ========== -->` (Task 7 replaces the whole page):
```html
  <div id="download"></div>
```

- [ ] **Step 7: Link-preview image**

`scripts/og/og.html`:
```html
<!doctype html>
<html><head><meta charset="utf-8">
<style>
  @font-face { font-family: 'Inter Variable'; font-weight: 100 900; src: url('../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2') format('woff2'); }
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body { background: #08080A; font-family: 'Inter Variable', sans-serif; color: #fff; position: relative; }
  .glow { position: absolute; width: 900px; height: 900px; right: -260px; top: -220px; background: radial-gradient(closest-side, rgba(0,217,255,.22), rgba(0,217,255,0) 70%); }
  .copy { position: absolute; left: 88px; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; gap: 28px; width: 620px; }
  .brand { display: flex; align-items: center; gap: 16px; font-size: 34px; font-weight: 650; letter-spacing: -0.02em; }
  .brand img { width: 56px; height: 56px; }
  h1 { font-size: 96px; font-weight: 700; letter-spacing: -0.045em; line-height: 1; }
  p { font-size: 28px; color: #A1A1AA; line-height: 1.35; }
  .phone { position: absolute; right: 110px; top: 70px; width: 340px; filter: drop-shadow(0 40px 60px rgba(0,0,0,.6)); }
  .phone img { width: 100%; display: block; }
  .rim { position: absolute; inset: 0; border-radius: 42px; box-shadow: inset 0 0 0 1px rgba(255,255,255,.12), 0 0 80px rgba(0,217,255,.18); }
</style></head>
<body>
  <div class="glow"></div>
  <div class="copy">
    <div class="brand"><img src="../../src/assets/mark.png" alt="">Cascane</div>
    <h1>Social,<br>out loud.</h1>
    <p>Voice messages, Convos and Channels — on iPhone and Android.</p>
  </div>
  <div class="phone"><img src="../../src/assets/screens/chat_page.png" alt=""><div class="rim"></div></div>
</body></html>
```

`scripts/render-og.sh`:
```bash
#!/usr/bin/env bash
# Renders public/og.png (1200x630) from scripts/og/og.html with headless Chrome.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=3000 \
  --screenshot="$ROOT/public/og.png" "file://$ROOT/scripts/og/og.html" 2>/dev/null
python3 -c "from PIL import Image; im=Image.open('$ROOT/public/og.png'); assert im.size==(1200,630), im.size; im.convert('RGB').save('$ROOT/public/og.png', optimize=True); print('og.png', im.size)"
```

Run: `chmod +x scripts/render-og.sh && scripts/render-og.sh`
Expected: `og.png (1200, 630)`. Open `public/og.png` (Read tool): the Cascane mark and name, "Social, out loud.", the subline, and the chat phone on the right with a cyan glow.

- [ ] **Step 8: Run the checks until they pass**

Run: `npm run check`
Expected: every check shows `✓`, including `seo` and `badges`; `ℹ pass 13`.

- [ ] **Step 9: Write the browser suite (tests for nav, layout, motion)**

`scripts/lib/preview-server.mjs`:
```js
import { preview } from 'astro';

/** Serves dist/ with Astro's preview server for the duration of fn(baseUrl), then stops it. */
export async function withPreview(fn, port = 4321) {
  // In-process server (Astro's JS API): stop() reliably shuts it down, unlike
  // the CLI, whose launcher hands the server to a separate process and exits.
  const server = await preview({ root: process.cwd(), server: { port }, logLevel: 'error' });
  try {
    return await fn(`http://localhost:${server.port}`);
  } finally {
    await server.stop();
  }
}
```

`scripts/browser-check.mjs`:
```js
// Drives the built site in headless Chrome. Each scripts/browser/NN-*.mjs exports
// { name, run({ browser, base, screens }) } and throws (node:assert) on failure.
// Usage: npm run build && npm run browser [-- --screens]
import puppeteer from 'puppeteer-core';
import { readdirSync } from 'node:fs';
import { withPreview } from './lib/preview-server.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const dir = new URL('./browser/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort();
const screens = process.argv.includes('--screens');
let failed = 0;
await withPreview(async (base) => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  try {
    for (const f of files) {
      const { name, run } = await import(new URL(f, dir));
      try {
        await run({ browser, base, screens });
        console.log(`✓ ${name}`);
      } catch (e) {
        failed++;
        console.log(`✗ ${name}\n    ${String(e.message).split('\n').join('\n    ')}`);
      }
    }
  } finally {
    await browser.close();
  }
});
if (failed) { console.log(`\n${failed} browser check(s) failed`); process.exit(1); }
console.log('\nall browser checks passed');
```

`scripts/browser/_open.mjs`:
```js
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
```

`scripts/browser/10-layout.mjs`:
```js
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { open } from './_open.mjs';
import { PAGES } from '../checks/pages.mjs';

export const name = 'every new page: no sideways scroll at 320-1600px, no console errors';
const WIDTHS = [320, 375, 768, 1280, 1600];

export async function run({ browser, base, screens }) {
  if (screens) mkdirSync('.artifacts/screens', { recursive: true });
  for (const [file, { path }] of Object.entries(PAGES)) {
    for (const width of WIDTHS) {
      // Screenshots use reduced motion so every [data-reveal] block is visible.
      const { page, errors } = await open(browser, base, path, { width, reducedMotion: screens });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 0, `${path} at ${width}px scrolls sideways by ${overflow}px`);
      // The 404 page's own document response is a 404, which Chrome logs as a resource error.
      const real = errors.filter((e) => !(path === '/404' && e.includes('404')));
      assert.deepEqual(real, [], `${path} at ${width}px logged errors`);
      if (screens) await page.screenshot({ path: `.artifacts/screens/${file.replace('.html', '')}-${width}.png`, fullPage: true });
      await page.close();
    }
  }
}
```

`scripts/browser/20-nav.mjs`:
```js
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
```

`scripts/browser/30-motion.mjs`:
```js
import assert from 'node:assert/strict';
import { open } from './_open.mjs';
import { PAGES } from '../checks/pages.mjs';

export const name = 'content is visible with reduced motion and with JavaScript disabled';

export async function run({ browser, base }) {
  for (const { path } of Object.values(PAGES)) {
    for (const opts of [{ reducedMotion: true }, { javascript: false }]) {
      const { page } = await open(browser, base, path, { height: 5000, ...opts });
      const hidden = await page.$$eval('[data-reveal]', (els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length);
      assert.equal(hidden, 0, `${path} ${JSON.stringify(opts)}: ${hidden} [data-reveal] element(s) not visible`);
      await page.close();
    }
  }
}
```

In `package.json` `scripts`, add `"browser": "node scripts/browser-check.mjs"` and change `check` to `"npm run build && npm run verify && npm test && npm run browser"`.

- [ ] **Step 10: Run the browser suite**

Run: `npm run build && npm run browser`
Expected:
```
✓ every new page: no sideways scroll at 320-1600px, no console errors
✓ nav: mobile menu traps focus and closes on Esc; solid on scroll; Get the app routes by device
✓ content is visible with reduced motion and with JavaScript disabled

all browser checks passed
```
If a check fails, fix the component (not the test) and re-run. Then `lsof -ti tcp:4321` must print nothing (the preview server stopped).

- [ ] **Step 11: Look at the shell**

Run: `npm run browser -- --screens`, then open `.artifacts/screens/features-1280.png` and `features-375.png` (Read tool). Expected: transparent nav with the mark, "Cascane", Features · Safety · Contact and a white "Get the app" pill at 1280; a menu button at 375; the 3-column footer with the trademark line.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(shell): design tokens, base layout, SEO head, nav, mobile menu, footer, store badges

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Document pages: Child Safety, Privacy, Terms

**Files:**
- Create: `src/layouts/DocLayout.astro`, `src/components/Toc.astro`, `src/scripts/toc.ts`, `src/styles/legal.css`, `scripts/browser/35-toc.mjs`
- Replace: `src/pages/child-safety.astro`, `src/pages/privacy.astro`, `src/pages/terms.astro`
- Modify: `scripts/checks/pages.mjs`

**Interfaces:**
- Consumes: `Base` (Task 3).
- Produces: `<DocLayout title description path eyebrow heading? updated? toc?: {id,text}[]>`. The default slot renders inside `article[data-doc-body]`. When `heading` is omitted, no `<h1>` is rendered (the Termly body supplies it).

- [ ] **Step 1: Move the three pages to PAGES (the failing test)**

In `scripts/checks/pages.mjs`, cut these three entries from `LEGACY` and add them to `PAGES`:
```js
  'child-safety.html': { path: '/child-safety', indexed: true },
  'privacy.html': { path: '/privacy', indexed: true },
  'terms.html': { path: '/terms', indexed: true },
```

`scripts/browser/35-toc.mjs`:
```js
import assert from 'node:assert/strict';
import { open } from './_open.mjs';

export const name = 'child safety: table of contents is open on desktop, collapsed on phones, and links work';

export async function run({ browser, base }) {
  const desk = await open(browser, base, '/child-safety', { width: 1280 });
  const links = await desk.page.$$eval('[data-toc] a', (as) => as.map((a) => a.getAttribute('href')));
  assert.deepEqual(links, ['#prohibited', '#reporting', '#next-steps', '#contact']);
  assert.equal(await desk.page.$eval('[data-toc] details', (d) => d.open), true, 'TOC open on desktop');
  await desk.page.click('[data-toc] a[href="#next-steps"]');
  await desk.page.waitForFunction(() => document.querySelector('[data-toc] a[href="#next-steps"]')?.getAttribute('aria-current') === 'location');
  await desk.page.close();
  const phone = await open(browser, base, '/child-safety', { width: 375 });
  assert.equal(await phone.page.$eval('[data-toc] details', (d) => d.open), false, 'TOC collapsed on phones');
  await phone.page.close();
  for (const path of ['/privacy', '/terms']) {
    const { page } = await open(browser, base, path);
    assert.equal(await page.$('[data-toc]'), null, `${path} must not add a second table of contents`);
    await page.close();
  }
}
```

Run: `npm run build && npm run verify; npm run browser`
Expected: FAIL. `seo` reports missing canonicals, skip links and descriptions for the three pages (they're still the old port), and `35-toc` fails with `Cannot read … of null`.

- [ ] **Step 2: DocLayout, Toc, legal styles**

`src/layouts/DocLayout.astro`:
```astro
---
import Base from './Base.astro';
import Toc from '../components/Toc.astro';

interface Props {
  title: string;
  description: string;
  path: string;
  eyebrow: string;
  heading?: string;                       // omitted on legal pages: the Termly body has its own <h1>
  updated?: string;
  toc?: { id: string; text: string }[];
}
const { eyebrow, heading, updated, toc = [], ...seo } = Astro.props;
---
<Base {...seo}>
  <header class="container page-top doc-head">
    <p class="eyebrow">{eyebrow}</p>
    {heading && <h1 class="display-sm">{heading}</h1>}
    {updated && <p class="doc-updated">Last updated {updated}</p>}
  </header>
  <div class:list={['container', 'doc-grid', { 'has-toc': toc.length > 0 }]}>
    {toc.length > 0 && <Toc items={toc} />}
    <article class="doc-body" data-doc-body><slot /></article>
  </div>
</Base>
<style>
  .doc-head { display: grid; gap: 16px; padding-bottom: 40px; }
  .doc-updated { color: var(--text-3); font-size: 0.9375rem; }
  .doc-grid { padding-top: 40px; border-top: 1px solid var(--line); padding-bottom: var(--section); }
  .doc-grid.has-toc { display: grid; grid-template-columns: 220px minmax(0, var(--read)); gap: 64px; align-items: start; }
  .doc-body { max-width: var(--read); min-width: 0; }
  .doc-body :global(h2) { font-size: 1.5rem; font-weight: 650; letter-spacing: -0.02em; line-height: 1.25; margin: 2.5rem 0 0.75rem; scroll-margin-top: calc(var(--nav-h) + 24px); }
  .doc-body > :global(p) { color: var(--text-2); font-size: 1.0625rem; line-height: 1.75; }
  .doc-body > :global(p + p) { margin-top: 1rem; }
  .doc-body :global(a) { color: var(--accent); }
  .doc-body :global(a:hover) { text-decoration: underline; text-underline-offset: 3px; }
  @media (max-width: 1023px) { .doc-grid.has-toc { grid-template-columns: minmax(0, 1fr); gap: 24px; } }
</style>
```

`src/components/Toc.astro`:
```astro
---
interface Props { items: { id: string; text: string }[] }
const { items } = Astro.props;
---
<nav class="toc" aria-label="On this page" data-toc>
  <details open>
    <summary>On this page</summary>
    <ol>
      {items.map((i) => <li><a href={`#${i.id}`} data-toc-link={i.id}>{i.text}</a></li>)}
    </ol>
  </details>
</nav>
<script>import '../scripts/toc.ts';</script>
<style>
  .toc { position: sticky; top: calc(var(--nav-h) + 24px); }
  summary { cursor: pointer; font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-3); list-style: none; padding: 8px 0; }
  summary::-webkit-details-marker { display: none; }
  ol { list-style: none; padding: 0; margin-top: 8px; display: grid; gap: 2px; border-left: 1px solid var(--line); }
  a { display: block; padding: 6px 0 6px 16px; margin-left: -1px; border-left: 1px solid transparent; color: var(--text-2); font-size: 0.9375rem; transition: color 0.2s, border-color 0.2s; }
  a:hover { color: var(--text); }
  a[aria-current='location'] { color: var(--text); border-left-color: var(--accent); }
  @media (min-width: 1024px) { summary { pointer-events: none; } }
  @media (max-width: 1023px) { .toc { position: static; background: var(--surface-1); border-radius: 16px; padding: 8px 16px; box-shadow: inset 0 0 0 1px var(--line); } }
</style>
```

`src/scripts/toc.ts`:
```ts
// Keeps the TOC open on desktop and collapsed on phones, and highlights the
// section being read.
const toc = document.querySelector<HTMLElement>('[data-toc]');
if (toc) {
  const details = toc.querySelector('details');
  const mq = matchMedia('(min-width: 1024px)');
  const sync = () => { if (details) details.open = mq.matches; };
  sync();
  mq.addEventListener('change', sync);

  const links = new Map([...toc.querySelectorAll<HTMLAnchorElement>('[data-toc-link]')].map((a) => [a.dataset.tocLink!, a]));
  const mark = (id: string) => {
    links.forEach((a) => a.removeAttribute('aria-current'));
    links.get(id)?.setAttribute('aria-current', 'location');
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) mark(e.target.id);
  }, { rootMargin: '-20% 0px -70% 0px' });
  links.forEach((a, id) => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
    a.addEventListener('click', () => mark(id));
  });
}
```

`src/styles/legal.css`:
```css
/* Re-skin of the Termly-generated legal bodies (privacy, terms) for the dark theme.
   Termly writes ~1,200 inline style attributes (colour, size, font). Inline
   styles without !important lose to stylesheet rules with !important, so the
   legal HTML itself is never edited. */
.legal [data-custom-class='body'],
.legal [data-custom-class='body'] * {
  background: transparent !important;
  color: var(--text-2) !important;
  font-family: inherit !important;
  font-size: 1rem !important;
  line-height: 1.7 !important;
}
.legal h1, .legal h1 *, .legal [data-custom-class='title'], .legal [data-custom-class='title'] * {
  color: var(--text) !important;
  font-size: clamp(2rem, 4vw, 3rem) !important;
  font-weight: 700 !important;
  letter-spacing: -0.02em;
  line-height: 1.1 !important;
}
.legal [data-custom-class='subtitle'], .legal [data-custom-class='subtitle'] * {
  color: var(--text-3) !important;
  font-size: 0.9375rem !important;
}
.legal h2, .legal h2 *, .legal [data-custom-class='heading_1'], .legal [data-custom-class='heading_1'] * {
  color: var(--text) !important;
  font-size: 1.375rem !important;
  font-weight: 650 !important;
  line-height: 1.3 !important;
}
.legal h3, .legal h3 *, .legal [data-custom-class='heading_2'], .legal [data-custom-class='heading_2'] * {
  color: var(--text) !important;
  font-size: 1.125rem !important;
  font-weight: 600 !important;
}
.legal h2 { margin: 2.5rem 0 0.75rem; scroll-margin-top: calc(var(--nav-h) + 24px); }
.legal h3 { margin: 1.75rem 0 0.5rem; }
.legal [id] { scroll-margin-top: calc(var(--nav-h) + 24px); }
.legal strong, .legal strong * { color: var(--text) !important; }
.legal a, .legal a *, .legal [data-custom-class='link'], .legal [data-custom-class='link'] * {
  color: var(--accent) !important;
  word-break: break-word;
}
.legal a:hover { text-decoration: underline; }
.legal ul { list-style: square; padding-left: 1.5rem; margin: 0.5rem 0; }
.legal ul ul { list-style: circle; }
.legal ol { padding-left: 1.5rem; }
.legal li { margin: 0.25rem 0; }
.legal table { width: 100%; border-collapse: collapse; margin: 1rem 0; display: block; overflow-x: auto; }
.legal th, .legal td { border: 1px solid var(--line) !important; padding: 0.625rem 0.75rem; vertical-align: top; }
.legal th, .legal th * { color: var(--text) !important; }
```

- [ ] **Step 3: The three pages**

`src/pages/child-safety.astro` (the text is word-for-word from `e9f8589`; only the link targets changed, from `privacy.html` to `/privacy`):
```astro
---
import DocLayout from '../layouts/DocLayout.astro';

const toc = [
  { id: 'prohibited', text: "What's prohibited" },
  { id: 'reporting', text: 'How to report it' },
  { id: 'next-steps', text: 'What happens next' },
  { id: 'contact', text: 'Point of contact' },
];
---
<DocLayout
  title="Child Safety Standards · Cascane"
  description="Cascane's published standards against child sexual abuse and exploitation (CSAE), how to report it, and what happens next."
  path="/child-safety"
  eyebrow="Safety"
  heading="Child Safety Standards"
  updated="August 21, 2026"
  toc={toc}
>
  <p>Cascane has zero tolerance for child sexual abuse and exploitation (CSAE), including child sexual abuse material (CSAM), anywhere on our platform. This applies to every account, every message, and every piece of content on Cascane, without exception.</p>

  <h2 id="prohibited">What's prohibited</h2>
  <p>Users may not upload, share, request, solicit, or link to CSAE or CSAM in any form on Cascane. This includes content involving real or apparently real minors, as well as attempts to groom, sexualize, or endanger a minor through the app. Accounts used for these purposes are removed, regardless of where the account holder is located or the age they claim to be.</p>

  <h2 id="reporting">How to report it</h2>
  <p>If you encounter CSAE or CSAM on Cascane, report it directly from the app using the report option on the message, thread, or profile in question. You can also email us directly at <a href="mailto:support@cascane.app?subject=Child%20Safety%20Report">support@cascane.app</a> with as much detail as you can provide. You do not need an account to report a concern this way.</p>

  <h2 id="next-steps">What happens next</h2>
  <p>We review CSAE reports as a priority. Where a report is substantiated, we remove the content, permanently ban the account, and report the incident to the National Center for Missing &amp; Exploited Children (NCMEC) as required by law.</p>

  <h2 id="contact">Point of contact</h2>
  <p>Our child safety point of contact is <a href="mailto:support@cascane.app?subject=Child%20Safety">support@cascane.app</a>.</p>

  <p>See our <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms of Service</a> for more on how we handle content and accounts on Cascane.</p>
</DocLayout>
```

`src/pages/privacy.astro`:
```astro
---
import DocLayout from '../layouts/DocLayout.astro';
import body from '../content/legal/privacy.html?raw';
import '../styles/legal.css';
---
<DocLayout
  title="Privacy Policy · Cascane"
  description="Privacy policy for Cascane, the voice-first social messaging app by Cascane LLC: what we collect, how we use it, and your choices."
  path="/privacy"
  eyebrow="Legal"
>
  <div class="legal"><Fragment set:html={body} /></div>
</DocLayout>
```

`src/pages/terms.astro`:
```astro
---
import DocLayout from '../layouts/DocLayout.astro';
import body from '../content/legal/terms.html?raw';
import '../styles/legal.css';
---
<DocLayout
  title="Terms of Service · Cascane"
  description="The Terms of Service for Cascane, the voice-first social messaging app by Cascane LLC, covering your use of the app and its services."
  path="/terms"
  eyebrow="Legal"
>
  <div class="legal"><Fragment set:html={body} /></div>
</DocLayout>
```

- [ ] **Step 4: Run all checks**

Run: `npm run check`
Expected: every `verify` check `✓` (including `legalText`: the legal text is unchanged), unit tests pass, and all browser checks `✓` (4 now).

- [ ] **Step 5: Look at the pages**

Run: `npm run browser -- --screens`, then open `.artifacts/screens/privacy-1280.png` (the top 2,000px), `terms-375.png` and `child-safety-1280.png`. Expected:
- Privacy: dark background, white "PRIVACY POLICY", a grey "Last updated July 28, 2026", grey body text and cyan links, with no white box.
- Child safety: the sticky "On this page" column on the left.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(docs): dark document layout for child safety, privacy and terms (text unchanged)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Contact, Delete account, Request received, 404

**Files:**
- Replace: `src/pages/contact.astro`, `src/pages/delete-account.astro`, `src/pages/delete-account-received.astro`
- Create: `src/pages/404.astro`, `scripts/browser/40-form.mjs`
- Modify: `scripts/checks/pages.mjs`

**Interfaces:**
- Consumes: `Base`, `Icon` (Task 3); the global classes from `base.css`.

- [ ] **Step 1: The failing tests**

In `scripts/checks/pages.mjs`, move `contact.html`, `delete-account.html` and `delete-account-received.html` from `LEGACY` to `PAGES`, and add:
```js
  '404.html': { path: '/404', indexed: false },
```

`scripts/browser/40-form.mjs`:
```js
import assert from 'node:assert/strict';
import { open } from './_open.mjs';

export const name = 'delete-account form: the browser blocks empty and malformed emails';

export async function run({ browser, base }) {
  const { page } = await open(browser, base, '/delete-account');
  const url = page.url();
  await page.click('form[name="delete-account"] button[type="submit"]');
  assert.equal(page.url(), url, 'an empty form must not submit');
  assert.equal(await page.$eval('#email', (el) => el.validity.valueMissing), true);
  await page.type('#email', 'not-an-email');
  await page.click('form[name="delete-account"] button[type="submit"]');
  assert.equal(page.url(), url, 'a malformed email must not submit');
  assert.equal(await page.$eval('#email', (el) => el.validity.typeMismatch), true);
  assert.equal(await page.$eval('input[name="bot-field"]', (el) => el.offsetParent === null), true, 'honeypot must be invisible');
  await page.close();
}
```

Run: `npm run build && npm run verify`
Expected: FAIL. `seo` reports `404.html: listed but not built`, and skip-link/canonical errors for the three old-port pages.

- [ ] **Step 2: Contact page**

`src/pages/contact.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import Icon from '../components/Icon.astro';
import { SUPPORT_EMAIL } from '../lib/site.ts';

const cards = [
  { icon: 'mail', title: 'Support', text: 'Questions about your account, the app, or anything else.', subject: 'Support' },
  { icon: 'shield-check', title: 'Safety reports', text: 'Report abuse, harassment, or anything that breaks our rules. Include as much detail as you can.', subject: 'Safety Report' },
];
---
<Base title="Contact · Cascane" description="Get in touch with Cascane LLC, the team behind Cascane, a voice-first social messaging app. Support and safety reports: support@cascane.app." path="/contact">
  <section class="container page-top head">
    <p class="eyebrow" data-reveal>Contact</p>
    <h1 class="display-sm" data-reveal style="--i:1">We'd love to hear from you.</h1>
    <p class="lead" data-reveal style="--i:2">Have questions or want to learn more about Cascane? Reach out and we'll get back to you.</p>
  </section>
  <section class="container section grid-wrap">
    <ul class="grid">
      {cards.map((c, i) => (
        <li class="card contact" data-reveal style={`--i:${i}`}>
          <span class="icon-tile"><Icon name={c.icon} size={22} /></span>
          <h2 class="h3">{c.title}</h2>
          <p>{c.text}</p>
          <a class="link email" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(c.subject)}`}>{SUPPORT_EMAIL}</a>
        </li>
      ))}
      <li class="card contact" data-reveal style="--i:2">
        <span class="icon-tile"><Icon name="map-pin" size={22} /></span>
        <h2 class="h3">Mail</h2>
        <address>Cascane LLC<br />522 W Riverside Ave Ste N<br />Spokane, WA 99201<br />United States</address>
      </li>
    </ul>
    <p class="note muted">For urgent child-safety concerns, see our <a class="link" href="/child-safety">Child Safety Standards</a>.</p>
  </section>
</Base>
<style>
  .head { display: grid; gap: 20px; max-width: 760px; }
  .grid-wrap { padding-top: 64px; }
  .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .contact { padding: 28px; display: grid; gap: 12px; align-content: start; }
  .contact p, address { color: var(--text-2); font-style: normal; }
  .email { font-weight: 600; margin-top: 4px; }
  .icon-tile { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; color: var(--accent); background: rgba(0, 217, 255, 0.08); box-shadow: inset 0 0 0 1px rgba(0, 217, 255, 0.2); margin-bottom: 4px; }
  .note { margin-top: 32px; }
  @media (max-width: 899px) { .grid { grid-template-columns: minmax(0, 1fr); } }
</style>
```

- [ ] **Step 3: Delete account page**

`src/pages/delete-account.astro` (the form markup must keep every attribute in the Global Constraints):
```astro
---
import Base from '../layouts/Base.astro';
import Icon from '../components/Icon.astro';

const deleted = ['Your profile', "Every message and voice recording you've sent", "Every thread and DM you're part of", 'Any photos or avatar you\'ve uploaded'];
---
<Base title="Delete your account · Cascane" description="Request deletion of your Cascane account and data, in the app or from the web, with no sign-in or app download required." path="/delete-account">
  <section class="container page-top head">
    <p class="eyebrow">Account</p>
    <h1 class="display-sm">Delete your account</h1>
    <p class="lead">You can delete your Cascane account at any time. This deletes your profile, every message and voice recording you've sent, every thread and DM you're part of, and any photos or avatar you've uploaded — immediately and permanently. This page works without signing in or having the app installed.</p>
  </section>

  <section class="container section body">
    <div class="card deleted">
      <h2 class="h3">What gets deleted</h2>
      <ul>{deleted.map((d) => <li><Icon name="trash-2" size={18} />{d}</li>)}</ul>
    </div>

    <div class="paths">
      <article class="card path">
        <p class="tag">Fastest</p>
        <h2 class="h3">In the app</h2>
        <p>If you have the app installed, the fastest way to delete your account is inside it:</p>
        <ol class="steps">
          <li>Open <strong>Settings</strong></li>
          <li>Tap <strong>Security</strong></li>
          <li>Tap <strong>Delete account</strong></li>
        </ol>
        <p class="muted">This removes your account immediately.</p>
      </article>

      <article class="card path">
        <h2 class="h3">From the web</h2>
        <p>If you don't have the app, submit a deletion request below and our support team will verify your request and process it for you — typically within 30 days. Once processed, deletion is immediate and permanent.</p>
        <form
          name="delete-account"
          method="POST"
          data-netlify="true"
          netlify-honeypot="bot-field"
          action="/delete-account-received"
          class="form"
        >
          <input type="hidden" name="form-name" value="delete-account" />
          <input type="hidden" name="subject" value="Account Deletion Request" />
          <p hidden><label>Don't fill this out: <input name="bot-field" /></label></p>
          <div class="field">
            <label for="email">Account email <span aria-hidden="true" class="req">*</span></label>
            <input type="email" id="email" name="email" required autocomplete="email" placeholder="you@example.com" />
          </div>
          <div class="field">
            <label for="username">Username on Cascane <span class="opt">(optional)</span></label>
            <input type="text" id="username" name="username" autocomplete="username" placeholder="@username" />
          </div>
          <div class="field">
            <label for="message">Anything else we should know? <span class="opt">(optional)</span></label>
            <textarea id="message" name="message" rows="4"></textarea>
          </div>
          <button type="submit" class="btn btn-primary submit">Request account deletion</button>
        </form>
      </article>
    </div>

    <p class="fine">You can also email us directly at <a class="link" href="mailto:support@cascane.app?subject=Account%20Deletion%20Request">support@cascane.app</a> with the email address on your account, and we'll take it from there. See our <a class="link" href="/privacy">Privacy Policy</a> for more on how we handle your data.</p>
  </section>
</Base>
<style>
  .head { display: grid; gap: 20px; max-width: 820px; }
  .body { padding-top: 64px; display: grid; gap: 16px; }
  .deleted { padding: 28px; display: grid; gap: 16px; }
  .deleted ul { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; }
  .deleted li { display: flex; gap: 10px; align-items: center; color: var(--text-2); }
  .deleted :global(.icon) { color: var(--text-3); flex: none; }
  .paths { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: 16px; align-items: start; }
  .path { padding: 28px; display: grid; gap: 14px; }
  .path > p { color: var(--text-2); }
  .tag { justify-self: start; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; color: var(--accent); background: rgba(0, 217, 255, 0.08); box-shadow: inset 0 0 0 1px rgba(0, 217, 255, 0.25); border-radius: var(--r-pill); padding: 4px 10px; }
  .steps { list-style: none; padding: 0; counter-reset: s; display: grid; gap: 10px; }
  .steps li { counter-increment: s; display: flex; align-items: center; gap: 12px; color: var(--text-2); }
  .steps li::before { content: counter(s); width: 28px; height: 28px; flex: none; display: grid; place-items: center; border-radius: 50%; background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--line-strong); color: var(--text); font-size: 0.8125rem; font-weight: 600; }
  .steps strong { color: var(--text); font-weight: 600; }
  .form { display: grid; gap: 18px; margin-top: 8px; }
  .field { display: grid; gap: 8px; }
  label { font-size: 0.875rem; color: var(--text-2); }
  .req { color: var(--accent); }
  .opt { color: var(--text-3); }
  input, textarea { font: inherit; color: var(--text); background: var(--surface-2); border: 0; border-radius: 12px; padding: 12px 14px; box-shadow: inset 0 0 0 1px var(--line-strong); transition: box-shadow 0.2s; resize: vertical; width: 100%; }
  input::placeholder, textarea::placeholder { color: var(--text-3); }
  input:focus, textarea:focus { outline: none; box-shadow: inset 0 0 0 1px var(--accent), 0 0 0 4px rgba(0, 217, 255, 0.15); }
  .submit { width: 100%; margin-top: 4px; }
  .fine { color: var(--text-3); max-width: 760px; margin-top: 16px; }
  @media (max-width: 899px) { .paths { grid-template-columns: minmax(0, 1fr); } .deleted ul { grid-template-columns: minmax(0, 1fr); } }
</style>
```

- [ ] **Step 4: Request received and 404**

`src/pages/delete-account-received.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import Icon from '../components/Icon.astro';
---
<Base title="Request received · Cascane" description="Your Cascane account deletion request has been received. Our support team will verify it and delete your account within 30 days." path="/delete-account-received" noindex>
  <section class="container page-top section wrap">
    <div class="card box">
      <span class="check"><Icon name="check" size={28} /></span>
      <h1 class="h2">Request received</h1>
      <p class="lead">We've received your account deletion request. Our support team will verify it and permanently delete your account and the content you created within 30 days.</p>
      <p class="muted">Questions in the meantime? Email <a class="link" href="mailto:support@cascane.app">support@cascane.app</a>.</p>
      <a class="btn btn-primary" href="/">Back to Cascane</a>
    </div>
  </section>
</Base>
<style>
  .wrap { display: grid; place-items: center; }
  .box { max-width: 560px; padding: clamp(28px, 5vw, 48px); display: grid; gap: 18px; justify-items: center; text-align: center; }
  .check { width: 64px; height: 64px; display: grid; place-items: center; border-radius: 50%; color: var(--accent); background: rgba(0, 217, 255, 0.08); box-shadow: inset 0 0 0 2px rgba(0, 217, 255, 0.5), 0 0 40px rgba(0, 217, 255, 0.2); }
</style>
```

`src/pages/404.astro`:
```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Page not found · Cascane" description="This page doesn't exist on cascane.app. Head back to the Cascane homepage, or contact us if something looks broken." path="/404" noindex>
  <section class="container page-top section nf">
    <svg class="flatline" viewBox="0 0 600 80" aria-hidden="true">
      <path d="M0 40 H250 L262 22 L274 58 L286 40 H600" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <p class="eyebrow">404</p>
    <h1 class="display">Lost signal.</h1>
    <p class="lead">We couldn't find that page. It may have moved, or the link might be wrong.</p>
    <div class="actions">
      <a class="btn btn-primary" href="/">Go home</a>
      <a class="btn btn-secondary" href="/contact">Contact us</a>
    </div>
  </section>
</Base>
<style>
  .nf { display: grid; gap: 20px; justify-items: center; text-align: center; }
  .flatline { width: min(600px, 100%); color: var(--accent); stroke-dasharray: 700; stroke-dashoffset: 700; animation: draw 1.6s var(--ease) forwards; filter: drop-shadow(0 0 8px rgba(0, 217, 255, 0.5)); }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  .actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 8px; }
</style>
```

- [ ] **Step 5: Run all checks**

Run: `npm run check`
Expected: all `✓`. The `deleteForm` check still passes and `40-form` passes.

- [ ] **Step 6: Look at the pages**

Run: `npm run browser -- --screens`, then open `delete-account-1280.png`, `delete-account-375.png`, `contact-1280.png`, `404-1280.png` in `.artifacts/screens/`. Expected: two side-by-side cards on desktop (stacked on phone), the form with dark inputs and a white submit pill, and the cyan flatline on the 404 page.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(pages): contact, delete account, request received and 404 on the new design

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Safety Center

Every claim on this page was checked against the app's database migrations on 2026-09-29 (see spec §5.4): block is two-way and removes follows; mute hides new messages and is invisible to the muted person; "Hide your Daily" hides *your* posts from one person; private Convos/Channels are shown only to the creator's followers and never in Explore; the six report categories and the "also block?" follow-up come from `report_sheet.dart`.

**Files:**
- Replace: `src/pages/safety.astro`

**Interfaces:**
- Consumes: `Base`, `Icon`. Must keep `id="reporting"` (linked from the home page in Task 7).

- [ ] **Step 1: The failing test**

Add to `scripts/checks/seo.mjs`, inside the `for (const [file, …] of Object.entries(PAGES))` loop, after the `img` alt check:
```js
    if (file === 'safety.html') {
      const text = doc.body.textContent;
      for (const phrase of ['Spam or scam', 'Harassment or bullying', 'Hate speech or symbols', 'Violence or threats', 'Inappropriate content', 'Something else']) {
        if (!text.includes(phrase)) errors.push(`safety.html: report category "${phrase}" missing`);
      }
      if (!doc.getElementById('tools')) errors.push('safety.html: #tools section missing');
    }
```

Run: `npm run build && npm run verify`
Expected: FAIL, listing the six categories and `#tools`.

- [ ] **Step 2: The page**

`src/pages/safety.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import Icon from '../components/Icon.astro';

const principles = [
  { title: 'You choose who hears you', text: 'Block, mute, and hide your Daily from anyone, whenever you want.' },
  { title: 'Bad actors are removed', text: 'Reports are reviewed by our team, and accounts that break our rules are removed.' },
  { title: 'Your data is yours', text: "Delete your account and everything you've sent, whenever you want." },
];
const tools = [
  { icon: 'shield-ban', title: 'Block', text: "Blocking someone stops you both from seeing each other's content, and removes any follows between you." },
  { icon: 'volume-x', title: 'Mute', text: "Stop seeing new messages from someone. They can't tell you've muted them, and unmuting brings their messages back." },
  { icon: 'eye-off', title: 'Hide your Daily', text: "Keep your Daily posts from a specific person. They'll never know." },
  { icon: 'lock', title: 'Private Convos & Channels', text: 'Make a Convo or Channel private and it is only shown to people who follow you. It never appears in Explore.' },
  { icon: 'timer', title: 'Disappearing messages', text: 'Set any message to disappear after 1 to 24 hours, or keep it forever. Daily posts always disappear after 24 hours.' },
  { icon: 'trash-2', title: 'Delete your account', text: "Delete your account and everything you've sent, in the app or from the web.", href: '/delete-account' },
];
const categories = ['Spam or scam', 'Harassment or bullying', 'Hate speech or symbols', 'Violence or threats', 'Inappropriate content', 'Something else'];
---
<Base title="Safety Center · Cascane" description="How Cascane keeps you in control: block, mute, hide your Daily, private Convos and Channels, reporting, and our child safety standards." path="/safety">
  <section class="container page-top hero">
    <p class="eyebrow" data-reveal>Safety Center</p>
    <h1 class="display" data-reveal style="--i:1">Tools to keep Cascane yours.</h1>
    <p class="lead" data-reveal style="--i:2">Cascane is built around real voices, so we built real controls around them. Here's everything you can do to decide who hears you, and what happens when someone crosses the line.</p>
  </section>

  <section class="container section principles-wrap">
    <ol class="principles">
      {principles.map((p, i) => (
        <li data-reveal style={`--i:${i}`}>
          <span class="num">0{i + 1}</span>
          <h2 class="h3">{p.title}</h2>
          <p>{p.text}</p>
        </li>
      ))}
    </ol>
  </section>

  <section class="container section" id="tools">
    <p class="eyebrow" data-reveal>Your controls</p>
    <h2 class="h2" data-reveal style="--i:1">Everything you can do in the app.</h2>
    <ul class="tools">
      {tools.map((t, i) => (
        <li class="card tool" data-reveal style={`--i:${i % 3}`}>
          <span class="icon-tile"><Icon name={t.icon} size={22} /></span>
          <h3 class="h3">{t.title}</h3>
          <p>{t.text}</p>
          {t.href && <a class="link more" href={t.href}>How to delete your account <Icon name="arrow-right" size={16} /></a>}
        </li>
      ))}
    </ul>
  </section>

  <section class="container section" id="reporting">
    <div class="split">
      <div class="copy">
        <p class="eyebrow" data-reveal>Reporting</p>
        <h2 class="h2" data-reveal style="--i:1">How reporting works</h2>
        <p class="lead" data-reveal style="--i:2">Report any message, thread or profile straight from the app using its report option, then pick the category that fits best. When you report a profile, you can block it in the same step.</p>
        <p class="lead" data-reveal style="--i:3">We review every report, and child safety reports are handled as a priority.</p>
      </div>
      <ul class="card cats" data-reveal>
        {categories.map((c) => <li><Icon name="flag" size={16} />{c}</li>)}
      </ul>
    </div>
  </section>

  <section class="container section">
    <div class="card child" data-reveal>
      <div>
        <h2 class="h3">Zero tolerance for child exploitation</h2>
        <p>Cascane prohibits child sexual abuse and exploitation in any form. Substantiated reports lead to content removal, a permanent ban, and a report to NCMEC.</p>
      </div>
      <a class="btn btn-secondary" href="/child-safety">Read our Child Safety Standards</a>
    </div>
    <p class="fine muted">More: <a class="link" href="/privacy">Privacy Policy</a> · <a class="link" href="/terms">Terms of Service</a> · <a class="link" href="mailto:support@cascane.app?subject=Safety">support@cascane.app</a></p>
  </section>
</Base>
<style>
  .hero { display: grid; gap: 20px; max-width: 880px; }
  .principles-wrap { padding-bottom: 0; }
  .principles { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px; border-top: 1px solid var(--line); padding-top: 40px; }
  .principles li { display: grid; gap: 10px; align-content: start; }
  .principles p { color: var(--text-2); }
  .num { font-size: 0.8125rem; font-weight: 600; color: var(--accent); font-variant-numeric: tabular-nums; }
  #tools .h2 { margin: 16px 0 48px; max-width: 720px; }
  .tools { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .tool { padding: 28px; display: grid; gap: 10px; align-content: start; }
  .tool p { color: var(--text-2); }
  .icon-tile { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; color: var(--accent); background: rgba(0, 217, 255, 0.08); box-shadow: inset 0 0 0 1px rgba(0, 217, 255, 0.2); margin-bottom: 6px; }
  .more { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; margin-top: 4px; }
  .split { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: clamp(32px, 6vw, 80px); align-items: center; }
  .copy { display: grid; gap: 20px; }
  .cats { list-style: none; padding: 12px; display: grid; }
  .cats li { display: flex; gap: 12px; align-items: center; padding: 14px 16px; border-radius: 12px; color: var(--text); }
  .cats li + li { box-shadow: 0 -1px 0 var(--line); }
  .cats :global(.icon) { color: var(--text-3); }
  .child { padding: clamp(28px, 4vw, 40px); display: flex; gap: 24px; align-items: center; justify-content: space-between; flex-wrap: wrap; background: linear-gradient(135deg, rgba(0, 217, 255, 0.08), rgba(0, 217, 255, 0) 60%), var(--surface-1); }
  .child > div { display: grid; gap: 8px; max-width: 640px; }
  .child p { color: var(--text-2); }
  .fine { margin-top: 24px; }
  @media (max-width: 999px) { .tools { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 899px) { .principles, .split { grid-template-columns: minmax(0, 1fr); } }
  @media (max-width: 639px) { .tools { grid-template-columns: minmax(0, 1fr); } }
</style>
```

- [ ] **Step 3: Run all checks**

Run: `npm run check`
Expected: all `✓`.

- [ ] **Step 4: Look at it**

Run: `npm run browser -- --screens` and open `.artifacts/screens/safety-1280.png` and `safety-375.png`. Expected: three numbered principles, a 3-column tool grid, the reporting split with the six categories, and the child-safety card.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(safety): Safety Center with verified tool semantics and reporting categories

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Home page, part 1: hero, why voice, feature rows, download band, structured data

**Files:**
- Create: `src/components/Phone.astro`, `src/components/FeatureRow.astro`, `src/components/Waveform.astro`, `src/components/DownloadBand.astro`, `src/scripts/tilt.ts`, `scripts/checks/structured-data.mjs`
- Replace: `src/pages/index.astro`
- Modify: `scripts/checks/pages.mjs`, `scripts/checks/seo.mjs`, `scripts/checks/index.mjs`
- Delete: `public/css/style.css` (no page uses the old stylesheet after this task)

**Interfaces:**
- Consumes: `Base`, `Icon`, `Mark`, `StoreBadges` (Task 3); `SITE_URL`, `APP_STORE_URL`, `PLAY_STORE_URL`, `SUPPORT_EMAIL`.
- Produces:
  - `<Phone src: ImageMetadata alt width?=320 eager? float? tilt?>`
  - `<FeatureRow id? eyebrow title body points: string[] image?: ImageMetadata alt? flip?>`, with a named slot `media` used when `image` is omitted
  - `<Waveform bars?=28 seed?=7 animated? class?>`: bars follow `currentColor`; height comes from `--wave-h` (default 24px)
  - `<DownloadBand id? heading text?>`

- [ ] **Step 1: The failing tests**

In `scripts/checks/pages.mjs`, move `index.html` from `LEGACY` to `PAGES` (after this, `LEGACY` is `{}`).

At the top of the `seo` function in `scripts/checks/seo.mjs`, after `const errors = [];`, add:
```js
  if (Object.keys(LEGACY).length) errors.push(`pages still on the old design: ${Object.keys(LEGACY).join(', ')}`);
  if (ctx.exists('css/style.css')) errors.push('old stylesheet css/style.css is still published');
```

`scripts/checks/structured-data.mjs`:
```js
const APPLE = 'https://apps.apple.com/app/cascane/id6802686539';
const GOOGLE = 'https://play.google.com/store/apps/details?id=app.cascane.mobile&hl=en';

export default function structuredData(ctx) {
  const errors = [];
  if (!ctx.exists('index.html')) return ['index.html missing'];
  const blocks = [...ctx.doc('index.html').querySelectorAll('script[type="application/ld+json"]')]
    .map((s) => { try { return JSON.parse(s.textContent); } catch (e) { errors.push(`index.html: invalid JSON-LD (${e.message})`); return null; } })
    .filter(Boolean);
  const byType = Object.fromEntries(blocks.map((b) => [b['@type'], b]));
  if (byType.WebSite?.name !== 'Cascane' || byType.WebSite?.url !== 'https://www.cascane.app/') errors.push('WebSite JSON-LD must have name "Cascane" and url "https://www.cascane.app/"');
  if (!byType.Organization?.logo) errors.push('Organization JSON-LD needs a logo');
  const app = byType.MobileApplication;
  if (!app) errors.push('MobileApplication JSON-LD missing');
  else {
    if (app.aggregateRating) errors.push('MobileApplication must not claim an aggregateRating');
    if (!app.installUrl?.includes(APPLE) || !app.installUrl?.includes(GOOGLE)) errors.push('MobileApplication installUrl must list both stores');
  }
  for (const f of ctx.htmlFiles()) {
    if (f !== 'index.html' && ctx.doc(f).querySelector('script[type="application/ld+json"]')) errors.push(`${f}: JSON-LD belongs on the home page only`);
  }
  return errors;
}
```

Register it in `scripts/checks/index.mjs`: add `import structuredData from './structured-data.mjs';` and add `structuredData` to the exported object.

Run: `npm run build && npm run verify`
Expected: FAIL with `old stylesheet css/style.css is still published`, JSON-LD errors, and `index.html` SEO errors.

- [ ] **Step 2: Components**

`src/components/Waveform.astro`:
```astro
---
interface Props { bars?: number; seed?: number; animated?: boolean; class?: string }
const { bars = 28, seed = 7, animated = false, class: cls } = Astro.props;
// Deterministic pseudo-random heights so the build output is stable.
const heights = Array.from({ length: bars }, (_, i) => {
  const x = Math.sin((i + 1) * seed * 12.9898) * 43758.5453;
  return 0.25 + 0.75 * (x - Math.floor(x));
});
---
<span class:list={['wave', { animated }, cls]} aria-hidden="true">
  {heights.map((h, i) => <span style={`--h:${h.toFixed(2)};--d:${(i % 7) * 90}ms`} />)}
</span>
<style>
  .wave { display: inline-flex; align-items: center; gap: 2px; height: var(--wave-h, 24px); }
  .wave span { width: 3px; height: calc(var(--h) * 100%); border-radius: 2px; background: currentColor; }
  .animated span { animation: wave 1.4s ease-in-out var(--d) infinite alternate; }
  @keyframes wave { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }
</style>
```

`src/components/Phone.astro`:
```astro
---
import { Picture } from 'astro:assets';
import type { ImageMetadata } from 'astro';

interface Props {
  src: ImageMetadata;   // a cropped panel from src/assets/screens (991x2092)
  alt: string;
  width?: number;       // rendered width in CSS px on desktop
  eager?: boolean;      // the hero phone is the page's largest image
  float?: boolean;
  tilt?: boolean;
}
const { src, alt, width = 320, eager = false, float = false, tilt = false } = Astro.props;
---
<figure class="phone" style={`--w:${width}px`} data-tilt={tilt ? '' : undefined}>
  <div class="glow" aria-hidden="true"></div>
  <div class:list={['body', { float }]}>
    <Picture
      src={src}
      alt={alt}
      formats={['avif', 'webp']}
      widths={[360, 540, 720, 991]}
      sizes={`(max-width: 640px) 72vw, ${width}px`}
      loading={eager ? 'eager' : 'lazy'}
      fetchpriority={eager ? 'high' : undefined}
    />
    <div class="rim" aria-hidden="true"></div>
  </div>
</figure>
<script>import '../scripts/tilt.ts';</script>
<style>
  .phone { position: relative; isolation: isolate; width: min(var(--w), 72vw); margin: 0 auto; transform: perspective(1400px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); transition: transform 0.5s var(--ease); }
  .glow { position: absolute; inset: -18% -40%; z-index: -1; pointer-events: none; background: radial-gradient(closest-side, rgba(0, 217, 255, 0.16), rgba(0, 217, 255, 0) 72%); }
  .body { position: relative; border-radius: 12.3% / 5.83%; box-shadow: 0 60px 120px -30px rgba(0, 0, 0, 0.9); }
  .body :global(img) { width: 100%; height: auto; border-radius: inherit; }
  .rim { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.22); }
  .float { animation: float 6s ease-in-out infinite; }
  @keyframes float { 0%, 100% { transform: translateY(-6px); } 50% { transform: translateY(6px); } }
</style>
```

`src/scripts/tilt.ts`:
```ts
// Subtle pointer-follow tilt (max 4 degrees) for [data-tilt], fine pointers only.
const els = [...document.querySelectorAll<HTMLElement>('[data-tilt]')];
const ok = matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
if (els.length && ok) {
  let raf = 0;
  addEventListener('pointermove', (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const x = e.clientX / innerWidth - 0.5;
      const y = e.clientY / innerHeight - 0.5;
      for (const el of els) {
        el.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
      }
    });
  }, { passive: true });
}
```

`src/components/FeatureRow.astro`:
```astro
---
import type { ImageMetadata } from 'astro';
import Phone from './Phone.astro';
import Icon from './Icon.astro';

interface Props { id?: string; eyebrow: string; title: string; body: string; points: string[]; image?: ImageMetadata; alt?: string; flip?: boolean }
const { id, eyebrow, title, body, points, image, alt = '', flip = false } = Astro.props;
---
<section class="section feature" id={id}>
  <div class:list={['container', 'grid', { flip }]}>
    <div class="copy">
      <p class="eyebrow" data-reveal>{eyebrow}</p>
      <h2 class="h2" data-reveal style="--i:1">{title}</h2>
      <p class="lead" data-reveal style="--i:2">{body}</p>
      <ul class="points" data-reveal style="--i:3">
        {points.map((p) => <li><Icon name="check" size={18} /><span>{p}</span></li>)}
      </ul>
    </div>
    <div class="media" data-reveal>
      {image ? <Phone src={image} alt={alt} width={320} /> : <slot name="media" />}
    </div>
  </div>
</section>
<style>
  .grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(48px, 7vw, 96px); align-items: center; }
  .flip .copy { order: 2; }
  .copy { display: grid; gap: 20px; max-width: 520px; }
  .points { list-style: none; padding: 0; display: grid; gap: 12px; margin-top: 8px; }
  .points li { display: flex; gap: 12px; align-items: flex-start; color: var(--text-2); }
  .points :global(.icon) { color: var(--accent); flex: none; margin-top: 3px; }
  @media (max-width: 899px) {
    .grid { grid-template-columns: minmax(0, 1fr); }
    .flip .copy { order: 0; }
    .copy { max-width: none; }
  }
</style>
```

`src/components/DownloadBand.astro`:
```astro
---
import Mark from './Mark.astro';
import StoreBadges from './StoreBadges.astro';

interface Props { id?: string; heading: string; text?: string }
const { id, heading, text } = Astro.props;
---
<section class="section band" id={id}>
  <div class="container inner">
    <div class="mark"><Mark size={96} /></div>
    <h2 class="h2" data-reveal>{heading}</h2>
    {text && <p class="lead" data-reveal style="--i:1">{text}</p>}
    <StoreBadges />
  </div>
</section>
<style>
  .band { position: relative; overflow: hidden; }
  .band::before { content: ''; position: absolute; left: 50%; top: 45%; width: 900px; height: 600px; transform: translate(-50%, -50%); background: radial-gradient(closest-side, rgba(0, 217, 255, 0.12), rgba(0, 217, 255, 0) 70%); pointer-events: none; }
  .inner { position: relative; display: grid; justify-items: center; text-align: center; gap: 20px; }
  .mark :global(img) { border-radius: 22px; box-shadow: 0 0 60px rgba(0, 217, 255, 0.35); }
  .inner .h2 { max-width: 760px; }
</style>
```

- [ ] **Step 3: The home page**

`src/pages/index.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import Phone from '../components/Phone.astro';
import FeatureRow from '../components/FeatureRow.astro';
import Waveform from '../components/Waveform.astro';
import StoreBadges from '../components/StoreBadges.astro';
import DownloadBand from '../components/DownloadBand.astro';
import Icon from '../components/Icon.astro';
import chat from '../assets/screens/chat_page.png';
import convos from '../assets/screens/convos_page.png';
import inbox from '../assets/screens/inbox_page.png';
import channel from '../assets/screens/channel_info_page.png';
import profile from '../assets/screens/profile_page.png';
import { SITE_URL, APP_STORE_URL, PLAY_STORE_URL, SUPPORT_EMAIL } from '../lib/site.ts';

const jsonLd = [
  { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Cascane', url: `${SITE_URL}/` },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Cascane LLC',
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/icon-512.png`,
    email: SUPPORT_EMAIL,
    address: { '@type': 'PostalAddress', streetAddress: '522 W Riverside Ave Ste N', addressLocality: 'Spokane', addressRegion: 'WA', postalCode: '99201', addressCountry: 'US' },
    sameAs: [APP_STORE_URL, PLAY_STORE_URL],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'Cascane',
    operatingSystem: 'iOS, Android',
    applicationCategory: 'SocialNetworkingApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    installUrl: [APP_STORE_URL, PLAY_STORE_URL],
    publisher: { '@type': 'Organization', name: 'Cascane LLC' },
  },
];

const safety = [
  { icon: 'shield-check', title: "You're in control", text: 'Block, mute, and hide your Daily from anyone.', href: '/safety', cta: 'Visit the Safety Center' },
  { icon: 'flag', title: 'Report anything', text: 'Six report categories, reviewed by our team.', href: '/safety#reporting', cta: 'How reporting works' },
  { icon: 'lock', title: 'Zero tolerance for child exploitation', text: 'Substantiated reports mean removal, a permanent ban, and a report to NCMEC.', href: '/child-safety', cta: 'Child Safety Standards' },
];
---
<Base
  title="Cascane — Voice-first social messaging"
  description="Cascane is a social app where every message is a voice. Talk with friends, join Convos about anything, and follow the voices you love. Free on iPhone and Android."
  path="/"
  jsonLd={jsonLd}
>
  <meta slot="head" name="google-site-verification" content="YebptMeSaMRmH9P3XirwODk8zuesbpQQuMm41_QLcAE" />

  <section class="hero page-top">
    <div class="container hero-grid">
      <div class="hero-copy">
        <p class="eyebrow" data-reveal>Voice-first social</p>
        <h1 class="display" data-reveal style="--i:1">Social, out loud.</h1>
        <p class="lead" data-reveal style="--i:2">Cascane is a social app where every message is a voice. Talk with friends, jump into Convos about anything, and follow the people you want to hear from.</p>
        <StoreBadges />
        <p class="muted meta">Free on iPhone and Android.</p>
      </div>
      <div class="hero-media">
        <Phone src={chat} alt="A Cascane Convo: friends' voice replies appear as avatar bubbles, with the record button at the bottom" width={360} eager float tilt />
      </div>
    </div>
  </section>

  <section class="section why">
    <div class="container why-inner">
      <p class="why-text" data-reveal><span>Text flattens people.</span> Voice brings back the tone, the laugh, the pause before the punchline.</p>
      <Waveform bars={64} seed={11} animated class="why-wave" />
    </div>
  </section>

  <FeatureRow
    eyebrow="Convos"
    title="Start conversations about anything."
    body="Post a question and let everyone answer by voice. The best replies rise to the top."
    points={['Hashtags for every topic', "Upvote what's worth hearing", 'Public or private']}
    image={convos}
    alt="The Convos tab: voice conversation prompts with hashtags and vote counts"
  />
  <FeatureRow
    eyebrow="Messages"
    title="Every conversation in one place."
    body="DMs, group chats and the Channels you follow live together in one inbox."
    points={['DMs, groups and Channels together', 'Unread at a glance', 'Find anyone by name']}
    image={inbox}
    alt="The Messages inbox with DMs, group chats and Channels"
    flip
  />
  <FeatureRow
    eyebrow="Channels"
    title="Your voice, broadcast."
    body="Start a Channel and speak to everyone who subscribes."
    points={['Subscribers hear every update', 'Hashtags help people find it', 'Public or private']}
    image={channel}
    alt="A Channel page for “Updates from the Starspace band!” with 5,765 subscribers"
  />
  <FeatureRow
    eyebrow="People"
    title="Follow the voices you love."
    body="Follow friends and the people you want to hear from. Your Cascane Score grows as people listen, reply and follow."
    points={['Followers and mutuals', '“Follows you” at a glance', 'Your Cascane Score']}
    image={profile}
    alt="A Cascane profile with followers, a Cascane Score, Convos started and Channels"
    flip
  />

  <section class="section safety">
    <div class="container">
      <p class="eyebrow" data-reveal>Safety</p>
      <h2 class="h2" data-reveal style="--i:1">Built to feel safe.</h2>
      <ul class="safety-grid">
        {safety.map((s, i) => (
          <li data-reveal style={`--i:${i}`}>
            <a class="card safety-card" href={s.href}>
              <span class="icon-tile"><Icon name={s.icon} size={22} /></span>
              <h3 class="h3">{s.title}</h3>
              <p>{s.text}</p>
              <span class="link more">{s.cta} <Icon name="arrow-right" size={16} /></span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  </section>

  <DownloadBand id="download" heading="Your voice belongs in the conversation." text="Free on iPhone and Android." />
</Base>

<style>
  .hero { position: relative; overflow: hidden; padding-bottom: clamp(64px, 10vw, 120px); }
  .hero::before { content: ''; position: absolute; right: -10%; top: -20%; width: 900px; height: 900px; background: radial-gradient(closest-side, rgba(0, 217, 255, 0.1), rgba(0, 217, 255, 0) 70%); pointer-events: none; }
  .hero-grid { position: relative; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: clamp(40px, 6vw, 80px); align-items: center; }
  .hero-copy { display: grid; gap: 24px; justify-items: start; }
  .hero-copy .lead { max-width: 540px; }
  .meta { font-size: 0.875rem; margin-top: -12px; }
  .why { text-align: center; }
  .why-inner { display: grid; gap: 40px; justify-items: center; }
  .why-text { font-size: clamp(1.75rem, 3.6vw, 3rem); font-weight: 600; letter-spacing: -0.025em; line-height: 1.2; max-width: 960px; text-wrap: balance; }
  .why-text span { color: var(--text-3); }
  .why :global(.why-wave) { --wave-h: 56px; color: var(--accent); opacity: 0.9; max-width: 100%; overflow: hidden; }
  .safety .h2 { margin: 16px 0 48px; }
  .safety-grid { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .safety-card { height: 100%; padding: 28px; display: grid; gap: 10px; align-content: start; transition: background-color 0.2s; }
  .safety-card:hover { background: #15151A; }
  .safety-card p { color: var(--text-2); }
  .icon-tile { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; color: var(--accent); background: rgba(0, 217, 255, 0.08); box-shadow: inset 0 0 0 1px rgba(0, 217, 255, 0.2); margin-bottom: 6px; }
  .more { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; margin-top: 6px; }
  @media (max-width: 899px) {
    .hero-grid { grid-template-columns: minmax(0, 1fr); }
    .safety-grid { grid-template-columns: minmax(0, 1fr); }
  }
</style>
```

Delete the old stylesheet: `git rm -q public/css/style.css`

- [ ] **Step 4: Run all checks**

Run: `npm run check`
Expected: all `✓` (verify now includes `structuredData`), unit tests pass, browser checks pass. The layout check now covers `/` at every width.

- [ ] **Step 5: Look at the home page**

Run: `npm run browser -- --screens` and open `.artifacts/screens/index-1280.png`, `index-375.png`, `index-1600.png`. Expected:
- **Hero:** copy and badges on the left, the chat phone on the right with a cyan glow and a visible rim, so the black phone separates from the black page.
- **Why voice:** the grey-then-white sentence and the cyan waveform.
- **Feature rows:** four rows alternating sides.
- **Bottom:** three safety cards, then the download band with the glowing mark and badges.
- **At 375px:** the phone sits under the copy.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(home): hero, why-voice band, feature rows, safety band, download band, JSON-LD

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Home page, part 2: five-ways switcher, illustrations, details grid, Explore

**Files:**
- Create: `src/lib/tabs.ts`, `tests/tabs.test.ts`
- Create: `src/styles/illo.css`, `src/components/AvatarBubble.astro`, `src/components/VoicePill.astro`, `src/components/TypeSwitcher.astro`, `src/components/DetailGrid.astro`
- Create: `src/components/illustrations/{DailyFeed,DmThread,GroupThread,ConvoCard,ChannelCard,ExploreBoard}.astro`
- Create: `scripts/browser/50-switcher.mjs`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `Icon`, `Waveform`, `FeatureRow` (with `slot="media"`), `src/assets/avatars/*.png`.
- Produces:
  - `nextTabIndex(current: number, key: string, count: number): number | null`
  - `<AvatarBubble src size?=44 ring?: 'new'|'seen' online?>`
  - `<VoicePill duration seed? bars? mine?>`
  - `<DetailGrid id? eyebrow title items: {icon,title,text}[]>`
  - The six illustration components (no props; used again in Task 9)
  - `<TypeSwitcher>` (renders `section#ways`)

- [ ] **Step 1: The failing unit test**

`tests/tabs.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextTabIndex } from '../src/lib/tabs.ts';

test('arrow keys move and wrap around', () => {
  assert.equal(nextTabIndex(4, 'ArrowRight', 5), 0);
  assert.equal(nextTabIndex(0, 'ArrowLeft', 5), 4);
  assert.equal(nextTabIndex(2, 'ArrowRight', 5), 3);
});
test('Home and End jump to the ends', () => {
  assert.equal(nextTabIndex(3, 'Home', 5), 0);
  assert.equal(nextTabIndex(1, 'End', 5), 4);
});
test('other keys are ignored', () => {
  assert.equal(nextTabIndex(1, 'Enter', 5), null);
  assert.equal(nextTabIndex(1, 'a', 5), null);
});
```

Run: `npm test`
Expected: FAIL, `Cannot find module '…/src/lib/tabs.ts'`.

- [ ] **Step 2: Implement `tabs.ts`**

`src/lib/tabs.ts`:
```ts
/** Roving-focus index for a horizontal tablist (WAI-ARIA Tabs pattern). */
export function nextTabIndex(current: number, key: string, count: number): number | null {
  switch (key) {
    case 'ArrowRight': return (current + 1) % count;
    case 'ArrowLeft': return (current - 1 + count) % count;
    case 'Home': return 0;
    case 'End': return count - 1;
    default: return null;
  }
}
```

Run: `npm test`
Expected: `ℹ fail 0`.

- [ ] **Step 3: The failing browser test**

`scripts/browser/50-switcher.mjs`:
```js
import assert from 'node:assert/strict';
import { open } from './_open.mjs';

export const name = 'home: five-ways switcher works by click and keyboard';

export async function run({ browser, base }) {
  const { page } = await open(browser, base, '/');
  const state = () => page.evaluate(() => ({
    selected: [...document.querySelectorAll('#ways [role=tab]')].map((t) => t.getAttribute('aria-selected')).join(','),
    visible: [...document.querySelectorAll('#ways [role=tabpanel]')].filter((p) => !p.hidden).map((p) => p.id).join(','),
    focused: document.activeElement?.id ?? '',
  }));
  assert.deepEqual(await state(), { selected: 'true,false,false,false,false', visible: 'panel-daily', focused: '' });
  await page.click('#tab-convos');
  assert.equal((await state()).visible, 'panel-convos');
  await page.focus('#tab-channels');
  await page.keyboard.press('ArrowRight');
  assert.deepEqual(await state(), { selected: 'true,false,false,false,false', visible: 'panel-daily', focused: 'tab-daily' });
  await page.keyboard.press('End');
  assert.equal((await state()).visible, 'panel-channels');
  await page.keyboard.press('Home');
  assert.equal((await state()).focused, 'tab-daily');
  const tabindexes = await page.$$eval('#ways [role=tab]', (ts) => ts.map((t) => t.tabIndex));
  assert.deepEqual(tabindexes, [0, -1, -1, -1, -1], 'only the selected tab is in the Tab order');
  await page.close();
}
```

Run: `npm run build && npm run browser`
Expected: FAIL on `50-switcher` (no `#ways`).

- [ ] **Step 4: Illustration building blocks**

`src/styles/illo.css`:
```css
/* Shared styles for the HTML/CSS product illustrations (decorative, aria-hidden). */
.illo { position: relative; background: linear-gradient(180deg, #131317, #0E0E11); border-radius: var(--r-panel); box-shadow: inset 0 0 0 1px var(--line), 0 40px 80px -30px rgba(0, 0, 0, 0.8); padding: clamp(18px, 3vw, 28px); width: 100%; max-width: 440px; margin-inline: auto; overflow: hidden; }
.illo::before { content: ''; position: absolute; inset: -40% -20% auto; height: 70%; background: radial-gradient(closest-side, rgba(0, 217, 255, 0.1), transparent); pointer-events: none; }
.illo > * { position: relative; }
.illo-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.illo-title { font-weight: 650; font-size: 1.125rem; letter-spacing: -0.01em; }
.illo-label { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-3); margin: 20px 0 10px; }
.chip { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 12px; border-radius: var(--r-pill); font-size: 0.75rem; font-weight: 600; color: var(--text-2); background: rgba(255, 255, 255, 0.06); box-shadow: inset 0 0 0 1px var(--line); white-space: nowrap; }
.chip-accent { color: var(--accent); background: rgba(0, 217, 255, 0.08); box-shadow: inset 0 0 0 1px rgba(0, 217, 255, 0.25); }
.feed { list-style: none; padding: 0; display: grid; gap: 14px; }
.row { display: flex; align-items: center; gap: 12px; min-width: 0; }
.row.end { justify-content: flex-end; }
.between { justify-content: space-between; }
.grow { flex: 1; min-width: 0; }
.who { display: grid; gap: 4px; min-width: 0; }
.who strong { font-size: 0.9375rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.who span { font-size: 0.75rem; color: var(--text-3); }
.meta { font-size: 0.75rem; color: var(--text-3); white-space: nowrap; }
.meta strong { color: var(--text); font-weight: 600; }
.pill { display: inline-flex; align-items: center; gap: 10px; height: 40px; padding: 0 14px 0 6px; border-radius: var(--r-pill); background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--line); color: var(--text-2); --wave-h: 18px; max-width: 100%; overflow: hidden; }
.pill.mine { background: rgba(0, 217, 255, 0.12); color: var(--accent); box-shadow: inset 0 0 0 1px rgba(0, 217, 255, 0.3); }
.pill .play { width: 28px; height: 28px; flex: none; display: grid; place-items: center; border-radius: 50%; background: var(--text); color: #000; }
.pill.mine .play { background: var(--accent); }
.pill .dur { font-size: 0.75rem; font-variant-numeric: tabular-nums; color: var(--text-3); }
.tick { display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--accent); }
.react { display: inline-flex; align-items: center; gap: 4px; height: 24px; padding: 0 8px; border-radius: var(--r-pill); background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--line); font-size: 0.75rem; color: var(--text-2); }
.stack { display: flex; }
.stack > * + * { margin-left: -12px; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tag { height: 26px; padding: 0 10px; display: inline-flex; align-items: center; border-radius: var(--r-pill); font-size: 0.75rem; color: var(--text-2); box-shadow: inset 0 0 0 1px var(--line-strong); }
.votes { display: flex; gap: 12px; font-size: 0.8125rem; color: var(--text-2); font-variant-numeric: tabular-nums; }
.votes span { display: inline-flex; align-items: center; gap: 2px; }
.votes .up { color: var(--accent); }
.q { font-size: 1.0625rem; font-weight: 600; line-height: 1.35; margin: 14px 0; color: var(--text); }
.follow { height: 30px; padding: 0 14px; border-radius: var(--r-pill); background: var(--text); color: #000; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; flex: none; }
```

`src/components/AvatarBubble.astro`:
```astro
---
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';

interface Props { src: ImageMetadata; size?: number; ring?: 'new' | 'seen'; online?: boolean }
const { src, size = 44, ring = 'seen', online = false } = Astro.props;
---
<span class:list={['bubble', `ring-${ring}`]} style={`--s:${size}px`}>
  <Image src={src} alt="" width={size} height={size} densities={[1, 2]} />
  {online && <span class="online"></span>}
</span>
<style>
  .bubble { position: relative; flex: none; display: inline-grid; place-items: center; width: calc(var(--s) + 8px); height: calc(var(--s) + 8px); border-radius: 50%; }
  .bubble::before { content: ''; position: absolute; inset: 0; border-radius: 50%; padding: 2px; background: #3A3A40; -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
  /* The app's "unlistened" ring: green -> cyan -> shimmer -> cyan -> green, rotated 45deg. */
  .ring-new::before { background: conic-gradient(from 45deg, var(--accent-3), var(--accent), var(--accent-2), var(--accent), var(--accent-3)); }
  .bubble :global(img) { width: var(--s); height: var(--s); border-radius: 50%; }
  .online { position: absolute; right: 2px; bottom: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--accent-3); box-shadow: 0 0 0 2px #121216; }
</style>
```

`src/components/VoicePill.astro`:
```astro
---
import Icon from './Icon.astro';
import Waveform from './Waveform.astro';

interface Props { duration: string; seed?: number; bars?: number; mine?: boolean }
const { duration, seed = 3, bars = 18, mine = false } = Astro.props;
---
<span class:list={['pill', { mine }]}>
  <span class="play"><Icon name="play" size={14} /></span>
  <Waveform bars={bars} seed={seed} />
  <span class="dur">{duration}</span>
</span>
```

`src/components/illustrations/DailyFeed.astro`:
```astro
---
import '../../styles/illo.css';
import AvatarBubble from '../AvatarBubble.astro';
import VoicePill from '../VoicePill.astro';
import Icon from '../Icon.astro';
import natalie from '../../assets/avatars/natalie.png';
import tyler from '../../assets/avatars/tyler.png';
import anna from '../../assets/avatars/anna.png';

const posts = [
  { img: natalie, name: 'Natalie', left: '23h left', dur: '0:24', seed: 3, ring: 'new' },
  { img: tyler, name: 'Tyler', left: '22h left', dur: '0:41', seed: 5, ring: 'new' },
  { img: anna, name: 'Anna', left: '20h left', dur: '0:18', seed: 9, ring: 'seen' },
] as const;
---
<div class="illo" aria-hidden="true">
  <div class="illo-head">
    <span class="illo-title">Daily</span>
    <span class="chip chip-accent"><Icon name="timer" size={14} />Gone in 24h</span>
  </div>
  <ul class="feed">
    {posts.map((p) => (
      <li class="row">
        <AvatarBubble src={p.img} size={40} ring={p.ring} />
        <div class="who grow"><strong>{p.name}</strong><VoicePill duration={p.dur} seed={p.seed} bars={14} /></div>
        <span class="meta">{p.left}</span>
      </li>
    ))}
  </ul>
</div>
```

`src/components/illustrations/DmThread.astro`:
```astro
---
import '../../styles/illo.css';
import AvatarBubble from '../AvatarBubble.astro';
import VoicePill from '../VoicePill.astro';
import Icon from '../Icon.astro';
import ethan from '../../assets/avatars/ethan.png';
---
<div class="illo" aria-hidden="true">
  <div class="illo-head">
    <div class="row"><AvatarBubble src={ethan} size={36} online /><div class="who"><strong>Ethan Park</strong><span>Online now</span></div></div>
  </div>
  <div class="feed">
    <div class="row"><VoicePill duration="0:14" seed={2} /></div>
    <div class="row end"><VoicePill duration="0:09" seed={4} mine /></div>
    <div class="row end"><span class="tick"><Icon name="check-check" size={14} />Listened</span></div>
    <div class="row"><VoicePill duration="0:22" seed={6} /><span class="react">😂 2</span></div>
  </div>
</div>
```

`src/components/illustrations/GroupThread.astro`:
```astro
---
import '../../styles/illo.css';
import AvatarBubble from '../AvatarBubble.astro';
import VoicePill from '../VoicePill.astro';
import austin from '../../assets/avatars/austin.png';
import nate from '../../assets/avatars/nate.png';
import natalie from '../../assets/avatars/natalie.png';
---
<div class="illo" aria-hidden="true">
  <div class="illo-head">
    <div class="row">
      <span class="stack"><AvatarBubble src={austin} size={28} /><AvatarBubble src={nate} size={28} /><AvatarBubble src={natalie} size={28} /></span>
      <div class="who"><strong>Weekend plans</strong><span>4 members</span></div>
    </div>
  </div>
  <div class="feed">
    <div class="row"><AvatarBubble src={austin} size={28} /><VoicePill duration="0:17" seed={7} bars={14} /></div>
    <div class="row"><AvatarBubble src={nate} size={28} /><VoicePill duration="0:08" seed={13} bars={12} /><span class="react">🔥 3</span></div>
    <div class="row end"><VoicePill duration="0:12" seed={5} bars={14} mine /></div>
    <div class="row"><AvatarBubble src={natalie} size={28} ring="new" /><VoicePill duration="0:26" seed={3} bars={14} /></div>
  </div>
</div>
```

`src/components/illustrations/ConvoCard.astro`:
```astro
---
import '../../styles/illo.css';
import AvatarBubble from '../AvatarBubble.astro';
import Icon from '../Icon.astro';
import austin from '../../assets/avatars/austin.png';
import tyler from '../../assets/avatars/tyler.png';
import anna from '../../assets/avatars/anna.png';
import nate from '../../assets/avatars/nate.png';
import ethan from '../../assets/avatars/ethan.png';
---
<div class="illo" aria-hidden="true">
  <div class="row"><AvatarBubble src={austin} size={24} /><span class="meta"><strong>Austin Stanley</strong> · @astanley · 32 messages</span></div>
  <p class="q">Do an impression of your favorite actor! Say the funniest thing they've ever said</p>
  <div class="tags"><span class="tag">#impressions</span><span class="tag">#school</span><span class="tag">#actors</span></div>
  <div class="row between" style="margin-top:16px">
    <span class="meta">Received from Tyler · 12m</span>
    <span class="votes"><span class="up"><Icon name="arrow-up" size={14} />87</span><span><Icon name="arrow-down" size={14} />3</span></span>
  </div>
  <div class="row" style="margin-top:18px">
    <span class="stack"><AvatarBubble src={tyler} size={24} ring="new" /><AvatarBubble src={anna} size={24} /><AvatarBubble src={nate} size={24} /><AvatarBubble src={ethan} size={24} /></span>
    <span class="meta">29 voice replies</span>
  </div>
</div>
```

`src/components/illustrations/ChannelCard.astro`:
```astro
---
import '../../styles/illo.css';
import AvatarBubble from '../AvatarBubble.astro';
import VoicePill from '../VoicePill.astro';
import Icon from '../Icon.astro';
import tyler from '../../assets/avatars/tyler.png';
---
<div class="illo" aria-hidden="true">
  <div class="illo-head">
    <div class="row"><AvatarBubble src={tyler} size={40} ring="new" /><div class="who"><strong>Updates from the Starspace band!</strong><span>Channel · 5,765 subscribers</span></div></div>
  </div>
  <div class="feed">
    <div class="row"><VoicePill duration="0:48" seed={8} /><span class="meta">2h</span></div>
    <div class="row"><VoicePill duration="1:05" seed={12} /><span class="meta">1d</span></div>
  </div>
  <div class="row between" style="margin-top:20px">
    <span class="chip"><Icon name="radio" size={14} />Only Tyler posts</span>
    <span class="follow">Subscribed</span>
  </div>
</div>
```

`src/components/illustrations/ExploreBoard.astro`:
```astro
---
import '../../styles/illo.css';
import AvatarBubble from '../AvatarBubble.astro';
import Icon from '../Icon.astro';
import natalie from '../../assets/avatars/natalie.png';
import nate from '../../assets/avatars/nate.png';
import anna from '../../assets/avatars/anna.png';

const voices = [
  { img: natalie, name: 'Natalie Ashford', sub: 'Rising voice' },
  { img: nate, name: 'Nate Callahan', sub: 'Trending now' },
  { img: anna, name: 'Anna Brooks', sub: 'Joined recently' },
];
---
<div class="illo" aria-hidden="true">
  <div class="illo-head"><span class="illo-title">Explore</span><Icon name="search" size={18} /></div>
  <p class="illo-label">Trending hashtags</p>
  <div class="tags">
    {['#music', '#horror', '#career', '#hiking', '#band', '#movies'].map((t) => <span class="tag">{t}</span>)}
  </div>
  <p class="illo-label">Popular voices</p>
  <ul class="feed">
    {voices.map((v) => (
      <li class="row"><AvatarBubble src={v.img} size={36} /><div class="who grow"><strong>{v.name}</strong><span>{v.sub}</span></div><span class="follow">Follow</span></li>
    ))}
  </ul>
</div>
```

- [ ] **Step 5: Switcher and details grid**

`src/components/TypeSwitcher.astro`:
```astro
---
import Icon from './Icon.astro';
import DailyFeed from './illustrations/DailyFeed.astro';
import DmThread from './illustrations/DmThread.astro';
import GroupThread from './illustrations/GroupThread.astro';
import ConvoCard from './illustrations/ConvoCard.astro';
import ChannelCard from './illustrations/ChannelCard.astro';

const tabs = [
  { id: 'daily', label: 'Daily', title: 'Your day, out loud.', text: "Post a voice note to everyone who follows you. It's gone in 24 hours.", facts: ['Posts from the people you follow', 'Every post disappears after 24 hours', 'Hide your Daily from anyone'], Illo: DailyFeed },
  { id: 'dms', label: 'DMs', title: 'One-on-one, in your own voice.', text: "See when they're online and when they've listened.", facts: ['Online status at a glance', "Know when they've listened", 'Add a photo to any voice note'], Illo: DmThread },
  { id: 'groups', label: 'Groups', title: 'Group chats you can actually hear.', text: 'Name it, add your friends, and talk.', facts: ['Add friends in a couple of taps', 'React and reply to any message', 'Everyone hears everyone'], Illo: GroupThread },
  { id: 'convos', label: 'Convos', title: 'Ask anything. Everyone answers by voice.', text: 'Public or private topics with hashtags, votes, and replies that spread through friends.', facts: ['Public or private', 'Hashtags and upvotes', 'Spreads friend to friend'], Illo: ConvoCard },
  { id: 'channels', label: 'Channels', title: 'Broadcast to thousands.', text: 'Only you post; your subscribers listen.', facts: ['Only the creator posts', 'Subscribers tune in', 'Discoverable by hashtag'], Illo: ChannelCard },
];
---
<section class="section switch" id="ways">
  <div class="container">
    <div class="head">
      <p class="eyebrow" data-reveal>Five ways to talk</p>
      <h2 class="h2" data-reveal style="--i:1">One voice. Five ways to talk.</h2>
    </div>
    <div data-switcher>
      <div class="tabs" role="tablist" aria-label="Ways to talk on Cascane">
        {tabs.map((t, i) => (
          <button type="button" role="tab" id={`tab-${t.id}`} aria-controls={`panel-${t.id}`} aria-selected={i === 0 ? 'true' : 'false'} tabindex={i === 0 ? 0 : -1}>{t.label}</button>
        ))}
      </div>
      {tabs.map((t, i) => {
        const Illo = t.Illo;
        return (
          <div class="panel" role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={i !== 0}>
            <div class="panel-copy">
              <h3 class="panel-title">{t.title}</h3>
              <p class="lead">{t.text}</p>
              <ul class="facts">{t.facts.map((f) => <li><Icon name="check" size={18} />{f}</li>)}</ul>
            </div>
            <div class="panel-media"><Illo /></div>
          </div>
        );
      })}
    </div>
    <a class="link more" href="/features">Explore every feature <Icon name="arrow-right" size={16} /></a>
  </div>
</section>
<script>
  import { nextTabIndex } from '../lib/tabs.ts';

  document.querySelectorAll<HTMLElement>('[data-switcher]').forEach((root) => {
    const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = [...root.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
    const select = (i: number, focus: boolean) => {
      tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; });
      panels.forEach((p, j) => { p.hidden = i !== j; });
      if (focus) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i, false));
      t.addEventListener('keydown', (e) => {
        const next = nextTabIndex(i, e.key, tabs.length);
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
    });
  });
</script>
<style>
  .head { text-align: center; display: grid; gap: 16px; justify-items: center; margin-bottom: 40px; }
  .tabs { display: flex; gap: 4px; padding: 4px; margin: 0 auto 48px; width: max-content; max-width: 100%; overflow-x: auto; border-radius: var(--r-pill); background: var(--surface-1); box-shadow: inset 0 0 0 1px var(--line); scrollbar-width: none; }
  .tabs::-webkit-scrollbar { display: none; }
  [role='tab'] { height: 40px; padding: 0 18px; flex: none; border-radius: var(--r-pill); font-size: 0.9375rem; font-weight: 600; color: var(--text-2); white-space: nowrap; transition: background-color 0.2s, color 0.2s; }
  [role='tab'][aria-selected='true'] { background: var(--text); color: #000; }
  [role='tab']:hover:not([aria-selected='true']) { color: var(--text); }
  .panel { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(32px, 6vw, 80px); align-items: center; }
  .panel[hidden] { display: none; }
  .panel-copy { display: grid; gap: 16px; max-width: 460px; }
  .panel-title { font-size: clamp(1.5rem, 2.6vw, 2.25rem); font-weight: 650; letter-spacing: -0.025em; line-height: 1.15; }
  .facts { list-style: none; padding: 0; display: grid; gap: 10px; color: var(--text-2); }
  .facts li { display: flex; gap: 10px; align-items: center; }
  .facts :global(.icon) { color: var(--accent); flex: none; }
  .more { display: inline-flex; align-items: center; gap: 6px; margin-top: 48px; font-weight: 600; }
  @media (max-width: 899px) { .panel { grid-template-columns: minmax(0, 1fr); } }
</style>
```

`src/components/DetailGrid.astro`:
```astro
---
import Icon from './Icon.astro';

interface Item { icon: string; title: string; text: string }
interface Props { id?: string; eyebrow: string; title: string; items: Item[] }
const { id, eyebrow, title, items } = Astro.props;
---
<section class="section details" id={id}>
  <div class="container">
    <div class="head">
      <p class="eyebrow" data-reveal>{eyebrow}</p>
      <h2 class="h2" data-reveal style="--i:1">{title}</h2>
    </div>
    <ul class="grid">
      {items.map((it, i) => (
        <li class="card item" data-reveal style={`--i:${i % 3}`}>
          <span class="icon-tile"><Icon name={it.icon} size={22} /></span>
          <h3 class="h3">{it.title}</h3>
          <p>{it.text}</p>
        </li>
      ))}
    </ul>
  </div>
</section>
<style>
  .head { display: grid; gap: 16px; max-width: 720px; margin-bottom: 48px; }
  .grid { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .item { padding: 28px; display: grid; gap: 10px; align-content: start; }
  .item p { color: var(--text-2); }
  .icon-tile { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; color: var(--accent); background: rgba(0, 217, 255, 0.08); box-shadow: inset 0 0 0 1px rgba(0, 217, 255, 0.2); margin-bottom: 6px; }
  @media (max-width: 999px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 639px) { .grid { grid-template-columns: minmax(0, 1fr); } }
</style>
```

- [ ] **Step 6: Wire them into the home page**

In `src/pages/index.astro`, add these imports below `import Icon from '../components/Icon.astro';`:
```astro
import TypeSwitcher from '../components/TypeSwitcher.astro';
import DetailGrid from '../components/DetailGrid.astro';
import ExploreBoard from '../components/illustrations/ExploreBoard.astro';
```

Add this constant below the `safety` array in the frontmatter:
```js
const details = [
  { icon: 'smile', title: 'Reactions', text: 'React to any voice message with an emoji.' },
  { icon: 'reply', title: 'Voice replies', text: 'Reply to a specific message and keep the thread together.' },
  { icon: 'headphones', title: 'Who listened', text: 'See exactly who heard your message.' },
  { icon: 'image', title: 'Photos', text: 'Attach a photo to any voice note.' },
  { icon: 'timer', title: 'Disappearing messages', text: 'Set any message to vanish after 1–24 hours, or keep it forever.' },
  { icon: 'circle-dot', title: 'Online now', text: 'See when your friends are around.' },
];
```

Insert immediately after the closing `</section>` of `<section class="section why">`:
```astro
  <TypeSwitcher />
```

Insert immediately before `<section class="section safety">`:
```astro
  <DetailGrid eyebrow="The details" title="The details that make voice feel alive." items={details} />

  <FeatureRow
    id="explore"
    eyebrow="Explore"
    title="Find your people."
    body="Trending Convos and Channels, Popular Voices, and hashtag pages for whatever you're into, all a tap away."
    points={['Trending Convos and Channels', 'Popular Voices to follow', 'Hashtag pages for every interest']}
  >
    <ExploreBoard slot="media" />
  </FeatureRow>
```

- [ ] **Step 7: Run all checks**

Run: `npm run check`
Expected: all `✓`, including `50-switcher`. The 320px layout check covers the five-tab bar, which scrolls inside itself rather than pushing the page sideways.

- [ ] **Step 8: Look at it**

Run: `npm run browser -- --screens`, then open `index-1280.png` and `index-375.png`. Expected:
- **Switcher:** a centred white pill on "Daily" and the Daily feed illustration, with ringed avatars, voice pills and "23h left".
- **Details:** a 3×2 grid of cards.
- **Explore:** the Explore row with hashtag chips and Popular voices.
- **Faces:** no avatar shows a grey ring fragment.

If any illustration overflows its card at 320px, reduce that pill's `bars`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(home): five-ways switcher with HTML illustrations, details grid, Explore row

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Features page

The copy is deliberately different from the home page's sentences (Google advises against repeated content). `#dms` uses `inbox_page` and `#groups` uses the `GroupThread` illustration, so the same screenshot never appears twice on one page.

**Files:**
- Replace: `src/pages/features.astro` (keep the ids `daily dms groups convos channels details explore profiles`)
- Create: `scripts/browser/60-features.mjs`

**Interfaces:**
- Consumes: `FeatureRow`, `DetailGrid`, `DownloadBand`, `DailyFeed`, `GroupThread`, `ExploreBoard`, screens `inbox_page`, `convos_page`, `channel_info_page`, `profile_page`.

- [ ] **Step 1: The failing test**

`scripts/browser/60-features.mjs`:
```js
import assert from 'node:assert/strict';
import { open } from './_open.mjs';

export const name = 'features: every section is present, with media and a download band';

export async function run({ browser, base }) {
  const { page } = await open(browser, base, '/features');
  for (const id of ['daily', 'dms', 'groups', 'convos', 'channels', 'details', 'explore', 'profiles']) {
    const ok = await page.$eval(`#${id}`, (el) => !!el.querySelector('h2') && !!el.querySelector('.phone, .illo, .card'));
    assert.ok(ok, `#${id} needs a heading and media`);
  }
  assert.ok(await page.$('.band [data-store-badges]'), 'closing download band with badges');
  await page.close();
}
```

Run: `npm run build && npm run browser`
Expected: FAIL. `#daily needs a heading and media` (the skeleton has `h2` but no media).

- [ ] **Step 2: The page**

`src/pages/features.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import FeatureRow from '../components/FeatureRow.astro';
import DetailGrid from '../components/DetailGrid.astro';
import DownloadBand from '../components/DownloadBand.astro';
import DailyFeed from '../components/illustrations/DailyFeed.astro';
import GroupThread from '../components/illustrations/GroupThread.astro';
import ExploreBoard from '../components/illustrations/ExploreBoard.astro';
import inbox from '../assets/screens/inbox_page.png';
import convos from '../assets/screens/convos_page.png';
import channel from '../assets/screens/channel_info_page.png';
import profile from '../assets/screens/profile_page.png';

const details = [
  { icon: 'smile', title: 'Reactions', text: 'Answer with an emoji when a voice note deserves one, and see who reacted with what.' },
  { icon: 'reply', title: 'Threaded voice replies', text: 'Reply to one specific message. Replies stay threaded under it, so busy chats stay easy to follow.' },
  { icon: 'headphones', title: 'Listen receipts', text: "Every message shows who's heard it, so you're never left wondering." },
  { icon: 'image', title: 'Photo + voice', text: 'Attach a photo to any voice message and say what it is at the same time.' },
  { icon: 'timer', title: 'Timers', text: "Pick a timer from 1 to 24 hours, or keep a message forever. When time's up, it's gone." },
  { icon: 'circle-dot', title: 'Presence', text: "A green dot shows who's around right now." },
];
---
<Base title="Features · Cascane" description="Daily voice posts, DMs, group chats, Convos and Channels, plus reactions, voice replies and disappearing messages. See everything Cascane can do." path="/features">
  <section class="container page-top hero">
    <p class="eyebrow" data-reveal>Features</p>
    <h1 class="display" data-reveal style="--i:1">Everything you can say with Cascane.</h1>
    <p class="lead" data-reveal style="--i:2">Cascane turns every message into a voice note: in your feed, your DMs, your group chats, and the conversations you start. Here's the whole tour.</p>
    <nav class="jump" aria-label="Jump to a feature" data-reveal style="--i:3">
      {[['daily', 'Daily'], ['dms', 'DMs'], ['groups', 'Groups'], ['convos', 'Convos'], ['channels', 'Channels'], ['explore', 'Explore'], ['profiles', 'Profiles']].map(([id, label]) => <a class="chip-link" href={`#${id}`}>{label}</a>)}
    </nav>
  </section>

  <FeatureRow
    id="daily"
    eyebrow="Daily"
    title="A feed that sounds like your friends."
    body="Daily is your home tab: short voice posts from you and everyone you follow, newest first. Every post clears itself after 24 hours, so the feed is always about today."
    points={['Voice posts from the people you follow', 'Posts disappear after 24 hours', 'Hide your Daily from specific people', 'React or reply to any post']}
  >
    <DailyFeed slot="media" />
  </FeatureRow>

  <FeatureRow
    id="dms"
    eyebrow="DMs"
    title="Conversations that sound like you."
    body="Send a voice message to anyone, one-on-one. Your inbox keeps DMs, groups and Channels together, with unread counts so nothing slips by."
    points={["See who's online", 'Know when your message was heard', 'Filter by DMs, Groups or Channels', 'Search by name or username']}
    image={inbox}
    alt="The Messages inbox with DMs, group chats and Channels, filtered by type"
    flip
  />

  <FeatureRow
    id="groups"
    eyebrow="Groups"
    title="Everyone in the room, out loud."
    body="Start a group, give it a name if you like, and add the people you follow. Everyone can talk, react, and reply to a specific message, so side conversations stay organised."
    points={["Name your group (or don't)", 'Add people from your followers', 'Reactions and threaded voice replies']}
  >
    <GroupThread slot="media" />
  </FeatureRow>

  <FeatureRow
    id="convos"
    eyebrow="Convos"
    title="Ask the question. Hear every answer."
    body="A Convo starts with a prompt, anything from a horror-movie debate to your craziest first day at work. People answer by voice, vote on the best, and pass it along to friends."
    points={['Add a title, description, photo and hashtags', 'Public, or private to your followers', 'Upvote and downvote', 'See who passed it to you']}
    image={convos}
    alt="The Convos tab listing prompts such as “What's one horror movie you'll never get tired of watching?”"
    flip
  />

  <FeatureRow
    id="channels"
    eyebrow="Channels"
    title="Your own station."
    body="Channels are one-way: you post, subscribers listen. Use one for your band, your club, or your hot takes, and let people find it by hashtag."
    points={['Only the creator posts', 'Subscribers get every update', 'Hashtags help people discover it', 'Public, or private to your followers']}
    image={channel}
    alt="The info page of a Channel with its description, hashtags, subscriber count and creator"
  />

  <DetailGrid id="details" eyebrow="The details" title="Small things that make voice feel alive." items={details} />

  <FeatureRow
    id="explore"
    eyebrow="Explore"
    title="There's always someone worth hearing."
    body="Explore surfaces trending Convos and Channels, Popular Voices, and hashtag pages, tuned to what you engage with."
    points={['Trending Convos and Channels', 'Popular Voices to follow', 'A page for every hashtag', 'Search people, Convos and Channels']}
    flip
  >
    <ExploreBoard slot="media" />
  </FeatureRow>

  <FeatureRow
    id="profiles"
    eyebrow="Profiles"
    title="Your profile, your voice."
    body="Your profile shows the Convos you've started and the Channels you run, alongside your followers and your Cascane Score."
    points={['Followers, following and mutuals', '“Follows you” at a glance', 'A Cascane Score that grows as you post, and as people listen, reply, react, upvote, subscribe and follow']}
    image={profile}
    alt="A profile page with bio, follower counts, Cascane Score, Convos started and Channels"
  />

  <DownloadBand heading="Hear it for yourself." text="Free on iPhone and Android." />
</Base>
<style>
  .hero { display: grid; gap: 20px; max-width: 900px; padding-bottom: 24px; }
  .jump { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .chip-link { height: 36px; padding: 0 14px; display: inline-flex; align-items: center; border-radius: var(--r-pill); font-size: 0.875rem; font-weight: 600; color: var(--text-2); background: var(--surface-1); box-shadow: inset 0 0 0 1px var(--line); transition: color 0.2s, background-color 0.2s; }
  .chip-link:hover { color: var(--text); background: var(--surface-2); }
</style>
```

- [ ] **Step 3: Run all checks**

Run: `npm run check`
Expected: all `✓`, including `60-features`, `internalLinks` (footer anchors `#daily #convos #channels` resolve) and `badges` (the features page has two badge groups, the download band and the mobile menu, both valid).

- [ ] **Step 4: Look at it**

Run: `npm run browser -- --screens`, then open `features-1280.png` and `features-375.png`. Expected: the hero with jump chips, eight alternating sections, the details grid, and the download band.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(features): full feature tour for Daily, DMs, Groups, Convos, Channels, Explore, Profiles

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Quality gate: Lighthouse, full visual review, keyboard pass

**Files:**
- Create: `scripts/lighthouse.mjs`
- Modify: `package.json` (add a `lighthouse` script)
- Modify: whichever component a finding points to

- [ ] **Step 1: The Lighthouse gate (test)**

`scripts/lighthouse.mjs`:
```js
// Mobile Lighthouse on key pages against the local preview. Fails below the spec's thresholds.
// Usage: npm run build && npm run lighthouse
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, readFileSync } from 'node:fs';
import { withPreview } from './lib/preview-server.mjs';

const run = promisify(execFile);
const PAGES = ['/', '/features', '/safety', '/privacy'];
const MIN = { performance: 95, accessibility: 100, 'best-practices': 95, seo: 100 };

mkdirSync('.artifacts/lighthouse', { recursive: true });
let failed = false;
await withPreview(async (base) => {
  for (const p of PAGES) {
    const out = `.artifacts/lighthouse/${p === '/' ? 'home' : p.slice(1)}.json`;
    // Async on purpose: the preview server runs in this process and must keep serving.
    await run('node_modules/.bin/lighthouse', [
      base + p, '--quiet', '--form-factor=mobile',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--chrome-flags=--headless=new', '--output=json', `--output-path=${out}`,
    ], { maxBuffer: 1 << 26 });
    const report = JSON.parse(readFileSync(out, 'utf8'));
    const scores = Object.fromEntries(Object.entries(report.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
    const low = Object.entries(MIN).filter(([k, min]) => scores[k] < min);
    console.log(`${low.length ? '✗' : '✓'} ${p}`, scores);
    for (const [k] of low) {
      const audits = report.categories[k].auditRefs.map((r) => report.audits[r.id]).filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative');
      audits.slice(0, 6).forEach((a) => console.log(`    ${k}: ${a.id} — ${a.title}`));
    }
    if (low.length) failed = true;
  }
});
process.exit(failed ? 1 : 0);
```

In `package.json` `scripts`, add `"lighthouse": "node scripts/lighthouse.mjs"`.

Run: `npm run build && npm run lighthouse`
Expected: one line per page with scores. For any `✗`, the failing audits are listed underneath.

- [ ] **Step 2: Fix every failing audit**

For each listed audit, fix the cause in the component it names and re-run Step 1 until every page shows `✓`. Most likely causes and their fixes:
- `color-contrast`: raise the offending text to `--text-2` or `--text-3` (both pass AA on `--bg` and `--surface-1`); never lower the threshold.
- `largest-contentful-paint`: confirm the hero `Phone` has `eager` (so `fetchpriority="high"`), and that no `[data-reveal]` wraps `.hero-media`.
- `image-size-responsive` / `uses-responsive-images`: adjust that `Phone`'s `sizes` to its real rendered width.
- `heading-order`: change the skipped level (for example an `h3` directly under an `h1` becomes an `h2`).

Performance can wobble by 1–3 points between runs on a laptop. If a page lands at 93–94 with no failing audits listed, re-run once before changing code.

- [ ] **Step 3: Full-page visual review**

Run: `npm run browser -- --screens`
Open every file in `.artifacts/screens/` (10 pages × 5 widths) with the Read tool, and check each against this list. Fix what fails, re-run, and re-check that file:
- No text touches a screen edge; the side gutter is at least 20px.
- No overlapping elements; no orphaned single word on a heading's last line at 1280px.
- Phones never render with a white corner or a missing rim.
- Every card grid collapses cleanly (3 → 2 → 1 columns).
- Badges sit side by side at ≥ 375px, with the App Store badge first.
- The footer's trademark line is readable.

- [ ] **Step 4: Keyboard pass (manual in headless Chrome)**

Run `npm run browser`. The nav, menu, switcher, TOC and form suites cover the interactive parts. Then confirm the one thing they don't: that every focusable element shows the cyan focus ring. Add this file:

`scripts/browser/70-focus.mjs`:
```js
import assert from 'node:assert/strict';
import { open } from './_open.mjs';

export const name = 'keyboard: every Tab stop on the home page shows a visible focus ring';

export async function run({ browser, base }) {
  const { page } = await open(browser, base, '/', { reducedMotion: true });
  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      return { key: el.outerHTML.slice(0, 80), outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 };
    });
    if (!info || seen.has(info.key)) break;
    seen.add(info.key);
    assert.ok(info.outline, `no visible focus ring on ${info.key}`);
  }
  assert.ok(seen.size > 10, `expected many Tab stops, got ${seen.size}`);
  await page.close();
}
```

Run: `npm run build && npm run browser`
Expected: all `✓`, including `70-focus`.

- [ ] **Step 5: Final full check**

Run: `npm run check && npm run lighthouse`
Expected: every verify check, unit test, browser check and Lighthouse page is `✓`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: Lighthouse gate and focus-ring check; fixes from the full visual review

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Deploy Preview and live-environment checks (stops before going live)

**Files:**
- Create: `scripts/check-remote.sh`, `scripts/form-test.mjs`

**Interfaces:**
- Consumes: the Netlify MCP tools `netlify-project-services-reader` (`get-forms-for-project`) and `netlify-project-services-updater` (`manage-form-submissions`), site id `14564ab0-d590-42ce-98b4-d332fd922cbb`, form id `6a86f337dcbe280008dec5fe`.

- [ ] **Step 1: The remote checks (tests for a deployed copy)**

`scripts/check-remote.sh`:
```bash
#!/usr/bin/env bash
# Checks a deployed copy of the site. Usage: scripts/check-remote.sh https://host
set -uo pipefail
BASE="${1:?usage: check-remote.sh https://host}"
TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
fail=0
check() { # path, expected HTTP status (after redirects), text the body must contain
  local got; got=$(curl -s -L -o "$TMP" -w '%{http_code}' "$BASE$1")
  if [ "$got" != "$2" ] || ! grep -qF "$3" "$TMP"; then echo "✗ $1 → $got (want $2 containing '$3')"; fail=1; else echo "✓ $1"; fi
}
check /                              200 'Social, out loud.'
check /index.html                    200 'Social, out loud.'
for p in privacy privacy.html privacy/; do check "/$p" 200 'PRIVACY POLICY'; done
for p in terms terms.html; do check "/$p" 200 'TERMS OF SERVICE'; done
for p in contact contact.html; do check "/$p" 200 'hear from you'; done
for p in child-safety child-safety.html; do check "/$p" 200 'Child Safety Standards'; done
for p in delete-account delete-account.html; do check "/$p" 200 'name="delete-account"'; done
for p in delete-account-received delete-account-received.html; do check "/$p" 200 'Request received'; done
check /features                      200 'Everything you can say'
check /safety                        200 'Tools to keep Cascane yours'
check /sitemap-index.xml             200 'sitemap-0.xml'
check /sitemap-0.xml                 200 'https://www.cascane.app/features'
check /robots.txt                    200 'Sitemap: https://www.cascane.app/sitemap-index.xml'
check /site.webmanifest              200 '"name": "Cascane"'
check /this-page-does-not-exist      404 'Lost signal.'
for f in og.png favicon.ico badges/app-store.svg badges/google-play.svg; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/$f"); [ "$code" = 200 ] && echo "✓ /$f" || { echo "✗ /$f → $code"; fail=1; }
done
echo "x-robots-tag on /: $(curl -sI "$BASE/" | grep -i '^x-robots-tag' | tr -d '\r' || echo '(none)')"
exit $fail
```

`scripts/form-test.mjs`:
```js
// Submits the delete-account form once on a deployed copy, as a real browser would.
// Usage: node scripts/form-test.mjs https://host
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const base = process.argv[2];
if (!base) throw new Error('usage: node scripts/form-test.mjs https://host');
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
  const page = await browser.newPage();
  await page.goto(`${base}/delete-account`, { waitUntil: 'networkidle0' });
  await page.type('#email', 'test+deletion-form@cascane.app');
  await page.type('#message', 'TEST — ignore (automated check of the redesigned form)');
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.click('form[name="delete-account"] button[type="submit"]')]);
  assert.match(new URL(page.url()).pathname, /^\/delete-account-received(\.html)?$/, `landed on ${page.url()}`);
  assert.equal(await page.$eval('h1', (h) => h.textContent.trim()), 'Request received');
  console.log('✓ form submitted and landed on', page.url());
} finally {
  await browser.close();
}
```

Run: `chmod +x scripts/check-remote.sh && git add scripts/check-remote.sh scripts/form-test.mjs && git commit -m "test: remote checks for a deployed copy of the site

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`

- [ ] **Step 2: Push the branch and open a draft PR**

```bash
git push -u origin redesign-astro
gh pr create --draft --base main --head redesign-astro \
  --title "Redesign cascane.app on Astro" \
  --body "$(cat <<'EOF'
Rebuilds cascane.app on Astro with the dark "Social, out loud." design. Spec: docs/superpowers/specs/2026-09-29-website-redesign-design.md

Draft: for the Deploy Preview only. Do not merge until the site owner approves the preview.

- Every legacy URL keeps working (file-format build, verified by scripts/verify.mjs and scripts/check-remote.sh)
- delete-account Netlify form unchanged (same name, fields, honeypot, action)
- Privacy/Terms text byte-identical to the live site; Child Safety text word-for-word

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
PR=$(gh pr view --json number -q .number); echo "PR #$PR"
```

- [ ] **Step 3: Wait for the Deploy Preview**

```bash
PREVIEW="https://deploy-preview-$PR--cascane-site.netlify.app"
for i in $(seq 1 60); do
  body=$(curl -s "$PREVIEW/") && echo "$body" | grep -q 'Social, out loud.' && { echo "preview up: $PREVIEW"; break; }
  sleep 10
done
```
Expected: `preview up: https://deploy-preview-N--cascane-site.netlify.app` within 10 minutes.

**If it never comes up**, run `gh pr checks $PR`. If no Netlify check exists, Deploy Previews are off for this site. **Stop and ask the user** to enable them: Netlify → cascane-site → Project configuration → Build & deploy → Continuous deployment → Deploy Previews → "Any pull request against your production branch / branch deploy branches". Then trigger a new build with `git commit --allow-empty -m "chore: trigger deploy preview" && git push`, and repeat this step. If the Netlify check exists but failed, read its log link and fix the build.

- [ ] **Step 4: Run the remote checks on the preview**

Run: `scripts/check-remote.sh "$PREVIEW"`
Expected: every line `✓` and exit 0. Note the printed `x-robots-tag` value for the report; Netlify is expected to send `noindex` on previews.

- [ ] **Step 5: Test the form on the preview, then clean up**

Run: `node scripts/form-test.mjs "$PREVIEW"`
Expected: `✓ form submitted and landed on …/delete-account-received`.

Then, through the Netlify connection:
1. `netlify-project-services-updater` → `manage-form-submissions` with `{ action: "get-submissions", formId: "6a86f337dcbe280008dec5fe", siteId: "14564ab0-d590-42ce-98b4-d332fd922cbb" }`. Find the submission whose email is `test+deletion-form@cascane.app`.
2. If it's there, delete **only that one**: `manage-form-submissions` with `{ action: "delete-submission", submissionId: "<its id>", siteId: "14564ab0-d590-42ce-98b4-d332fd922cbb" }`. Never touch the real submission from 2026-08-20.
3. If it isn't there, Netlify did not record preview submissions (their docs don't say whether it does). Record that for the report. The form test then happens on production right after going live (Task 12, Step 3).
4. `netlify-project-services-reader` → `get-forms-for-project`: the `delete-account` form's fields must still be exactly `subject, bot-field, email, username, message`.

- [ ] **Step 6: Report to the user and STOP**

Send the user:
- the preview URL;
- the check-remote result (all ✓);
- the x-robots-tag value;
- whether the preview form submission was recorded, and that it was deleted;
- that nothing is live yet.

Ask them to look through the preview and say whether to go live. **Do not merge, do not push to `main`.**

---

### Task 12: Go live (only after the user explicitly says so)

- [ ] **Step 1: Merge**

```bash
gh pr ready $PR
gh pr merge $PR --merge --delete-branch=false
```

- [ ] **Step 2: Wait for production and re-run the remote checks**

```bash
for i in $(seq 1 60); do curl -s https://www.cascane.app/ | grep -q 'Social, out loud.' && { echo live; break; }; sleep 10; done
scripts/check-remote.sh https://www.cascane.app
```
Expected: `live`, then every line `✓`, with no `x-robots-tag: noindex` on production.

- [ ] **Step 3: Form check on production (only if the preview submission was not recorded in Task 11)**

Run `node scripts/form-test.mjs https://www.cascane.app`. Then find and delete that single test submission through `manage-form-submissions`, exactly as in Task 11, Step 5.

- [ ] **Step 4: Rollback, if anything is wrong**

`git revert -m 1 <merge sha> && git push origin main` restores the old site in about a minute (or re-publish the previous deploy from the Netlify dashboard).

- [ ] **Step 5: Hand the user the Search Console steps**

1. Open https://search.google.com/search-console and pick the cascane.app property (it's already verified by the site's meta tag).
2. Go to Sitemaps, enter `sitemap-index.xml`, and press Submit.
3. Optional: in URL Inspection, enter `https://www.cascane.app/` → Request indexing.

Mention that Google creates sitelinks automatically, and that they can take weeks to appear.
