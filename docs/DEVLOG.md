# Dev log — one entry per commit

The model-facing record: what changed, why, which files, what proves it.
Newest first. The pre-commit hook refuses a source change without a new
entry here; `docs/CODE_MAP.md` is updated in the same commit when a file
is added, moved or changes its job.

## 2026-09-06 — Build reproducible across platforms (.gitattributes, LF)

- **Why:** CI's "Bundle matches source" failed on d08d677: a `git stash
  pop` on Windows had rewritten the working copies with CRLF (autocrlf),
  Prettier restored LF only where it runs, the language JSON files (in
  `.prettierignore`) kept CRLF, esbuild's text loader embedded `` into
  the language chunks, and the committed chunk hashes differed from the
  Linux build. The deploy was skipped, production stayed on b05d5bff84.
- **What:** every tracked text file normalised to LF; `.gitattributes`
  pins `* text=auto eol=lf` so every checkout on every platform is LF;
  the build is committed again with the hashes CI produces.
- **Lesson:** never trust the working copy's line endings after a git
  checkout/stash on Windows; the attributes file now makes that moot.

## 2026-09-06 — Swiss competitor research (correction of 2026-09-04)

- **Why:** the owner pointed out that the 2026-09-04 research covered
  plancraft and ToolTime (German market) and none of the Swiss vendors.
- **What:** `docs/research/2026-09-06_swiss-competitors.md` from the
  vendors' own pages: ALBAU/OF-Bau, SORBA, Werkli, noovi, Baunex, BRIXX,
  Technoova (+ Jobilino for languages); feature-by-feature against Site
  Log; prices; market size (~850 firms / 4,000 employees under the GAV).
  PROJECT.md §1a records the reality and withdraws the "ahead of the
  competition" line and the CHF 290 price. The private-server plan and
  the billing/landing steps are parked until the crew-language hypothesis
  is tested with real firms.

## 2026-09-06 — Plan: Site Log on a private server (spec, proposed)

- **Why:** the owner asked for a plan to move the whole suite to a private
  server so database and file size limits stop shaping the product.
- **What:** `docs/specs/2026-09-06_private-server-migration.md` — the
  limits today (1 MiB documents, 900 KB photos, 25 MB files, Spark quotas,
  KV-only server state, rules DSL, emulator blind to uploads) and what
  removes each; target: Caddy + Fastify API + PostgreSQL 16 + MinIO in
  Docker Compose on a Swiss VPS; auth stays Firebase until phase 3; a
  change-feed sync (SSE + IndexedDB mirror) replaces `onSnapshot`; four
  phases (seams/local stack → files+photos → data → auth+Worker jobs →
  hosting+paperwork) with read-back checks and a month-long way back.
- **Waits on the owner:** provider, location, budget, phase order.
- **Effect on the open batch:** the Abo (billing) moves to the API in
  phase 3; `worker/src/plan.js` stays an uncommitted draft; ownership
  transfer and company deletion are planned on the API, not on Firestore.

## 2026-09-06 — Language before sign-in; QR-bill code lazy; code map + dev log

- **Why:** UI audit pass 2 finding 20 and PROJECT.md §1b — a crew member
  must be able to sign in without help, in their own language. The owner
  asked for a code map and a per-commit log so a session starts from the
  map instead of searching.
- **Language:** `ui/lang-picker.jsx` (`AuthLangPicker`, `[data-auth-lang]`,
  14 languages, accessible name `t.languageLabel`) on the sign-in and the
  onboarding screen; `lang` state initialised from `localStorage`
  `site-log-lang` (validated with `isLang`); `changeLang` writes it;
  `entry.jsx` preloads the saved language with en/de. New i18n key
  `languageLabel` in all 14 files.
- **Budget:** the picker pushed the first paint 194 bytes over 350 KB, so
  the QR-bill payload/QR/Swiss cross moved to `swiss-qr-bill.js`, loaded
  when a bill is printed or a pickup QR is drawn; `swiss-qr.js` keeps the
  validation the billing form needs at render time. First paint 349 KB.
- **Tooling:** `.*-under-test.mjs` (the suites' temporary bundles) ignored
  by ESLint, Prettier and git — a crashed suite had left one behind and
  lint failed on it. `docs/CODE_MAP.md`, this log, a logic test that every
  source file is named in the map, and the hook rule for this log.
- **Tests:** e2e `crew-morning.spec.mjs` "sign-in screen: the language
  picker works before signing in and is remembered" (select sq → button
  "Hyr", `html[lang=sq]`, reload keeps it); logic 305, render 150, order
  11, dock 21, worker 30, e2e 3 — all green. Emulator: picker 39 px high,
  Albanian applied to the whole sign-in screen, kept after reload.
- **Noted:** one Playwright run timed out on the owner spec (60 s waiting
  for the sign-in screen) and passed on the rerun; watch for it in CI.
- **Not committed:** `worker/src/plan.js` draft for the Abo (waits for the
  private-server migration plan, which decides where billing lives).
