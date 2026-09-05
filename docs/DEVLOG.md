# Dev log — one entry per commit

The model-facing record: what changed, why, which files, what proves it.
Newest first. The pre-commit hook refuses a source change without a new
entry here; `docs/CODE_MAP.md` is updated in the same commit when a file
is added, moved or changes its job.

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
