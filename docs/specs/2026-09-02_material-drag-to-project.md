# Drag material onto a project

**Status: proposed — waiting for a human to accept the plan before code.**

## Goal

On a desk, the Polier plans a job by dragging what it needs onto it: a person
(already works), a day (already works), and now the material. Today the basket
reaches a project only through a modal picker, and a catalog item reaches a
project only through the basket. There is no drag anywhere in the material
path, and nothing was ever built for it — the earlier "drag" work on
materials was reordering rows *inside* a job, not moving material *into* one.

## Where the drag can physically happen

HTML5 drag does not cross tabs, so source and target must share a screen.
Two options were considered:

| Option | Source | Target | Verdict |
|---|---|---|---|
| A. Board tab | a material strip added to the Board | the job cards already on the Board | **Chosen.** Board is the desk command centre; the job cards are already drop-capable in spirit (people, days). |
| B. Materials tab | catalog / basket rows | a project list added to the Materials tab | Rejected: duplicates the project list on a phone-first tab that has no room. |

## Constraints

- Desktop only in practice (`lg:`), but every drop must have a tap
  equivalent — the phone remains the primary device and touch has no HTML5
  drag. The tap path is the existing basket → picker; nothing is taken away.
- Dropped material is a normal `material` entry built through `newEntry()`
  with the dragged item's name, the article master's unit/price/supplier/
  article number when known, and `trade` = the project's dominant trade
  (most entries) or `other`. No new collection, no rule change.
- Quantity: a drop books **1 unit** and opens the row for editing quantity
  inline, the way the basket does. Guessing quantities is how wrong figures
  reach costing.
- The Board's material strip shows the **basket first** (what the Polier
  already collected), then the catalog category chips. Dragging a basket row
  onto a job moves that row out of the basket.

## Definition of done

- On the Board, a basket row or a catalog item can be dragged onto a job
  card; the job gains one material entry and the card's entry count rises.
- A basket row dropped on a job leaves the basket.
- `order-flow.test.mjs`-style browser test drives dragstart → drop with real
  `DataTransfer` and asserts the entry lands on the project with supplier and
  article number filled from the article master.
- Crew never see the strip (Board is manager-only already).
- Render suite still green; no new console errors on a cold load.

## Out of scope

- Dragging between projects (moving material from one job to another).
- Dragging onto a *day* in the planner (material is per job, not per day).
- Any touch drag polyfill.
- OCI / HGC basket import — separate spec once OCI access exists.

## Files

- `roofing-site-manager.jsx`: Board tab (material strip, drop handlers on job
  cards), one helper `dropMaterialOnProject(projectId, payload)`.
- `i18n/*.json`: 3 keys (`boardMaterialStrip`, `dropMaterialHint`,
  `materialDropped`) — German/English written, others fall back.
- New `material-drop.test.mjs` (jsdom, real DataTransfer) or a block in
  `order-flow.test.mjs`.

## Risks

- The Board is already the densest screen; a strip must collapse by default
  on narrow desktops (900–1100 px) or the planner loses height.
- Payload must be the material *name* plus a source flag (`basket:<id>` vs
  `catalog`), never an index — the basket re-renders between dragstart and
  drop.
