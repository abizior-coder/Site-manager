# Wie die anderen aufgebaut sind: Menüs, Layout, Standards (2026-09-04)

Owner's ask: "zbadaj strukturę pozostałych dostępnych na rynku programów,
menu, ułożenie etc, zaproponuj zmiany w tej aplikacji które są standardem
w branży".

Method: public feature pages and store listings, read on 2026-09-04, no
accounts. Where a page did not describe the phone layout, that is said.
Sources at the end.

## 1. Who was looked at

| Product | Market | What it is |
|---|---|---|
| Baurapport.ch | CH, all trades incl. Dachdecker/Spengler | site app with Rapport as the daily unit, GAV hour split, Swiss servers |
| plancraft | DE/AT/CH, trades | office + worker app: Zeiterfassung, Baudokumentation, Chat, Plantafel |
| ToolTime | DE, trades | office + worker app: Aufträge, Zeiterfassung, Baudokumentation, Unterschrift |
| Craftnote | DE/CH, construction | project folder ("Baumappe"), Chat, Bautagebuch, Fotos, Dokumente |
| 123erfasst (Nevaris) | DE/AT/CH, construction | six modules; worker app: Zeit, Tagesbericht, Fotos |
| MeinDachdecker-App | CH/DE, roofing | Zeit, Bautagebuch, Rapporte, Abnahme, Chat, Material, Urlaub, customer portal |
| smartDach | DE, roofing | Zeit, Rapportzettel, Bautagebuch, Dienstplan, Urlaub |
| Das Programm | DE, roofing | Aufmass, Angebote, Aufträge, Zeit (Stoppuhr), Abnahme, Bautagebuch |
| PlanRadar / Fieldwire | international, site management | tickets/tasks on plans, photos, forms, reports, offline |

## 2. What every one of them does the same way

These are the patterns that show up in nearly every product. A crew that
has used any of them expects them.

1. **A bottom tab bar on the phone, four or five items, the rest under
   «Mehr».** Baurapport: *Start · Baustellen · Rapport · Woche · Mehr*.
   ToolTime and 123erfasst describe a bottom navigation for the crew.
   Nobody hides the main sections behind a hamburger on a phone.
2. **The Baustelle is the hub.** One screen per site with: address and
   status, who is assigned, plans and documents, the photo gallery, the
   chat, the reports. Craftnote calls it the Baumappe, plancraft the
   Projektmappe. Inside, the content is split into tabs or sections, not
   one long page.
3. **The day is a Rapport (Tagesrapport / Bautagebuch).** One record per
   person and day with hours (split *Normal / Überstunden / Reisezeit*
   in Switzerland, per GAV), breaks, material used, photos, checklist,
   notes, and the office approves it. Baurapport, 123erfasst, plancraft,
   Craftnote, MeinDachdecker and smartDach all build the worker's day
   around this.
4. **Time is a stamp, not a form.** Einstempeln / Ausstempeln, breaks,
   travel time, switch the site with one tap (plancraft), a stopwatch
   (Das Programm). A **weekly view** per person and an export for payroll
   (Baurapport «Woche», TimeTac).
5. **A chat per site.** Craftnote ("like WhatsApp"), Baurapport, plancraft,
   MeinDachdecker. Photos and voice notes go into it; the office reads it.
6. **Tasks and checklists per site**, with an assignee, a due date and a
   photo as proof; defects as tickets pinned on a plan (PlanRadar,
   Fieldwire, Craftnote, Baurapport).
7. **Photos with markup, documents in folders, plans available offline**
   (Craftnote, PlanRadar, Baurapport).
8. **Abnahme / Rapport with the customer's signature** (Das Programm,
   MeinDachdecker, ToolTime, plancraft).
9. **Absences and planning:** Urlaubsantrag, Krankmeldung, Dienstplan /
   Plantafel (MeinDachdecker, smartDach, plancraft, Craftnote).
10. **Two faces:** a simple worker app, and a browser back office for
    approval, planning, quotes and invoices (all of them).

Not standard, but a differentiator worth noting: a **customer portal**
(MeinDachdecker: the client sees progress, reports, the Abnahme).
Roofing-specific extras: **Aufmass / Dachflächen** and **Ziegel
catalogues** (Das Programm).

## 3. Site Log today, against that list

| Pattern | Site Log now | Verdict |
|---|---|---|
| Bottom tab bar | hamburger drawer with 10 items (Heute, Projekte, Kunden, Kalender, Material, Team, Transport, Berichte, Sicherheit + Board/Übersicht for managers); dock of active jobs at the bottom | **gap** — the phone has no primary navigation in reach of the thumb |
| Baustelle as hub | job view exists and is rich (crew, plans, materials by trade, inspections, trips, comments, reports) but is **one long page** | **partly** — content is there, structure is not |
| Tagesrapport | daily report exists as a live view with send history, breaks net of GAV, notes section; hours are not split Normal/Überstunden/Reisezeit; no per-person weekly view | **partly** |
| Time as a stamp | Tag starten/stoppen in the job, Znüni/Mittag chips; no one-tap site switch, no travel category in hours, no reminder | **partly** |
| Chat per site | comments with auto-translation into crew languages (better than most), but no author/time layout, no read state, no photo in the thread | **partly**, with a strength nobody else has |
| Tasks/checklists | inspection checklist only; no tasks with assignee and due date | **gap** |
| Photos/markup/plans | photo viewer with markup, plans in R2, offline shell | **done** (plan pins missing) |
| Signature | signed Rapport, immutable | **done** |
| Absences/planning | leave requests, Board planner, multiple jobs per person/day | **done** |
| Two faces | Board/Cockpit for managers, crew tabs; same PWA | **done** |
| Quick capture | the note box on Heute classifies text; camera button removed today because it covered content | **gap** — no standard «+» |
| Naming | menu says Projekte, job view says Auftrag, dock says Baustellen | **inconsistent** |

## 4. Proposed changes, in the order they pay off

### P1 — the phone gets a tab bar and a «+» (standard #1, #10)

`Heute · Baustellen · + · Rapport · Mehr`. The «+» opens a sheet: Zeit
starten/stoppen, Material, Foto, Notiz, Fahrt, Inspektion — for the
active site, or asks which. «Mehr» holds Kunden, Kalender, Material,
Team, Transport, Berichte, Sicherheit, Profil; managers see Board and
Übersicht there too. The desktop keeps the sidebar. The dock of active
jobs moves into the Baustellen tab as its top strip (it is the same
idea: the active sites in reach). The hamburger goes.
Effort: 1–2 days; the tabs already exist, this is navigation only.
Risk: every render test that walks the menu; the dock tests.

### P2 — the day becomes a Rapport with a Woche view (standard #3, #4)

Rename the daily report to **Tagesrapport** and give it the shape the
market uses: Stunden split *Normal / Überstunden / Reisezeit* (Transport
hours become Reisezeit, which the GAV pays), Pausen, Material, Fahrten,
Fotos, Notizen, Checkliste, Unterschrift optional. Add **Woche**: hours
per person per day for the week, with the GAV target, the same numbers
the monthly sheet (planned for October) will export. Office approval
already exists (Cockpit «Stunden zu prüfen»); surface it on the Rapport.
Effort: 2–3 days; `reports.js` and `breaks.js` carry most of the logic.

### P3 — the Baustelle gets tabs and a chat (standard #2, #5)

The job view becomes a hub with a segmented control:
`Übersicht · Zeiten · Material · Fotos · Pläne · Rapporte · Chat`.
Übersicht keeps address, status, crew, next steps; the rest is what is
there today, one section per tab. Comments become the **Chat**: author
and time on every message, photos in the thread, the auto-translation
under each message as now, unread count on the tab. This is also where
Site Log is ahead: a chat that every language on the roof can read.
Effort: 2–3 days, mostly moving JSX; `tabs/ProjectDetail.jsx` is already
a separate module.

### P4 — tasks per site (standard #6)

Aufgaben with assignee, due date, photo proof, done state; the
inspection checklist becomes one kind of task list. Shown in the hub's
Übersicht and on Heute ("Heute für dich"). Later: a pin on a plan.
Effort: 2 days.

### P5 — time polish (standard #4)

One-tap site switch while clocked in; Reisezeit as a category; a push
reminder at the planned start (needs notifications, a spec of its own).

### P6 — naming

Crews: **Baustellen** everywhere (menu, dock, hub). Office: Aufträge
where money is meant (Offerte, Rechnung). Drop «Projekte» from the crew
side.

### Later, as differentiators, not standards

Customer portal with progress photos and reports (MeinDachdecker);
Aufmass / Dachflächen with the tile reference already in `roof-tiles.js`.

## 5. What not to copy

- A separate "Mitarbeiter-App" and "Büro-Software" as two products: Site
  Log's one PWA with role-based views is simpler to run and to sell.
- Ten modules on the home screen (123erfasst): the crew needs three.
- Chat without translation: the market's chats are single-language.

## Sources

- Baurapport.ch — https://baurapport.ch/de
- plancraft — https://plancraft.com/
- ToolTime Funktionen — https://www.tooltime.app/funktionen
- Craftnote — https://www.craftnote.de/ and https://craftnote.de/funktionen/
- 123erfasst — https://www.123erfasst.de/
- MeinDachdecker-App — https://www.mein-dachdecker-app.ch/
- smartDach — https://www.leistungen-dach.de/app-fur-handwerker/
- Das Programm (Dachdecker) — https://das-programm.io/gewerke/dachdecker-software/
- PlanRadar, Vergleich Bauleiter-Apps Schweiz — https://www.planradar.com/ch/app-fuer-bauleiter-welche-bauleiter-app/
- Softwareabc24, Dachdecker-Software 2026 — https://www.softwareabc24.de/handwerker-software/dachdecker/
