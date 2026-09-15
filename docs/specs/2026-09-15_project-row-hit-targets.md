# Project row tap targets: name vs. address

Date: 2026-09-15

## Goal

On the phone Projekte list, fix the row's HTML structure so tapping behavior is unambiguous:

- Tapping the project name / card opens the job.
- Tapping the address (only the address text) opens the map.
- The address control does not cover the rest of the row.

## Constraints

- No new dependencies. No unrelated refactors.
- Keep the existing drag-to-reorder handle and drag-to-calendar behavior on the row.
- Keep the 350 KB first-paint budget green.

## Design

The current row (`roofing-site-manager.jsx`, `tab === "projects"` → `ReorderList`'s
`renderItem`) renders the whole name/category/status/customer/address/entry-count column,
including a `<MapPin>` `<a href={mapsUrl(...)}>`, **nested inside** the row's own
`<button onClick={() => setSelectedProject(p.id)}>`. An `<a href>` is interactive content and
is invalid inside a `<button>` (HTML's button content model forbids interactive descendants);
in practice this makes focus order and screen-reader behavior for the two controls undefined,
even though `stopPropagation()` on the anchor happens to keep mouse clicks working today.

Fix: pull the address out of the button entirely. The card becomes two stacked rows instead of
one:

1. Handle + icon + a `<button onClick={() => setSelectedProject(p.id)}>` wrapping the name,
   category/status chips, customer line, entry count, and chevron — everything that opens the
   job. This keeps working exactly as it does today (including drag-to-calendar on the inner
   `draggable` div) and stays a real `<button>` (existing tests locate a job by
   `document.querySelectorAll("button")` + name text).
2. A sibling `<a href={mapsUrl(p.address)} target="_blank" rel="noreferrer">` below the button,
   indented to align under the name text, rendered only when `p.address` is set. It is sized to
   its own content (icon + text), not a block spanning the row, so it cannot cover anything else
   in the card.

No behavior changes for rows without an address (button-only, as today).

## Definition of done

- The address `<a>` is no longer a descendant of the row's `<button>`.
- Render test: tapping the project name opens the job hub (`selectedProject` set), not a map (no
  `window.open`/navigation to `mapsUrl`).
- Render test: tapping the address text opens the map (the anchor's `href` resolves via
  `mapsUrl`), without opening the job hub.
- Drag-to-reorder and drag-to-calendar on the row are unaffected.
- `npm run precommit` is green.
- Changes committed and pushed to `origin main`.

## Out of scope

- The bottom dock (separate component, renders no address at all — untouched).
- Any change to `mapsUrl()` itself or the customer list's own Call button pattern.
- Bug 1 / Bug 2 from `docs/specs/2026-09-15_row-actions-and-project-status.md` (already done).
