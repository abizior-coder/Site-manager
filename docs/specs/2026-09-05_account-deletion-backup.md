# Account deletion and a backup routine

**Status: implemented 2026-09-05** (accepted the same day; engineering audit M4; owner: "wykonaj
wszystkie krok po kroku").

## Goal

1. **A person can delete their own account** (DSG right to erasure) from
   the profile: after typing the password again, their personal data goes
   (profile, documents, dock pins, language, clock, the legacy personal
   store, the `users/{uid}` record), their membership is set inactive so
   the entries they logged keep a name, and the Auth account is deleted.
   The modal says what stays: the entries, photos and signatures they made
   for the firm are the firm's business records. An **owner** cannot
   delete themselves while they own a company: the modal says to hand the
   company over or write to the support address (ownership transfer is a
   spec of its own).
2. **The owner is reminded to back up**: the Cockpit shows a "Backup" card
   with the date of the last export, amber and worded as overdue after
   seven days, and the export button. Every export records
   `site-backup-meta` (when, by whom) in the company store.
3. **Restore is documented and tested**: `docs/runbooks/backup-restore.md`
   says how to export, where to keep the file, how to restore into a new
   firm, and records the restore test done on the emulator.

## Design

- `firestore.rules`: a member may update their own member document only
  to set `active: false` (role, name, e-mail unchanged); rules tests.
- `company-store.js`: `leaveCompany(uid)` (own kv keys, own member doc);
  `firebase-client.js`: `reauthenticate(password)`, `deleteOwnAccount()`
  (legacy kv, `users/{uid}`, `deleteUser`).
- `backup.js` (pure, tested): `backupDue(lastAt, now, days)`,
  `backupMeta(previous, now, by)`.
- App: profile modal button → `[data-delete-account]` modal with password
  field and confirm; Cockpit `BackupCard`; export records the meta.
- i18n ×14.

## Definition of done

- Rules tests: self-deactivation allowed, changing role or another member
  refused.
- Logic tests for `backupDue`/`backupMeta`.
- Render: crew sees the delete-account button and the modal; the owner
  sees the blocked text; the owner's Cockpit shows the backup card.
- Emulator: a crew account deletes itself and cannot sign in again; its
  entries still show its name; a backup exported from the seeded firm
  restores into a fresh firm with the same counts (recorded in the runbook).

## Out of scope

- Ownership transfer; deleting a whole company.
- Automated off-site backups (needs Blaze or an external job).

## Found on the way

The restore test hit E10: leave and sent-Rapport records may only be
created under one's own id, so the owner could not restore the crew's.
Managers may now create entries, leave, reports and sent reports for other
members (rules + tests). The import guard keeps the author of an entry
when that author is a member of the target company, so a restore into the
same firm keeps who did what. The package is declared an ES module
(`type: module`, Tailwind config as `.cjs`) so Node stops reparsing.
