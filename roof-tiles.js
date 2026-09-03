// Roof tiles as they are named on a Swiss site, with what one weighs and how
// many cover a square metre. Used to turn "we replaced 180 Biber" into a
// waste weight the transport can plan a skip for.
//
// The figures are typical manufacturer values (Gasser, ZZ Wancor, Braas,
// Eternit); a given batch differs by a few percent. That is fine for a
// skip, not for a structural calculation -- and the app never uses it for one.

export const ROOF_TILES = [
  { key: "biber", label: "Biberschwanz", kgPerPiece: 2.0, perM2: 36 },
  { key: "biber_doppel", label: "Biberschwanz (Doppeldeckung)", kgPerPiece: 2.0, perM2: 44 },
  { key: "jura", label: "Jura / Berner Ziegel", kgPerPiece: 2.9, perM2: 15 },
  { key: "flachdachziegel", label: "Flachdachziegel (Tegalit)", kgPerPiece: 4.3, perM2: 10 },
  { key: "muldenfalz", label: "Doppelmuldenfalzziegel", kgPerPiece: 3.4, perM2: 14 },
  { key: "pfanne_ton", label: "Pfannenziegel (Ton)", kgPerPiece: 3.6, perM2: 11 },
  { key: "frankfurter", label: "Frankfurter Pfanne (Beton)", kgPerPiece: 4.3, perM2: 10 },
  { key: "tegula", label: "Tegula / Harzer Pfanne (Beton)", kgPerPiece: 4.5, perM2: 10 },
  { key: "eternit_platte", label: "Faserzement-Dachplatte (Eternit)", kgPerPiece: 1.1, perM2: 20 },
  { key: "welle", label: "Faserzement-Wellplatte", kgPerPiece: 12.0, perM2: 1.4 },
  { key: "schiefer", label: "Naturschiefer", kgPerPiece: 1.3, perM2: 25 },
  { key: "first", label: "Firstziegel", kgPerPiece: 3.8, perM2: 0 },
];

export function tileMeta(key) {
  return ROOF_TILES.find((t) => t.key === key) || null;
}

// { wasteKg, areaM2 } for a model and a count; null weight for an unknown
// model rather than a made-up number.
export function tileWaste(key, count) {
  const n = Math.max(0, parseFloat(count) || 0);
  const meta = tileMeta(key);
  if (!meta || !n) return { wasteKg: meta ? 0 : null, areaM2: meta ? 0 : null };
  return {
    wasteKg: Math.round(n * meta.kgPerPiece),
    areaM2: meta.perM2 > 0 ? Math.round((n / meta.perM2) * 10) / 10 : 0,
  };
}

// Total waste over several rows; rows with an unknown model contribute
// nothing and are reported so the form can say so.
export function tilesWaste(rows) {
  let wasteKg = 0, areaM2 = 0, unknown = 0;
  for (const r of rows || []) {
    const w = tileWaste(r.model, r.count);
    if (w.wasteKg == null) { if (parseFloat(r.count) > 0) unknown++; continue; }
    wasteKg += w.wasteKg; areaM2 += w.areaM2;
  }
  return { wasteKg, areaM2: Math.round(areaM2 * 10) / 10, unknown };
}

// The inspection's own summary line, for the entry text when no AI report
// is asked for.
export function summariseInspection({ checklist = {}, tiles = [], note = "", labels = {} }) {
  const bad = Object.entries(checklist).filter(([, v]) => v === "mangel").map(([k]) => labels[k] || k);
  const ok = Object.entries(checklist).filter(([, v]) => v === "ok").length;
  const w = tilesWaste(tiles);
  const parts = [];
  if (bad.length) parts.push(`${labels.__mangel || "Mangel"}: ${bad.join(", ")}`);
  if (ok) parts.push(`${ok} ${labels.__ok || "OK"}`);
  const tileLines = (tiles || []).filter((r) => parseFloat(r.count) > 0).map((r) => `${r.count} ${(tileMeta(r.model) || {}).label || r.model || "?"}`);
  if (tileLines.length) parts.push(`${labels.__replaced || "ersetzt"}: ${tileLines.join(", ")}${w.wasteKg ? ` (~${w.wasteKg} kg)` : ""}`);
  if (note && note.trim()) parts.push(note.trim());
  return parts.join(" · ");
}

// Hours between two HH:MM times on the same day; a trip that ends after
// midnight counts forward. Blank or malformed → 0.
export function tripHours(depart, arrive) {
  const p = (s) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || "").trim()); return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null; };
  const a = p(depart), b = p(arrive);
  if (a == null || b == null) return 0;
  let d = b - a;
  if (d < 0) d += 24 * 60;
  return Math.round((d / 60) * 100) / 100;
}
