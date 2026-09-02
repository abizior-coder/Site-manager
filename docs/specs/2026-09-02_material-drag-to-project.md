# Project dock — drag anything onto an active job

**Status: accepted by the owner on 2026-09-02** ("weźmimy z gry Toca Boca
World … oddzielny pasek na dole … dostęp do aktywnych projektów na bieżąco").
Supersedes the Board-strip proposal from earlier the same day.

## Goal

A persistent tray at the bottom of every screen showing the **active**
projects (status *In Ausführung*) plus any the user has **pinned**, as big
tiles the way Toca Boca World keeps its characters in a bottom tray. The
tiles are both the shortcut *to* a job and the thing you drop *onto*:

- drag a catalog item or a basket row from the Materials tab onto a tile →
  it is booked as material on that job;
- drag a person from Team or from a job's crew chips onto a tile → they
  join that job's crew (managers only);
- tap a tile → the job opens.

Because the dock is on every tab, the "HTML5 drag cannot cross tabs"
problem from the first proposal disappears.

## Constraints

- Phone first. Touch has no HTML5 drag; on a phone the dock is a row of
  tappable shortcuts and nothing else is lost — the basket picker stays.
- The dock takes real height from the main column (not an overlay), so
  nothing scrolls underneath it. It collapses to a one-line handle and
  remembers that per device (`localStorage`, try/catch, default open).
- Hidden entirely when nothing is active and nothing pinned. No empty bar.
- Pins are personal (`personalKey("site-dock-pins")`), not company-wide:
  the Polier and the Chef care about different jobs on a given week.
- A material drop books **1 unit** (or the basket row's quantity), fills
  unit / price / supplier / article number from the article master, and
  files it under the job's dominant trade (most entries) or the last used
  one. It never guesses a quantity.
- A basket row dropped on a job leaves the basket.
- Payload is `text/material` = JSON `{name, kind, qty?, unit?, basketId?}`
  and the existing `text/member-uid`. Never an index — the basket
  re-renders between dragstart and drop.
- Entries are built through `newEntry()` as always; no new collection, no
  rule change. Crew may drop material (their own entry), only managers may
  drop people (same check as the crew zone).

## Definition of done

- Dock renders on every tab for every role; tiles show name, status, crew
  count and material count, pinned tiles first.
- Pin/unpin from the job view header; survives reload for that account.
- Drop of a catalog item, a basket row and a person all land, with a toast
  naming the job.
- jsdom test drives dragstart → dragover → drop with a fake DataTransfer for
  material and for a person, and checks the entry / crew member is on the
  project afterwards.
- Render suite green; no new console errors on a cold load.

## Second pass (owner's screenshot, 2026-09-02)

Asked for after seeing it live with real data:

- **Search box** on the Materials tab. One box finds a thing wherever it
  lives: the firm's own article master first (it carries price and
  article number), then the merchants' catalogs and tools. Every hit is a
  draggable chip; while a search is open the category browser is hidden.
- **Tiles show the job's category as an icon** (flat → layers, pitched →
  mountain, facade → building, other → hard hat) in the project's colour.
  At tile size there is no room for the word.
- **Project cards in the Projects tab can be dragged onto the tray** to
  pin them. Dropping is an "add" gesture only — a slip never unpins.
- **A sort control in the stripe** above the tiles: one tap cycles pinned
  first → name → status → recently used, remembered per device.

## Out of scope

- Moving material between two jobs.
- Dropping onto a planner day.
- Touch drag polyfill.
- OCI / HGC basket — separate spec once OCI access exists.

## Files

- `roofing-site-manager.jsx`: dock (inside the main column, after the scroll
  area), `dropOnProject`, `materialDragProps`, pin state + persistence, pin
  button in `ProjectDetail`, draggable catalog chips and basket names.
- `i18n/*.json`: `dockTitle`, `dockPin`, `dockUnpin`, `dockDropHint`,
  `dockPersonDropped`.
- `dock.test.mjs` (jsdom).

## Risks

- The floating camera button sits bottom-right; if it covers the last tile
  it must move up while the dock is open.
- On a 900–1000 px desktop the dock costs the Board planner one row; the
  collapse handle is the answer, not hiding the dock on that tab.
