// Tests for the app's pure logic — the parts that can be checked without a
// browser or an account. Run with: npm run test:logic
//
// These exist because a verification pass found real bugs in features nobody
// had exercised since they were written.

import { build } from "esbuild";
import { parsePriceList, parsePrice, mergeIntoCatalog } from "./price-list.js";
import { reportId, reportRows, reportTotals, unsentMonthEntries, withSend, rapportChanged } from "./reports.js";
import { guessKind, fmtSize, sortFiles, normaliseLink, MAX_FILE_BYTES as MAX_UPLOAD } from "./files.js";
import { BREAKS, breakHours, netHours, breakTaken } from "./breaks.js";
import { sanitiseBackup, sanitiseProjectCode, isPhotoDataUrl } from "./import-guard.js";
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

// --- the report model ----------------------------------------------------
// A report is a view over entries plus a send record. These pin down the
// two things that used to duplicate: identity, and copied rows.
t("one id per person, period and day", reportId("u1", "daily", "2026-09-02"), "u1-daily-2026-09-02");
t("a second send makes the same id", reportId("u1", "daily", "2026-09-02") === reportId("u1", "daily", "2026-09-02"), true);
t("another person's report is a different one", reportId("u2", "daily", "2026-09-02") === reportId("u1", "daily", "2026-09-02"), false);

{
  const log = [
    { id: "a", type: "time", qty: "7.5", projectId: "p1", description: "7h 30m" },
    { id: "b", type: "material", qty: "8", unit: "m", projectId: "p1", description: "Lattung" },
    { id: "c", type: "tool", qty: "1", projectId: "p2", description: "Bauaufzug" },
  ];
  const report = { entryIds: ["a", "b", "c", "gone"], entryLabels: { gone: "Ziegel · 24 m2" }, excludedIds: ["c"] };
  const rows = reportRows(report, log);
  t("rows come from the live log, not a copy", rows.find((r) => r.id === "b").qty, "8");
  t("an excluded entry is not a row", rows.some((r) => r.id === "c"), false);
  t("a deleted entry stays as a marked row", rows.find((r) => r.id === "gone").deleted, true);
  t("the deleted row keeps its label", rows.find((r) => r.id === "gone").description, "Ziegel · 24 m2");
  const totals = reportTotals(rows);
  t("hours are summed from live time entries", totals.hours, 7.5);
  t("deleted rows count for nothing", totals.materialsCount, 1);
  t("sites come from the live rows", totals.projIds, ["p1"]);
  // A corrected quantity in the log reaches the report without any copy.
  const fixed = log.map((e) => (e.id === "b" ? { ...e, qty: "10" } : e));
  t("a fix in the log shows in the report", reportRows(report, fixed).find((r) => r.id === "b").qty, "10");
}
{
  const legacy = { entries: [{ id: "x", type: "material", description: "Alt", qty: "1" }], hours: 3 };
  t("an old report still renders from its own copy", reportRows(legacy, []).length, 1);
}
{
  const month = [
    { id: "d1", date: "2026-09-01", type: "time", qty: "8" },
    { id: "d2", date: "2026-09-01", type: "material", qty: "1" },
    { id: "n1", date: "2026-09-02", type: "time", qty: "8" },
  ];
  const sent = [
    { id: "u1-daily-2026-09-01", period: "daily", periodLabel: "2026-09-01", userId: "u1", entryIds: ["d1", "d2"] },
    { id: "u2-daily-2026-09-02", period: "daily", periodLabel: "2026-09-02", userId: "u2", entryIds: ["n1"] },
    { id: "u1-daily-2026-08-31", period: "daily", periodLabel: "2026-08-31", userId: "u1", entryIds: ["n1"] },
  ];
  const r = unsentMonthEntries(month, sent, "u1", "2026-09");
  t("monthly leaves out what daily already sent", r.entries.map((e) => e.id), ["n1"]);
  t("and says how many it left out", r.alreadySent, 2);
  t("another person's daily report does not hide my entries", unsentMonthEntries(month, sent.filter((x) => x.userId === "u2"), "u1", "2026-09").entries.length, 3);
  t("a daily report from another month does not count", unsentMonthEntries(month, [sent[2]], "u1", "2026-09").entries.length, 3);
}
{
  const first = withSend({ id: "r", period: "daily" }, "mail", 1000);
  t("the first send starts the history", first.sends, [{ at: 1000, via: "mail" }]);
  const second = withSend(first, "whatsapp", 2000);
  t("a second send appends, it does not replace", second.sends.length, 2);
  t("sentAt follows the latest send", second.sentAt, 2000);
  const old = withSend({ id: "o", sentAt: 500 }, "mail", 3000);
  t("an old report's single sentAt becomes its first history line", old.sends[0], { at: 500, via: "mail" });
}
{
  const signed = { hours: "7.5", lines: [{ description: "Lattung", qty: "8", unit: "m" }] };
  const day = [
    { type: "time", qty: "7.5" },
    { type: "material", description: "Lattung", qty: "8", unit: "m" },
  ];
  t("a day that matches the signature is not flagged", rapportChanged(signed, day), false);
  t("a changed quantity after signing is flagged", rapportChanged(signed, [day[0], { ...day[1], qty: "10" }]), true);
  t("an added line after signing is flagged", rapportChanged(signed, [...day, { type: "material", description: "Ziegel", qty: "1" }]), true);
  t("changed hours after signing are flagged", rapportChanged(signed, [{ type: "time", qty: "9" }, day[1]]), true);
}

// --- plans and documents ---------------------------------------------------
t("a jpg is a photo", guessKind("IMG_2231.jpg", "image/jpeg"), "photo");
t("a dwg is a plan", guessKind("Dach_Sued.dwg", "application/octet-stream"), "plan");
t("a pdf called Offerte is an offer", guessKind("Offerte_Schlatter.pdf", "application/pdf"), "offer");
t("a Werkvertrag is a contract", guessKind("Werkvertrag.pdf", "application/pdf"), "contract");
t("a Lieferschein is a delivery note", guessKind("Lieferschein_HGC.pdf", "application/pdf"), "delivery");
t("an unnamed pdf is a plan by default", guessKind("scan.pdf", "application/pdf"), "plan");
t("a spreadsheet is other", guessKind("Kalkulation.xlsx", "application/vnd.ms-excel"), "other");
t("sizes read as a phone shows them", [fmtSize(900), fmtSize(20480), fmtSize(2.5 * 1024 * 1024), fmtSize(15 * 1024 * 1024)], ["900 B", "20 KB", "2.5 MB", "15 MB"]);
t("the client limit matches the Worker's 25 MB", MAX_UPLOAD, 25 * 1024 * 1024);
{
  const sorted = sortFiles([
    { id: "a", kind: "other", name: "Z", createdAt: 3 },
    { id: "b", kind: "plan", name: "Old plan", createdAt: 1 },
    { id: "c", kind: "plan", name: "New plan", createdAt: 2 },
    { id: "d", kind: "offer", name: "Offerte", createdAt: 5 },
  ]).map((f) => f.id);
  t("plans first, newest plan first, then the paperwork", sorted, ["c", "b", "d", "a"]);
}
t("a bare domain becomes https", normaliseLink("dropbox.com/s/abc"), "https://dropbox.com/s/abc");
t("an http link is kept", normaliseLink("http://intranet/plan"), "http://intranet/plan");
t("a javascript: link is refused", normaliseLink("javascript:alert(1)"), "");
t("an empty link is empty", normaliseLink("   "), "");

// --- breaks ---------------------------------------------------------------
t("two breaks a day: nine and noon", BREAKS.map((b) => `${b.key}@${b.start}/${b.minutes}`), ["znuni@09:00/30", "mittag@12:00/60"]);
{
  const day = [
    { type: "time", qty: "8.5", date: "2026-09-03", userId: "u1" },
    { type: "break", breakKey: "znuni", qty: "0.5", date: "2026-09-03", userId: "u1" },
    { type: "break", breakKey: "mittag", qty: "1", date: "2026-09-03", userId: "u1" },
  ];
  t("both breaks come to an hour and a half", breakHours(day), 1.5);
  t("the day reads net of breaks", netHours(day), 7);
  t("a break marked is found", breakTaken(day, "mittag", "2026-09-03", "u1"), true);
  t("a break not marked is not", breakTaken(day.slice(0, 2), "mittag"), false);
  t("someone else's break is not mine", breakTaken(day, "mittag", "2026-09-03", "u2"), false);
}
t("a break before any clock entry does not read as negative work", netHours([{ type: "break", breakKey: "znuni", qty: "0.5" }]), 0);
t("a break of unknown kind falls back to its stored hours", breakHours([{ type: "break", breakKey: "kaffee", qty: "0.25" }]), 0.25);

// --- what a pasted code or a backup may bring in ----------------------------
// The importer used to spread whatever JSON it was handed straight into state.
{
  let n = 0;
  const makeId = () => `new-${++n}`;
  const PNG = "data:image/png;base64,iVBORw0KGgo=";
  const hostile = {
    projects: [{ id: "p1", name: "Dach", client: "Sutter", address: "Lettenring 21", category: "pitched", status: "construction", __proto__polluted: true, evil: "<script>" }],
    entries: [
      { id: "e1", type: "photo", projectId: "p1", photoId: "sig-of-a-real-rapport", description: "x", date: "2026-09-01" },
      { id: "e2", type: "time", projectId: "p1", qty: "8", date: "2026-09-01", userId: "somebody-else" },
      { id: "e3", type: "material", projectId: "p-unknown", description: "Lattung", date: "bad-date" },
      "not an object",
    ],
    photos: { "sig-of-a-real-rapport": PNG, "html": "data:text/html;base64,PHNjcmlwdD4=", "js": "javascript:alert(1)" },
    siteReports: [{ id: "r1", projectId: "p1", date: "2026-09-01", hours: "8", signatureId: "sig-of-a-real-rapport", signerName: "Kunde", signedAt: 1 }],
    customers: [{ id: "c1", name: "Sutter" }, { id: "c2" }],
  };
  const out = sanitiseBackup(hostile, { makeId, userId: "me" });
  t("a pasted photo id is never adopted", Object.keys(out.photos).includes("sig-of-a-real-rapport"), false);
  t("a photo comes in under a fresh id", Object.keys(out.photos).length, 1);
  const photoEntry = out.entries.find((e) => e.type === "photo");
  t("the entry follows the photo to its new id", photoEntry.photoId, Object.keys(out.photos)[0]);
  t("the signed report follows its signature to the new id", out.siteReports[0].signatureId, Object.keys(out.photos)[0]);
  t("html and javascript 'photos' are dropped", out.dropped.photos, 2);
  t("entries are attributed to the importer, not to whoever the file says", out.entries.every((e) => e.userId === "me"), true);
  t("entries get fresh ids", out.entries.every((e) => e.id.startsWith("new-")), true);
  t("an entry whose project is not in the backup loses the reference", out.entries.find((e) => e.description === "Lattung").projectId, null);
  t("a bad date becomes today", /^\d{4}-\d{2}-\d{2}$/.test(out.entries.find((e) => e.description === "Lattung").date), true);
  t("a non-object entry is dropped", out.entries.length, 3);
  t("unknown project fields do not travel", "evil" in out.projects[0] || "__proto__polluted" in out.projects[0], false);
  t("a customer without a name is dropped", out.customers.length, 1);
  t("project references are remapped everywhere", out.siteReports[0].projectId, out.projects[0].id);
}
t("a jpeg data url is a photo", isPhotoDataUrl("data:image/jpeg;base64,/9j/4AAQ"), true);
t("an html data url is not", isPhotoDataUrl("data:text/html;base64,PHNjcmlwdD4="), false);
t("a plain string is not", isPhotoDataUrl("https://example.com/a.jpg"), false);
{
  let n = 0;
  const code = sanitiseProjectCode({ name: "Dach Muster", client: "Sutter", address: "Lettenring 21", category: "pitched", entries: [{ type: "material", description: "Siga", qty: "8", unit: "m", date: "2026-08-20", photoId: "sneaky" }], other: "x" }, { makeId: () => `id-${++n}`, userId: "me" });
  t("a share code keeps name, client, address and category", [code.name, code.client, code.address, code.category], ["Dach Muster", "Sutter", "Lettenring 21", "pitched"]);
  t("its entries are cleaned and attributed to the importer", [code.entries.length, code.entries[0].userId, "photoId" in code.entries[0]], [1, "me", false]);
  t("a code without a name is refused", sanitiseProjectCode({ entries: [] }, { makeId: () => "x", userId: "me" }), null);
  t("a backup that is not a backup is refused", sanitiseBackup({ hello: 1 }, { makeId: () => "x", userId: "me" }), null);
}
{
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
