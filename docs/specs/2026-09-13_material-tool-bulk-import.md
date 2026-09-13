# Bulk-importing material/tool rows (extends the rapport import)

Status: implemented (2026-09-13)

## Goal

The owner also photographs a delivery/material list (a Gutex order slip, a
screw count, tool-usage hours) for a job and wants the same treatment the
weekly Rapport got: transcribe it, then write real entries — this time
`material`/`tool` entries against an **existing** project (e.g. Waltz),
not new `time` entries against possibly-new projects.

## Constraints

- Reuse `rapport-import.js`/`scripts/import-rapport.mjs`
  (`docs/specs/2026-09-13_weekly-rapport-bulk-import.md`) rather than a
  second tool — same sign-in, same dry-run/`--commit` gate, same project
  matching.
- A row now carries a `kind` (`"time" | "material" | "tool"`, default
  `"time"` — every existing rows file with no `kind` field keeps working
  unchanged) and a `qty`/`unit` pair instead of a time row's `hours` (kept
  as a legacy alias: `hours` on a `kind: "time"` row is read into `qty`
  with `unit: "h"`).
- The written entry's `type` is exactly `row.kind` — `material` and `tool`
  entries land in exactly the tabs/costing views that type already feeds
  (`ui/entries.jsx`'s `typeMeta`, the job's Material/Tools lists), no new
  entry shape.
- Still no fuzzy project matching, still dry-run by default.

## Design

`rapport-import.js`: `normaliseImportRows` gains `kind` (validated against
`["time", "material", "tool"]`) and `qty`/`unit` (falling back to `hours`/
`"h"` for a `time` row with no `qty`). `matchProjects` is unchanged — it
already worked on `row.project`/`row.address` generically.

`scripts/import-rapport.mjs`: the entry it writes uses `type: row.kind`,
`qty: String(row.qty)`, `unit: row.unit` instead of the hardcoded
`type: "time"`/`unit: "h"`; the printed plan groups by kind instead of
assuming everything is hours.

## Definition of done

- `normaliseImportRows` validates `kind` and requires a `unit` for a
  non-time row; a legacy `{hours}` row with no `kind` still normalises to
  `kind: "time", qty, unit: "h"`.
- New `logic.test.mjs` cases: a material row round-trips qty/unit; an
  unknown `kind` throws naming the row; a non-time row with no `unit`
  throws; the legacy `hours`-only shape still works.
- Failsafe green; `docs/CODE_MAP.md`/`docs/DEVLOG.md` updated.
- First real use: a material/tool list for the existing Waltz project
  (Stallikerstrasse 14, Stallikon), transcribed from a photo.

## Out of scope

- Everything already out of scope in the original spec (OCR automation,
  multi-worker resolution, editing an existing project's fields, any UI).
- `trade`/`supplier`/`artNo` on the written entry — not asked for here,
  can be added later without changing this shape.
