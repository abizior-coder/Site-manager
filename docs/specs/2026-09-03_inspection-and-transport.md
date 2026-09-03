# Roof inspection inside the job; a Transport tab

**Status: accepted by the owner on 2026-09-03** ("roof inspection musi zostać
przeniesione jako guzik do okna projektu, z kafelkami do zaznaczenia, zmieniona
dachówka z modelem i ilością … trzeba dodać zakładkę transport z czasem").

## Goal

1. The roof inspection starts **from the job**, not from Today, and is a
   checklist a Polier ticks with a thumb — plus the replaced tiles: which
   model, how many, and what that weighs as waste.
2. A **Transport** tab records every trip: when, how long, which vehicle,
   from where to where, what was carried and how much, which skip (Mulde)
   and where it went. The waste weight from an inspection is offered when a
   waste trip is logged for that job.

## Inspection

- A button **Dachinspektion** in the job's action row opens the inspection
  bound to that job. The Today-tab button goes.
- **Checklist tiles** (tap cycles: none → OK → Mangel): Eindeckung, First,
  Kehle, Anschlüsse/Blech, Dachfenster, Rinne/Ablauf, Unterdach/Folie,
  Lattung, Dämmung, Schneefang, Blitzschutz, Kamin, Moos/Reinigung.
- **Replaced tiles**: one row per model — model from the reference table
  (`roof-tiles.js`: kg per piece, pieces per m²) or free text, count. The
  row shows the reference (kg/Stk, Stk/m²) and the computed waste in kg
  and the equivalent area in m². Unknown model → weight left blank, never
  guessed.
- The inspection can be **saved without the AI**: the entry's text is a
  composed summary (Mängel, replaced tiles, note). "An die Berater senden"
  stays as an optional enrichment that replaces the text with the report.
- The `inspection` entry carries `checklist`, `tiles[]`, `wasteKg`,
  `startTime`, `ladderLength`, `psaCount` as fields, so Transport and the
  printed report can read them.

## Transport

- New top-level tab (sidebar + hamburger). Entries of type `transport`:
  `date, projectId, vehicle, from, to, departTime, arriveTime, hours, km,
  loadKind (material | waste | tools | scaffold | other), weightKg, mulde
  (size), disposalSite, notes`. Built through `newEntry()`; the driver is
  the entry's `userId`.
- Vehicles: Lieferwagen, Pritsche, Anhänger, LKW/Kran, Mulden-Service, PW.
  Skips: 3 / 7 / 10 / 15 / 20 m³.
- "+ Fahrt" form; list by day, newest first; month totals (trips, hours,
  km, kg waste); filter by job.
- **Waste prefill**: choosing a job and load kind *Abfall* offers the sum
  of that job's inspection `wasteKg` minus waste already transported for
  it ("aus Inspektion: 340 kg offen").
- Transport hours are shown **separately** from work hours in Berichte
  (a trip may overlap a running clock; the GAV treats travel differently
  and the office decides how to pay it).

## Definition of done

- Job view: Dachinspektion button → tiles → save without AI → an
  `inspection` entry with the summary text and `wasteKg`.
- Transport tab reachable by every role; a trip saved from the form
  appears in the list with hours computed from the two times.
- A waste trip for a job with an inspection is prefilled with the open
  waste weight.
- Logic tests for the tile reference (weight, area, unknown model) and the
  transport hours; render tests for the button, the tiles, the tab and the
  form.

## Out of scope

- Route/km from a maps API.
- Disposal-site price lists (a free text and an optional cost for now).
- Charging transport into job costing (later, with the Bexio export).
