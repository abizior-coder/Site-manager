# UI audit pass 2: the «+» sheet's note, the photo dialog, Albanian, dates, forms

**Status: implemented 2026-09-06** (interface-engineer pass 2 per `docs/ui-audit-checklist.md`;
findings and the emulator evidence in `docs/ui-audit-2026-09-06-pass2.md`; reviewed,
re-verified and committed by the software engineer after the agent was cut off). The "Definition of
done" below is ticked as each item lands; the final counts are in the audit's
"Fixed in this pass" section.

## Goal

The display bugs pass 2 rated H and M, fixed the industry-standard way:

1. **The «+» sheet's Notiz** opens a note: title «Notiz», one textarea (the job
   hub's comment placeholder), no trade or quantity fields; saving writes a
   `note` entry exactly as the job hub's comment box does (and translates it).
2. **Every dialog closes on Escape.** `focusable()` in `ui/dialog.js` no longer
   treats a `display:none` control (the photo modal's hidden file input) as the
   first focus target, so the photo modal gets focus, traps Tab and closes on
   Escape like every other one.
3. **Albanian.** The 200 keys of `i18n/sq.json` that were the English text, and
   the short ones (`All`, `VAT`, `Due`, `No.`, `Fog`), translated into Albanian
   in the file's own vocabulary; `sq` joins the logic test's list of languages
   that must not be "English with a flag".
4. **Dates as people read them** everywhere pass 1 did not reach: Kunden
   (follow-ups, contact history), Team invites, the Kalender day modal titles
   (manager and crew), Transport day headings, the Cockpit's hours / leave /
   overdue / follow-up / bexio / backup lines — all through `fmtDate` with the
   app language (`CockpitTab` receives `lang`).
5. **Forms.** Accessible names on the eleven unnamed controls (contact
   follow-up date, range-leave dates, the trip modal's selects, date, times and
   notes, the inspection's tile model select, the basket quantity); the
   inspection's three-field row fits the phone; its checklist tiles wrap
   instead of cutting; the customers' «Kunden importieren» button has padding
   and wraps; the «+» sheet's «Neue Dachinspektion» wraps to two lines; the
   break chips read as two lines («Znüni» / «09:00 · 30 min») instead of a cut.
6. **Destructive actions ask.** Deleting a customer is a two-step inline
   confirm (the pattern the Team tab uses).
7. **Touch.** The invite row's four icons become 36 px boxes 4 px apart (no
   overlapping hit areas); the emergency screen's close control is ≥ 40 px;
   the 16 px text controls (remove member, change weather place, show finished,
   empty basket, hours & holidays, edit job, sign-in links, privacy links)
   carry the `tap` hit area.
8. **Structure and names.** The customer row's call link is a sibling of the
   row button (not nested), with an accessible name; the Kalender arrows are
   named «Vorheriger Monat» / «Nächster Monat» (two new keys, 14 languages);
   `de.json` says «Team einladen», not «Ekipa einladen»; the webhook hint
   speaks impersonally like the rest of the app.
9. **Empty states.** Transport without trips and the crew's day modal use
   `EmptyState`; the Transport count is `COLORS.accentText`, not the button red.
10. **Board on a phone.** Month cells under `sm` show a strip of coloured dots
    (one per assignment, amber for leave) instead of one-letter chips.

## Constraints

- Every new string exists in all 14 `i18n/*.json` files, translated (the logic
  test refuses English under another flag; `sq` is now in that list).
- Type never under 12 px; icon-only buttons carry `aria-label` + `title` +
  `tap`; red text uses `COLORS.accentText` / `COLORS.dangerText`; dialogs use
  `useDialog`; loading and empty states use the pass-1 components.
- **First paint stays under 350 KB** (347 KB at the start of this pass, 3 KB of
  headroom): changes in the first-paint component are small attribute and
  wording edits, one short note branch and one inline confirm; the Board dots
  and Cockpit dates live in lazy chunks; the translations are lazy language
  files.
- No change to `worker/`, `firestore.rules`, `.github/`, package dependencies.
- No product logic changes: what a note is, who sees which entries, what the
  Board plans, what a customer deletion unlinks — unchanged.

## Definition of done

- Render tests: the «+» sheet's Notiz opens a dialog titled Notiz with a
  textarea and no quantity input; a month cell of the Board carries
  `[data-board-dots]`; the invite row's four buttons carry `w-9`; the
  customer follow-up row and the Cockpit's hours row show no ISO date; the
  first tap on a customer's Löschen keeps the customer and shows the confirm;
  no «+» action label carries `truncate`; the trip modal has no unnamed
  control; no `a` inside a `button` on the customers tab; the break chips
  carry no `truncate`; the calendar arrows carry the month names; the
  emergency close button has vertical padding; crew's Transport shows
  `[data-empty="trips"]`.
- Logic tests: `focusable()` skips a `display:none` input; `sq` has fewer than
  40 English leftovers; `de.json` carries no «Ekipa»; every language has the
  two new keys; first paint under 350 KB.
- Emulator, after `npm run build` with the service worker unregistered: the
  photo modal closes on Escape; Notiz opens the note form; the inspection row
  fits 375 px; the Board month at 375 shows dots; Kunden and Cockpit show local
  dates; the Cockpit in `sq` shows no English; the break chips show the
  minutes; 1280 px without horizontal overflow.
- `npx eslint .`, `npx prettier --check`, `npm run build`, and the logic,
  render, order and dock suites green.

## Out of scope (product decisions, see the audit's "not fixed" list)

- A language control on the sign-in screen; labelling today's assignment on
  the Team roster; Board touch drag and today's column on a phone; confirming
  invite-code deletion; visible labels for placeholder-only forms; the Worker's
  bexio status text; the onboarding screen (needs a new account).
