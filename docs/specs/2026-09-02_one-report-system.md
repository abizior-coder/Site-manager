# One report system: live, editable, never duplicated

**Status: implemented 2026-09-02** (owner's go: "wykluczać" — the monthly
report *excludes* what daily reports already sent, rather than flagging it).

## What exists today (read from the code, 2026-09-02)

| System | Where it lives | Created by | Editable? | Duplicates? |
|---|---|---|---|---|
| Tages-/Monatsbericht "an Vorgesetzten" | `sentReports` collection | `sendReportToSupervisor` | notes only (`saveReportEdits`) | **yes** — every click appends a new record for the same day/month |
| Rapport (signed by the customer) | `reports` collection (`siteReports`) | `saveRapport` | no — immutable once signed (rules) | **yes** — nothing stops a second Rapport for the same job + day |
| Projekt-Bericht (print) | not stored | `generateProjectsReport` | n/a | n/a — it is a print |
| Dachinspektion | an `inspection` entry | `logInspection` | as an entry | no |
| Webhook to the supervisor | `sendWebhook("report", …)` | on every send | — | **yes**, fires again on every re-send, no report id in the payload |

## Why entries get duplicated

1. **No identity for a report.** `sendReportToSupervisor` does `id: uid()` and
   prepends. Two taps on *An Vorgesetzten senden* for 2026-09-02 make two
   reports for 2026-09-02, both go out by mail and webhook.
2. **Entries are copied by value into the report** (`entries: list.map(...)`).
   The same entry then lives in the log *and* in every report snapshot.
   Correct a quantity in the log and the report still shows the old one;
   edit the report and the log does not change. Two sources of truth is the
   duplication the owner is seeing.
3. **Monthly re-sends what daily already sent.** The month view is the union
   of the days, so the supervisor receives each entry at least twice, with
   nothing marking what is new.
4. **"Sent" means "the mail app was opened".** `sentAt` is stamped on the
   tap, before anyone pressed Send in Mail or WhatsApp. There is no record
   of a report that was drafted but never went out.
5. The Rapport copies lines by value too — but that one is **right**: a
   signed document must not change after the signature. The problem there
   is only the missing guard against a second Rapport for the same day.

## Design

**A report is a view over entries, plus a small "sent" record.** Nothing is
copied until a signature freezes it.

```
sentReports/{id}
  id            = `${userId}-${period}-${periodLabel}`   ← deterministic
  period        daily | monthly
  periodLabel   2026-09-02 | 2026-09
  userId
  entryIds      [ …ids of the entries in scope at send time… ]
  excludedIds   [ …entries the author took out of this report… ]
  notes         free text, editable any time
  sends         [ { at, via: mail|whatsapp|webhook } ]   ← history, not one stamp
  editedAt
```

- **Rendering** joins `entryIds` against the live `entries` array. Fix a
  quantity in the log and every report that contains it is right. Delete an
  entry and the report shows it as *(gelöscht)* rather than silently
  shrinking — the supervisor may already have the old figure.
- **Re-send updates, never appends.** Same id → `sends` gets one more
  row, the mail/webhook go out again with the same `reportId`. The list
  shows *gesendet 2× · zuletzt 14:05*, not two rows.
- **Editable** means three things and nothing else: change the notes,
  exclude/include an entry (`excludedIds`), and fix the entry itself in the
  log. No free-text editing of copied lines.
- **Monthly** leaves out every entry that a sent daily report of this
  person already carried (`unsentMonthEntries`), and says how many it left
  out. Owner's call: nothing reaches the supervisor twice; the month total
  is therefore "what is new", not the calendar month.
- **Rapport (signed)** stays frozen, and gains one guard: opening a Rapport
  for a job + day that already has one offers *open existing* first. After
  signing, if the day's entries change, the job view shows *Einträge seit
  Unterschrift geändert* — the Polier signs an addendum, the original is
  untouched.
- **Webhook** payload carries `reportId` and `sendIndex` so the receiving
  side can dedupe; it fires once per send, never on a notes edit.
- **Migration:** existing `sentReports` keep their copied `entries` and
  render from that when `entryIds` is absent. Nothing is rewritten.

## Definition of done

- Sending the same day twice yields one record with two `sends`.
- Editing an entry's quantity in the log changes what the sent report shows.
- Excluding an entry from a report does not touch the log.
- Monthly report excludes entries already sent daily and says how many.
- Second Rapport for the same job + day is offered as *open existing*.
- Rules: `sentReports` create/update require `userId == auth.uid` (crew own
  their reports; managers may read all) — one new rules test per line.
- Logic tests for the id, the join with deleted entries, and the monthly
  flag; render test that the Berichte tab still walks.

## Out of scope

- Approval workflow on reports (the cockpit already approves hours).
- PDF generation beyond the existing print-to-HTML.
- Any change to the signed Rapport format.

## Files

- `roofing-site-manager.jsx`: `sendReportToSupervisor`, `saveReportEdits`,
  the Berichte tab, `openRapport`, `sendWebhook`, `reportViewModal`.
- `firestore.rules` + `rules.test.mjs` for `sentReports` ownership.
- `logic.test.mjs` for `reportId`, `reportEntries(report, entries)`,
  `monthlyAlreadySent`.
