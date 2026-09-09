# Landing page: self-onboarding without anyone from Site Log

**Status: proposed 2026-09-09.** Requested by the owner. Sequencing note
from `docs/specs/2026-09-06_self-service-plan-billing.md`'s Out of scope:
"the landing page with demo: the next two specs after this one" — this is
that spec, ahead of billing rather than after it, at the owner's request.

**Open question this spec does not resolve:** PROJECT.md §1a
(`docs/research/2026-09-06_swiss-competitors.md`, point 4) says "no
landing page... no further features for sale" until the crew-language
hypothesis is tested with real firms. Publishing this file costs nothing
— it adds no first-paint weight and nothing links to it — but *promoting*
it (a link from anywhere external, a message to a firm) is a decision
still owed to that open question. Building it now is fine; announcing it
is a separate call for the owner to make.

## Goal

A public page a Swiss roofing or Spengler firm's **owner or Polier** can
open, understand in German, and use to start self-onboarding — without
a call, an e-mail exchange, or anyone from Site Log doing anything. The
page explains the crew's morning on a phone; it is written to the person
who decides whether to try it, not to the crew who will use it.

## Constraints

- PROJECT.md §1 (languages: 11 are actually translated — `de, gsw, fr,
  it, en, es, pt, pl, sk, cs, sq`; `ro, bg, hu` are listed in the app's
  picker but fall back to English almost everywhere — **never claim
  those three here**), §1a (no "ahead of the market" language — the
  Swiss field already has ALBAU, SORBA, Werkli, noovi, Baunex, BRIXX;
  Rapport/QR-Rechnung/bexio/offline are table stakes there, stated as
  plain capabilities, not a claim of being first or best), §1b (no
  manual step per customer — the only path in is the existing
  self-service sign-up, nothing new to build for onboarding itself).
- No price invented. CHF 290 (the value plan's figure) is withdrawn per
  §1a. The page's price area reads **"Preis auf Anfrage"** or is omitted
  outright until the owner sets a real number — this spec does not set
  one.
- No billing, Abo, Stripe integration or private-server work. Those are
  separate, unstarted specs (`2026-09-06_self-service-plan-billing.md`,
  `2026-09-06_private-server-migration.md`).
- No demo that needs seeded production data or a live customer job: no
  embedded live app, no iframe into a real company, no login. A morning
  on site is told and shown with static images, not run live.
- Static, on GitHub Pages, next to the app — **must not add one byte to
  the app's first-paint bundle**. Its own HTML/JS is a separate file the
  esbuild entry graph never imports, so `logic.test.mjs`'s "first-paint
  JS stays under 350 KB" test (which walks `build/bundle.js`'s own
  static imports) cannot see it and is unaffected by construction.
- No founder inbox as the primary call to action. The single button is
  "Kostenlos starten" into the existing sign-up; an e-mail address is
  present only as a small, secondary, backup contact.

## Design

### Where the file lives, and why it cannot touch the budget

`willkommen.html`, a new file at the repo root, alongside the three
static pages already there (`docs/CODE_MAP.md`'s own list:
`index.html`, `build/`, `sw.js`, `tailwind.css`, `datenschutz.html`,
`404.html`). `datenschutz.html` is the precedent to copy: a standalone
`<!doctype html>` document, its own inline `<style>`, the same dark
palette (`#1b1b1a` background, `#f5f1e8` text, `#e8b923` accent,
`color-scheme: dark`), no build step, `<meta name="site-log-build">`
not needed since nothing here is versioned against the app bundle.
`willkommen.html` gets one addition datenschutz.html doesn't need: a
small inline `<script>` for the language picker (below). It is never
imported by `entry.jsx`, `roofing-site-manager.jsx`, or any lazy chunk,
and no chunk imports it — the esbuild entry point is `entry.jsx` alone,
so a file nothing points to from there is invisible to the bundler and
to the budget test that walks the bundle's own import graph.

`.github/workflows/pages.yml` already does
`actions/upload-pages-artifact@v3` with `path: .` — the whole repository
root is published as the Pages source (confirmed: this is exactly how
`datenschutz.html` and `404.html` are already live today). A new
top-level HTML file needs **no workflow change** to go live; committing
it is enough. The pages.yml "bundle matches source" guard only checks
`git status` on `build tailwind.css index.html sw.js` — `willkommen.html`
is outside that check, same as `datenschutz.html` is today.

### Page outline (sections, in order)

1. **Hero.** One sentence: a phone-first site log for Swiss roofing and
   Spengler crews. "Kostenlos starten" (primary button, → `index.html`,
   the existing self-service sign-up) directly under it. A static
   screenshot or a simple SVG phone mockup of the Heute screen, not a
   live embed.
2. **Für wen** (who it's for). Addressed to the firm owner or Polier by
   name — "Sie entscheiden, Ihre Crew tippt" — one paragraph distinguish-
   ing the reader (who is choosing) from the crew (who will use the
   phone on the roof).
3. **Ein Morgen auf der Baustelle** (a morning on site). A short,
   narrated walkthrough with 3–4 static screenshots (or the same SVG
   mockup style, several frames): clock in, log material with a photo,
   take a GAV break, a note auto-translated for a colleague who reads a
   different language. No interactive element; nothing here calls the
   app, Firestore, or the Worker.
4. **Sprachen.** Names the 11 languages that are actually translated
   (`de, gsw, fr, it, en, es, pt, pl, sk, cs, sq`), explicitly not the
   other three the app's own picker lists. This section doubles as the
   page's own language picker (below).
5. **Offline.** One short paragraph: works without signal on a roof,
   syncs when the connection returns.
6. **Rapport, QR-Rechnung, bexio.** Three short, factual paragraphs —
   signed Rapport with the GAV split, a Swiss QR-bill straight from a
   job, a bexio Personal Access Token pushes contacts and invoices. No
   comparison to any competitor, no "only", "first" or "best" language.
7. **Preis.** "Preis auf Anfrage" (or the whole section omitted — the
   implementation may drop it rather than show an empty promise).
8. **Datenschutz.** One line + a link to the existing `datenschutz.html`
   (already names the operator and every fact about where data goes;
   nothing new to write).
9. **CTA + footer.** "Kostenlos starten" again (→ `index.html`), then
   the operator line already used on `datenschutz.html` (Andrzej
   Bizior, Si-Ma, Birmensdorf) and a small "Fragen? a.bizior@pm.me" —
   visually secondary to the button, never the only way in.

### The language picker

Same UX pattern as the sign-in screen's `ui/lang-picker.jsx`
(`AuthLangPicker`, `[data-auth-lang]`): a native `<select>` with an
accessible name, one option per language, switching the page's own
visible copy. It cannot be the same component — that component is part
of the React app bundle, and importing it here would defeat the whole
point of keeping this page outside the first-paint graph. Instead:

- New, small, `willkommen.html`-only translation files —
  `i18n/landing/de.json`, `i18n/landing/en.json`, etc. — one per
  language, a handful of keys (hero title/subtitle, section headings,
  the CTA label, the language-picker's own accessible name), **not**
  the app's ~940-key files. A different shape on purpose: this content
  is marketing copy, the app's `i18n/*.json` is UI strings: conflating
  them would make either one harder to keep honest.
- A small inline `<script>` in `willkommen.html` (plain JS, no
  framework, no esbuild) that reads the picker's value, `fetch()`es
  `i18n/landing/<code>.json`, and replaces the page's text nodes by a
  `data-i18n="<key>"` attribute on each element — the same
  attribute-driven substitution pattern is common and keeps the HTML
  readable without a templating step.
- Rollout: ship with **German and English** copy translated (English
  is the app's own second fully-translated language); the remaining
  nine language files can follow incrementally without touching the
  page's structure. The picker still lists only languages that have a
  real `i18n/landing/<code>.json` — never a language whose file doesn't
  exist yet, so the same honesty rule from PROJECT.md §1 holds here
  from day one, not as a later fix.
- The choice is stored the same way the sign-in picker stores it —
  `localStorage.setItem("site-log-lang", code)` — so a visitor who
  picks a language here and then clicks "Kostenlos starten" lands on
  the sign-up screen already in that language. Reading that value back
  is the app's existing behaviour (`entry.jsx` already preloads the
  saved language); nothing in the app needs to change for this to work.

### CTA into onboarding — no code change needed

"Kostenlos starten" is a plain `<a href="index.html">` (or
`index.html#signup` if a direct link to the onboarding screen turns out
to need a query parameter — to confirm during implementation by reading
`onboarding.js`'s existing join-code handling, not assumed here). The
existing self-service sign-up (PROJECT.md §1b baseline, 2026-09-05
onboarding spec) already handles a brand-new visitor with no company —
this spec adds no new entry point, no new Firestore rule, no new Worker
route. The link is one-directional (landing → app); a reciprocal link
from the sign-in screen back to `willkommen.html` would touch
`roofing-site-manager.jsx` and is deliberately left out of this spec's
Definition of done — a one-line follow-up once the page exists, not a
blocker to shipping it.

## Definition of done

- `willkommen.html` exists at the repo root with the nine sections
  above, valid HTML, no console errors, no reference to `build/*.js` or
  any app chunk (checkable by reading the file — it imports nothing).
- `i18n/landing/de.json` and `i18n/landing/en.json` exist and cover
  every `data-i18n` key the page uses; the picker offers exactly the
  languages that have a file, German first.
- "Kostenlos starten" (both instances) link to `index.html`; the
  Datenschutz link points to `datenschutz.html`.
- No price is invented: the page shows "Preis auf Anfrage" or no price
  section at all.
- `docs/CODE_MAP.md`'s "Shape" bullet gains `willkommen.html` in the
  same list as `datenschutz.html`/`404.html`, and a new row for
  `i18n/landing/`; `docs/DEVLOG.md` gets the implementation entry — both
  in the commit that adds the file, not part of this spec.

### Tests that will exist once this is implemented

- **Logic (`logic.test.mjs`), a static-content guard** — mirroring the
  existing pattern that keeps `datenschutz.html` honest: reads
  `willkommen.html` and asserts it contains no `build/` or chunk
  reference (proving the zero-coupling claim above mechanically, not
  just by inspection); reads every `i18n/landing/*.json` and asserts
  the picker's own language list (parsed from the HTML) never names a
  language without a matching file, and never names `ro`, `bg` or `hu`.
  Confirms `logic.test.mjs`'s existing first-paint test is unaffected —
  no new assertion needed there, since the file is provably outside the
  import graph.
- **e2e (`e2e/landing.spec.mjs`, Playwright, the existing pattern in
  `e2e/crew-morning.spec.mjs`/`e2e/owner-cockpit.spec.mjs`, helpers from
  `e2e/helpers.mjs` where they fit)** — navigates straight to
  `/willkommen.html` (no `signIn()`, no emulator dependency: the page
  needs neither Firebase Auth nor Firestore), asserts the hero and CTA
  render, the language picker switches the visible hero text between at
  least German and English, and clicking "Kostenlos starten" navigates
  to `index.html`. Runs in CI exactly like the existing e2e specs
  (`npm run test:e2e` / `npx playwright test`), no new CI job.
- **Manual/emulator check** (per PROJECT.md §2b's production
  verification bar): open the deployed page, confirm no first-paint
  regression by re-running `node logic.test.mjs` after the change lands
  and reading the reported KB figure, and click through "Kostenlos
  starten" once on the real static server to confirm the sign-up screen
  actually opens.

## Out of scope

- The billing Worker, an Abo, Stripe, hard plan enforcement (separate,
  unstarted specs).
- Report Phase 2 (the arrangeable report) — unrelated work, already
  queued from `docs/DEVLOG.md`'s 2026-09-08 entries.
- A live or interactive demo of any kind.
- The nine remaining `i18n/landing/*.json` files beyond German and
  English — incremental follow-ups, not blockers.
- The reverse link from the sign-in screen back to the landing page.
- Deciding whether or when to promote this page anywhere — see the open
  question at the top of this spec.
