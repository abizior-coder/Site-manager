// Firebase lives here, in the app bundle, rather than in index.html.
// index.html and bundle.js are cached independently, and depending on a global
// defined in the shell has already caused an outage (PROJECT.md §6). esbuild
// leaves a dynamic import of a URL expression untouched, so the SDK is fetched
// at runtime without being bundled.

const CDN = "https://www.gstatic.com/firebasejs/10.7.1/";

const firebaseConfig = {
  apiKey: "AIzaSyA_pf25-mCaig-HL3mJJSJQfFbXttKnADw",
  authDomain: "site-log-ab6a9.firebaseapp.com",
  projectId: "site-log-ab6a9",
  storageBucket: "site-log-ab6a9.firebasestorage.app",
  messagingSenderId: "72854783892",
  appId: "1:72854783892:web:0fa812d5485b505612f181",
};

let sdk = null;
let ready = null;

async function boot() {
  const [appMod, fsMod, authMod] = await Promise.all([
    import(CDN + "firebase-app.js"),
    import(CDN + "firebase-firestore.js"),
    import(CDN + "firebase-auth.js"),
  ]);
  const app = appMod.initializeApp(firebaseConfig);

  const isLocal = typeof location !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const useEmulator = isLocal && typeof location !== "undefined" && location.search.includes("emulator=1");

  // Offline persistence, enabled at creation. Crews work on roofs with poor
  // signal; without a local cache every read simply fails when the connection
  // drops. Falls back to a plain instance where the browser refuses (private
  // windows, or a second tab holding the lock).
  //
  // Skipped against the emulator: a cache surviving between runs would make
  // test results depend on what a previous run left behind.
  let db;
  try {
    db = useEmulator
      ? fsMod.initializeFirestore(app, {})
      : fsMod.initializeFirestore(app, {
          localCache: fsMod.persistentLocalCache({ tabManager: fsMod.persistentMultipleTabManager() }),
        });
  } catch {
    db = fsMod.getFirestore(app);
  }

  const auth = authMod.getAuth(app);

  // Local emulator mode, opt-in via ?emulator=1 on localhost only. Lets the
  // real UI be driven end-to-end as every role against disposable data,
  // without touching production or anyone's real account. The hostname check
  // means a deployed page can never be pointed at a local emulator.
  if (useEmulator) {
    authMod.connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    fsMod.connectFirestoreEmulator(db, "127.0.0.1", 8080);
    console.info("Firebase: using local emulators");
  }
  // Survive app restarts on a phone without asking for the password again.
  try { await authMod.setPersistence(auth, authMod.browserLocalPersistence); } catch {}
  sdk = { app, db, auth, fs: fsMod, authApi: authMod };
  return sdk;
}

export function initFirebase() {
  if (!ready) ready = boot();
  return ready;
}

// Exposed so company-store.js can use the same initialised instance rather
// than creating a second app.
export function getSdk() {
  if (!sdk) throw new Error("firebase not initialised");
  return sdk;
}

export function currentUser() {
  return sdk && sdk.auth.currentUser ? sdk.auth.currentUser : null;
}

function currentUid() {
  const user = sdk && sdk.auth.currentUser;
  return user ? user.uid : null;
}

// Every document is scoped to the signed-in account: users/{uid}/kv/{key}.
// Without a user there is deliberately no path, so nothing can be read or
// written while signed out.
function ref(key) {
  const uid = currentUid();
  if (!uid) throw new Error("not signed in");
  return sdk.fs.doc(sdk.db, "users", uid, "kv", key);
}

export const storage = {
  async get(key) {
    await initFirebase();
    const snap = await sdk.fs.getDoc(ref(key));
    if (!snap.exists()) return null;
    return { key, value: snap.data().value };
  },
  async set(key, value) {
    await initFirebase();
    await sdk.fs.setDoc(ref(key), { value });
    return { key, value };
  },
  async delete(key) {
    await initFirebase();
    await sdk.fs.deleteDoc(ref(key));
    return { key, deleted: true };
  },
  async list(prefix) {
    await initFirebase();
    const uid = currentUid();
    if (!uid) throw new Error("not signed in");
    const snaps = await sdk.fs.getDocs(sdk.fs.collection(sdk.db, "users", uid, "kv"));
    const keys = [];
    snaps.forEach((d) => { if (!prefix || d.id.startsWith(prefix)) keys.push(d.id); });
    return { keys, prefix: prefix || "" };
  },
};

// --- One-time migration off the old public paths -------------------------
// Before accounts existed everything sat in the world-readable `local/*`
// collection. This is deliberately user-triggered rather than automatic:
// whoever signed in first would otherwise claim data they may not own.
// Once the owner has imported, the security rules deny `local/*` outright.

export async function legacyScan() {
  await initFirebase();
  const snaps = await sdk.fs.getDocs(sdk.fs.collection(sdk.db, "local"));
  const docs = [];
  snaps.forEach((d) => docs.push({ id: d.id, value: d.data().value }));
  return docs;
}

export async function importLegacy(docs) {
  await initFirebase();
  const uid = currentUid();
  if (!uid) throw new Error("not signed in");
  let written = 0;
  // Written one at a time rather than in a batch: a photo document can be
  // several hundred KB and a batch caps at ~10 MB in total.
  for (const d of docs) {
    await sdk.fs.setDoc(sdk.fs.doc(sdk.db, "users", uid, "kv", d.id), { value: d.value });
    written++;
  }
  return written;
}

// The Claude proxy requires proof of a signed-in account. Firebase refreshes
// the token itself when it is close to expiry.
export async function getIdToken() {
  await initFirebase();
  const user = sdk.auth.currentUser;
  if (!user) throw new Error("not signed in");
  return user.getIdToken();
}

export async function onAuthChange(cb) {
  await initFirebase();
  return sdk.authApi.onAuthStateChanged(sdk.auth, cb);
}

// Firebase error codes are not something to show a roofer on a phone; map the
// ones that actually happen to plain sentences the caller can translate.
export function authErrorKey(err) {
  const code = (err && err.code) || "";
  if (code.includes("invalid-email")) return "authErrInvalidEmail";
  if (code.includes("missing-password") || code.includes("weak-password")) return "authErrWeakPassword";
  if (code.includes("email-already-in-use")) return "authErrEmailInUse";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "authErrBadLogin";
  // Fires when Email/Password is still disabled in the Firebase console —
  // the most likely first-run failure, so name it instead of saying "oops".
  if (code.includes("operation-not-allowed")) return "authErrProviderOff";
  if (code.includes("too-many-requests")) return "authErrTooMany";
  if (code.includes("network")) return "authErrNetwork";
  return "authErrGeneric";
}

export async function signUp(email, password) {
  await initFirebase();
  const cred = await sdk.authApi.createUserWithEmailAndPassword(sdk.auth, email.trim(), password);
  return cred.user;
}

export async function signIn(email, password) {
  await initFirebase();
  const cred = await sdk.authApi.signInWithEmailAndPassword(sdk.auth, email.trim(), password);
  return cred.user;
}

export async function signOutUser() {
  await initFirebase();
  await sdk.authApi.signOut(sdk.auth);
}

export async function sendReset(email) {
  await initFirebase();
  await sdk.authApi.sendPasswordResetEmail(sdk.auth, email.trim());
}
