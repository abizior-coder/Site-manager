# The phone gets a tab bar and a «+»

**Status: implemented 2026-09-04** (owner picked P1 → P2 → P3 from
`docs/research/2026-09-04_competitor-ux.md`).

## Goal

On a phone the main sections sit under the thumb, the way every site app
on the market does it: a bottom bar with four tabs and a «+» in the
middle for what a crew member does thirty times a day. The hamburger and
the removed camera button are replaced, not added to.

## Design

- **Bar (phones only, `lg:hidden`):** `Heute · Baustellen · + · Berichte · Mehr`.
  Heute = Today tab, Baustellen = projects tab, Berichte = reports tab
  (renamed to Rapport when P2 lands), Mehr opens the existing drawer,
  which keeps every section incl. Board/Übersicht for managers, Profil
  and the language. The header's hamburger goes; the header keeps the
  title, the status chips and the language chip.
- **«+»:** a bottom sheet, `data-quick-add`, for the *current site*: the
  clocked-in one, else the open job, else the only active site, else a
  row of site chips to pick from. Actions: Tag starten / Tag beenden,
  Material, Foto, Notiz, Fahrt, Dachinspektion. Each opens the composer
  that exists today.
- **Dock:** it was never fixed -- it takes real height in the column --
  so it simply sits above the bar, collapsible as before. Nothing moves.
- **Content padding:** the scroll container clears the bar on phones.
- Desktop unchanged: sidebar, dock, no bar.

## Definition of done

- Phone width: the bar shows five items; each tab switches; «+» opens
  the sheet with the actions; «Mehr» opens the drawer with the rest.
- With a clocked-in site, «+ → Material» opens the material composer for
  that site; with none and two active sites, the sheet asks which.
- No fixed element overlaps the list bottom on a phone (the reason the
  camera button went).
- Render tests: bar present with the five items, the sheet opens and
  its Material action opens the composer, Mehr opens the drawer; the
  existing drawer and dock tests keep passing.
- Emulator walk at 390 px width: Today, Baustellen with the dock strip,
  Berichte, Mehr, «+».

## Out of scope

- Renaming Projekte → Baustellen across the app (P6).
- The Rapport shape and the Woche view (P2).
