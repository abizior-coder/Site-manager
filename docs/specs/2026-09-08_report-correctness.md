# Report correctness (Phase 1 of the reporting roadmap)

**Status: proposed 2026-09-08.** Phase 1 of the reporting work ordered in
PROJECT.md §1a-2 (owner + boss decided 2026-09-07 to continue the app,
reporting first). Fixes six data-completeness and scope defects found in
the reporting code reading of 2026-09-07; does not touch layout,
letterhead or photos — that is Phase 2.

## Goal

The report a supervisor receives carries what it claims to carry, once:

- A day report defaults to the sender's own entries. A manager gets a
  toggle to send the whole crew's day instead (today it is always the
  whole crew, silently, under the sender's name).
- The PDF renders every entry type the modal already shows — not only
  material, tool and note — and states one hours figure, net of breaks,
  the same figure the mail body and the modal already use.
- Target weekly hours and the firm's name and address are readable by
  whoever issues a report, in any role — not just the owner. The money
  fields on the same document (labour rate, IBAN) stay owner-only.
- A Regie-flagged entry is marked as Regie on the report line, in the
  mail body and in the PDF.
- The monthly report and any colleague's daily report never carry the
  same entry twice, and never carry it zero times either: an entry
  excluded from one report and never re-sent must still be offered by
  the next report that covers its day.

## Constraints

- PROJECT.md §1a-2, §1b (no manual step per customer), §2b (spec first,
  pure logic tested, suites green locally and in CI, emulator and
  production verification, local dates, no personal data to undeclared
  third parties, 350 KB first-paint budget) and §4 (data model) apply as
  written.
- No private server: `docs/specs/2026-09-06_private-server-migration.md`
  is proposed and unstarted; this spec ships on Firestore + the
  Cloudflare Worker as they are today.
- No billing: `worker/src/plan.js` stays an uncommitted draft, untouched.
- No drag-and-drop report builder, no field toggle, no custom logo — that
  is Phase 2 and Phase 3 of the reporting roadmap.
- No file other than this one is written by this spec.

## Definition of done

Six defects from the 2026-09-07 code reading, each closed by name, with
the files it touches (from `docs/CODE_MAP.md`; not re-derived by
grepping the tree) and the test that proves it.

### 1. Day report scope: per person by default, whole crew by manager toggle

Today `generateDayReport`/`todayEntries` filter only by date, so every
member's entries go out under the sender's name
(`roofing-site-manager.jsx` around `generateDayReport` and the Tag-card
`todayEntries`, feeding `sendReportToSupervisor`). `entryLabels`
(`reports.js`) carries no author.

- Files: `roofing-site-manager.jsx` (`generateDayReport`,
  `sendReportToSupervisor`, the Tag card's send button, the Board day
  action, the report modal for the new toggle), `reports.js`
  (`reportRows`/`entryLabels`, to carry each row's author), `i18n/*.json`
  (14 files: a label for the whole-crew toggle).
- Test: `logic.test.mjs` — "a day report scopes to the sender by
  default"; "a manager's whole-crew toggle scopes to every member's
  entries"; "a non-manager never sees the whole-crew toggle"; "report
  rows carry the entry's author".

### 2. PDF carries every entry type, one net-hours figure everywhere

`buildReportHtml`/`renderReportDocument` render only material, tool and
note rows and sum time entries gross; `reports.js`'s `reportTotals`
(used by the modal and the mail body) subtracts breaks. Same day, two
numbers.

- Files: `roofing-site-manager.jsx` (`buildReportHtml`,
  `renderReportDocument` — render from the same row list the modal
  already builds instead of a separate filtered set), `reports.js`
  (`reportTotals`/`reportRows`, unchanged in logic, reused as the single
  source for the PDF too).
- Test: `logic.test.mjs` — "the PDF renders a row for every entry type
  reportRows returns"; "the PDF's hours total equals reportTotals' net
  hours"; "a day with a break entry prints the same hours in the PDF, the
  modal and the mail body".

### 3. Target hours and firm address readable by every report-issuing role

`billing`/finance loads only `if (isOwner())`
(`roofing-site-manager.jsx`), gated the same way in
`firestore.rules` (`private/finance`). A supervisor's or crew member's
own Woche view shows no target, and a non-owner's Rapport prints an
empty firm address. Money fields (labour rate, IBAN) must stay
owner-only.

- Files: `firestore.rules` (`private/finance` — split into a
  member-readable subset: `weeklyHours`, `companyName`, `street`,
  `buildingNumber`, `postalCode`, `town`; a new owner-only subset keeps
  `labourRate`, `iban`), `company-store.js` (a report-profile read
  usable by any member, alongside the existing owner-only finance read),
  `roofing-site-manager.jsx` (the billing load, the Woche target
  calculation, `printRapport`'s non-owner letterhead path).
- Test: `rules.test.mjs` — "a supervisor may read weeklyHours and the
  firm address"; "a crew member may read the firm address but not the
  labour rate or IBAN"; `logic.test.mjs`/`render.test.mjs` — "a crew
  member's week table shows the firm's weekly target".
- Follow-up (Phase 2, not this spec): the same address becomes a full
  letterhead with an uploaded logo, on both the customer Rapport and the
  supervisor report.

### 4. Regie on the report line

`entryLabels` (`reports.js`) carries no Regie marker; the supervisor
report and mail body never show which hours were Regie.

- Files: `reports.js` (`entryLabels`, add a Regie marker to the label or
  a parallel field), `roofing-site-manager.jsx` (`reportSendText` — a
  Regie-hours count in the mail body; `buildReportHtml` — a Regie tag on
  the affected rows).
- Test: `logic.test.mjs` — "entryLabels marks a Regie entry"; "the mail
  body states Regie hours separately from ordinary hours".

### 5. Month report never doubles or drops an entry across people

`unsentMonthEntries` (`reports.js`) subtracts only the sender's own
daily-report entryIds, while the daily scope (once item 1 ships) is
per-person by default and per-crew on the manager toggle — so a manager's
whole-crew daily report already covers entries a colleague's monthly
report would otherwise carry again.

- Files: `reports.js` (`unsentMonthEntries` — subtract entries covered by
  any daily report for that day, not only the sender's own), `roofing-
  site-manager.jsx` (the `monthUnsent` call site).
- Test: `logic.test.mjs` — "unsentMonthEntries excludes entries already
  covered by a colleague's whole-crew daily report"; "unsentMonthEntries
  still includes a colleague's entries when no whole-crew report covered
  them".

### 6. An excluded-then-unsent entry can be sent again

`unsentMonthEntries` ignores `excludedIds` (`reports.js`): an entry taken
out of a daily report and never re-sent is still counted as sent and
never reaches the month report, or any report again.

- Files: `reports.js` (`unsentMonthEntries`, `reportRows`),
  `roofing-site-manager.jsx` (`saveReportEdits`, the rescoping in
  `sendReportToSupervisor`).
- Test: `logic.test.mjs` — "an entry excluded from a daily report and not
  re-sent still appears in that month's report".

### Suite-wide

- `node logic.test.mjs`, `node render.test.mjs`, `node order-flow.test.mjs`,
  `node dock.test.mjs` green; `npm run test:rules` green; `npm run -s
  build` under the 350 KB first-paint budget; `npx playwright test`
  green against the emulator.
- `docs/CODE_MAP.md` and `docs/DEVLOG.md` updated in the implementation
  commit, per the working rule — not part of this spec.

## Out of scope

- Phase 2 (firm letterhead and logo on every report type, a per-report
  field toggle at noovi's level, photo thumbnails in the PDF, signature
  on the supervisor report, the Cockpit export card's locale and default-
  month bugs, Monat gaining a PDF/CSV export) and Phase 3 (a drag-and-
  drop report builder with saved layouts).
- Weather, GPS and automatic travel-time capture in the daily report.
- Photos in the PDF: parked for Phase 2 as a thumbnail strip, not part
  of this spec's "every entry type" requirement — a photo row still
  prints as a bare row here, with no image.
