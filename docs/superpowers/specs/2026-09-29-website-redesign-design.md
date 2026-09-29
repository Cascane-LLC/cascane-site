# cascane.app Redesign — Design Spec

**Date:** 2026-09-29
**Repo:** `Cascane-LLC/cascane-site` (local: `~/Downloads/cascane-site`)
**Netlify project:** `cascane-site` → https://www.cascane.app (auto-deploys `main`)
**Status:** Design approved in brainstorm; this spec awaits review.

---

## 1. Intent

**Goal.** Replace the current bare, single-stylesheet site with one that reads like the homepage of a major social network: someone landing on cascane.app immediately understands what the product is, trusts it, and knows how to get it. The legal and safety pages feel like part of the same product, not an afterthought.

**Secondary goal.** Make the site as eligible as possible for a rich Google result (favicon, site name "Cascane", sitelinks under the main result).

**Decisions already made:**

| Decision | Choice |
|---|---|
| Theme | Dark, cinematic — continuous with the app's OLED-black UI |
| Stack | Astro, static output, deployed on Netlify |
| Product imagery | 5 of the 7 iOS store images in `~/Desktop/app store photos dupe/app store files` (originals never modified) |
| Calls to action | Official App Store + Google Play badges; app is live on both stores |
| Rollout | Built on a branch, verified on a Netlify Deploy Preview, merged to `main` only on explicit go-ahead |

**Non-goals.** No web version of the app, no logins, no blog/help center (the stack leaves room for them later). No fabricated social proof: no invented user counts, testimonials, ratings or press logos.

---

## 2. Hard constraints

1. **Every existing URL keeps working exactly as today.** Google Play Console and Search Console reference them. Legacy paths that must return 200 with the right page:
   `/`, `/index.html`, `/privacy`, `/privacy.html`, `/terms`, `/terms.html`, `/contact`, `/contact.html`, `/child-safety`, `/child-safety.html`, `/delete-account`, `/delete-account.html`, `/delete-account-received`, `/delete-account-received.html`.
   Mechanism: Astro `build.format: 'file'` emits `privacy.html` etc. at the root exactly as today, and Netlify's Pretty URLs (on by default) keep serving both the extensionless and `.html` forms, as they do now. No redirect rules are needed; the verification in §9 proves it.
2. **The `delete-account` Netlify Form must keep working.** The form's `name="delete-account"`, `method="POST"`, `data-netlify="true"`, `netlify-honeypot="bot-field"`, `action="/delete-account-received"`, the hidden `form-name` and `subject` inputs, the honeypot field, and the field names `email` / `username` / `message` are preserved byte-for-byte in the rendered HTML. The form must be present in static HTML (it will be, since Astro renders it at build time) so Netlify's build-time form detection finds it.
3. **Legal and child-safety wording is unchanged.** Privacy and Terms keep the Termly-generated body HTML verbatim; Child Safety keeps its current text word-for-word. Only the presentation around them changes.
4. **The originals in `~/Desktop/app store photos dupe` are never modified.** Copies are taken into the repo and processed there.
5. **Google site verification meta tag** (`YebptMeSaMRmH9P3XirwODk8zuesbpQQuMm41_QLcAE`) stays on the homepage.
6. **`CNAME` file** is carried over into the published output unchanged.

---

## 3. Visual system

### 3.1 Color tokens (from `lib/core/design_system/app_colors.dart`)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#08080A` | Page background (app `nearBlack` is `#080809`) |
| `--surface-1` | `#111114` | Cards, panels |
| `--surface-2` | `#18181C` | Raised cards, inputs (near app `authSurface #141418`) |
| `--line` | `rgba(255,255,255,0.08)` | Hairlines, card borders |
| `--text` | `#FFFFFF` | Headings, primary text |
| `--text-2` | `#A1A1AA` | Body copy (≥ 4.5:1 on `--bg`) |
| `--text-3` | `#8A8A93` | Captions, meta (app `authMist`; ≥ 4.5:1 on `--bg`) |
| `--accent` | `#00D9FF` | Brand cyan (`neonBlue`) — links, active states, glows |
| `--accent-2` | `#00FFD1` | Gradient partner (`accentShimmer`) |
| `--accent-3` | `#11FF00` | `brandGreen` — only inside the "unlistened ring" motif and the online dot |

Cyan is used sparingly: links, the active tab, focus rings, and light/glow effects. Large surfaces stay neutral. The app's "unlistened ring" (a sweep gradient green → cyan → shimmer → cyan → green) is reused as a signature motif around avatar bubbles in the HTML recreations.

The site is dark-only; there is no light theme to switch to. `color-scheme: dark` is declared so browser UI (scrollbars, form controls) matches.

### 3.2 Typography

- **Inter Variable**, self-hosted through `@fontsource-variable/inter` (no Google Fonts request; `font-display: swap`; Latin subset preloaded).
- Display: weight 650–700, letter-spacing −0.035em, line-height 1.02–1.08. Hero heading `clamp(2.75rem, 6.5vw, 5.5rem)`.
- Section headings `clamp(2rem, 4vw, 3.5rem)`, weight 650, −0.03em.
- Body 17–18px (desktop) / 16px (mobile), line-height 1.6, `--text-2`.
- Eyebrow labels: 13px, weight 600, uppercase, +0.08em, `--accent`.
- `font-feature-settings: "cv11", "ss01"` (Inter's single-storey a and open digits) for a more product-grade look.

### 3.3 Layout and shape

- Max content width 1200px; reading column 720px; side gutters 20px (mobile) → 32px (desktop).
- Section vertical rhythm `clamp(96px, 12vw, 160px)`.
- Radii: cards 20px, large panels 28px, pills 999px.
- Primary button: white pill, black text (mirrors the app's white CTA). Secondary: `--surface-2` pill with a hairline border.

### 3.4 Phone presentation

Screenshots are shown as phone panels: the store images already contain a bezel-less black phone panel with rounded corners. Each copy is cropped tight to that panel (see §6.1), and the component clips with a matching `border-radius` (≈ 14.1% of the panel width, from the store spec: radius 148 on a 1050-wide panel), so the white store background never shows at the corners. Each phone sits on a "stage":
- a soft radial light from above (`--accent` at ~8–12% opacity, very large blur);
- a 1px rim highlight (`rgba(255,255,255,0.10)` → transparent);
- a long, soft drop shadow so the black phone separates from the black page.

### 3.5 Motion

- Scroll reveals: content fades up 16px over 600ms (`cubic-bezier(.2,.7,.2,1)`), staggered 60ms; driven by `IntersectionObserver`, run once.
- Hero phone: a slow 6s float (±6px) plus a subtle pointer-follow tilt (max 4°) on fine-pointer devices only.
- Waveform motif: animated bars (CSS) in the "Why voice" band.
- Page-to-page: CSS cross-document View Transitions (`@view-transition { navigation: auto; }`), with a fade. Zero JS; browsers without support simply navigate normally.
- **Store badges are never animated, tilted or revealed with motion** (Apple: "Don't modify, angle, or animate the App Store badge"). Their containers are excluded from the reveal system.
- `prefers-reduced-motion: reduce` disables float, tilt, reveals, waveform animation and view transitions.

---

## 4. Site map

| URL (canonical) | Source | New? | Indexed |
|---|---|---|---|
| `/` | `src/pages/index.astro` | redesigned | yes |
| `/features` | `src/pages/features.astro` | **new** | yes |
| `/safety` | `src/pages/safety.astro` | **new** | yes |
| `/contact` | `src/pages/contact.astro` | redesigned | yes |
| `/delete-account` | `src/pages/delete-account.astro` | redesigned | yes |
| `/delete-account-received` | `src/pages/delete-account-received.astro` | redesigned | **no** (`noindex`, as today) |
| `/child-safety` | `src/pages/child-safety.astro` | redesigned | yes |
| `/privacy` | `src/pages/privacy.astro` | re-skinned | yes |
| `/terms` | `src/pages/terms.astro` | re-skinned | yes |
| 404 | `src/pages/404.astro` | **new** | no |

Canonical URLs are extensionless on the `www` host (e.g. `https://www.cascane.app/privacy`). Internal links use the extensionless form.

---

## 5. Pages

### 5.1 Global chrome

**Top menu (every page).**
- Left: app-icon mark (the five-dot glyph on cyan, 28px, radius 8px) + "Cascane" wordmark.
- Center (desktop): Features · Safety · Contact.
- Right: **Get the app** (white pill).
- Behaviour: fixed; transparent over the hero, then `rgba(8,8,10,0.72)` + `backdrop-filter: blur(20px)` + hairline bottom border once scrolled more than 8px.
- Mobile (<860px): links collapse into a menu button that opens a full-screen sheet (large links, both store badges at the bottom, focus kept inside while open, closes on Esc).
- **Get the app** routing (small inline script): iOS → App Store listing; Android → Play listing; everything else → `/#download`. Without JS it links to `/#download`.

**Footer (every page).**
- Brand column: mark + wordmark, one-line tagline. **No badges in the footer**: they would sit on screen next to the badges in the download band just above it (Apple: one App Store badge per layout).
- Link columns — **Product:** Features, Daily, Convos, Channels (anchors into `/features`), plus plain text links "Download for iPhone" / "Download for Android" to the two store listings. **Company:** Contact, Safety Center. **Legal:** Privacy Policy, Terms of Service, Child Safety, Delete Account.
- Bottom row: `© 2026 Cascane LLC · 522 W Riverside Ave Ste N, Spokane, WA 99201`, plus the trademark line: "Apple and the Apple logo are trademarks of Apple Inc., registered in the U.S. and other countries. App Store is a service mark of Apple Inc. Google Play and the Google Play logo are trademarks of Google LLC."

**Store badges.**
- Official artwork only: Apple's black "Download on the App Store" badge (en-US) from Apple's App Store marketing toolbox, and Google's "Get it on Google Play" badge (en) from Google's badge asset package. Committed as SVG where offered, otherwise PNG at 3× the displayed size.
- Links: App Store `https://apps.apple.com/app/cascane/id6802686539`; Google Play `https://play.google.com/store/apps/details?id=app.cascane.mobile&hl=en`.
- Order: App Store first, Google Play second (Apple rule).
- Size: visible badge height 48px (desktop) / 44px (mobile). The Google badge's visible artwork height is **equal to or larger than** Apple's (Google rule). Google's PNG has built-in transparent padding, so it is sized by its visible artwork, not its box.
- Clear space: at least ¼ of the badge height on all sides (both brands' rule).
- Placement: the homepage hero, the homepage `#download` band, the `/features` closing band, and the mobile menu sheet. There is at most one badge pair per page region, never two pairs on screen at once (the hero and download band are a full page apart; the menu sheet covers the page). The badges stay subordinate to the headline and phone (Apple rule).
- Accessible names: "Download Cascane on the App Store" / "Get Cascane on Google Play".

**iOS Smart App Banner.** `<meta name="apple-itunes-app" content="app-id=6802686539">` on every page, so Safari on iPhone shows its native "Open / Get" banner.

### 5.2 Home (`/`)

Section order and content:

1. **Hero.**
   - Eyebrow: "Voice-first social".
   - Headline — primary pick **"Conversations you can actually hear."** Alternatives, choose one before implementation: "Say it with your voice." / "Talk like you mean it."
   - Subhead: "Cascane is a social app where every message is a voice. Talk with friends, jump into Convos about anything, and follow the people you want to hear from."
   - Store badges, then a small meta line: "Free on iPhone and Android."
   - Visual: `chat_page` phone on a lit stage, cyan rim glow, float + tilt. Desktop is two columns (text left, phone right, the phone slightly overlapping the next section); mobile stacks the phone under the text.
2. **"Why voice" band.** A single large statement, centered, max about 18 words: "Text flattens people. Voice brings back the tone, the laugh, the pause before the punchline." Beneath it, a thin animated waveform in the accent gradient.
3. **"One voice. Five ways to talk." switcher.** An accessible tablist (`role="tablist"`, arrow-key navigation, `aria-selected`) with the tabs **Daily · DMs · Groups · Convos · Channels**. Each panel has a one-line description, 2–3 facts, and an HTML/CSS illustration (§6.2). Copy drafts:
   - **Daily** — "Your day, out loud. Post a voice note to everyone who follows you. It's gone in 24 hours."
   - **DMs** — "One-on-one, in your own voice. See when they're online and when they've listened."
   - **Groups** — "Group chats you can actually hear. Name it, add your friends, and talk."
   - **Convos** — "Ask anything. Everyone answers by voice. Public or private topics with hashtags, votes, and replies that spread through friends."
   - **Channels** — "Broadcast to thousands. Only you post; your subscribers listen."
   - Link: "Explore every feature →" to `/features`.
4. **Feature sections** (phone alternates side; on mobile the text comes first, then the phone):
   - **Convos** — `convos_page`. Eyebrow "Convos". Heading "Start conversations about anything." Points: hashtags; upvote the best; public or private.
   - **Messages** — `inbox_page`. Heading "Every conversation in one place." Points: DMs, groups and Channels together; unread at a glance; find anyone by name.
   - **Channels** — `channel_info_page`. Heading "Your voice, broadcast." Points: subscribers; hashtags for discovery; public or private.
   - **People** — `profile_page`. Heading "Follow the voices you love." Points: followers, mutuals, "Follows you"; your Cascane Score grows as people listen, reply and follow.
5. **"The details that make voice feel alive."** A 3×2 grid of small cards (2×3 on tablet, 1 column on mobile), each with a line icon, title and one sentence:
   - **Reactions** — React to any voice message with an emoji.
   - **Voice replies** — Reply to a specific message and keep the thread together.
   - **Who listened** — See exactly who heard your message.
   - **Photos** — Attach a photo to any voice note.
   - **Disappearing messages** — Set any message to vanish after 1–24 hours, or keep it forever.
   - **Online now** — See when your friends are around.
6. **Explore band.** Heading "Find your people." Text covers trending Convos, trending Channels, Popular Voices and hashtags. Visual: an HTML recreation of trending hashtag chips and a mini "Popular Voices" list (§6.2).
7. **Safety band.** Heading "Built to feel safe." Three cards linking out: "You're in control" (block, mute, hide from Daily) → `/safety`; "Report anything" (six categories, reviewed by our team) → `/safety#reporting`; "Zero tolerance for child exploitation" → `/child-safety`.
8. **Download (`#download`).** App icon (96px, cyan radius-22 tile with glow), heading "Your voice belongs in the conversation.", both store badges.

### 5.3 Features (`/features`)

A full tour with anchor ids for footer links:
- Hero: eyebrow "Features", heading "Everything you can say with Cascane.", a short intro.
- `#daily`, `#dms`, `#groups`, `#convos`, `#channels`: one block each, with 3–5 concrete capabilities taken from the code, and the matching screenshot or illustration. `#convos` uses `convos_page`; `#channels` uses `channel_info_page`; `#dms`/`#groups` share `inbox_page`; `#daily` uses its illustration.
- `#details`: the details grid (a longer version of home §5).
- `#explore`: trending Convos and Channels, Popular Voices, hashtag pages, search.
- `#profiles`: profile, followers/following/mutuals, the Cascane Score explained qualitatively ("earn points when you post, and when people listen, reply, react, upvote, subscribe or follow"). No point values are published.
- Closing download band: a smaller variant of the home `#download` band, with both store badges.

The copy is written so it doesn't duplicate the home page's sentences (Google advises against repeated content).

### 5.4 Safety Center (`/safety`)

- Hero: "Safety Center" / "Tools to keep Cascane yours."
- Principles: three short statements (you choose who hears you; bad actors are removed; your data is yours).
- **Tools** (cards, each with an icon and 1–2 sentences on how it works in the app):
  - Block — they can't message you or see your content.
  - Mute — stop hearing from someone without them knowing.
  - Hide from Daily — keep someone's posts out of your Daily feed.
  - Private Convos & Channels — only people you invite.
  - Disappearing messages — 1–24 hours, or forever.
  - Delete your account — link to `/delete-account`.
- `#reporting`: "How reporting works" — report any message, thread or profile from the app; the six categories are listed in the app's order (Spam or scam · Harassment or bullying · Hate speech or symbols · Violence or threats · Inappropriate content · Something else); reporting a profile offers to block too.
- Child safety summary (2 sentences) → `/child-safety`.
- Links to Privacy Policy and Terms; contact `support@cascane.app` (subject "Safety").

Every claim here must match app behaviour. Implementation re-checks each tool's exact semantics in the Flutter code (`report_sheet.dart`, the block/mute/hidden-daily repositories) before the copy is final.

### 5.5 Contact (`/contact`)

- Hero: "Contact" / "We'd love to hear from you."
- Two cards:
  - **Support** — `support@cascane.app` (subject "Support").
  - **Safety reports** — the same address (subject "Safety Report"), with a note that urgent child-safety concerns go through `/child-safety`.
- Address card: Cascane LLC, 522 W Riverside Ave Ste N, Spokane, WA 99201, United States.

### 5.6 Delete account (`/delete-account`)

- Hero: eyebrow "Account", heading "Delete your account", intro (the current paragraph, kept).
- "What gets deleted" list: profile; every message and voice recording you've sent; every thread and DM you're part of; photos and avatar. Immediate and permanent.
- Two cards side by side (stacked on mobile):
  - **In the app — fastest.** A numbered path: Settings → Security → Delete account. Immediate.
  - **From the web.** The existing text ("verified … typically within 30 days"), then the form (constraint §2.2) restyled: labelled inputs on `--surface-2`, 12px radius, cyan focus ring, required-field marker, the browser's native validation, and a full-width white submit button "Request account deletion".
- The email fallback and privacy link are kept.

### 5.7 Deletion received (`/delete-account-received`)

Centered card: a check mark in a cyan ring, "Request received", the current two sentences, and a "Back to Cascane" button. `noindex`.

### 5.8 Document layout (Child safety, Privacy, Terms)

- Page header: eyebrow (Safety / Legal), H1, "Last updated" date (Privacy and Terms take it from the Termly body; Child Safety shows its commit date, 2026-08-21).
- Two columns on ≥1024px: a sticky "On this page" table of contents (the page's H2s, current section highlighted via `IntersectionObserver`) and the 720px reading column. Single column with a collapsible TOC on mobile.
- **Termly re-skin (Privacy, Terms):** the body HTML is moved verbatim into `src/content/legal/privacy.html` / `terms.html` and rendered with `set:html`. The page's own stylesheet overrides the inline styles scoped under `.legal`: `color`, `font-family`, `font-size` and `line-height` set with `!important` on `.legal *`. That wins over non-important inline styles, so none of the ~1,200 inline style attributes need editing. Link color → `--accent`; tables get dark borders; lists keep their square/circle markers. Both Termly bodies contain their own "TABLE OF CONTENTS" (verified), which stays; the sticky TOC is therefore omitted on these two pages to avoid two TOCs. The sticky TOC appears on Child Safety only.
- Verification (§9) diffs the visible text of the old and new legal bodies to prove they are unchanged.

### 5.9 404

"Lost signal." with a flatlined waveform that twitches once, a short line, and buttons to Home and Contact. `noindex`.

---

## 6. Assets

### 6.1 Screenshots

- Source: `~/Desktop/app store photos dupe/app store files/{chat_page,convos_page,inbox_page,channel_info_page,profile_page}.png` (1320×2868 each). `convo_creation_page` and `group_creation_page` are not used.
- `scripts/prepare-screens.py` (PIL) **copies** each file, finds the phone panel's bounding box (the non-white region below the headline), crops to it, and writes `src/assets/screens/<name>.png`. The crop box is logged for review. Originals are opened read-only.
- Astro `<Picture>` generates AVIF + WebP at 360/540/720/1080px widths with `sizes`; the hero phone is `loading="eager"` + `fetchpriority="high"`, the rest are lazy. Target under 90 KB per image at the size actually displayed.
- Alt text describes the screen content, e.g. "Cascane Convo thread showing friends' voice replies as avatar bubbles".

### 6.2 HTML/CSS illustrations

These are used where no screenshot exists (Daily, Explore, and the switcher panels). Each is built from real app elements: avatar bubbles with the unlistened-ring gradient, waveform bars, timer chips ("23h"), hashtag chips, reaction badges, count pills. Avatars are small circular crops taken from the screenshot **copies** (the same demo people seen in the store images). Illustrations are decorative (`aria-hidden="true"`); each panel's text carries the meaning.

### 6.3 Brand files

- From the Flutter repo, copied: `assets/icons/app_icon.png` (1024², cyan with five white dots) → `favicon.ico` (16/32/48), `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180), and a `site.webmanifest`. All live at stable root URLs.
- Link preview image `public/og.png` (1200×630): a dark stage, the app icon, the "Cascane" wordmark, the hero headline and a cropped hero phone. Rendered once from an HTML template (`scripts/og/og.html`) with headless Chrome, and committed.

---

## 7. SEO and Google result

- Each page has a unique `<title>` (`<Page> · Cascane`; the home page is "Cascane — Voice-first social messaging") and a unique meta description of 140–160 characters.
- `<link rel="canonical">` points to the extensionless `https://www.cascane.app/...` URL on every page.
- Open Graph + Twitter card tags on every page (`og:site_name` = "Cascane", `og:image` = `/og.png`).
- **Home page JSON-LD:**
  - `WebSite` — `name: "Cascane"`, `url: "https://www.cascane.app/"` (Google's site-name signal).
  - `Organization` — name "Cascane LLC", `url`, `logo` (`/icon-512.png`), `email`, `address`, `sameAs` both store URLs.
  - `MobileApplication` — name "Cascane", `operatingSystem` "iOS, Android", `applicationCategory` "SocialNetworkingApplication", `offers` price 0 USD, `installUrl` both stores. No `aggregateRating` (nothing fabricated).
- `sitemap.xml` via `@astrojs/sitemap`: `site: 'https://www.cascane.app'`, serialized to extensionless URLs, excluding the 404 and deletion-received pages.
- `robots.txt`: allow all, with a sitemap reference.
- Internal links use concise anchor text that matches the target page's title (Google sitelink guidance).
- After launch (the user does this, and gets exact steps): submit the sitemap in Search Console.
- Caveat to keep in mind: sitelinks are fully automated by Google and can't be forced. This work maximizes eligibility.

---

## 8. Architecture

```
cascane-site/
├─ astro.config.mjs        site, build.format 'file', sitemap integration
├─ netlify.toml            build command, publish dir, Node version
├─ package.json            astro, @astrojs/sitemap, @fontsource-variable/inter
├─ .nvmrc                  22 (LTS; matched in netlify.toml)
├─ public/                 CNAME, favicons, og.png, robots.txt, site.webmanifest, badges/
├─ scripts/
│  ├─ prepare-screens.py   copy + crop the store images (§6.1)
│  ├─ og/og.html           link-preview template (§6.3)
│  └─ verify.mjs           post-build checks (§9)
├─ src/
│  ├─ assets/screens/      cropped screenshot copies
│  ├─ content/legal/       privacy.html, terms.html (verbatim Termly bodies)
│  ├─ components/          Seo, Nav, MobileMenu, Footer, StoreBadges, Phone,
│  │                       Stage, FeatureRow, TypeSwitcher, DetailCard,
│  │                       Waveform, AvatarBubble, DocLayout, Toc, Button
│  ├─ layouts/             Base.astro (html shell + Seo + Nav + Footer)
│  ├─ pages/               see §4
│  ├─ scripts/             nav.ts, menu.ts, switcher.ts, reveal.ts, tilt.ts,
│  │                       get-app.ts, toc.ts  (all tiny, no dependencies)
│  └─ styles/              tokens.css, base.css, legal.css
└─ docs/superpowers/specs/ this file
```

- Each component has one job and receives its data through props. Pages compose components and hold the page's copy.
- Client JS is plain TypeScript bundled by Astro and loaded only on pages that use it. There are no UI-framework runtimes (no React/Vue). Target: under 10 KB of JS on the home page after gzip.
- `netlify.toml`: `[build] command = "npm run build"`, `publish = "dist"`, `[build.environment] NODE_VERSION = "22"`. No redirect rules (constraint §2.1).
- The old root `*.html` files and `css/style.css` are removed in the same change; their content lives on in `src/`.

---

## 9. Verification

**Test-first.** `scripts/verify.mjs` is written before the pages and fails against an empty build. The pages are built until it passes.

It runs over `dist/` after `astro build` and asserts:
1. Every legacy path in §2.1 maps to an emitted file (`index.html`, `privacy.html`, … at the root).
2. The delete-account form's rendered attributes and fields match §2.2 exactly.
3. The visible text of the Privacy and Terms bodies equals the text extracted from the current `privacy.html` / `terms.html` (normalized whitespace); the same for Child Safety's body copy.
4. Every internal `href`/`src` resolves to a file in `dist/`, with no broken anchors.
5. Each page has exactly one `<h1>`, a unique title and description, and a canonical URL on `https://www.cascane.app` without `.html`.
6. The home page JSON-LD parses, and `WebSite.name === "Cascane"`.
7. `sitemap-index.xml`/`sitemap-0.xml` list exactly the indexable pages from §4; `robots.txt` references the sitemap.
8. `noindex` appears on the 404 and deletion-received pages and nowhere else.
9. Every `<img>` has an `alt` attribute (empty only when `aria-hidden`/decorative).
10. The Google verification meta tag and `CNAME` are present.

Additionally, before the preview:
- Lighthouse (mobile) on `/`, `/features` and `/privacy` via `astro preview`: Performance ≥ 95, Accessibility 100, Best Practices ≥ 95, SEO 100.
- A visual check in the browser at 375px, 768px, 1280px and 1600px, plus reduced-motion mode and keyboard-only navigation.

**On the Netlify Deploy Preview** (a draft PR from branch `redesign-astro`):
- `curl -sI` every legacy path in §2.1: 200 and correct content.
- One test submission of the delete-account form (email `test+deletion-form@cascane.app`, message "TEST — ignore"). Confirm it appears under Netlify Forms and that the browser lands on the "Request received" page. The user then deletes the test entry.
- Confirm the preview responds with an `X-Robots-Tag: noindex` header (to be checked on the real preview, not assumed).
- The user reviews the preview URL. Merging to `main` happens only on explicit go-ahead.

---

## 10. Rollout

1. Branch `redesign-astro` in `cascane-site`.
2. Implement per the plan (writing-plans produces it from this spec).
3. `verify.mjs` + Lighthouse pass locally.
4. Push the branch and open a **draft PR** → Netlify builds a Deploy Preview (unlisted URL; not password-protected).
5. Run the preview checks (§9) and send the user the URL.
6. On the user's go-ahead, merge to `main`, then re-run the legacy-URL `curl` checks against https://www.cascane.app.
7. The user submits the sitemap in Search Console.

Rollback: if anything is wrong after merging, revert the merge commit on `main`. Netlify redeploys the previous static site within a minute (or the previous deploy can be re-published instantly from the Netlify dashboard).

Git actions (commits, the first push, the PR, the merge) are taken only with the user's explicit approval at each step.

---

## 11. Open items (resolve before implementation starts)

- **Hero headline:** keep "Conversations you can actually hear." or pick an alternative (§5.2).
