# Bulk-importing chat notes (extends the rapport import)

Status: implemented (2026-09-13)

## Goal

Logged hours say how much was worked, not what was done. The owner wants
each job's own work description (already transcribed for the weekly
Rapport) to also land as a chat note on that job — `type: "note"`, the
same thing `submitNote()`/the job hub's own comment box already writes —
so anyone opening a project's Chat can read what happened, not just see
hours.

## Constraints

- Reuse `rapport-import.js`/`scripts/import-rapport.mjs`, same as the
  material/tool extension (`docs/specs/2026-09-13_material-tool-bulk-import.md`)
  — a third `kind`, not a third tool.
- A note entry's shape, per `submitNote()`/the job hub's add-note path
  (`roofing-site-manager.jsx`), is exactly `{type: "note", projectId,
  description}` (plus the usual `id`/`date`/`userId`/`createdAt`/`srcLang`
  every entry gets) — **no `qty`/`unit`**. `normaliseImportRows` must not
  demand a unit for a note row the way it does for material/tool.
- Still: dry-run by default, still matches existing projects only unless
  the project is genuinely new (unchanged from the earlier specs).

## Design

`rapport-import.js`: `KINDS` gains `"note"`. `qty`/`unit` validation is
skipped entirely for a `note` row (no default, no requirement) — only
`date`/`project`/`description` apply, same as every kind.

`scripts/import-rapport.mjs`: the written entry omits `qty`/`unit` when
`row.kind === "note"`, matching the app's own note shape exactly; the
printed dry-run line drops the `qty unit` portion for a note row.

## Definition of done

- A `note` row needs no `qty`/`unit`; a `time`/`material`/`tool` row's
  existing requirements are unchanged.
- New `logic.test.mjs` cases: a note row with no qty/unit normalises
  fine; a note row is not forced into requiring a unit.
- Failsafe green; `docs/CODE_MAP.md`/`docs/DEVLOG.md` updated.
- First real use: one note per work-description line from the
  2026-09-07…11 Wochen-Rapport, one per project that week touched.

## Out of scope

- Everything already out of scope in the earlier two specs.
- Combining a day's several descriptions for one project into a single
  note — one row here is one note, same as it was one time/material row.
