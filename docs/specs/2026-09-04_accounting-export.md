# Accounting export: invoices, hours and customers for Bexio and the Treuhänder

**Status: implemented 2026-09-04** (accepted the same day; owner picked it as the next patch: "1").

## What Bexio actually takes (checked 2026-09-04)

- **Invoices:** no native CSV/Excel import. They enter through the API
  (`POST /2.0/kb_invoice`, OAuth2/OpenID login per firm) or through
  third-party importers (importly, Rombro templates) that use the API.
- **Hours for Lohn:** bexio Payroll takes hours only from bexio's own
  project time tracking or from clockodo/TimeStatement, matched **by the
  employee's e-mail address**. No CSV import.
- **Contacts:** native import via *Kontakte → Import/Export → Kontakte
  hochladen (.xlsx)*, with bexio's own template columns (Kontaktart
  Privat/Firma, Name, Vorname, Adresse, PLZ, Ort, Land, Telefon, E-Mail,
  Kontaktperson 1 …). Max 2,000 per import.

So the honest v1 is **files the office and the Treuhänder can use today**,
without a Bexio account being connected to Site Log. The API push is a
separate spec (OAuth flow, token storage in the Worker, mapping of
contacts/projects/users).

## Goal

The owner opens the Cockpit, picks a month, and downloads:

1. **Rechnungsjournal** — one row per invoice of that month: number, date,
   due date, customer, site, net, VAT rate, VAT, gross (rounded to 0.05
   like the printed invoice), paid, open, status. What a Treuhänder books
   from; what an importer maps into `kb_invoice`.
2. **Rechnungspositionen** — one row per line item, with the invoice
   number on every row (no blank-cell tricks): description, qty, unit,
   unit price, amount.
3. **Stunden pro Mitarbeiter (Lohn)** — one row per person: name,
   **e-mail** (the bexio Payroll key), days worked, normal, overtime,
   travel, breaks, net, target (contract day × working days of the month),
   difference, approved absences by kind. Plus **Stunden pro Tag** with the
   same split per person and day, for a Stundenlöhner or a dispute.
4. **Kunden als Bexio-Kontakte** — customers in the bexio template layout,
   `Firma` when a company name is set, else `Privat`; the person becomes
   `Kontaktperson 1` on a Firma; the whole name goes into `Name` (bexio's
   mandatory field) and `Vorname` stays empty, because Swiss offices write
   both "Teresa Sutter" and "Sutter Teresa" and a wrong split is worse than
   none; address split into Strasse / PLZ / Ort (Swiss four-digit PLZ on
   its own line), Land CH.

All files: UTF-8 with BOM, `;` separated, CRLF, numbers with `.` and two
decimals (de-CH Excel and bexio), fixed German headers (office documents;
the buttons and hints are translated). For the bexio contact import the
office opens the CSV in Excel and saves it as .xlsx — one step, said in
the hint. An .xlsx writer is out of scope until a pilot asks.

## Design

- `documents.js` (new, pure): `documentTotals`, `documentState` move here;
  the app re-exports them so every import keeps working. Money stays in one
  place.
- `accounting-export.js` (new, pure, tested): `toCsv(headers, rows)`,
  `monthDays(month)`, `workingDays(month)`, `invoiceJournal(documents,
  customers, projects, month)`, `invoicePositions(documents, month)`,
  `payrollRows(entries, members, month, weeklyHours, leaveRequests)`,
  `payrollDays(...)`, `contactRows(customers)`, `splitAddress(text)`.
  Hours reuse `splitDayHours` from `reports.js`.
- `ui/download.js`: `downloadText(name, text, mime)`; the week CSV uses it
  too.
- `tabs/CockpitTab.jsx`: `ExportCard` (owner only, `[data-export-card]`):
  `<input type="month" data-export-month>` defaulting to the previous
  month, a count line (invoices · people · customers), buttons
  `[data-export=invoices|positions|payroll|payroll-days|contacts]`, a hint.
  New props on the Cockpit mount: `documents, customers, entries, billing,
  leaveRequests`.
- i18n: `export*` keys ×14.

## Definition of done

- Journal gross equals `documentTotals` for every invoice; draft invoices
  and quotes are excluded; a month with nothing yields a file with headers
  only and the button says so.
- Payroll rows split normal/overtime with the firm's weekly hours (42 h →
  8.4 h/day), the target counts Mon–Fri of the month, absences are approved
  ones only, the e-mail is the member's login e-mail.
- Contact rows: Firma vs Privat, PLZ/Ort split, person as Kontaktperson 1,
  whole name in Name.
- Logic tests for the helpers; render test: the owner's Cockpit shows the
  card and a click hands the browser a file with the right name and header.
- Existing suites green; emulator check with the seeded firm; deployed.

## Out of scope

- Bexio API push (OAuth) — next spec once a pilot has a bexio account.
- .xlsx writer, Abacus/Sage layouts, products export.
