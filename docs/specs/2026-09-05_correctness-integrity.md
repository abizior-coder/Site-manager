# Correctness and integrity: local dates, local codes, real ids, visible crashes

**Status: implemented 2026-09-05** (accepted the same day; engineering audit H1, H2, H4, part of H7;
owner: "1 potem 2 potem 3").

## Goal

1. **Local calendar dates.** `todayKey`/`monthKey` and every "today" or
   "due date" derivation use the phone's local calendar, never UTC. Pure
   date arithmetic on ISO strings (`weekOf`, `monthDays`, `previousMonth`)
   stays UTC-based because it never touches "now".
2. **Order codes drawn locally.** The pickup QR comes from the `qrcode`
   package already used for the QR-bill; the barcode is Code 128 (subset
   B/C, checksum) rendered as inline SVG by a pure module. No order reference
   leaves the app. Closes audit item L3 as well.
3. **Ids from `crypto.randomUUID()`**, with the old generator only where the
   platform lacks it. Same call sites, same `uid()` name.
4. **Uncaught errors are captured and reported.** `entry.jsx` installs
   `error` and `unhandledrejection` handlers; each event is classified with
   `errors.js`, shown in the error panel (once per distinct message per
   minute, so a loop cannot flood the screen), and sent to the Worker's
   `POST /errors/<cid>` with: build, code, tag, message head (200 chars),
   stack head (400 chars), path, language, user-agent family. No account id,
   no site names. The Worker keeps per company and day up to 200 entries for
   30 days (KV), and answers `GET /errors/<cid>` for owner/supervisor. The
   Cockpit shows an "Fehler" card next to "Nutzung": count per day and the
   last ten entries. Before sign-in (no company), errors are only shown.
5. `<html lang>` follows the UI language.

## Design

- `ui/format.js`: `todayKey(d)` → `${y}-${mm}-${dd}` local; `monthKey`
  likewise; `dateKeyOffset(days)` for due dates and expiry look-ahead.
- `barcode.js` (new, pure, tested): `code128(text)` → `{ pattern: [bar
  widths], checksum }`, `code128Svg(text, { height })` → SVG string. The
  pickup modal renders the QR via `qrDataUrl` (existing) and the SVG inline.
- `errors.js`: `crashReport(event, build)` → the payload; `errorReport`
  unchanged.
- `worker/src/errors.js` (new, mirrors metrics.js; tested): `handleErrors`,
  `appendError` (pure), caps and retention; `index.js` routes `/errors`.
- `errors-client.js` (new, pure, tested): `installCrashCapture({ window,
  report, show, now })` with the one-per-message-per-minute gate.
- App: `document.documentElement.lang = lang` effect; the entry chunk imports
  nothing for the capture (payload shaping is inline, E91 fixed) and hands
  each crash to the app as a `site-log:crash` event, queued until the app
  listens; the app posts it under the company. `ErrorsCard` and `UsageCard`
  live in the lazy Cockpit chunk and fetch their own data. `import-guard.js`
  and `price-list.js` load on demand, which is what keeps the first paint
  at 342 KB with the capture in it.

## Definition of done

- Logic tests: `todayKey` at 00:30 local on a UTC+2 day returns the local
  day; due date = today + N local; Code 128 encodes "HGC-2026-001234" with
  the documented checksum and switches to subset C for digit runs; the
  crash gate drops a repeat within a minute and lets it through after.
- Worker tests: POST accepted from a member with capped fields, refused
  without sign-in, GET for owner only, 200-entry cap, 30-day TTL.
- Render test: the pickup modal shows an inline SVG barcode and no external
  `<img>`; the owner's Cockpit shows the errors card.
- Emulator: an injected `Promise.reject` shows the panel once and reaches
  the Worker (checked via the errors card); the pickup code renders offline.
- No request to `qrserver` or `bwipjs` remains in the code.

## Out of scope

- Edit history / soft delete (H7) — next spec after patch 3.
- Alerting on errors (e-mail) — needs a mail service.
