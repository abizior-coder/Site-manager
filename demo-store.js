// A canned, in-memory Firestore + Auth substitute for the public demo
// (docs/specs/2026-09-09_public-demo.md). Loaded only when
// firebase-client.js's isDemoMode() is true, from initFirebase() itself,
// instead of that file's boot() -- which is the only place the real
// Firebase SDK is ever imported. This file therefore MUST NOT import
// firebase-client.js, company-store.js, or any "firebase/*" package: doing
// so would defeat the one guarantee that matters, that a demo session can
// never reach the real Firebase project. A logic test reads this file's
// own source text and enforces that mechanically, not only by review.
//
// Every write below lands in the in-memory Map created fresh by
// createDemoSdk() and nowhere else -- never localStorage, sessionStorage
// or IndexedDB. A full reload of the page re-evaluates this module and
// starts over: "reload = clean demo" needs no reset code of its own.
//
// No real customer, contact, or job: every name and address here is
// invented, in the same style scripts/seed-emulator.mjs and
// test-stubs/company-store.js already use for the same reason.
import { todayKey } from "./ui/format.js";

export const DEMO_UID = "demo-owner";
export const DEMO_CID = "demo-co";

// The fixture as plain data (also used directly by tests, without needing
// a fake Firestore in the way) -- one fictional firm, one job, three
// entries for "today" so Heute and Rapport have something to show the
// moment the demo mounts.
export function demoFixture() {
  const now = Date.now();
  const today = todayKey();
  return {
    [`users/${DEMO_UID}`]: { companyId: DEMO_CID, displayName: "Chef Muster" },
    [`companies/${DEMO_CID}`]: { name: "Dach AG", ownerUid: DEMO_UID, createdAt: now },
    [`companies/${DEMO_CID}/members/${DEMO_UID}`]: {
      role: "owner",
      name: "Chef Muster",
      email: "demo@site-log.invalid",
      active: true,
      joinedAt: now,
    },
    [`companies/${DEMO_CID}/projects/demo-p1`]: {
      name: "Steildach Lettenring",
      address: "Lettenring 21, 8144 Dannikon",
      client: "Muster Immobilien AG",
      category: "steildach",
      status: "construction",
      createdAt: now,
    },
    [`companies/${DEMO_CID}/entries/demo-e1`]: {
      type: "time",
      date: today,
      qty: "7.5",
      projectId: "demo-p1",
      userId: DEMO_UID,
      createdAt: now,
    },
    [`companies/${DEMO_CID}/entries/demo-e2`]: {
      type: "material",
      date: today,
      description: "Ziegel Biberschwanz",
      qty: "12",
      unit: "m2",
      projectId: "demo-p1",
      userId: DEMO_UID,
      createdAt: now,
    },
    [`companies/${DEMO_CID}/entries/demo-e3`]: {
      type: "note",
      date: today,
      description: "Wetter trocken, gut vorangekommen.",
      projectId: "demo-p1",
      userId: DEMO_UID,
      createdAt: now,
    },
  };
}

// A small, generic, in-memory stand-in for the handful of Firestore calls
// firebase-client.js and company-store.js actually make (doc, collection,
// getDoc(FromServer), getDocs, setDoc, updateDoc, deleteDoc, onSnapshot,
// writeBatch) -- enough for the app's normal read/write paths to work
// unmodified against canned data. Not a general Firestore emulator:
// query()/where() are pass-through (their one real caller, listInvites, is
// unreachable -- the demo never signs in or joins by code) and writeBatch()
// runs its operations sequentially rather than atomically (its one real
// caller, joinCompanyWithCode, is unreachable for the same reason).
function makeFirestore(seed) {
  const store = new Map(Object.entries(seed));
  const ref = (path) => ({ path, id: path.split("/").pop() });
  async function getDoc(r) {
    const data = store.get(r.path);
    return { exists: () => data !== undefined, data: () => data, id: r.id, ref: r };
  }
  async function getDocs(r) {
    const prefix = `${r.path}/`;
    const docs = [];
    for (const [path, data] of store) {
      if (path.startsWith(prefix) && !path.slice(prefix.length).includes("/")) {
        docs.push({ id: path.slice(prefix.length), data: () => data, ref: ref(path) });
      }
    }
    return { docs, forEach: (fn) => docs.forEach(fn), empty: docs.length === 0 };
  }
  async function setDoc(r, data, opts) {
    const prev = store.get(r.path);
    store.set(r.path, opts && opts.merge && prev ? { ...prev, ...data } : { ...data });
  }
  async function updateDoc(r, data) {
    store.set(r.path, { ...(store.get(r.path) || {}), ...data });
  }
  async function deleteDoc(r) {
    store.delete(r.path);
  }
  // Fires once with the current state and never again -- the spec's own
  // decision: no live updates to simulate for a single, local visitor.
  function onSnapshot(r, a, b, c) {
    const cb = typeof a === "function" ? a : b;
    const errCb = typeof a === "function" ? b : c;
    getDocs(r)
      .then((snap) => cb({ ...snap, metadata: { fromCache: false, hasPendingWrites: false } }))
      .catch((e) => errCb && errCb(e));
    return () => {};
  }
  function writeBatch() {
    const ops = [];
    return {
      set: (r, data, opts) => ops.push(() => setDoc(r, data, opts)),
      update: (r, data) => ops.push(() => updateDoc(r, data)),
      delete: (r) => ops.push(() => deleteDoc(r)),
      commit: async () => {
        for (const op of ops) await op();
      },
    };
  }
  return {
    doc: (_db, ...segs) => ref(segs.join("/")),
    collection: (_db, ...segs) => ({ path: segs.join("/") }),
    getDoc,
    getDocFromServer: getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    writeBatch,
    query: (r) => r,
    where: () => null,
    store, // exposed for tests only; app code never reaches in through here
  };
}

let cached = null;

// What firebase-client.js's initFirebase() assigns to its module-level
// `sdk` when isDemoMode() is true, in place of calling boot(). Same shape
// boot() itself produces ({ app, db, auth, fs, authApi }), so every
// existing function in firebase-client.js and company-store.js that reads
// getSdk().fs / .db / .auth / .authApi keeps working, unmodified, against
// canned data instead of a real project.
export function createDemoSdk() {
  if (cached) return cached;
  const fakeUser = { uid: DEMO_UID, email: "demo@site-log.invalid", getIdToken: async () => "demo-token" };
  const authApi = {
    // Fires once with the fixture's own already-signed-in user; the demo
    // never shows a sign-in screen.
    onAuthStateChanged(auth, cb) {
      Promise.resolve().then(() => cb(auth.currentUser));
      return () => {};
    },
    async signInWithEmailAndPassword() {
      throw new Error("demo: sign-in is not available");
    },
    async createUserWithEmailAndPassword() {
      throw new Error("demo: sign-up is not available");
    },
    async signOut() {},
    EmailAuthProvider: { credential: () => null },
    async reauthenticateWithCredential() {},
    async deleteUser() {},
  };
  cached = {
    app: null,
    db: { __demo: true },
    auth: { currentUser: fakeUser },
    fs: makeFirestore(demoFixture()),
    authApi,
  };
  return cached;
}
