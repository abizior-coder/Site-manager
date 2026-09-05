# UI audit fixes: loading, empty states, reports on the phone, the day

**Status: implemented and verified on the emulator 2026-09-06, not committed**
(interface-engineer pass per `docs/ui-audit-checklist.md`; findings and the
emulator evidence in `docs/ui-audit-2026-09-06.md`; every suite green: logic
300, render 136, order-flow 11, dock 21; first paint 358,023 of 358,400 bytes;
awaiting the software engineer's review and commit).

## Goal

The display bugs the audit rated H and M, fixed the industry-standard way:

1. **Loading states.** Every lazy tab (Material, Board, Übersicht) and every lazy
   overlay (job hub, photo viewer, photo editor) shows a visible loading element
   the moment it is asked for, never a blank area. One component, `ui/loading.jsx`,
   is the Suspense fallback everywhere `fallback={null}` stood.
2. **Report views readable on a phone.** The Woche table scrolls inside its card
   with the date column pinned left and the Total column pinned right, so the
   totals are visible in every language (Albanian and Hungarian pushed Total off
   the screen); headers and numbers never wrap mid-value. The Tagesrapport,
   Woche, Monat titles and the sent-report rows and modal show local dates
   (`Sa, 05.09.2026`, `September 2026`), not ISO keys. "Pausen −0.0" reads
   "0.0". The sent-report modal's entry list no longer shows a horizontal
   scrollbar and its two bottom actions stack instead of wrapping to three lines.
3. **Printing.** The report and Rapport documents that open in a new tab carry a
   print toolbar (Drucken) hidden on paper and call `window.print()` once loaded,
   so «Als PDF speichern» and the print icon actually reach the print/PDF sheet.
4. **The day.** Heute opens with a day card: the local date, the site (assignment
   or running clock), the running clock and breaks, and the first action as the
   largest control on the screen (`Baustelle öffnen`, which lands on the job's
   «Tag hier starten»; `Baustelle wählen` when nothing is assigned). The weather
   moves below the day. A one-line count of today's entries sits in the card.
5. **Empty states.** `ui/empty-state.jsx`: an icon, what would be here, how to add
   the first item. Used for today's entries, the Rapport entries and sent reports,
   the job hub's photos, and the project list.
6. **Overflow and layout.** The Cockpit's leave-request buttons wrap under the
   name instead of pushing the column 61 px past a 375 px screen; the update bar
   sits above the phone tab bar instead of covering the «+»; the job sheet keeps
   one height across its hub tabs and scrolls the active tab chip into view;
   switching main tabs starts at the top of the page; the phone tab bar labels
   drop letter-spacing so «Baustellen» is not cut to «Baustell…».
7. **Names.** The person picker (Woche) and the team's «Zu Baustelle hinzufügen»
   selects carry `aria-label`.

## Constraints

- Every new string exists in all 14 `i18n/*.json` files, translated (the logic
  test refuses English under another flag).
- Type never under 12 px; icon-only buttons carry `aria-label` + `title` + `tap`;
  red text uses `COLORS.accentText` / `COLORS.dangerText`; dialogs use `useDialog`.
- First paint stays under 350 KB: the new `ui/` pieces are small (a spinner, an
  empty state, three date formatters); the print toolbar (`ui/print.js`) is a
  lazy chunk loaded on the print tap, with the tab opened on the tap's own
  stack so popup blockers let it through (the service worker precaches every
  chunk, so printing works offline too).
- Pure logic (`fmtDate`, `fmtMonth`, `fmtDateRange`, `printChrome`) has unit tests.
- No change to `worker/`, `firestore.rules`, `.github/`, package dependencies.
- No product logic changes: what a report contains, who sees which entries and
  the recording of a send stay as they are (open questions in the audit go to a
  separate spec).

## Definition of done

- Render tests: a lazy tab shows `[data-loading]` while its chunk resolves and no
  loading element remains afterwards; the crew's Rapport shows the reports empty
  state; a job without photos shows the photos empty state; Heute shows
  `[data-today-date]` with a weekday and `[data-day-action]` as a button; the
  Tagesrapport title carries no ISO date; the Woche table's Total column is
  sticky; the Cockpit's leave row wraps.
- Logic tests: `fmtDate`/`fmtMonth`/`fmtDateRange` for `de`, `en`, `sq`;
  `printChrome` carries `window.print` and a `no-print` rule; i18n completeness.
- Emulator, after `npm run build` with the service worker unregistered: Heute at
  375 px shows date, site and the action without scrolling; Woche in `sq` shows
  the Total column; the Cockpit at 375 px has no horizontal overflow; the report
  modal has no inner scrollbar; the update bar clears the tab bar.
- `npx eslint .`, `npx prettier --check`, `npm run build`, and the logic, render,
  order and dock suites green.

## Out of scope (product decisions, see the audit's "not fixed" list)

- Recording a send when no supervisor contact exists; who sees whose entries on
  Heute/Rapport; the manager's Tagesrapport mixing own hours with the company's
  entries; month navigation in Monat; a desktop grid for Heute; the stacked
  profile modal on first send.
