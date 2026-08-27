// Rules tests. These assert what the SERVER allows, not what the UI shows —
// the crew/owner split is only real if it holds against a raw client.
//
//   firebase emulators:exec --only firestore "node rules.test.mjs"

import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import fs from "node:fs";

const CID = "company1";
const OWNER = "owner-uid";
const CREW = "crew-uid";
const OUTSIDER = "outsider-uid";

let passed = 0, failed = 0;
async function check(name, fn) {
  try { await fn(); console.log("ok   " + name); passed++; }
  catch (e) { console.log("FAIL " + name + " — " + (e.message || e)); failed++; }
}

const testEnv = await initializeTestEnvironment({
  projectId: "rules-test",
  firestore: { rules: fs.readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8085 },
});

// Seed with rules disabled.
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const d = ctx.firestore();
  await setDoc(doc(d, "companies", CID), { name: "Dach AG", ownerUid: OWNER });
  await setDoc(doc(d, "companies", CID, "members", OWNER), { role: "owner" });
  await setDoc(doc(d, "companies", CID, "members", CREW), { role: "crew" });
  await setDoc(doc(d, "companies", CID, "private", "finance"), { labourRate: 85, iban: "CH93..." });
  await setDoc(doc(d, "companies", CID, "documents", "inv1"), { number: "R-2026-001", total: 5000 });
  await setDoc(doc(d, "companies", CID, "projects", "p1"), { name: "Roof" });
  await setDoc(doc(d, "companies", CID, "entries", "e-own"), { userId: CREW, qty: "8" });
  await setDoc(doc(d, "companies", CID, "entries", "e-other"), { userId: OWNER, qty: "8" });
  await setDoc(doc(d, "invites", "GOODCODE"), {
    companyId: CID, role: "crew", expiresAt: Date.now() + 86400000, usedBy: null,
  });
  await setDoc(doc(d, "invites", "EXPIRED"), {
    companyId: CID, role: "crew", expiresAt: Date.now() - 1000, usedBy: null,
  });
  await setDoc(doc(d, "invites", "OWNERCODE"), {
    companyId: CID, role: "owner", expiresAt: Date.now() + 86400000, usedBy: null,
  });
});

const owner = testEnv.authenticatedContext(OWNER).firestore();
const crew = testEnv.authenticatedContext(CREW).firestore();
const outsider = testEnv.authenticatedContext(OUTSIDER).firestore();
const anon = testEnv.unauthenticatedContext().firestore();

// --- the money must be invisible to crew --------------------------------
await check("crew CANNOT read finance", () =>
  assertFails(getDoc(doc(crew, "companies", CID, "private", "finance"))));
await check("crew CANNOT read invoices", () =>
  assertFails(getDoc(doc(crew, "companies", CID, "documents", "inv1"))));
await check("crew CANNOT list invoices", () =>
  assertFails(getDocs(collection(crew, "companies", CID, "documents"))));
await check("owner CAN read finance", () =>
  assertSucceeds(getDoc(doc(owner, "companies", CID, "private", "finance"))));
await check("owner CAN read invoices", () =>
  assertSucceeds(getDoc(doc(owner, "companies", CID, "documents", "inv1"))));

// --- crew can do their job ----------------------------------------------
await check("crew CAN read projects", () =>
  assertSucceeds(getDoc(doc(crew, "companies", CID, "projects", "p1"))));
await check("crew CANNOT write projects", () =>
  assertFails(setDoc(doc(crew, "companies", CID, "projects", "p1"), { name: "hacked" })));
await check("crew CAN create own entry", () =>
  assertSucceeds(setDoc(doc(crew, "companies", CID, "entries", "e-new"), { userId: CREW, qty: "4" })));
await check("crew CANNOT create entry attributed to someone else", () =>
  assertFails(setDoc(doc(crew, "companies", CID, "entries", "e-fake"), { userId: OWNER, qty: "4" })));
await check("crew CAN edit own entry", () =>
  assertSucceeds(setDoc(doc(crew, "companies", CID, "entries", "e-own"), { userId: CREW, qty: "9" })));
await check("crew CANNOT edit another's entry", () =>
  assertFails(setDoc(doc(crew, "companies", CID, "entries", "e-other"), { userId: OWNER, qty: "99" })));
await check("crew CANNOT delete another's entry", () =>
  assertFails(deleteDoc(doc(crew, "companies", CID, "entries", "e-other"))));
await check("owner CAN edit any entry", () =>
  assertSucceeds(setDoc(doc(owner, "companies", CID, "entries", "e-other"), { userId: OWNER, qty: "7" })));

// --- privilege escalation ------------------------------------------------
await check("crew CANNOT promote themselves to owner", () =>
  assertFails(setDoc(doc(crew, "companies", CID, "members", CREW), { role: "owner" })));
await check("crew CANNOT change another member", () =>
  assertFails(setDoc(doc(crew, "companies", CID, "members", OWNER), { role: "crew" })));
await check("crew CAN read member list", () =>
  assertSucceeds(getDoc(doc(crew, "companies", CID, "members", OWNER))));

// --- outsiders -----------------------------------------------------------
await check("outsider CANNOT read projects", () =>
  assertFails(getDoc(doc(outsider, "companies", CID, "projects", "p1"))));
await check("outsider CANNOT read company", () =>
  assertFails(getDoc(doc(outsider, "companies", CID))));
await check("outsider CANNOT join without an invite", () =>
  assertFails(setDoc(doc(outsider, "companies", CID, "members", OUTSIDER), { role: "crew" })));
await check("anonymous CANNOT read anything", () =>
  assertFails(getDoc(doc(anon, "companies", CID, "projects", "p1"))));

// --- invites -------------------------------------------------------------
await check("outsider CAN join with a valid invite", () =>
  assertSucceeds(setDoc(doc(outsider, "companies", CID, "members", OUTSIDER), {
    role: "crew", inviteCode: "GOODCODE",
  })));
await check("invite CANNOT be used to grant a higher role than it names", () =>
  assertFails(setDoc(doc(testEnv.authenticatedContext("u2").firestore(), "companies", CID, "members", "u2"), {
    role: "owner", inviteCode: "GOODCODE",
  })));
await check("expired invite is rejected", () =>
  assertFails(setDoc(doc(testEnv.authenticatedContext("u3").firestore(), "companies", CID, "members", "u3"), {
    role: "crew", inviteCode: "EXPIRED",
  })));
await check("made-up invite code is rejected", () =>
  assertFails(setDoc(doc(testEnv.authenticatedContext("u4").firestore(), "companies", CID, "members", "u4"), {
    role: "crew", inviteCode: "NOSUCHCODE",
  })));
await check("crew CANNOT create invites", () =>
  assertFails(setDoc(doc(crew, "invites", "MINE"), { companyId: CID, role: "owner", expiresAt: Date.now() + 1000 })));

// --- supervisor: runs the work, never sees the money ---------------------
const SUP = "supervisor-uid";
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const d = ctx.firestore();
  await setDoc(doc(d, "companies", CID, "members", SUP), { role: "supervisor" });
  await setDoc(doc(d, "companies", CID, "leave", "lv-crew"), { userId: CREW, date: "2026-09-02", status: "pending", type: "vacation" });
  await setDoc(doc(d, "companies", CID, "leave", "lv-own"), { userId: SUP, date: "2026-09-03", status: "pending", type: "vacation" });
});
const sup = testEnv.authenticatedContext(SUP).firestore();

await check("supervisor CANNOT read finance", () =>
  assertFails(getDoc(doc(sup, "companies", CID, "private", "finance"))));
await check("supervisor CANNOT read invoices", () =>
  assertFails(getDoc(doc(sup, "companies", CID, "documents", "inv1"))));
await check("supervisor CAN edit projects", () =>
  assertSucceeds(setDoc(doc(sup, "companies", CID, "projects", "p1"), { name: "Roof (updated)" })));
await check("supervisor CAN plan assignments", () =>
  assertSucceeds(setDoc(doc(sup, "companies", CID, "assignments", "a-sup"), { date: "2026-09-02", projectId: "p1", userId: CREW })));
await check("supervisor CAN correct a crew member's hours", () =>
  assertSucceeds(setDoc(doc(sup, "companies", CID, "entries", "e-own"), { userId: CREW, qty: "8.5" })));
await check("supervisor CANNOT promote themselves", () =>
  assertFails(setDoc(doc(sup, "companies", CID, "members", SUP), { role: "owner" })));

// --- absences ------------------------------------------------------------
await check("crew CAN request their own leave", () =>
  assertSucceeds(setDoc(doc(crew, "companies", CID, "leave", "lv-new"), { userId: CREW, date: "2026-09-05", status: "pending", type: "sick" })));
await check("crew CANNOT file leave for someone else", () =>
  assertFails(setDoc(doc(crew, "companies", CID, "leave", "lv-fake"), { userId: SUP, date: "2026-09-05", status: "pending", type: "sick" })));
await check("crew CANNOT approve their own leave", () =>
  assertFails(setDoc(doc(crew, "companies", CID, "leave", "lv-crew"), { userId: CREW, date: "2026-09-02", status: "approved", type: "vacation" })));
await check("crew CAN amend their own pending request", () =>
  assertSucceeds(setDoc(doc(crew, "companies", CID, "leave", "lv-crew"), { userId: CREW, date: "2026-09-02", status: "pending", type: "sick" })));
await check("supervisor CAN approve crew leave", () =>
  assertSucceeds(setDoc(doc(sup, "companies", CID, "leave", "lv-crew"), { userId: CREW, date: "2026-09-02", status: "approved", type: "sick" })));
await check("crew CAN see the team's absences", () =>
  assertSucceeds(getDoc(doc(crew, "companies", CID, "leave", "lv-own"))));

// --- signed site reports -------------------------------------------------
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const d = ctx.firestore();
  await setDoc(doc(d, "companies", CID, "reports", "r-open"), { userId: CREW, projectId: "p1", date: "2026-09-01", signedAt: null });
  await setDoc(doc(d, "companies", CID, "reports", "r-signed"), { userId: CREW, projectId: "p1", date: "2026-09-01", signedAt: Date.now(), signerName: "Kunde" });
});
await check("crew CAN create a report on site", () =>
  assertSucceeds(setDoc(doc(crew, "companies", CID, "reports", "r-new"), { userId: CREW, projectId: "p1", date: "2026-09-02", signedAt: null })));
await check("crew CANNOT create a report as someone else", () =>
  assertFails(setDoc(doc(crew, "companies", CID, "reports", "r-fake"), { userId: SUP, projectId: "p1", date: "2026-09-02", signedAt: null })));
await check("manager CAN edit an unsigned report", () =>
  assertSucceeds(setDoc(doc(sup, "companies", CID, "reports", "r-open"), { userId: CREW, projectId: "p1", date: "2026-09-01", signedAt: null, note: "korrigiert" })));
// The point of a signature is that what was signed cannot change afterwards.
await check("a SIGNED report cannot be altered, even by the owner", () =>
  assertFails(setDoc(doc(owner, "companies", CID, "reports", "r-signed"), { userId: CREW, projectId: "p1", date: "2026-09-01", signedAt: Date.now(), signerName: "Jemand anders" })));
await check("crew CAN read reports", () =>
  assertSucceeds(getDoc(doc(crew, "companies", CID, "reports", "r-signed"))));
await check("crew CANNOT delete a report", () =>
  assertFails(deleteDoc(doc(crew, "companies", CID, "reports", "r-signed"))));

// --- sent reports --------------------------------------------------------
await check("crew CAN send their own report", () =>
  assertSucceeds(setDoc(doc(crew, "companies", CID, "sentReports", "sr1"), { userId: CREW, period: "daily" })));
await check("crew CANNOT send a report as someone else", () =>
  assertFails(setDoc(doc(crew, "companies", CID, "sentReports", "sr2"), { userId: SUP, period: "daily" })));
await check("manager CAN correct a sent report", () =>
  assertSucceeds(setDoc(doc(sup, "companies", CID, "sentReports", "sr1"), { userId: CREW, period: "daily", note: "korrigiert" })));

// --- scheduling ----------------------------------------------------------
await check("owner CAN create an assignment", () =>
  assertSucceeds(setDoc(doc(owner, "companies", CID, "assignments", "a1"), {
    date: "2026-09-01", projectId: "p1", userId: CREW,
  })));
await check("crew CAN read the schedule", () =>
  assertSucceeds(getDoc(doc(crew, "companies", CID, "assignments", "a1"))));
await check("crew CANNOT reassign themselves", () =>
  assertFails(setDoc(doc(crew, "companies", CID, "assignments", "a1"), {
    date: "2026-09-01", projectId: "p-nicer", userId: CREW,
  })));
await check("crew CANNOT delete an assignment", () =>
  assertFails(deleteDoc(doc(crew, "companies", CID, "assignments", "a1"))));
// A fresh identity: `outsider` legitimately joined the company earlier in
// this suite, so reusing it here would prove nothing.
await check("a non-member CANNOT read the schedule", () =>
  assertFails(getDoc(doc(
    testEnv.authenticatedContext("stranger-uid").firestore(),
    "companies", CID, "assignments", "a1"
  ))));

// --- founding a company --------------------------------------------------
// The gap that shipped a broken rule: these all happen with no membership
// yet, so anything asking "are you already an owner?" fails by definition.
const founderUid = "founder-uid";
const founder = testEnv.authenticatedContext(founderUid).firestore();
await check("founder CAN create a company naming themselves owner", () =>
  assertSucceeds(setDoc(doc(founder, "companies", "newco"), { name: "New AG", ownerUid: founderUid })));
await check("founder CAN create their own owner membership", () =>
  assertSucceeds(setDoc(doc(founder, "companies", "newco", "members", founderUid), { role: "owner" })));
await check("founder CAN write their user record", () =>
  assertSucceeds(setDoc(doc(founder, "users", founderUid), { companyId: "newco" })));
await check("founder CAN then read their own company", () =>
  assertSucceeds(getDoc(doc(founder, "companies", "newco"))));
await check("founder CAN write finance in their own company", () =>
  assertSucceeds(setDoc(doc(founder, "companies", "newco", "private", "finance"), { labourRate: 90 })));
await check("someone else CANNOT create a company claiming a different owner", () =>
  assertFails(setDoc(doc(crew, "companies", "stolenco"), { name: "X", ownerUid: OWNER })));
await check("outsider CANNOT attach themselves to a company they do not own", () =>
  assertFails(setDoc(doc(outsider, "companies", "newco", "members", OUTSIDER), { role: "owner" })));

// --- owner-side invite management ---------------------------------------
await check("owner CAN create an invite", () =>
  assertSucceeds(setDoc(doc(owner, "invites", "NEWCODE"), {
    companyId: CID, role: "crew", expiresAt: Date.now() + 86400000, usedBy: null,
  })));
await check("owner CAN delete an invite", () =>
  assertSucceeds(deleteDoc(doc(owner, "invites", "NEWCODE"))));

// --- legacy paths --------------------------------------------------------
await check("old public local/* stays denied", () =>
  assertFails(getDoc(doc(anon, "local", "site-data"))));
await check("owner CAN still read their personal kv (migration source)", () =>
  assertSucceeds(getDoc(doc(owner, "users", OWNER, "kv", "site-data"))));

await testEnv.cleanup();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
