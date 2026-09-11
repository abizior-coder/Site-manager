# The job's RAPPORTE tab: reports sent for this job, not billing

**Status: proposed 2026-09-11, implemented same day.**

## Goal

`tabs/ProjectDetail.jsx`'s job hub tab labelled Rapporte
(`hubTab === "reports"`, `t.hubReports`) currently mixes two unrelated
things: the signed customer Rapport list (`reports`/`siteReports`,
correct — this stays) and a billing block (`canBill`-gated: "Neue
Offerte"/"Neue Rechnung" buttons, the project's quote/invoice list, the
Regie-as-quote/invoice buttons, the costing summary). On a job with no
signed Rapport, no documents, no Regie and no costing data yet, the tab
shows nothing but those two buttons — which is what was reported as
"the RAPPORTE tab shows only «Neue Offerte» and «Neue Rechnung»". Worse,
the tab never shows the reports this job actually generated most often:
the daily/weekly/monthly reports sent to the Polier or the chef
(`sentReports`, `docs/specs/2026-09-02_one-report-system.md`,
`docs/specs/2026-09-08_report-correctness.md`) — that data exists,
company-wide, but nothing here filters it down to this job.

1. **RAPPORTE lists this job's sent reports.** Every `sentReports` record
   whose entries touch this project (any daily or monthly report sent to
   a supervisor that included at least one of this project's entries)
   shows as a row: period, local date, hours, send count, last sent.
   Tapping a row opens the **existing** report-review modal
   (`reportViewModal`, already built, already reachable from the
   top-level Rapport tab) — hours, every entry row, excluded lines, notes,
   resend, PDF — nothing new is built for "opens and expands."
2. **Owner/supervisor can control them.** The modal's editing actions —
   notes, the hours override on a pre-model report, excluding/restoring
   a line, Save, Resend — become `canManage()`-gated (currently open to
   whoever has the modal open, an existing gap this closes). Viewing a
   report (its figures, its rows, the PDF button) stays available to
   anyone who can already reach it, unchanged.
3. **Billing leaves this tab.** "Neue Offerte", "Neue Rechnung", this
   project's quote/invoice list, the Regie-as-quote/invoice buttons and
   the costing summary move to a **new, owner-only** hub tab in the same
   job view, reusing the existing `canBill` prop (`isOwner()`) that
   already gated all of this content — so a crew or supervisor account
   never sees the new tab button at all, not merely a hidden button
   inside a tab they can open.
4. **No new report engine.** Reuse `reports.js` (`reportRows`,
   `reportTotals` via the existing `reportFigures` helper) and the
   existing `sentReports` state, `reportViewModal`, `resendReport`,
   `toggleReportEntry`, `saveReportEdits`, `periodTitle` exactly as they
   already work for the top-level Rapport tab. The only new code is: the
   per-job filter, the row list markup (copied from the top-level tab's
   own row markup), the new tab, and the `canManage()` guards inside the
   existing modal.

## Constraints

- PROJECT.md §2b, §3 (24 px touch targets, accessible names, 350 KB
  first-paint budget, no Blaze).
- `sentReports`' own rules and shape are untouched — `docs/specs/2026-09-
  02_one-report-system.md`'s id scheme, `entryIds`/`excludedIds`/`sends`,
  and `docs/specs/2026-09-08_report-correctness.md`'s per-person default
  scope, Regie marking and month de-duplication all stay exactly as they
  are. This spec only *reads* `sentReports` through a new filter and
  *gates* who may act on the modal already built for it.
- `reports.js` gets no new exports. The per-job filter and the row data
  (period, title, hours, send count, last sent) are computed in
  `roofing-site-manager.jsx`, which already has `sentReports`,
  `allEntries`, `reportFigures` and `periodTitle` — `tabs/
  ProjectDetail.jsx` stays render-only per this repo's own rule ("a tab
  component renders only; handlers and state stay in
  `roofing-site-manager.jsx`", `docs/CODE_MAP.md`).
- No rules change: `sentReports`' Firestore rules already let a manager
  read/update every record and an author read/update their own; nothing
  here changes who may write, only who sees the *controls* in the UI.
- One new `i18n` key (`hubBilling`, the new tab's label) in all 14
  `i18n/*.json` files. Every other string reused: `t.sentReports`,
  `t.daily`, `t.monthly`, `t.reportSentTimes`, `t.reportLastSent`,
  `t.noReportsYet`, `t.hubReports`, all already used by the top-level
  Rapport tab this borrows its markup from.

## Design

### The job's report list

In `roofing-site-manager.jsx`, where `ProjectDetail` is invoked, a new
`jobReports` prop:

```js
jobReports={sentReports
  .map((r) => ({ report: r, f: reportFigures(r) }))
  .filter(({ f }) => f.rows.some((row) => row.projectId === selectedProject))
  .map(({ report: r, f }) => ({
    id: r.id,
    report: r,
    period: r.period,
    title: periodTitle(r),
    hours: f.hours,
    sends: (r.sends || []).length || 1,
    lastSent: r.sends?.length ? r.sends[r.sends.length - 1].at : r.sentAt || null,
  }))}
onOpenReport={(r) => setReportViewModal(r)}
```

`reportFigures(r).rows` already joins `entryIds` against the live log
(exactly what the top-level tab already relies on), so "touches this
project" is `row.projectId === selectedProject` — the same fact
`projectCosting`/`regieSummary` already key off elsewhere in this file.

`tabs/ProjectDetail.jsx`'s `hubTab === "reports"` block gains, above the
existing signed-Rapport list, a row per `jobReports` item — the same
button shape (period · local date, hours/sends/last-sent line,
trailing `ChevronRight`) the top-level Rapport tab already renders for
`sentReports`, calling `onOpenReport(item.report)` instead of a local
`setReportViewModal`. When both `reports` and `jobReports` are empty, an
`EmptyState` (`t.noReportsYet`, reused) replaces the current silent
blank. The tab's badge count becomes
`(reports || []).length + (jobReports || []).length`.

### Control gating on the existing modal

`reportViewModal`'s render (`roofing-site-manager.jsx`) gains
`canManage()` around: the notes `<textarea>` (read-only text shown
instead when notes exist and the viewer may not edit), the hours
`<input>` shown for a pre-model report, the per-row exclude button, the
excluded-row restore button, and the Save/Resend buttons. The Stat
summary, the entry/excluded-entry lists themselves, and the PDF button
stay visible to whoever could already open the modal — this spec does
not change who may *view* a report, only who may change it.

### The new billing tab

`tabs/ProjectDetail.jsx`'s hub-tabs array gets one more entry, spliced
in only `canBill && [...]` so the tab button itself never renders for
a non-owner (not merely hidden content behind a reachable tab):

```js
["overview", …], ["time", …], ["material", …], ["photos", …],
["plans", …], ["reports", …],
...(canBill ? [["billing", t.hubBilling, (documents || []).length]] : []),
["chat", …],
```

Everything currently inside the "reports" tab's `canBill && (...)` block
— the two new-document buttons, this project's document list, the Regie
summary with its as-quote/as-invoice buttons, and the costing card —
moves as-is into a new `hubTab === "billing"` block, still wrapped in
`canBill &&` as belt-and-suspenders (the tab is already unreachable
without it). No prop changes needed there: `documents`, `regie`,
`costing`, `onNewDocument`, `onOpenDocument`, `onPrintDocument`,
`onRegieDocument`, `money` are already threaded into this component.

## Definition of done

- A job whose entries were included in a sent daily or monthly report
  shows that report as a row in RAPPORTE; tapping it opens the same
  hours/entries/excluded-lines/resend view the top-level Rapport tab
  already offers, unmodified.
- A crew account can still see that a report exists and view it, but the
  notes field, the exclude/restore controls, Save and Resend are gone
  from the modal for anyone `canManage()` returns false for.
- Neither "Neue Offerte" nor "Neue Rechnung" (nor the document list,
  Regie billing buttons, or costing card) appears anywhere in RAPPORTE
  for any role.
- A crew or supervisor account never sees the new billing tab button;
  an owner does, with the same content that used to sit in RAPPORTE.
- `node logic.test.mjs`, `node render.test.mjs`, `node order-flow.test.mjs`,
  `node dock.test.mjs` green; `npm run -s test:worker` green; `npm run -s
  build` under the 350 KB first-paint budget.
- Render tests (`render.test.mjs`): a job with a sent daily report whose
  entries belong to it shows that report as a row in RAPPORTE; tapping
  it opens the report modal; the modal's Save/Resend/exclude controls
  are absent for crew and present for the owner; the new billing tab is
  absent for crew and present for the owner, carrying the two buttons
  that used to sit in RAPPORTE.
- `docs/CODE_MAP.md` and `docs/DEVLOG.md` updated in the implementation
  commit.

## Out of scope

- Any change to `sentReports`' shape, id scheme, rules, or the
  daily/monthly scoping and de-duplication logic
  (`docs/specs/2026-09-02_one-report-system.md`,
  `docs/specs/2026-09-08_report-correctness.md`) — reused untouched.
- A new report engine, a new modal, or a new PDF path — none is needed;
  `reportViewModal`/`saveReportAsPdf`/`resendReport` are reused as they
  stand.
- Restricting who may *view* an existing report (only who may *control*
  one changes here).
- The top-level Rapport tab's own report list — unchanged, still shows
  every `sentReports` row company-wide the way it already does.
- Moving the signed customer-Rapport list (`reports`/`siteReports`) out
  of RAPPORTE — it already belongs there and is untouched.
