# Entries keep their history: soft delete, change records, a trash per job

**Status: implemented 2026-09-05** (accepted the same day; engineering audit H7; owner: "wykonaj
wszystkie krok po kroku").

## Goal

A Bautagebuch is evidence. Nothing logged on a job vanishes without a
trace, and what a signed or sent Rapport covered can be reconstructed:

1. **Soft delete everywhere.** Deleting an entry marks it
   `deleted: true` with `deletedAt`, `deletedBy` and, when the entry was
   covered by a sent Rapport, a reason the person is asked for. Deleted
   entries leave every list, sum, costing and report; they stay in the
   database.
2. **Change records on covered entries.** Editing an entry that a sent
   Rapport covers appends `{ at, by, reason, before }` to its `history`
   (the fields as they were), capped at twenty; the edit form asks for the
   reason and shows the history. Every changed entry, covered or not,
   carries `updatedAt` and `updatedBy`.
3. **A trash per job.** The job's Übersicht shows "Gelöscht (n)" with
   restore for everyone who may edit and "endgültig löschen" for managers
   (which is the only hard delete left; the photo goes with it).
4. **Sent Rapporte read the full log** including deleted entries, so a
   report rendered later still shows what was sent.

## Design

- `entries-history.js` (pure, tested): `coveredEntryIds(sentReports)`,
  `changedFields(prev, next)`, `reconcileEntries(prevAll, nextVisible,
  { by, now, covered, reason, purge })` — the one place that turns the
  app's "visible entries" array into the stored array: stamps changes,
  writes history, turns absences into soft deletes, drops only purged ids.
- App: state holds `allEntries`; `entries` is the visible slice
  (`!deleted`) every existing call site keeps using; `persist({ entries })`
  runs the reconciler, so every path — add, edit, time edit, delete — gets
  the rules without change. `deleteEntryFn` asks for a reason when the
  entry is covered. `restoreEntry`, `purgeEntry`.
- `ProjectDetail`: `deletedEntries`, `onRestoreEntry`, `onPurgeEntry`.
- Rules unchanged: soft delete and restore are updates the existing rules
  allow; purge is the existing delete.

## Definition of done

- Logic: reconcile stamps changed entries, writes history only for covered
  ones, soft-deletes absences, keeps deleted ones hidden, drops purged
  ids, never touches unchanged entries.
- Render: deleting a material in the job view removes it from the list,
  "Gelöscht (1)" appears on the Übersicht, restore brings it back.
- Emulator: the deleted entry is still in Firestore with `deleted: true`.

## Out of scope

- A company-wide audit log screen (the history lives on the entry).
- Retention/purge automation.
