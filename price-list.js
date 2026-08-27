// Parsing a supplier's price list into the article master.
//
// The point of this file is that a small roofing firm can get a real
// Artikelstamm without an integration contract. The big packages (plancraft,
// HERO, pds) read DATANORM straight from the wholesaler; that needs a
// commercial relationship with each merchant. A CSV export from the merchant's
// portal is something the boss can download himself this afternoon.
//
// Nothing here writes anything. It returns rows plus warnings, and the caller
// shows them for confirmation first -- a price list overwrites prices that end
// up on invoices, so it is not something to apply sight unseen.

const HEADERS = {
  // What merchants actually call these columns, across the languages their
  // portals ship in.
  name: ["name", "bezeichnung", "artikelbezeichnung", "artikel", "kurztext", "beschreibung", "description", "designation", "nazwa", "descrizione", "denominazione"],
  artNo: ["artikelnummer", "artikel-nr", "artikelnr", "art-nr", "artnr", "art. nr", "artikel nr", "nummer", "article number", "article no", "art no", "sku", "ref", "référence", "reference", "codice", "nr artykulu", "nr artykułu", "indeks"],
  price: ["preis", "einzelpreis", "nettopreis", "verkaufspreis", "ep", "price", "unit price", "prix", "prezzo", "cena", "cena netto"],
  unit: ["einheit", "mengeneinheit", "me", "verpackungseinheit", "unit", "uom", "unité", "unita", "unità", "jednostka", "jm"],
  supplier: ["lieferant", "hersteller", "supplier", "vendor", "fournisseur", "fornitore", "dostawca"],
};

function normHeader(h) {
  return String(h || "").trim().toLowerCase().replace(/^\uFEFF/, "").replace(/[."']/g, "");
}

function matchColumn(header) {
  const h = normHeader(header);
  for (const [field, aliases] of Object.entries(HEADERS)) {
    if (aliases.includes(h)) return field;
  }
  return null;
}

// Swiss and German exports write 1'234.50, 1.234,50 and 1234.50 for the same
// number. Guessing wrong turns 1'234.50 into 123450, so this is deliberate
// rather than a parseFloat.
export function parsePrice(raw) {
  let v = String(raw == null ? "" : raw).trim();
  if (!v) return "";
  v = v.replace(/[^\d.,'\-]/g, "").replace(/'/g, "");
  if (!v || v === "-") return "";
  const lastComma = v.lastIndexOf(",");
  const lastDot = v.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // whichever comes last is the decimal separator
    if (lastComma > lastDot) v = v.replace(/\./g, "").replace(",", ".");
    else v = v.replace(/,/g, "");
  } else if (lastComma > -1) {
    // A lone comma is decimal unless it looks like a thousands group (1,234)
    v = /,\d{3}$/.test(v) ? v.replace(/,/g, "") : v.replace(",", ".");
  }
  const n = parseFloat(v);
  return Number.isFinite(n) ? String(n) : "";
}

export function detectDelimiter(line) {
  const counts = [";", "\t", ",", "|"].map((d) => [d, line.split(d).length - 1]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ";";
}

// Minimal RFC4180: quoted fields, doubled quotes inside them.
export function splitRow(line, delim) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

// DATANORM article records. The field order below is DATANORM 4/5 as published,
// but merchants do vary it, which is exactly why the caller previews the result
// before applying it rather than trusting this blind.
function parseDatanorm(lines, warnings) {
  const rows = [];
  for (const line of lines) {
    if (!/^A\s*;/i.test(line)) continue;
    const f = line.split(";");
    const name = [f[4], f[5]].filter((x) => x && x.trim()).join(" ").trim();
    if (!name) continue;
    rows.push({
      name,
      artNo: (f[2] || "").trim(),
      unit: (f[8] || "").trim(),
      price: parsePrice(f[9]),
      supplier: "",
    });
  }
  if (rows.length) warnings.push("datanormFieldOrder");
  return rows;
}

export function parsePriceList(text) {
  const warnings = [];
  const lines = String(text || "").split(/\r\n|\r|\n/).filter((l) => l.trim());
  if (!lines.length) return { rows: [], format: "empty", warnings: ["emptyFile"] };

  if (lines.some((l) => /^A\s*;/i.test(l))) {
    return { rows: parseDatanorm(lines, warnings), format: "datanorm", warnings };
  }

  const delim = detectDelimiter(lines[0]);
  const header = splitRow(lines[0], delim);
  const map = {};
  header.forEach((h, i) => {
    const field = matchColumn(h);
    if (field && map[field] === undefined) map[field] = i;
  });

  if (map.name === undefined) {
    // No recognisable header. Rather than guess which column is the name and
    // silently import rubbish, say so.
    return { rows: [], format: "csv", warnings: ["noNameColumn"] };
  }
  if (map.price === undefined) warnings.push("noPriceColumn");
  if (map.artNo === undefined) warnings.push("noArtNoColumn");

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitRow(lines[i], delim);
    const name = (cells[map.name] || "").trim();
    if (!name) continue;
    rows.push({
      name,
      artNo: map.artNo === undefined ? "" : (cells[map.artNo] || "").trim(),
      unit: map.unit === undefined ? "" : (cells[map.unit] || "").trim(),
      price: map.price === undefined ? "" : parsePrice(cells[map.price]),
      supplier: map.supplier === undefined ? "" : (cells[map.supplier] || "").trim(),
    });
  }
  return { rows, format: "csv", warnings };
}

// Folds parsed rows into the existing article master and reports what would
// change, so the user sees "412 new, 38 repriced" before committing.
export function mergeIntoCatalog(catalog, rows, defaultSupplier) {
  const next = { ...catalog };
  let added = 0, updated = 0, repriced = 0;
  for (const r of rows) {
    const key = r.name.trim().toLowerCase();
    if (!key) continue;
    const prev = next[key];
    const merged = {
      name: r.name.trim(),
      unit: r.unit || prev?.unit || "",
      price: r.price || prev?.price || "",
      artNo: r.artNo || prev?.artNo || "",
      supplier: r.supplier || defaultSupplier || prev?.supplier || "",
    };
    if (!prev) added++;
    else {
      if (r.price && prev.price && r.price !== prev.price) repriced++;
      updated++;
    }
    next[key] = merged;
  }
  return { catalog: next, added, updated, repriced };
}
