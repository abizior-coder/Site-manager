# Materials: a supplier opens the whole list as a sheet

**Status: implemented 2026-09-04** (accepted the same day; (owner: "po kliknięciu na zakładkę np. HGC
zamiast tylko kilku materiałów ma być cała lista w formie arkusza z
przewijaniem, możliwością szukania, sortowania, dodania do koszyka,
przeciągnięcia na projekt"). Verified on the emulator with a 3,000-row import: 30 rows in the DOM, search, price sort, «+» with unit and price.

## Goal

Tapping a supplier (HGC, Gabs, Soprema, …) shows every article the firm
has for that supplier — the imported price list, thousands of rows if
need be — as a scrolling sheet: article number, name, unit, price;
search as you type; sort by any column; «+» into the basket; every row
draggable onto a job or a dock tile. The handful of demo items per
supplier only fills the sheet while no price list is imported, with a
line that says so and a button to import one.

## Design

- Source: `articleMaster` (the merged price lists, `price-list.js`),
  filtered by `supplier`; when it has nothing for that supplier, the
  catalogue's demo groups for it, flattened, marked "Beispiel".
- `ArticleSheet` (in `tabs/MaterialsTab.jsx`): search box (name or
  article number, case-insensitive, instant), sortable column headers
  (name, article no., unit, price; a second tap reverses), a virtual
  window of rows (only the ~60 rows around the scroll position are in
  the DOM, so 5,000 articles scroll on a phone), a count line
  ("1 254 Artikel, 38 gefunden"), and per row: the number, the name, the
  unit, the price, a «+» that calls `addToBasket(name, "material", {unit,
  price, supplier, artNo})`. Rows carry `materialDragProps(name,
  "material", {unit, artNo, supplier})` so they drop onto a job or a
  dock tile like the chips do today.
- The type view (Holz, Membranen, …) is unchanged; the sheet replaces the
  group chips in the supplier view only.
- Pure helpers with tests in `price-list.js`: `articlesFor(master,
  catalogue, supplier)`, `filterArticles(rows, query)`, `sortArticles(rows,
  key, dir)`.

## Definition of done

- With an imported HGC list, tapping HGC shows all its rows, search
  narrows them, a header tap sorts, «+» adds to the basket with unit and
  price, and a row drags onto the dock tile (dock test).
- Without a list, HGC shows the demo items with the "Beispiel" line and
  the import button.
- Logic tests for the three helpers; render test for search, sort and
  basket; the existing order and dock tests keep passing.

## Out of scope

- Live shop prices (OCI) — separate spec.
- Editing articles in the sheet.
