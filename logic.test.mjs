// Tests for the app's pure logic — the parts that can be checked without a
// browser or an account. Run with: npm run test:logic
//
// These exist because a verification pass found real bugs in features nobody
// had exercised since they were written.

import { build } from "esbuild";
import {
  parsePriceList,
  parsePrice,
  mergeIntoCatalog,
  supplierMatches,
  articlesFor,
  filterArticles,
  sortArticles,
} from "./price-list.js";
import {
  toCsv,
  workingDays,
  invoiceJournal,
  invoicePositions,
  payrollRows,
  payrollDays,
  contactRows,
  splitAddress,
  previousMonth,
} from "./accounting-export.js";
import { documentTotals as docTotalsPure } from "./documents.js";
import { inviteUrl, joinCodeFromSearch, withoutJoinParam, firstSteps } from "./onboarding.js";
import { parseCustomersCsv, mergeCustomers } from "./customers-import.js";
import { readFileSync } from "node:fs";
import * as fsMod from "node:fs";
import { todayKey, monthKey, dateKeyOffset, uid } from "./ui/format.js";
import {
  code128Values,
  code128Bars,
  patternFor,
  patternCount,
  START_B,
  START_C,
  CODE_B,
  CODE_C,
  STOP,
} from "./barcode.js";
import { createCrashGate, crashPayload, installCrashCapture, uaFamily } from "./errors-client.js";
import { coveredEntryIds, changedFields, reconcileEntries } from "./entries-history.js";
import {
  reportId,
  reportRows,
  reportTotals,
  unsentMonthEntries,
  withSend,
  rapportChanged,
  splitDayHours,
  weekOf,
  weekRows,
  weekCsv,
} from "./reports.js";
import { guessKind, fmtSize, sortFiles, normaliseLink, MAX_FILE_BYTES as MAX_UPLOAD } from "./files.js";
import { BREAKS, breakHours, netHours, breakTaken } from "./breaks.js";
import { sanitiseBackup, sanitiseProjectCode, isPhotoDataUrl } from "./import-guard.js";
import { tileWaste, tilesWaste, summariseInspection, tripHours } from "./roof-tiles.js";
import { routeFor, precacheAllowed } from "./sw-routes.js";
import { ERROR_CODES, classifyError, errorReport } from "./errors.js";
import { unlinkSync } from "node:fs";

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

let pass = 0,
  fail = 0;
function t(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(
    (ok ? "ok   " : "FAIL ") +
      name +
      (ok ? "" : `\n       got  ${JSON.stringify(got)}\n       want ${JSON.stringify(want)}`),
  );
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
t(
  "share code survives email line-wrapping",
  M.decodeProjectCode(code.slice(0, 20) + "\n" + code.slice(20)).name,
  "Dach Muster",
);
t(
  "share code survives surrounding text",
  M.decodeProjectCode("Hier der Code:\n\n" + code + "\n\nGruss").name,
  "Dach Muster",
);
t("garbage is rejected rather than throwing", M.decodeProjectCode("not a code"), null);
t("empty input is rejected", M.decodeProjectCode(""), null);
t(
  "umlauts and accents survive",
  M.decodeProjectCode(
    M.encodeProjectCode({ name: "Gebäude Zürich — Façade", client: "", address: "", category: "facade" }, []),
  ).name,
  "Gebäude Zürich — Façade",
);

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
  [
    { id: "p1", client: "Meier AG" },
    { id: "p2", client: "meier ag" },
    { id: "p3", client: "" },
  ],
  [],
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
  const m = mergeIntoCatalog(
    before,
    [
      { name: "Dachziegel", artNo: "4711", unit: "Stk", price: "2.75", supplier: "" },
      { name: "Lattung", artNo: "12", unit: "m", price: "1.10", supplier: "" },
    ],
    "HGC",
  );
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
t(
  "a second send makes the same id",
  reportId("u1", "daily", "2026-09-02") === reportId("u1", "daily", "2026-09-02"),
  true,
);
t(
  "another person's report is a different one",
  reportId("u2", "daily", "2026-09-02") === reportId("u1", "daily", "2026-09-02"),
  false,
);

{
  const log = [
    { id: "a", type: "time", qty: "7.5", projectId: "p1", description: "7h 30m" },
    { id: "b", type: "material", qty: "8", unit: "m", projectId: "p1", description: "Lattung" },
    { id: "c", type: "tool", qty: "1", projectId: "p2", description: "Bauaufzug" },
  ];
  const report = { entryIds: ["a", "b", "c", "gone"], entryLabels: { gone: "Ziegel · 24 m2" }, excludedIds: ["c"] };
  const rows = reportRows(report, log);
  t("rows come from the live log, not a copy", rows.find((r) => r.id === "b").qty, "8");
  t(
    "an excluded entry is not a row",
    rows.some((r) => r.id === "c"),
    false,
  );
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
  t(
    "monthly leaves out what daily already sent",
    r.entries.map((e) => e.id),
    ["n1"],
  );
  t("and says how many it left out", r.alreadySent, 2);
  t(
    "another person's daily report does not hide my entries",
    unsentMonthEntries(
      month,
      sent.filter((x) => x.userId === "u2"),
      "u1",
      "2026-09",
    ).entries.length,
    3,
  );
  t(
    "a daily report from another month does not count",
    unsentMonthEntries(month, [sent[2]], "u1", "2026-09").entries.length,
    3,
  );
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
  t(
    "an added line after signing is flagged",
    rapportChanged(signed, [...day, { type: "material", description: "Ziegel", qty: "1" }]),
    true,
  );
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
t(
  "sizes read as a phone shows them",
  [fmtSize(900), fmtSize(20480), fmtSize(2.5 * 1024 * 1024), fmtSize(15 * 1024 * 1024)],
  ["900 B", "20 KB", "2.5 MB", "15 MB"],
);
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
t(
  "two breaks a day: nine and noon",
  BREAKS.map((b) => `${b.key}@${b.start}/${b.minutes}`),
  ["znuni@09:00/30", "mittag@12:00/60"],
);
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
t(
  "a break before any clock entry does not read as negative work",
  netHours([{ type: "break", breakKey: "znuni", qty: "0.5" }]),
  0,
);
t(
  "a break of unknown kind falls back to its stored hours",
  breakHours([{ type: "break", breakKey: "kaffee", qty: "0.25" }]),
  0.25,
);

// --- what a pasted code or a backup may bring in ----------------------------
// The importer used to spread whatever JSON it was handed straight into state.
{
  let n = 0;
  const makeId = () => `new-${++n}`;
  const PNG = "data:image/png;base64,iVBORw0KGgo=";
  const hostile = {
    projects: [
      {
        id: "p1",
        name: "Dach",
        client: "Sutter",
        address: "Lettenring 21",
        category: "pitched",
        status: "construction",
        __proto__polluted: true,
        evil: "<script>",
      },
    ],
    entries: [
      {
        id: "e1",
        type: "photo",
        projectId: "p1",
        photoId: "sig-of-a-real-rapport",
        description: "x",
        date: "2026-09-01",
      },
      { id: "e2", type: "time", projectId: "p1", qty: "8", date: "2026-09-01", userId: "somebody-else" },
      { id: "e3", type: "material", projectId: "p-unknown", description: "Lattung", date: "bad-date" },
      "not an object",
    ],
    photos: { "sig-of-a-real-rapport": PNG, html: "data:text/html;base64,PHNjcmlwdD4=", js: "javascript:alert(1)" },
    siteReports: [
      {
        id: "r1",
        projectId: "p1",
        date: "2026-09-01",
        hours: "8",
        signatureId: "sig-of-a-real-rapport",
        signerName: "Kunde",
        signedAt: 1,
      },
    ],
    customers: [{ id: "c1", name: "Sutter" }, { id: "c2" }],
  };
  const out = sanitiseBackup(hostile, { makeId, userId: "me" });
  t("a pasted photo id is never adopted", Object.keys(out.photos).includes("sig-of-a-real-rapport"), false);
  t("a photo comes in under a fresh id", Object.keys(out.photos).length, 1);
  const photoEntry = out.entries.find((e) => e.type === "photo");
  t("the entry follows the photo to its new id", photoEntry.photoId, Object.keys(out.photos)[0]);
  t(
    "the signed report follows its signature to the new id",
    out.siteReports[0].signatureId,
    Object.keys(out.photos)[0],
  );
  t("html and javascript 'photos' are dropped", out.dropped.photos, 2);
  t(
    "entries are attributed to the importer, not to whoever the file says",
    out.entries.every((e) => e.userId === "me"),
    true,
  );
  t(
    "entries get fresh ids",
    out.entries.every((e) => e.id.startsWith("new-")),
    true,
  );
  t(
    "an entry whose project is not in the backup loses the reference",
    out.entries.find((e) => e.description === "Lattung").projectId,
    null,
  );
  t(
    "a bad date becomes today",
    /^\d{4}-\d{2}-\d{2}$/.test(out.entries.find((e) => e.description === "Lattung").date),
    true,
  );
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
  const code = sanitiseProjectCode(
    {
      name: "Dach Muster",
      client: "Sutter",
      address: "Lettenring 21",
      category: "pitched",
      entries: [{ type: "material", description: "Siga", qty: "8", unit: "m", date: "2026-08-20", photoId: "sneaky" }],
      other: "x",
    },
    { makeId: () => `id-${++n}`, userId: "me" },
  );
  t(
    "a share code keeps name, client, address and category",
    [code.name, code.client, code.address, code.category],
    ["Dach Muster", "Sutter", "Lettenring 21", "pitched"],
  );
  t(
    "its entries are cleaned and attributed to the importer",
    [code.entries.length, code.entries[0].userId, "photoId" in code.entries[0]],
    [1, "me", false],
  );
  t(
    "a code without a name is refused",
    sanitiseProjectCode({ entries: [] }, { makeId: () => "x", userId: "me" }),
    null,
  );
  t(
    "a backup that is not a backup is refused",
    sanitiseBackup({ hello: 1 }, { makeId: () => "x", userId: "me" }),
    null,
  );
}
{
  // Replaced tiles become a waste weight the skip is ordered by. An unknown
  // model gives no number rather than a wrong one.
  t("180 Biber weigh 360 kg and cover 5 m²", tileWaste("biber", 180), { wasteKg: 360, areaM2: 5 });
  t("a count of zero weighs nothing", tileWaste("jura", 0), { wasteKg: 0, areaM2: 0 });
  t("an unknown model is null, not a guess", tileWaste("wunderziegel", 50), { wasteKg: null, areaM2: null });
  t("ridge tiles have a weight but no area", tileWaste("first", 10), { wasteKg: 38, areaM2: 0 });
  t(
    "rows add up and unknown rows are counted",
    tilesWaste([
      { model: "biber", count: "100" },
      { model: "Sonderziegel", count: "20" },
      { model: "jura", count: "10" },
    ]),
    { wasteKg: 229, areaM2: 3.5, unknown: 1 },
  );
  t(
    "the summary names the defects, the tiles and the note",
    summariseInspection({
      checklist: { first: "mangel", kehle: "ok", rinne: "ok" },
      tiles: [{ model: "biber", count: "100" }],
      note: "Moos",
      labels: { first: "First", __mangel: "Mangel", __ok: "OK", __replaced: "ersetzt" },
    }),
    "Mangel: First · 2 OK · ersetzt: 100 Biberschwanz (~200 kg) · Moos",
  );
  t("an empty inspection has no summary", summariseInspection({}), "");
  // Trips: hours from two times, forward over midnight, nothing from garbage.
  t("07:00 to 08:30 is 1.5 h", tripHours("07:00", "08:30"), 1.5);
  t("a trip over midnight counts forward", tripHours("23:30", "00:15"), 0.75);
  t("a missing arrival is 0 h", tripHours("07:00", ""), 0);
  t(
    "transport hours are told apart from work",
    reportTotals([
      { type: "time", qty: "8" },
      { type: "transport", hours: 1.5, qty: "1.5" },
      { type: "break", qty: "0.5" },
    ]),
    { hours: 7.5, breaks: 0.5, transportHours: 1.5, materialsCount: 0, toolsCount: 0, projIds: [] },
  );
}

{
  // Every language carries every key, and the languages that were once a
  // thin layer over English are translated -- a key that falls back to
  // English is not a translation, it is a gap that only shows on a phone.
  const { readFileSync, readdirSync } = await import("node:fs");
  const en = JSON.parse(readFileSync("i18n/en.json", "utf8"));
  const files = readdirSync("i18n").filter((f) => f.endsWith(".json") && f !== "en.json");
  const missing = {};
  const englishLeft = {};
  const SAME_OK = new Set([
    "OK",
    "km",
    "SUVA",
    "PDF",
    "QR",
    "SOS",
    "Pipeline",
    "Board",
    "Text…",
    "Text",
    "Link",
    "Plan",
    "Status",
    "Name",
    "Art.",
    "Transport",
    "Material",
    "Steildach",
    "Flachdach",
    "Spengler",
    "Holzbau",
    "Gerüst",
    "Unterhalt",
    "Shop",
    "Wind",
    "Route",
    "E-Mail",
    "Email",
    "Total",
    "Team",
    "Standard",
    "IBAN",
    "Mulde",
    "Subtotal",
    "Manual",
    "Calendar",
    "Catalog",
    "Contract",
    "Defect",
    "https://hooks.zapier.com/...",
    "https://… (Dropbox, SharePoint, Drive)",
  ]);
  for (const f of files) {
    const d = JSON.parse(readFileSync(`i18n/${f}`, "utf8"));
    const miss = Object.keys(en).filter((k) => !(k in d));
    if (miss.length) missing[f] = miss.length;
    const same = Object.keys(en).filter(
      (k) => k in d && d[k] === en[k] && String(en[k]).length > 3 && !SAME_OK.has(en[k]),
    );
    englishLeft[f] = same.length;
  }
  t("every language file has every key", missing, {});
  for (const code of ["ro", "bg", "hu", "pl", "pt", "fr", "it", "es", "sk", "cs", "gsw"]) {
    t(
      `${code} is translated, not English with a flag (${englishLeft[code + ".json"]} left)`,
      englishLeft[code + ".json"] < 40,
      true,
    );
  }
}

{
  // The first paint must stay under budget: the entry plus every chunk it
  // imports statically. Languages, the job view, the catalogues and the
  // manager tabs are loaded on demand and do not count. Runs only when a
  // build exists, so the pure suite still runs on a fresh checkout.
  const { existsSync, readFileSync, statSync } = await import("node:fs");
  if (existsSync("build/bundle.js")) {
    const entry = readFileSync("build/bundle.js", "utf8");
    const chunks = [
      ...new Set([...entry.matchAll(/(?:from|import)\s*["']\.\/(chunk-[A-Z0-9]+\.js)["']/g)].map((m) => m[1])),
    ];
    const bytes = statSync("build/bundle.js").size + chunks.reduce((sum, c) => sum + statSync(`build/${c}`).size, 0);
    t(
      `first-paint JS stays under 350 KB (${Math.round(bytes / 1024)} KB: bundle.js + ${chunks.length} static chunk${chunks.length === 1 ? "" : "s"})`,
      bytes < 350 * 1024,
      true,
    );
    // The Firebase SDK is a lazy chunk loaded at boot: not in the first paint,
    // but the largest download of a cold start, so it has a budget of its own.
    const { readdirSync } = fsMod;
    const sdk = readdirSync("build")
      .filter((f) => f.startsWith("chunk-"))
      .map((f) => ({
        f,
        size: statSync(`build/${f}`).size,
        firestore: /firestore/i.test(readFileSync(`build/${f}`, "utf8").slice(0, 200000)),
      }))
      .filter((c) => c.firestore)
      .sort((a, b) => b.size - a.size)[0];
    t(
      `the bundled Firebase SDK chunk stays under 600 KB (${sdk ? Math.round(sdk.size / 1024) : "?"} KB)`,
      !!sdk && sdk.size < 600 * 1024,
      true,
    );
    t("tailwind.css is built and small", existsSync("tailwind.css") && statSync("tailwind.css").size < 60 * 1024, true);
    t(
      "index.html no longer loads Tailwind from a CDN",
      !readFileSync("index.html", "utf8").includes("cdn.tailwindcss.com"),
      true,
    );
    // The privacy notice on the site says who is responsible and matches the source document's date.
    const notice = readFileSync("datenschutz.html", "utf8");
    const md = readFileSync("docs/legal/datenschutzerklaerung.md", "utf8");
    t(
      "datenschutz.html names the operator",
      notice.includes("Andrzej Bizior, Si‑Ma") && notice.includes("a.bizior@pm.me"),
      true,
    );
    t(
      "datenschutz.html and the markdown carry the same date",
      (notice.match(/Stand: ([^<]+)</) || [])[1],
      (md.match(/^Stand: (.+)$/m) || [])[1],
    );
    // The service worker precaches exactly the first paint: the shell, the
    // stylesheet, the entry with its static chunks, English and German.
    const sw = readFileSync("sw.js", "utf8");
    const pre = JSON.parse(sw.match(/const PRECACHE = (\[[\s\S]*?\]);/)[1]);
    t(
      "sw.js precaches the entry and every static chunk",
      ["index.html", ...chunks.map((c) => `build/${c}`)].every((f) =>
        pre.some((p) => p === f || p.startsWith(f + "?")),
      ),
      true,
    );
    t(
      "sw.js precaches the stylesheet and the two first-paint languages",
      pre.some((p) => p.startsWith("tailwind.css?v=")) &&
        pre.filter((p) => /build\/chunk-/.test(p)).length >= chunks.length + 2,
      true,
    );
    t("sw.js precaches nothing that talks to a server", pre.every(precacheAllowed), true);
    t("sw.js carries a version that changes with the build", /const VERSION = "[a-f0-9]{10}"/.test(sw), true);
    const swVersion = sw.match(/const VERSION = "([a-f0-9]{10})"/)[1];
    t(
      "index.html names the same build as sw.js",
      (readFileSync("index.html", "utf8").match(/<meta name="site-log-build" content="([a-f0-9]+)"/) || [])[1],
      swVersion,
    );
    t("sw.js answers the page's version question", sw.includes('event.data.type === "version"'), true);
  }
}

{
  // Every failure gets a code from its shape, and every code is documented.
  const c = (e, ctx) => classifyError(e, ctx).code;
  t(
    "a refused write is E10",
    c({ code: "permission-denied", message: "Missing or insufficient permissions." }, "save"),
    "E10",
  );
  t(
    "no network is E11",
    c({ code: "unavailable", message: "Failed to get document because the client is offline." }, "save"),
    "E11",
  );
  t(
    "an oversized document is E12",
    c({ code: "invalid-argument", message: "Document exceeds maximum size" }, "save"),
    "E12",
  );
  t("an undecodable photo is E20", c(new Error("decode"), "photo"), "E20");
  t(
    "an invalid AI key is E30",
    c(
      new Error(
        'Anthropic API error 401: {"type":"error","error":{"type":"authentication_error","message":"API key is invalid."}}',
      ),
      "ai",
    ),
    "E30",
  );
  t("the daily AI limit is E31", c(new Error("daily scan limit reached — try again tomorrow"), "ai"), "E31");
  t("a non-member is E32", c(new Error("not a member of this company"), "ai"), "E32");
  t("an unparseable answer is E34", c(new Error("empty"), "ai"), "E34");
  t("a dead proxy is E35", c(new Error("Failed to fetch"), "ai"), "E35");
  t("a refused file type is E50", c({ status: 415, message: "upload 415" }, "file"), "E50");
  t("a language that cannot load is E40", c(new Error("Failed to fetch dynamically imported module"), "lang"), "E40");
  t(
    "the report line reads out",
    errorReport(classifyError({ code: "permission-denied", message: "Missing" }, "save"), "abc"),
    "E10 SAVE-DENIED · permission-denied: Missing · build abc",
  );
  const { readFileSync: rf } = await import("node:fs");
  const doc = rf("docs/ERROR_CODES.md", "utf8");
  const undocumented = Object.keys(ERROR_CODES).filter((k) => !new RegExp(`\\| ${k} \\|`).test(doc));
  t("every error code is in docs/ERROR_CODES.md", undocumented, []);
}

{
  // The day as the GAV reads it, and the week as a table.
  const day = [
    { type: "time", qty: "9.7", userId: "u1", date: "2026-09-02" },
    { type: "break", qty: "0.5", userId: "u1", date: "2026-09-02" },
    { type: "transport", hours: 1.5, userId: "u1", date: "2026-09-02" },
  ];
  t("9.2 h net against an 8.5 h day is 8.5 normal and 0.7 over, travel apart", splitDayHours(day, 42.5 / 5), {
    normal: 8.5,
    overtime: 0.7,
    travel: 1.5,
    breaks: 0.5,
    net: 9.2,
    target: 8.5,
  });
  t("without a contract day everything is normal and the target is null", splitDayHours(day, 0), {
    normal: 9.2,
    overtime: 0,
    travel: 1.5,
    breaks: 0.5,
    net: 9.2,
    target: null,
  });
  t("a week runs Monday to Sunday", weekOf("2026-09-02"), [
    "2026-08-31",
    "2026-09-01",
    "2026-09-02",
    "2026-09-03",
    "2026-09-04",
    "2026-09-05",
    "2026-09-06",
  ]);
  t("a Sunday belongs to the week before it", weekOf("2026-09-06")[0], "2026-08-31");
  const week = weekRows(day, "u1", weekOf("2026-09-02"), 42.5);
  t(
    "the week has seven rows and sums the one worked day",
    [week.rows.length, week.total.net, week.total.overtime, week.target, week.diff],
    [7, 9.2, 0.7, 42.5, -33.3],
  );
  const csv = weekCsv(week, "Polier Meier");
  t(
    "the CSV is Excel-friendly: semicolons, decimal commas, a totals line",
    [
      csv.split("\r\n").length - 1,
      csv.includes("2026-09-02;8,5;0,7;1,5;0,5;9,2"),
      csv.includes("Summe;8,5;0,7;1,5;0,5;9,2"),
      csv.includes("Soll;;;;;42,5"),
    ],
    [12, true, true, true],
  );
}

{
  // Entries keep their history: stamps, change records on covered entries,
  // soft delete, restore, purge.
  const covered = coveredEntryIds([{ entryIds: ["a", "b"] }, { entries: [{ id: "c" }] }]);
  t("covered ids come from entryIds and from old copies", [...covered].sort(), ["a", "b", "c"]);
  t(
    "changed fields list content, not bookkeeping",
    changedFields({ qty: 1, note: "x", updatedAt: 1 }, { qty: 2, note: "x", updatedAt: 2, extra: "y" }),
    { qty: 1, extra: null },
  );
  const prev = [
    { id: "a", type: "material", qty: 1, description: "Latte" },
    { id: "b", type: "time", qty: 8 },
    { id: "c", type: "note", description: "alt" },
    { id: "d", type: "material", qty: 3, deleted: true, deletedAt: 5 },
  ];
  const next = [
    { id: "a", type: "material", qty: 2, description: "Latte" },
    { id: "b", type: "time", qty: 8 },
    { id: "n", type: "material", qty: 1 },
  ];
  const out = reconcileEntries(prev, next, { by: "u1", now: 1000, covered, reason: "Zähler abgelesen" });
  const byId = Object.fromEntries(out.map((e) => [e.id, e]));
  t(
    "a covered change is stamped and recorded with what it was",
    [byId.a.qty, byId.a.updatedAt, byId.a.updatedBy, byId.a.history],
    [2, 1000, "u1", [{ at: 1000, by: "u1", reason: "Zähler abgelesen", before: { qty: 1 } }]],
  );
  t("an unchanged entry is the same object, untouched", byId.b === prev[1] && !byId.b.updatedAt, true);
  t(
    "an entry that left the visible list is soft-deleted, with a record when covered",
    [byId.c.deleted, byId.c.deletedAt, byId.c.deletedBy, byId.c.deleteReason, byId.c.history.length],
    [true, 1000, "u1", "Zähler abgelesen", 1],
  );
  t("an already deleted entry stays, hidden", byId.d === prev[3], true);
  t("a new entry is added as is", byId.n, { id: "n", type: "material", qty: 1 });
  const restored = reconcileEntries(out, [...next, { ...byId.d, deleted: false }], { by: "u2", now: 2000, covered });
  t(
    "restoring marks the return and keeps the entry",
    [restored.find((e) => e.id === "d").deleted, restored.find((e) => e.id === "d").restoredBy],
    [false, "u2"],
  );
  const purged = reconcileEntries(out, next, { by: "u1", now: 3000, covered, purge: ["c"] });
  t("purge is the only way a record leaves", purged.map((e) => e.id).sort(), ["a", "b", "d", "n"]);
  const uncoveredEdit = reconcileEntries([{ id: "x", qty: 1 }], [{ id: "x", qty: 2 }], {
    by: "u1",
    now: 10,
    covered: new Set(),
  });
  t(
    "an uncovered change is stamped but not recorded",
    [uncoveredEdit[0].updatedAt, uncoveredEdit[0].history],
    [10, undefined],
  );
}

{
  // Local calendar dates: 00:30 on the 5th is the 5th, whatever UTC says.
  t("todayKey is the local day", todayKey(new Date(2026, 8, 5, 0, 30)), "2026-09-05");
  t("monthKey is the local month at the month turn", monthKey(new Date(2026, 9, 1, 0, 10)), "2026-10");
  t("a due date counts local days and crosses months", dateKeyOffset(30, new Date(2026, 0, 31, 23, 0)), "2026-03-02");
  t(
    "ids are UUIDs, unique",
    (() => {
      const a = uid(),
        b = uid();
      return [a.length, a !== b, /^[0-9a-f-]{36}$/.test(a)];
    })(),
    [36, true, true],
  );
}

{
  // Code 128: the standard table, subset B for text, C for digit runs, the checksum.
  t(
    "the symbol table is complete and every pattern is eleven modules (stop thirteen)",
    (() => {
      let ok = patternCount() === 107;
      for (let v = 0; v < 107; v++) {
        const p = patternFor(v);
        const sum = [...p].reduce((s, c) => s + Number(c), 0);
        ok = ok && (v === 106 ? sum === 13 && p.length === 7 : sum === 11 && p.length === 6);
      }
      return ok;
    })(),
    true,
  );
  t("ABC in subset B with the modulo-103 checksum", code128Values("ABC"), [START_B, 33, 34, 35, 1, STOP]);
  t("digit runs switch to subset C and back", code128Values("HGC-2026-001234").slice(0, -2), [
    START_B,
    40,
    39,
    35,
    13,
    CODE_C,
    20,
    26,
    CODE_B,
    13,
    CODE_C,
    0,
    12,
    34,
  ]);
  t("an odd run keeps one digit in B before switching", code128Values("A12345").slice(0, -2), [
    START_B,
    33,
    17,
    CODE_C,
    23,
    45,
  ]);
  t("an all-digit even reference starts in C", code128Values("20260912").slice(0, -2), [START_C, 20, 26, 9, 12]);
  t(
    "the checksum is the weighted sum modulo 103",
    (() => {
      const v = code128Values("HGC-2026-001234");
      const data = v.slice(0, -2);
      let s = data[0];
      for (let k = 1; k < data.length; k++) s += data[k] * k;
      return v[v.length - 2] === s % 103 && v[v.length - 1] === STOP;
    })(),
    true,
  );
  t(
    "bars start after the quiet zone and the first bar is two modules wide",
    (() => {
      const b = code128Bars("ABC");
      return [b.bars[0].x, b.bars[0].w, b.width > 60];
    })(),
    [10, 2, true],
  );
  t(
    "non-printable text is refused",
    (() => {
      try {
        code128Values("é");
        return "no";
      } catch (e) {
        return "refused";
      }
    })(),
    "refused",
  );
  t(
    "the Cockpit chunk talks to the same Worker as the app",
    (() => {
      const w = (f) =>
        (readFileSync(new URL(f, import.meta.url), "utf8").match(/https:\/\/site-log-claude-proxy[^"]*/) || [])[0];
      return w("./tabs/CockpitTab.jsx") === w("./roofing-site-manager.jsx");
    })(),
    true,
  );
  t(
    "no type under 12 px in the source",
    [
      "./roofing-site-manager.jsx",
      "./tabs/ProjectDetail.jsx",
      "./tabs/MaterialsTab.jsx",
      "./tabs/TodayTab.jsx",
      "./tabs/BoardTab.jsx",
      "./tabs/CockpitTab.jsx",
      "./ui/entries.jsx",
      "./ui/break-chips.jsx",
    ].filter((f) => /text-\[(9|10|11)px\]/.test(readFileSync(new URL(f, import.meta.url), "utf8"))),
    [],
  );
  t(
    "every icon the manifest names is a file",
    (() => {
      const m = JSON.parse(readFileSync(new URL("./manifest.webmanifest", import.meta.url), "utf8"));
      const { existsSync } = fsMod;
      return m.icons.filter((i) => !existsSync(new URL("./" + i.src, import.meta.url))).map((i) => i.src);
    })(),
    [],
  );
  t(
    "no order reference goes to a third-party image service",
    /qrserver|bwipjs/.test(readFileSync(new URL("./roofing-site-manager.jsx", import.meta.url), "utf8")),
    false,
  );
}

{
  // Crash capture: one panel per message per minute, a nameless payload, a report.
  let clock = 1000;
  const gate = createCrashGate({ now: () => clock, windowMs: 60000 });
  t(
    "the gate lets a message through once a minute",
    [gate("x"), gate("x"), ((clock += 61000), gate("x")), gate("y")],
    [true, false, true, true],
  );
  const p = crashPayload(new TypeError("Cannot read properties of undefined (reading 'id')"), {
    build: "8f1ef53cc8",
    path: "/index.html",
    lang: "de",
    ua: "Mozilla/5.0 (Linux; Android 14) Chrome",
  });
  t(
    "the payload is coded E91, cut to size, device family only",
    [p.code, p.tag, p.build, p.ua, p.lang, p.message.length <= 200, p.stack.length <= 400],
    ["E91", "CRASH", "8f1ef53cc8", "android", "de", true, true],
  );
  t("E91 in the client matches the code table", [ERROR_CODES.E91.tag, ERROR_CODES.E91.group], ["CRASH", "other"]);
  t("device families", ["iPhone OS", "Windows NT", "Macintosh", "X11; Linux", "curl"].map(uaFamily), [
    "ios",
    "windows",
    "mac",
    "linux",
    "other",
  ]);
  const shown = [],
    reported = [];
  const listeners = {};
  const target = {
    addEventListener: (k, fn) => {
      listeners[k] = fn;
    },
  };
  installCrashCapture({
    target,
    build: "b1",
    show: (x) => shown.push(x.code),
    report: async (x) => {
      reported.push(x.message);
      return true;
    },
    gate: createCrashGate({ now: () => 5 }),
  });
  listeners.error({ error: new Error("boom") });
  listeners.error({ error: new Error("boom") });
  listeners.unhandledrejection({ reason: new Error("later") });
  listeners.error({ message: "ResizeObserver loop limit exceeded" });
  await new Promise((r) => setTimeout(r, 10));
  t(
    "errors and rejections are shown once and reported; browser noise is dropped",
    [shown, reported],
    [
      ["E91", "E91"],
      ["boom", "later"],
    ],
  );
}

{
  // Self-service onboarding: invite links, first steps, customers from a file.
  t(
    "an invite becomes a link on the app's own address",
    inviteUrl("abcd2345", "https://abizior-coder.github.io/Site-manager/index.html?emulator=1#x"),
    "https://abizior-coder.github.io/Site-manager/index.html?join=ABCD2345",
  );
  t(
    "a bare folder address still gets index.html",
    inviteUrl("ABCD2345", "https://abizior-coder.github.io/Site-manager/"),
    "https://abizior-coder.github.io/Site-manager/index.html?join=ABCD2345",
  );
  t(
    "the code comes back out of the address, cleaned",
    [joinCodeFromSearch("?join=abcd-2345&emulator=1"), joinCodeFromSearch("?join=xy"), joinCodeFromSearch("")],
    ["ABCD2345", "", ""],
  );
  t(
    "the parameter leaves the address bar, the rest stays",
    withoutJoinParam("http://localhost:5566/index.html?emulator=1&join=ABCD2345"),
    "http://localhost:5566/index.html?emulator=1",
  );
  const steps = firstSteps({
    projects: [{}],
    customers: [],
    members: [{ uid: "o" }],
    invites: [],
    billing: { weeklyHours: "42", labourRate: "" },
  });
  t(
    "first steps: hours need both numbers, a site is done, crew needs a second member or an invite, customers open",
    steps.map((s) => `${s.key}:${s.done ? 1 : 0}`),
    ["hours:0", "site:1", "crew:0", "customers:0"],
  );
  t(
    "an open invite counts as the crew step done",
    firstSteps({ projects: [], customers: [], members: [{}], invites: [{ code: "X" }], billing: {} })[2].done,
    true,
  );
  const bexio =
    "Kontaktart;Name;Vorname;Adresse;PLZ;Ort;Land;Telefon;E-Mail;Kontaktperson 1 Nachname;Kontaktperson 1 Vorname\r\nFirma;Muster AG;;Dorfstrasse 5;8903;Birmensdorf;CH;044 000 00 00;info@muster.ch;Muster;Hans\r\nPrivat;Meier;Anna;Seeweg 3;8001;Zürich;CH;;anna@meier.ch;;\r\nFirma;Leer GmbH;;;;;CH;;;;\r\n";
  const parsed = parseCustomersCsv("\ufeff" + bexio);
  t(
    "bexio's contact export: Firma with contact person, Privat with first and last name, Firma without a person",
    parsed.rows.map((r) => [r.name, r.company, r.address, r.email]),
    [
      ["Hans Muster", "Muster AG", "Dorfstrasse 5\n8903 Birmensdorf", "info@muster.ch"],
      ["Anna Meier", "", "Seeweg 3\n8001 Zürich", "anna@meier.ch"],
      ["Leer GmbH", "Leer GmbH", "", ""],
    ],
  );
  const plain = parseCustomersCsv(
    "Name,Telefon,Email,Bemerkung\nRuedi Keller,079 1,ruedi@k.ch,Dach 2019\n,,,\nSabine Ott,,,",
  );
  t(
    "a plain list with commas: name, phone, e-mail, notes; an empty line is dropped and counted",
    [plain.rows.map((r) => r.name), plain.rows[0].notes, plain.warnings],
    [["Ruedi Keller", "Sabine Ott"], "Dach 2019", ["1 ohne Name"]],
  );
  t("a file without a name column is refused", parseCustomersCsv("Datum;Betrag\n1;2").warnings, ["no-name-column"]);
  const merged = mergeCustomers([{ id: "c1", name: "Anna Meier", company: "", email: "ANNA@meier.ch" }], parsed.rows);
  t(
    "known e-mail or known name+company is skipped, the rest appended with ids",
    [merged.added.map((r) => r.name), merged.skipped.map((r) => r.name), merged.customers.length, !!merged.added[0].id],
    [["Hans Muster", "Leer GmbH"], ["Anna Meier"], 3, true],
  );
}

{
  // Accounting export: what the Treuhänder and bexio get for a month.
  t(
    "csv quotes only what needs it",
    toCsv(
      ["A", "B"],
      [
        ["x;y", 'say "hi"'],
        ["plain", ""],
      ],
    ),
    'A;B\r\n"x;y";"say ""hi"""\r\nplain;\r\n',
  );
  t("working days of September 2026", workingDays("2026-09"), 22);
  t("the previous month rolls over the year", previousMonth(new Date(2026, 0, 15)), "2025-12");
  const docs = [
    {
      id: "i1",
      type: "invoice",
      number: "R-2026-002",
      date: "2026-08-20",
      dueDate: "2026-09-19",
      status: "open",
      customerId: "c1",
      projectId: "p1",
      vatRate: 8.1,
      lineItems: [{ description: "Arbeit", qty: "10", unit: "h", unitPrice: "10" }],
      paidAmount: "50",
    },
    {
      id: "i2",
      type: "invoice",
      number: "R-2026-001",
      date: "2026-08-02",
      status: "draft",
      customerId: "c1",
      vatRate: 8.1,
      lineItems: [{ description: "x", qty: "1", unitPrice: "100" }],
    },
    {
      id: "i3",
      type: "invoice",
      number: "R-2026-003",
      date: "2026-09-01",
      status: "open",
      customerId: "c1",
      vatRate: 8.1,
      lineItems: [{ description: "x", qty: "1", unitPrice: "100" }],
    },
    {
      id: "q1",
      type: "quote",
      number: "O-2026-001",
      date: "2026-08-05",
      status: "sent",
      customerId: "c1",
      vatRate: 8.1,
      lineItems: [{ description: "x", qty: "1", unitPrice: "100" }],
    },
  ];
  const custs = [
    {
      id: "c1",
      name: "Hans Muster",
      company: "Muster AG",
      address: "Dorfstrasse 5\n8903 Birmensdorf",
      phone: "044 000 00 00",
      email: "hans@muster.ch",
    },
    { id: "c2", name: "Anna Meier", address: "Seeweg 3, 8001 Zürich" },
  ];
  const journal = invoiceJournal(docs, custs, [{ id: "p1", name: "Steildach Lettenring" }], "2026-08");
  t(
    "the journal holds the month's sent invoices only",
    journal.map((r) => r[0]),
    ["R-2026-002"],
  );
  t("journal money equals the printed invoice: net, VAT, gross to 0.05, paid, open", journal[0].slice(5, 12), [
    "100.00",
    "8.10",
    "8.10",
    "108.10",
    "50.00",
    "58.10",
    "teilbezahlt",
  ]);
  t("the journal names customer and site", [journal[0][3], journal[0][4]], ["Muster AG", "Steildach Lettenring"]);
  t("gross in the journal is the same function the invoice prints", docTotalsPure(docs[0]).gross, 108.1);
  t(
    "positions carry the invoice number on every row",
    invoicePositions(docs, custs, "2026-08").map((r) => [r[0], r[3], r[8]]),
    [["R-2026-002", 1, "100.00"]],
  );
  const entries = [
    { userId: "u1", date: "2026-09-01", type: "time", qty: 10 },
    { userId: "u1", date: "2026-09-01", type: "break", qty: 0.5 },
    { userId: "u1", date: "2026-09-02", type: "time", qty: 8, projectId: "p1" },
    { userId: "u1", date: "2026-09-02", type: "transport", hours: 1 },
    { userId: "u2", date: "2026-09-01", type: "time", qty: 4 },
  ];
  const members = [
    { uid: "u1", name: "Ali", email: "ali@firma.ch" },
    { uid: "u2", name: "Bo", email: "bo@firma.ch" },
    { uid: "u3", name: "Cy", email: "" },
  ];
  const leave = [
    { userId: "u1", date: "2026-09-03", type: "vacation", status: "approved" },
    { userId: "u1", date: "2026-09-04", type: "vacation", status: "pending" },
    { userId: "u1", date: "2026-09-05", type: "sick", status: "approved" },
  ];
  const pay = payrollRows(entries, members, "2026-09", 42, leave);
  t(
    "payroll splits the month the GAV way (42 h → 8.4 h/day)",
    [pay[0].normal, pay[0].overtime, pay[0].travel, pay[0].breaks, pay[0].net, pay[0].worked],
    [16.4, 1.1, 1, 0.5, 17.5, 2],
  );
  t(
    "the target counts Mon–Fri minus approved weekday absences",
    [pay[0].target, pay[0].vacation, pay[0].sick, pay[0].other],
    [8.4 * 21, 1, 1, 0],
  );
  t(
    "payroll rows carry the login e-mail bexio matches on",
    pay.map((r) => r.email),
    ["ali@firma.ch", "bo@firma.ch", ""],
  );
  t(
    "everyone is on the sheet, also with zero hours",
    pay.map((r) => r.worked),
    [2, 1, 0],
  );
  const days = payrollDays(entries, members, [{ id: "p1", name: "Lettenring" }], "2026-09", 42);
  t(
    "the day sheet names the sites of that day",
    days.map((r) => [r[0], r[2], r[7], r[8]]),
    [
      ["Ali", "2026-09-01", "9.50", ""],
      ["Ali", "2026-09-02", "8.00", "Lettenring"],
      ["Bo", "2026-09-01", "4.00", ""],
    ],
  );
  t(
    "a Swiss address splits into street, PLZ and Ort",
    [splitAddress("Dorfstrasse 5\n8903 Birmensdorf"), splitAddress("Seeweg 3, CH-8001 Zürich")],
    [
      { street: "Dorfstrasse 5", postalCode: "8903", town: "Birmensdorf" },
      { street: "Seeweg 3", postalCode: "8001", town: "Zürich" },
    ],
  );
  const contacts = contactRows(custs);
  t("a company is a Firma with the person as Kontaktperson 1", contacts[0], [
    "Firma",
    "Muster AG",
    "",
    "Dorfstrasse 5",
    "8903",
    "Birmensdorf",
    "CH",
    "044 000 00 00",
    "hans@muster.ch",
    "Hans Muster",
    "",
  ]);
  t("a person is Privat with the whole name in Name (both Swiss orders exist)", contacts[1].slice(0, 6), [
    "Privat",
    "Anna Meier",
    "",
    "Seeweg 3",
    "8001",
    "Zürich",
  ]);
}

{
  // The supplier sheet: the imported list when there is one, the demo groups
  // when there is none; search by words; sort by column.
  const master = {
    "siga majvest": { name: "Siga Majvest", unit: "Rolle", price: "189.50", artNo: "SG-1001", supplier: "HGC" },
    "konterlatte 30/50": {
      name: "Konterlatte 30/50",
      unit: "m",
      price: "2.10",
      artNo: "HL-30",
      supplier: "HG Commerciale AG",
    },
    "velux ggl mk06": { name: "Velux GGL MK06", unit: "Stk", price: "890", artNo: "V-MK06", supplier: "Velux" },
    "dachrinne halbrund": { name: "Dachrinne halbrund", unit: "m", price: "", artNo: "", supplier: "gabs" },
  };
  t(
    "a supplier key matches the free text an import wrote",
    [supplierMatches("HG Commerciale AG", "hgc"), supplierMatches("HGC", "hgc"), supplierMatches("Velux", "hgc")],
    [true, true, false],
  );
  const hgc = articlesFor(master, { items: { hgc: [{ group: "Demo", items: ["A", "B"] }] } }, "hgc");
  t(
    "with an imported list the sheet holds the supplier's own articles",
    hgc.map((a) => a.name),
    ["Siga Majvest", "Konterlatte 30/50"],
  );
  const demo = articlesFor({}, { items: { hgc: [{ group: "Holz", items: ["Konterlatte", "Dachlatte"] }] } }, "hgc");
  t(
    "without a list the demo groups fill it, marked as such",
    [demo.length, demo[0].demo, demo[0].group],
    [2, true, "Holz"],
  );
  const rows = Object.values(master);
  t(
    "search matches every word in name or number",
    filterArticles(rows, "velux mk06").map((a) => a.name),
    ["Velux GGL MK06"],
  );
  t(
    "search by article number",
    filterArticles(rows, "hl-30").map((a) => a.artNo),
    ["HL-30"],
  );
  t(
    "sort by price puts blanks last",
    sortArticles(rows, "price", "asc").map((a) => a.price),
    ["2.10", "189.50", "890", ""],
  );
  t("sort by name descending", sortArticles(rows, "name", "desc").map((a) => a.name)[0], "Velux GGL MK06");
}

{
  // Routing decisions the worker makes, from the URL alone.
  const scope = "https://abizior-coder.github.io/Site-manager/";
  const r = (url, mode = "no-cors", method = "GET") => routeFor({ url, mode, method }, scope);
  t("a navigation is the shell", r(scope + "index.html", "navigate"), "shell");
  t("the scope root is the shell", r(scope), "shell");
  t("a deep link within the scope is the shell", r(scope + "?emulator=1", "navigate"), "shell");
  t("another page under the scope is not the shell", r(scope + "datenschutz.html", "navigate"), "network");
  t("a hashed chunk is immutable", r(scope + "build/chunk-ABC123.js"), "immutable");
  t(
    "the stamped entry and stylesheet are immutable",
    [r(scope + "build/bundle.js?v=abc"), r(scope + "tailwind.css?v=abc")],
    ["immutable", "immutable"],
  );
  t(
    "the Firebase SDK, bundled under build/, is immutable like every chunk",
    r("https://abizior-coder.github.io/Site-manager/build/chunk-ASVWXV3D.js"),
    "immutable",
  );
  t(
    "nothing from Google's CDN is special-cased any more",
    r("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"),
    "network",
  );
  t(
    "Firestore itself is never cached",
    r("https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel"),
    "network",
  );
  t("the Worker is never cached", r("https://site-log-claude-proxy.abizior.workers.dev/metrics/c1"), "network");
  t("the weather is never cached", r("https://api.open-meteo.com/v1/forecast?latitude=1"), "network");
  t("a POST is never cached", r(scope + "build/chunk-ABC123.js", "cors", "POST"), "network");
  // The photo encoder's budget sits under the rules' kv cap with room for the document's other fields.
  {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("roofing-site-manager.jsx", "utf8");
    const budget = parseInt((src.match(/const MAX_PHOTO_DATA_URL = (\d+);/) || [])[1], 10);
    const cap = parseInt((readFileSync("firestore.rules", "utf8").match(/value\.size\(\) <= (\d{6,});/) || [])[1], 10);
    t("the photo budget stays under the rules' kv cap", budget > 0 && cap > 0 && budget < cap, true);
  }
  t(
    "another site on the same host is not ours",
    r("https://abizior-coder.github.io/other/index.html", "navigate"),
    "network",
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
