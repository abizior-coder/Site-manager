// Tests for the app's pure logic — the parts that can be checked without a
// browser or an account. Run with: npm run test:logic
//
// These exist because a verification pass found real bugs in features nobody
// had exercised since they were written.

import { build } from "esbuild";
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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
