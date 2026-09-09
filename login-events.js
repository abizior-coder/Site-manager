// Login audit (docs/specs/2026-09-09_login-audit.md): everything about this
// feature, pure logic and the Firestore read/write both. One file, reached
// only through dynamic import() (the same way report-document.js and
// swiss-qr-bill.js already are), so none of it costs the first-paint
// budget for a feature a session only ever touches once (recording its own
// sign-in) or never (a crew member's session never opens the owner-only
// Cockpit card that reads it). Splitting the pure helpers into their own
// eager file was tried first and cost more, not less — Firestore's path
// literals ("companies", "loginEvents") are not the kind of thing
// minification shrinks, and every one of them is real eager weight once
// this file's callers are statically reachable. Lazy is what actually fits.
import { initFirebase, getSdk } from "./firebase-client.js";
import { getCompanyId } from "./company-store.js";

function db() {
  return getSdk().db;
}
function fs() {
  return getSdk().fs;
}

// Bounded retention: the owner's own Cockpit list never needs pagination,
// and an unbounded per-account log is still personal data accumulating
// forever. 200 rows comfortably covers months of a whole crew's activity.
export const LOGIN_EVENTS_CAP = 200;

// Which rows, if any, must be pruned once listLoginEvents() reads more than
// the cap back — rows is assumed newest-first (Firestore's own
// `orderBy("at", "desc")`, the order the query below already runs in), so
// everything past the cap is simply the tail. Deleting is a separate,
// rules-checked write from the read (Firestore has no server-side trigger
// to do this on the Spark plan), so this returns a decision, not an action
// — listLoginEvents() performs the writes and swallows a permission
// refusal, since only the owner's own session may delete (see
// firestore.rules): a non-owner session leaves the excess in place,
// corrected the next time the owner's own session reads the list. Pure and
// exported so logic.test.mjs covers it directly.
export function idsToPrune(rows, cap = LOGIN_EVENTS_CAP) {
  return Array.isArray(rows) && rows.length > cap ? rows.slice(cap).map((r) => r.id) : [];
}

// Once per authenticated session, not once per page load: a sign-in that
// persists across a reload must not spend the retention cap every time a
// phone wakes up. True only the first time a given uid is seen on this
// device/tab session; marks it so every later call returns false. The same
// sessionStorage-marker shape entry.jsx's own stale-chunk reload-once guard
// already uses. Storage is a parameter, not a read of the real global, so a
// test can supply a stub.
export function claimLoginSlot(storage, uid) {
  const key = "site-log-login-recorded-" + uid;
  try {
    if (storage?.getItem(key)) return false;
    storage?.setItem(key, "1");
    return true;
  } catch {
    return false;
  }
}

// name/role are a snapshot at the moment of sign-in (not a live join to the
// member document), so a row still reads correctly after a promotion, a
// rename, or the person leaving.
export async function recordLogin(uid, name, role) {
  await initFirebase();
  const companyId = getCompanyId();
  if (!companyId) throw new Error("no company");
  const id = crypto.randomUUID();
  const at = Date.now();
  await fs().setDoc(fs().doc(db(), "companies", companyId, "loginEvents", id), {
    uid,
    name: name || "",
    role: role || "crew",
    at,
  });
  return { id, at };
}

// Owner-only per firestore.rules; newest first for the Cockpit list. Also
// where the bounded-retention prune happens, reusing the rows this read
// already fetched rather than a second query from recordLogin.
export async function listLoginEvents() {
  await initFirebase();
  const companyId = getCompanyId();
  if (!companyId) throw new Error("no company");
  const snaps = await fs().getDocs(
    fs().query(fs().collection(db(), "companies", companyId, "loginEvents"), fs().orderBy("at", "desc")),
  );
  const rows = [];
  snaps.forEach((d) => rows.push({ id: d.id, ...d.data() }));
  const prune = idsToPrune(rows);
  for (const id of prune)
    fs()
      .deleteDoc(fs().doc(db(), "companies", companyId, "loginEvents", id))
      .catch(() => {});
  return prune.length ? rows.slice(0, rows.length - prune.length) : rows;
}

// Once per authenticated session (see claimLoginSlot above), records the
// login and returns without waiting for it -- the caller (the app's mount
// effect) never blocks anything visible on this.
export function recordThisSession(uid, name, role) {
  if (claimLoginSlot(sessionStorage, uid)) recordLogin(uid, name, role).catch(() => {});
}
