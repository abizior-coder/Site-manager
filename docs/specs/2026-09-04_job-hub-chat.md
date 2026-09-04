# The Baustelle as a hub with tabs; the comments become a chat

**Status: accepted 2026-09-04** (P3 of the owner's pick from
`docs/research/2026-09-04_competitor-ux.md`).

## Goal

The job view is one long page: crew, plans, materials by trade,
inspections, trips, comments, photos, reports, costing. The market puts
the same content behind a row of tabs inside the site (Craftnote's
Baumappe, plancraft's Projektmappe, Baurapport's site screen), and gives
the site a chat. Site Log keeps its content and gets that structure, plus
the one thing the others do not have: a chat every language on the roof
can read.

## Design

- **Hub tabs** (a segmented control under the job header, remembered per
  job while the app is open):
  `Übersicht · Zeiten · Material · Fotos · Pläne · Rapporte · Chat`.
  - Übersicht: header (name, status, address, start/stop), actions,
    customer, crew, inspections, trips — the things a Polier checks first.
  - Zeiten: this job's time and break entries by day with the hours per
    person (new: the job view never showed hours as a list).
  - Material: the trade sections (materials and tools) as today.
  - Fotos: the gallery as today.
  - Pläne: plans and documents (upload, links) as today.
  - Rapporte: signed Rapporte, Regie, costing, quotes and invoices.
  - Chat: the notes as a conversation — author and time on every
    message, the reader's translation under it, the language chips, the
    composer at the bottom with dictation; unread count on the tab
    (messages newer than the reader's last visit of this job's chat).
- Counts on the tabs where they help: Fotos (n), Pläne (n), Chat (n new).
- Nothing is removed; every section keeps its markup and handlers.
- Deep links from elsewhere keep working: opening a job from Today lands
  on Übersicht; the «+ → Foto» composer works from any tab.

## Definition of done

- Render tests: the hub shows seven tabs; Chat lists the saved notes with
  author and time; the crew drop zone, plans and inspections tests still
  pass on their tabs; the unread badge appears for a note saved by
  someone else and clears when the Chat tab is opened.
- Emulator walk: open a job, switch every tab, send a chat message.

## Out of scope

- Read receipts per person, @mentions, push notifications.
- Zeiten editing (edit stays in Today/Kalender).
