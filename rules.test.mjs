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
  firestore: { rules: fs.readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
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
