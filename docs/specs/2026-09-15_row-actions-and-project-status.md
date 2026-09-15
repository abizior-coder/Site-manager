# Row action tap targets + project status control

Date: 2026-09-15

## Goal

Fix two reported bugs:

1. On list rows that carry a Copy/Edit/Delete (or Edit/Delete) button cluster, the invisible `.tap`
   44×44 hit areas overlap so much that tapping "Edit" can trigger "Delete" and vice versa.
2. The job Übersicht has no way to change a project's status, and the main Projekte list needs to
   keep showing every project (already true) while visually greying out inactive/closed ones (not
   yet true).

## Constraints

- Use the project statuses that already exist in `PROJECT_STATUSES`
  (`roofing-site-manager.jsx`) — do not invent new status keys.
- Only the owner/supervisor (`canManage()`) may change a project's status from the job hub.
- No new dependencies. No unrelated refactors.
- Keep the 350 KB first-paint budget green.

## Design

### Bug 1 — tap-target overlap

Root cause: `.tap` (`tailwind.src.css`) gives every element carrying it an invisible 44×44
hit box centered on the element, regardless of visible size. Three or two such buttons placed
`gap-2` (8px) apart end up with heavily overlapping hit boxes.

Fix: add a second utility, `.tap-sm`, using the same centering mechanism but a 24×24 minimum
(matching the "min 24×24" ask) instead of 44×44:

```css
.tap-sm {
  position: relative;
}
.tap-sm::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 24px;
  height: 24px;
  min-width: 100%;
  min-height: 100%;
  transform: translate(-50%, -50%);
}
```

Apply `.tap-sm` (replacing `.tap`) plus an explicit `h-6 w-6 flex items-center justify-center`
visible box to each button in the three affected clusters, and widen the cluster's own `gap-2`
to `gap-3` so adjacent 24px hit boxes (12px apart) cannot touch:

- `Section`'s row actions (`roofing-site-manager.jsx`) — Copy / Edit / Delete. Used by all four
  material/tool/order/transport lists in the job hub (`tabs/ProjectDetail.jsx`), so the fix
  applies everywhere without touching the call sites.
- `EntryRow` (`ui/entries.jsx`) — Edit / Delete.
- The tech-library row in `tabs/MaterialsTab.jsx` — Edit / Delete.

Behavior is unchanged (copy copies, edit opens edit, delete asks then deletes via the existing
confirm flow) — only the hit-box geometry changes.

### Bug 2 — project status control + Projekte list grey-out

**Status control on the job Übersicht:** below the "Neue Dachkontrolle" button
(`tabs/ProjectDetail.jsx`, end of the quick-action grid), add a row of 5 status chips using a
subset of the existing `PROJECT_STATUSES`:

| Chip label (existing i18n key) | status key |
|---|---|
| Anfrage (`projStatusLead`) | `lead` |
| Offerte (`projStatusQuoted`) | `quoted` |
| In Ausführung (`projStatusConstruction`) | `construction` |
| Abgeschlossen (`projStatusCompleted`) | `completed` |
| Inaktiv (`projStatusHold`) | `hold` |

`waiting` and `lost` are unaffected — still reachable via the existing project-edit form, just
not part of this quick control. Only rendered when `canManageStatus` (passed down as
`canManage()`, following the existing `canManageCrew` prop pattern) is true; otherwise the
current status still shows as a read-only chip via the existing `statusMeta` badge already in
the header. Clicking a chip calls a new `onChangeStatus(status)` prop, wired at the call site in
`roofing-site-manager.jsx` to a new `setProjectStatus(id, status)` function that updates the
project the same way `saveProjectEdit` does (`persist({ projects: updated })`).

**Projekte list grey-out:** the list (`tab === "projects"`) already renders every project
regardless of `pipelineFilter` (`pipelineFilter` defaults to `"all"`), so no filtering change is
needed. Add: rows whose status is `completed`, `lost`, or `hold` (closed/inactive) render at
reduced opacity (e.g. `opacity-60`) and drop the accent border color back to the neutral
`COLORS.border`. Active rows (`lead`, `quoted`, `waiting`, `construction`) are unchanged. Tapping
a greyed-out row still opens the job as before.

## Definition of done

- `.tap-sm` exists in `tailwind.src.css`; `Section`, `EntryRow`, and the `MaterialsTab`
  tech-library row use it with non-overlapping hit boxes.
- Render test: clicking Edit on a row does not call the row's delete handler, and clicking
  Delete does not call the row's edit handler.
- A status quick-control appears below "Neue Dachkontrolle" for owner/supervisor, offering the
  5 statuses listed above, and changes the project's status when tapped.
- The main Projekte list still lists every project; rows with `completed`/`lost`/`hold` status
  are visibly greyed out; active rows are unchanged.
- `npm run precommit` (lint, format, build, logic + render + order + dock + worker suites) is
  green.
- Changes committed and pushed to `origin main`.

## Out of scope

- Changing which statuses exist or their colors/order.
- The bottom dock (separate component, already filters to `construction` + pinned — untouched).
- Non-owner/supervisor ability to change status.
- The phone project-row hit-target restructuring (name vs. address tap targets) — covered by a
  separate spec, `2026-09-15_project-row-hit-targets.md`.
