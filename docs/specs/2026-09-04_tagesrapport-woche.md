# The day is a Tagesrapport; the week is a table

**Status: implemented 2026-09-04** (P2 of the owner's pick from
`docs/research/2026-09-04_competitor-ux.md`).

## Goal

The worker's day is shown the way the market and the GAV think of it:
hours split into *Normal / Überstunden / Reisezeit*, breaks, material,
trips, photos, notes — one card, sent to the office as before. Next to
it a **Woche** view: the seven days of a week per person, with the GAV
target and the difference, and a CSV for payroll. This is the shape the
monthly sheet (October) will be built on.

## Design

- Tab renamed **Rapport** (was Berichte). Three views: `Tag · Woche · Monat`.
  Monat keeps today's logic (what no daily report has sent yet).
- **Hours split** (`reports.js: splitDayHours(dayEntries, contractDaily)`):
  net = time entries minus breaks marked that day; `normal = min(net,
  contractDaily)`, `overtime = max(0, net − contractDaily)`; `travel` = the
  day's transport hours (paid under the GAV, shown apart); `breaks` as
  now. `contractDaily = weeklyHours / 5` from the billing settings; if
  none is set, everything is Normal and the target reads "—".
- **Tagesrapport card:** date, sites, the four hour lines with the total
  and the target, Material (count + list), Fahrten, Fotos (count),
  Notizen, an approval badge (every time entry of the day approved by a
  manager → "Freigegeben", else "Noch nicht freigegeben"), and the
  existing "An Vorgesetzten senden".
- **Woche:** `weekOf(date)` gives Monday..Sunday; ‹ › move by a week; a
  manager picks the person, a crew member sees their own. Rows per day:
  Normal · Über · Reise · Pausen · Total; footer: totals, Soll (weekly
  hours), Differenz. "Woche als CSV" downloads
  `woche-<person>-<monday>.csv` with those columns (semicolon-separated,
  Excel-friendly).
- Pure functions and their tests live in `reports.js` / `logic.test.mjs`.

## Definition of done

- A day with 9.2 h net, 0.5 h breaks and a 1.5 h trip against a 42.5 h
  week reads Normal 8.5 · Über 0.7 · Reise 1.5 · Pausen 0.5 (logic test).
- The Rapport tab shows Tag/Woche/Monat; Tag shows the four lines and
  sends as before (the send test keeps passing under the new label).
- Woche shows seven rows, moves by a week, and the CSV has 8 lines
  (header + 7 days) plus a totals line.
- Render tests updated for the label «RAPPORT».

## Out of scope

- The monthly GAV sheet and the payroll export format beyond CSV (October).
- Approving hours from the Rapport itself (the Cockpit does it).
