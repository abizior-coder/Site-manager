// Bulk-imports a transcribed weekly paper Wochen-Rapport into real projects
// and time entries. Signs in as the owner's own account with the plain
// client Firebase SDK the app itself ships — there is no admin SDK, no
// service account and no Blaze plan for this project (PROJECT.md §3), so
// this is the only way to write for real, and it writes exactly what the
// signed-in account's own role is allowed to (firestore.rules).
//
// The password is read from SITE_LOG_EMAIL/SITE_LOG_PASSWORD, or prompted
// for interactively (not echoed) — it is typed by whoever runs this script,
// never handled by the agent that produced the rows file.
//
// Dry run by default: prints the plan and writes nothing. Pass --commit to
// actually create the projects/entries.
//
//   node scripts/import-rapport.mjs rows.json           # dry run
//   node scripts/import-rapport.mjs rows.json --commit  # writes for real
//
// rows.json: an array of { date: "YYYY-MM-DD", project, description, hours,
// address? }. docs/specs/2026-09-13_weekly-rapport-bulk-import.md

import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseConfig } from "../firebase-client.js";
import { normaliseImportRows, matchProjects } from "../rapport-import.js";

const [, , rowsPath, ...rest] = process.argv;
const commit = rest.includes("--commit");

if (!rowsPath) {
  console.error("usage: node scripts/import-rapport.mjs <rows.json> [--commit]");
  process.exit(1);
}

async function promptHidden(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  process.stdout.write(question);
  // Readline has no built-in mask; muting the output stream keeps the
  // typed password off the terminal without pulling in a dependency.
  const write = rl._writeToOutput;
  rl._writeToOutput = () => {};
  const answer = await rl.question("");
  rl._writeToOutput = write;
  rl.close();
  process.stdout.write("\n");
  return answer;
}

async function resolveCredentials() {
  const email = process.env.SITE_LOG_EMAIL || (await promptHidden("Site Log email: "));
  const password = process.env.SITE_LOG_PASSWORD || (await promptHidden("Site Log password: "));
  return { email, password };
}

const rows = normaliseImportRows(JSON.parse(readFileSync(rowsPath, "utf8")));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const { email, password } = await resolveCredentials();
const cred = await signInWithEmailAndPassword(auth, email, password);
const uid = cred.user.uid;

const userDoc = await getDoc(doc(db, "users", uid));
const companyId = userDoc.exists() ? userDoc.data().companyId : null;
if (!companyId) throw new Error(`no company found for ${email}`);

const projectSnaps = await getDocs(collection(db, "companies", companyId, "projects"));
const existingProjects = [];
projectSnaps.forEach((d) => existingProjects.push({ id: d.id, name: d.data().name }));

const { toCreate, plan } = matchProjects(rows, existingProjects);

console.log(`Company: ${companyId}`);
console.log(`\nProjects to create (${toCreate.length}):`);
for (const p of toCreate) console.log(`  + ${p.name}${p.address ? ` — ${p.address}` : ""}`);

console.log(`\nEntries (${plan.length}), ${plan.reduce((s, r) => s + r.hours, 0).toFixed(2)}h total:`);
for (const row of plan) {
  console.log(`  ${row.date}  ${row.projectName.padEnd(20)}  ${row.hours.toFixed(2)}h  ${row.description}`);
}

if (!commit) {
  console.log("\nDry run only — nothing written. Re-run with --commit to write these for real.");
  process.exit(0);
}

const projectIdByName = new Map(existingProjects.map((p) => [p.name.toLowerCase(), p.id]));
for (const p of toCreate) {
  const id = crypto.randomUUID();
  await setDoc(doc(db, "companies", companyId, "projects", id), {
    id,
    name: p.name,
    client: "",
    customerId: null,
    address: p.address || "",
    category: "flat",
    status: "waiting",
    createdAt: Date.now(),
  });
  projectIdByName.set(p.name.toLowerCase(), id);
  console.log(`created project ${p.name} (${id})`);
}

for (const row of plan) {
  const projectId = row.projectId || projectIdByName.get(row.projectName.toLowerCase());
  const id = crypto.randomUUID();
  await setDoc(doc(db, "companies", companyId, "entries", id), {
    id,
    type: "time",
    date: row.date,
    projectId,
    description: row.description,
    qty: String(row.hours),
    unit: "h",
    userId: uid,
    createdAt: Date.now(),
    srcLang: "de",
  });
  console.log(`created entry ${row.date} ${row.projectName} ${row.hours}h`);
}

console.log("\nDone.");
process.exit(0);
