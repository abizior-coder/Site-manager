// Company-scoped storage.
//
// The app keeps its state as arrays (projects, entries, customers, documents)
// and saves through persist(). Rewriting every call site to do per-record
// writes would touch hundreds of places in a 5,000-line file. Instead this
// module DIFFS the new array against the last known one and writes only the
// documents that actually changed. Call sites stay as they are, and two
// phones editing different records no longer overwrite each other — which was
// the whole reason the single blob had to go.

import { initFirebase, getSdk } from "./firebase-client.js";

export const ENTITY_COLLECTIONS = ["projects", "entries", "customers", "documents", "assignments"];

let companyId = null;
let role = null;
// Last state written or received per collection, used as the diff baseline.
const baseline = new Map();

export function getCompanyId() { return companyId; }
export function getRole() { return role; }
export function isOwner() { return role === "owner"; }

function db() { return getSdk().db; }
function fs() { return getSdk().fs; }

function col(name) {
  return fs().collection(db(), "companies", companyId, name);
}
function docRef(name, id) {
  return fs().doc(db(), "companies", companyId, name, id);
}

// --- membership ----------------------------------------------------------

export async function loadMembership(uid) {
  await initFirebase();
  const snap = await fs().getDoc(fs().doc(db(), "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data.companyId) return null;

  const memberRef = fs().doc(db(), "companies", data.companyId, "members", uid);
  let member = await fs().getDoc(memberRef);

  // Repair a half-created company. An earlier rules bug allowed the company
  // document to be written but denied the owner's own membership, which left
  // the account pointing at a company it could not join — and no way out from
  // the UI, since onboarding would just create another orphan.
  if (!member.exists()) {
    try {
      const company = await fs().getDoc(fs().doc(db(), "companies", data.companyId));
      if (company.exists() && company.data().ownerUid === uid) {
        await fs().setDoc(memberRef, {
          role: "owner",
          name: data.displayName || "",
          email: "",
          active: true,
          joinedAt: Date.now(),
        });
        member = await fs().getDoc(memberRef);
      }
    } catch (e) {
      return null;
    }
  }
  if (!member.exists()) return null;

  companyId = data.companyId;
  role = member.data().role || "crew";
  return { companyId, role, member: member.data() };
}

export async function createCompany(uid, { companyName, displayName, email }) {
  await initFirebase();
  const id = fs().doc(col_root()).id;
  const now = Date.now();
  await fs().setDoc(fs().doc(db(), "companies", id), {
    name: companyName, ownerUid: uid, createdAt: now,
    publicSettings: { currency: "CHF" },
  });
  await fs().setDoc(fs().doc(db(), "companies", id, "members", uid), {
    role: "owner", name: displayName || "", email: email || "", active: true, joinedAt: now,
  });
  await fs().setDoc(fs().doc(db(), "users", uid), { companyId: id, displayName: displayName || "" }, { merge: true });

  // With offline persistence a write resolves as soon as it is queued locally,
  // so a server rejection would surface only later as a silent rollback. Read
  // the membership back from the server before calling this a success.
  const confirmed = await fs().getDocFromServer(fs().doc(db(), "companies", id, "members", uid));
  if (!confirmed.exists()) throw new Error("company-not-confirmed");

  companyId = id;
  role = "owner";
  return id;
}

function col_root() {
  return fs().collection(db(), "companies");
}

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alikes
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

export async function createInvite(inviteRole = "crew", days = 14) {
  await initFirebase();
  const code = randomCode();
  await fs().setDoc(fs().doc(db(), "invites", code), {
    companyId, role: inviteRole,
    expiresAt: Date.now() + days * 86400000,
    createdAt: Date.now(), usedBy: null,
  });
  return code;
}

export async function listInvites() {
  await initFirebase();
  const snaps = await fs().getDocs(fs().query(fs().collection(db(), "invites"), fs().where("companyId", "==", companyId)));
  const out = [];
  snaps.forEach((d) => out.push({ code: d.id, ...d.data() }));
  return out.filter((i) => !i.usedBy && i.expiresAt > Date.now());
}

export async function revokeInvite(code) {
  await initFirebase();
  await fs().deleteDoc(fs().doc(db(), "invites", code));
}

export async function joinCompanyWithCode(uid, code, { displayName, email }) {
  await initFirebase();
  const clean = String(code || "").trim().toUpperCase();
  const inviteRef = fs().doc(db(), "invites", clean);
  const invite = await fs().getDoc(inviteRef);
  if (!invite.exists()) throw new Error("invite-invalid");
  const data = invite.data();
  if (data.usedBy) throw new Error("invite-used");
  if (data.expiresAt < Date.now()) throw new Error("invite-expired");

  await fs().setDoc(fs().doc(db(), "companies", data.companyId, "members", uid), {
    role: data.role || "crew", name: displayName || "", email: email || "",
    active: true, joinedAt: Date.now(), inviteCode: clean,
  });
  await fs().setDoc(fs().doc(db(), "users", uid), { companyId: data.companyId, displayName: displayName || "" }, { merge: true });
  await fs().updateDoc(inviteRef, { usedBy: uid });

  companyId = data.companyId;
  role = data.role || "crew";
  return { companyId, role };
}

export async function listMembers() {
  await initFirebase();
  const snaps = await fs().getDocs(col("members"));
  const out = [];
  snaps.forEach((d) => out.push({ uid: d.id, ...d.data() }));
  return out;
}

// --- entity sync ---------------------------------------------------------

export function setBaseline(name, arr) {
  baseline.set(name, new Map((arr || []).map((r) => [r.id, JSON.stringify(r)])));
}

/**
 * Write only what changed. Returns counts so callers can report honestly
 * rather than assuming success.
 */
export async function syncCollection(name, nextArr) {
  await initFirebase();
  if (!companyId) throw new Error("no company");
  const prev = baseline.get(name) || new Map();
  const nextMap = new Map((nextArr || []).map((r) => [r.id, JSON.stringify(r)]));

  const writes = [];
  const deletes = [];
  for (const [id, json] of nextMap) {
    if (prev.get(id) !== json) writes.push(JSON.parse(json));
  }
  for (const id of prev.keys()) {
    if (!nextMap.has(id)) deletes.push(id);
  }

  // Sequential rather than batched: a batch caps at 500 operations and, more
  // importantly, one bad record would roll back the rest.
  for (const rec of writes) await fs().setDoc(docRef(name, rec.id), rec);
  for (const id of deletes) await fs().deleteDoc(docRef(name, id));

  baseline.set(name, nextMap);
  return { written: writes.length, deleted: deletes.length };
}

export async function loadCollection(name) {
  await initFirebase();
  const snaps = await fs().getDocs(col(name));
  const out = [];
  snaps.forEach((d) => out.push({ id: d.id, ...d.data() }));
  setBaseline(name, out);
  return out;
}

// Live updates, so a second device — or the owner watching the crew — sees
// changes without a reload. Also what makes offline edits reconcile.
export function subscribeCollection(name, cb, onError) {
  const unsub = fs().onSnapshot(
    col(name),
    (snaps) => {
      const out = [];
      snaps.forEach((d) => out.push({ id: d.id, ...d.data() }));
      setBaseline(name, out);
      cb(out);
    },
    (err) => { if (onError) onError(err); }
  );
  return unsub;
}

// --- company key/value (photos, prefs, library) --------------------------

export const companyStorage = {
  async get(key) {
    await initFirebase();
    if (!companyId) throw new Error("no company");
    const snap = await fs().getDoc(docRef("kv", key));
    if (!snap.exists()) return null;
    return { key, value: snap.data().value };
  },
  async set(key, value) {
    await initFirebase();
    if (!companyId) throw new Error("no company");
    await fs().setDoc(docRef("kv", key), { value });
    return { key, value };
  },
  async delete(key) {
    await initFirebase();
    if (!companyId) throw new Error("no company");
    await fs().deleteDoc(docRef("kv", key));
    return { key, deleted: true };
  },
  async list(prefix) {
    await initFirebase();
    if (!companyId) throw new Error("no company");
    const snaps = await fs().getDocs(col("kv"));
    const keys = [];
    snaps.forEach((d) => { if (!prefix || d.id.startsWith(prefix)) keys.push(d.id); });
    return { keys, prefix: prefix || "" };
  },
};

// --- owner-only finance settings ----------------------------------------

export async function loadFinance() {
  await initFirebase();
  const snap = await fs().getDoc(fs().doc(db(), "companies", companyId, "private", "finance"));
  return snap.exists() ? snap.data() : null;
}

export async function saveFinance(data) {
  await initFirebase();
  await fs().setDoc(fs().doc(db(), "companies", companyId, "private", "finance"), data);
}

// --- migration from the single-account blob ------------------------------

/**
 * Copies the old users/{uid}/kv/* data into the company. Copies rather than
 * moves: the originals stay untouched so this is reversible if the counts
 * look wrong.
 */
export async function migrateFromPersonal(uid, onProgress) {
  await initFirebase();
  if (!companyId) throw new Error("no company");

  const kvSnaps = await fs().getDocs(fs().collection(db(), "users", uid, "kv"));
  const kv = [];
  kvSnaps.forEach((d) => kv.push({ id: d.id, value: d.data().value }));

  const blobDoc = kv.find((d) => d.id === "site-data");
  const counts = { projects: 0, entries: 0, customers: 0, documents: 0, kv: 0 };

  if (blobDoc) {
    let blob;
    try { blob = JSON.parse(blobDoc.value); } catch { blob = null; }
    if (blob) {
      for (const name of ENTITY_COLLECTIONS) {
        const arr = Array.isArray(blob[name]) ? blob[name] : [];
        for (const rec of arr) {
          const id = rec.id || fs().doc(col(name)).id;
          const withOwner = name === "entries" ? { ...rec, id, userId: rec.userId || uid } : { ...rec, id };
          await fs().setDoc(docRef(name, id), withOwner);
          counts[name]++;
          if (onProgress) onProgress(name, counts[name]);
        }
      }
    }
  }

  // Everything else (photos, preferences, tech library) keeps its key.
  for (const d of kv) {
    if (d.id === "site-data") continue;
    await fs().setDoc(docRef("kv", d.id), { value: d.value });
    counts.kv++;
    if (onProgress) onProgress("kv", counts.kv);
  }

  return counts;
}

export async function personalDataSummary(uid) {
  await initFirebase();
  const kvSnaps = await fs().getDocs(fs().collection(db(), "users", uid, "kv"));
  const kv = [];
  kvSnaps.forEach((d) => kv.push({ id: d.id, value: d.data().value }));
  const blobDoc = kv.find((d) => d.id === "site-data");
  let blob = null;
  if (blobDoc) { try { blob = JSON.parse(blobDoc.value); } catch {} }
  return {
    hasData: !!blobDoc || kv.length > 0,
    projects: blob && blob.projects ? blob.projects.length : 0,
    entries: blob && blob.entries ? blob.entries.length : 0,
    customers: blob && blob.customers ? blob.customers.length : 0,
    documents: blob && blob.documents ? blob.documents.length : 0,
    otherDocs: kv.filter((d) => d.id !== "site-data").length,
  };
}

export function resetCompanyState() {
  companyId = null;
  role = null;
  baseline.clear();
}
