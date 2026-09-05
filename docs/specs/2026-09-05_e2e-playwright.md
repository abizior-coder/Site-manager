# End-to-end tests in a real browser

**Status: implemented 2026-09-05** (accepted the same day; engineering audit, testing; owner:
"wykonaj wszystkie krok po kroku").

## Goal

The suites so far run in jsdom. One Chromium run per push proves the
real thing: the built app, the service worker, Firebase Auth and
Firestore against the emulator, a crew member's morning and the owner's
Cockpit.

## Design

- `@playwright/test`, `playwright.config.mjs`: Chromium only, base URL
  `http://localhost:5566`, a static server started by the config, one
  retry in CI, traces on failure.
- `e2e/`: `crew-morning.spec.mjs` (sign in as crew1, the tab bar, the «+»
  sheet with its six actions, a job's hub tabs, sign out) and
  `owner-cockpit.spec.mjs` (sign in as chef, Cockpit cards: usage, errors,
  backup, accounting export with the month input).
- `npm run test:e2e` = `firebase emulators:exec --only auth,firestore
  "npm run seed && playwright test"`; CI job `e2e` after `test`, with
  Chromium installed via Playwright.

## Definition of done

- Both specs pass locally and in CI; a failing spec leaves a trace.

## Out of scope

- Visual regression; mobile device emulation beyond the viewport.
