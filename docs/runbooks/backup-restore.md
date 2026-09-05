# Runbook: backup and restore

Site Log runs on Firebase's free plan, which has no scheduled export. The
backup is therefore the owner's weekly habit, and the Cockpit nags after
seven days. This is how it is done and how it was tested.

## Export (owner, once a week)

1. Cockpit → card **Backup** → **Jetzt sichern** (or Profil → Backup
   exportieren).
2. Two forms:
   - **Code** (`BACKUP1-…`): projects, entries without photos, customers,
     documents, leave, sent Rapporte, profile, insurance and certificates
     without photos, language. Copy it into a note or an e-mail to
     yourself. About 7 KB for a small firm.
   - **Vollständige Sicherung herunterladen**: a file with everything,
     photos and signatures included. Keep it outside the phone (cloud
     drive of the firm, or the office computer).
3. Every export records the date; the Cockpit card turns amber after
   seven days without one.

## Restore

1. Sign in (or create an account and a company: the restore replaces the
   company's current state, so use a fresh company or the same one).
2. Profil → **Aus Backup wiederherstellen** → paste the code, or **Aus
   Datei wiederherstellen** for the file.
3. The import guard cuts the file to shape: known fields only, fresh ids,
   photos re-keyed and image-only. Entries keep the person who logged them
   when that person is a member of the company you restore into; otherwise
   they are attributed to the person restoring. Managers may create records
   for other members, which is what a restore of a whole crew needs.

## Restore test on the emulator, 2026-09-05

Source: the seeded firm (chef@test.local). Code export: 6,672 characters.
Target: a fresh account and company ("Restore AG") created for the test.

| What | Source | After restore |
|---|---|---|
| Baustellen (project cards) | 2 | 2 |
| Kunden (names on the list) | Sutter Teresa, Huber GmbH, Kurt Meier, Ruedi Keller | the same four |
| Error panel | — | none |

First attempt failed with E10 SAVE-DENIED: the rules let a member create
leave and Rapport records only under their own id, so the owner could not
restore the crew's. Fixed the same day (managers may create for others;
rules tests cover it) and the restore repeated cleanly.

## What is not covered

Photos are only in the file form. The Worker's R2 files (plans) are not in
either form; they stay in R2 and are listed by the `files` collection,
which the backup carries.
