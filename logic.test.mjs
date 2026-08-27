// Tests for the app's pure logic — the parts that can be checked without a
// browser or an account. Run with: npm run test:logic
//
// These exist because a verification pass found real bugs in features nobody
// had exercised since they were written.

import { build } from "esbuild";
import { parsePriceList, parsePrice, mergeIntoCatalog } from "./price-list.js";
import { writeFileSync, unlinkSync } from "node:fs";

// The helpers live in the JSX module, so compile it to plain JS first.
const tmp = "./.logic-under-test.mjs";
await build({
  entryPoints: ["roofing-site-manager.jsx"],
  outfile: tmp,
  bundle: true,
  format: "esm",
  jsx: "automatic",
  external: ["react", "react-dom", "lucide-react", "./firebase-client.js", "./company-store.js", "./swiss-qr.js"],
  logLevel: "silent",
});

const M = await import(tmp);
unlinkSync(tmp);

let pass = 0, fail = 0;
function t(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "ok   " : "FAIL ") + name + (ok ? "" : `\n       got  ${JSON.stringify(got)}\n       want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
}

// --- project share codes -------------------------------------------------
const project = { name: "Dach Muster", client: "Sutter", address: "Lettenring 21", category: "pitched" };
const entries = [
  { type: "material", description: "Siga Risan", qty: "8", unit: "m", date: "2026-08-20" },
  { type: "time", description: "7h", qty: "7", unit: "h", date: "2026-08-20" },
  { type: "photo", description: "Foto", photoId: "abc", date: "2026-08-20" },
];
const code = M.encodeProjectCode(project, entries);
t("share code has the expected prefix", code.slice(0, 6), "SITE1-");
const back = M.decodeProjectCode(code);
t("share code round-trips the project name", back.name, "Dach Muster");
t("share code keeps address and category", [back.address, back.category], ["Lettenring 21", "pitched"]);
t("photos are excluded from the share code", back.entries.length, 2);
t("share code survives email line-wrapping", M.decodeProjectCode(code.slice(0, 20) + "\n" + code.slice(20)).name, "Dach Muster");
t("share code survives surrounding text", M.decodeProjectCode("Hier der Code:\n\n" + code + "\n\nGruss").name, "Dach Muster");
t("garbage is rejected rather than throwing", M.decodeProjectCode("not a code"), null);
t("empty input is rejected", M.decodeProjectCode(""), null);
t("umlauts and accents survive", M.decodeProjectCode(M.encodeProjectCode({ name: "Gebäude Zürich — Façade", client: "", address: "", category: "facade" }, [])).name, "Gebäude Zürich — Façade");

// --- backup codes --------------------------------------------------------
const payload = {
  projects: [{ id: "p1", name: "A" }],
  entries: [{ id: "e1", type: "time", qty: "8" }],
  customers: [{ id: "c1", name: "Kunde" }],
  documents: [{ id: "d1", type: "invoice", number: "R-2026-001" }],
  lang: "de",
};
const bcode = M.encodeBackup(payload);
t("backup code has the expected prefix", bcode.slice(0, 8), "BACKUP1-");
const bback = M.decodeBackup(bcode);
t("backup round-trips customers", bback.customers[0].name, "Kunde");
t("backup round-trips documents", bback.documents[0].number, "R-2026-001");
t("a project code is not accepted as a backup", M.decodeBackup(code), null);

// --- note classification -------------------------------------------------
t("cement is material", M.classifyNote("8 Sack Zement verbraucht"), "material");
t("ladder is a tool", M.classifyNote("Leiter 5m gebraucht"), "tool");
t("hours are time", M.classifyNote("8 Stunden gearbeitet"), "time");
t("anything else is a note", M.classifyNote("Kunde war zufrieden"), "note");

// --- document numbering --------------------------------------------------
const docs = [
  { type: "invoice", number: "R-2026-001" },
  { type: "invoice", number: "R-2026-004" },
  { type: "quote", number: "O-2026-002" },
];
t("invoice numbering continues past the highest", M.nextDocNumber(docs, "invoice", 2026), "R-2026-005");
t("quote numbering is independent", M.nextDocNumber(docs, "quote", 2026), "O-2026-003");
t("a new year restarts numbering", M.nextDocNumber(docs, "invoice", 2027), "R-2027-001");
t("no documents starts at 001", M.nextDocNumber([], "invoice", 2026), "R-2026-001");

// --- client to customer migration ---------------------------------------
const mig = M.migrateClientsToCustomers(
  [{ id: "p1", client: "Meier AG" }, { id: "p2", client: "meier ag" }, { id: "p3", client: "" }],
  []
);
t("same client in different case becomes one customer", mig.customers.length, 1);
t("both projects link to it", [!!mig.projects[0].customerId, !!mig.projects[1].customerId], [true, true]);
t("a project with no client is left alone", mig.projects[2].customerId, undefined);
const again = M.migrateClientsToCustomers(mig.projects, mig.customers);
t("running migration twice creates nothing new", [again.customers.length, again.changed], [1, false]);

// --- status fallback -----------------------------------------------------
t("unknown status falls back to waiting", M.statusMeta("nonsense").key, "waiting");
t("missing status falls back to waiting", M.statusMeta(undefined).key, "waiting");
t("a known status is returned", M.statusMeta("construction").key, "construction");

// --- duration formatting -------------------------------------------------
t("formats hours and minutes", M.fmtHM(3600000 * 7.5), "7h 30m");
t("formats under an hour", M.fmtHM(60000 * 45), "0h 45m");

// --- supplier price lists ------------------------------------------------
// These numbers become invoice lines, so the number formats merchants actually
// export are pinned down here rather than trusted to parseFloat.
t("swiss thousands apostrophe", parsePrice("1'234.50"), "1234.5");
t("german decimal comma", parsePrice("2,75"), "2.75");
t("german thousands dot with decimal comma", parsePrice("1.234,50"), "1234.5");
t("english thousands comma", parsePrice("1,234.50"), "1234.5");
t("bare thousands comma is not a decimal", parsePrice("1,234"), "1234");
t("currency symbols are ignored", parsePrice("CHF 89.90"), "89.9");
t("empty price stays empty", parsePrice(""), "");
t("a dash stays empty", parsePrice("-"), "");

{
  const r = parsePriceList("Artikelbezeichnung;Artikel-Nr;Einheit;Preis\nLattung 40/60;12345;m;1'234.50");
  t("csv row is parsed", r.rows, [{ name: "Lattung 40/60", artNo: "12345", unit: "m", price: "1234.5", supplier: "" }]);
  t("csv format is detected", r.format, "csv");
}
{
  const r = parsePriceList("name,sku,uom,price\nRidge tile,R-1,Stk,4.20");
  t("comma delimiter with english headers", r.rows.length, 1);
  t("english header maps the article number", r.rows[0].artNo, "R-1");
}
{
  const r = parsePriceList("Menge;Datum\n5;2026-01-01");
  t("a file with no name column imports nothing", r.rows.length, 0);
  t("and says why", r.warnings, ["noNameColumn"]);
}
{
  const r = parsePriceList("Bezeichnung;Artikel-Nr\nDachziegel;9");
  t("a missing price column is flagged, not fatal", r.warnings.includes("noPriceColumn"), true);
  t("rows still import without prices", r.rows.length, 1);
}
{
  const r = parsePriceList("V;irrelevant header\nA;N;4711;;Dachziegel;rot;;;Stk;2,75;;;");
  t("datanorm records are recognised", r.format, "datanorm");
  t("datanorm article number", r.rows[0].artNo, "4711");
  t("datanorm joins both short texts", r.rows[0].name, "Dachziegel rot");
  t("datanorm field order is flagged for review", r.warnings.includes("datanormFieldOrder"), true);
}
{
  const before = { dachziegel: { name: "Dachziegel", unit: "Stk", price: "2.00", artNo: "", supplier: "" } };
  const m = mergeIntoCatalog(before, [
    { name: "Dachziegel", artNo: "4711", unit: "Stk", price: "2.75", supplier: "" },
    { name: "Lattung", artNo: "12", unit: "m", price: "1.10", supplier: "" },
  ], "HGC");
  t("new articles are counted", m.added, 1);
  t("existing articles are counted", m.updated, 1);
  t("a changed price is called out", m.repriced, 1);
  t("the import fills in the article number", m.catalog.dachziegel.artNo, "4711");
  t("the default supplier is applied", m.catalog.lattung.supplier, "HGC");
}
{
  const m = mergeIntoCatalog({}, [{ name: "Blech", artNo: "", unit: "", price: "", supplier: "" }], "");
  t("a row with no price does not invent one", m.catalog.blech.price, "");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
