// Stub for render tests: a signed-in user, no network.
export function initFirebase() {
  return Promise.resolve({});
}
export function getSdk() {
  return {};
}
export function currentUser() {
  return stubSignedOut ? null : { uid: "u1", email: "owner@example.com" };
}

// Stays signed out for a test that needs the sign-in screen itself (the
// Demo control has no other harness: docs/CODE_MAP.md's render.test.mjs
// row used to say "no signed-out render harness (use e2e)" -- this is
// that harness, added for exactly that control).
let stubSignedOut = false;
export function setStubSignedOut(v) {
  stubSignedOut = v;
}

// docs/specs/2026-09-09_transport-detail-and-scan.md: the trip slip scan
// control reads this to hide itself in demo mode. Real firebase-client.js
// reads the `?demo=1` URL param; this stub is a plain toggle instead so a
// test can flip it without touching the harness's own jsdom URL.
let stubDemoMode = false;
export function setStubDemoMode(v) {
  stubDemoMode = v;
}
export function isDemoMode() {
  return stubDemoMode;
}

export async function onAuthChange(cb) {
  // Real Firebase reports "nobody" before it reports the persisted user, so
  // the signed-out branch runs on every cold load. A stale setter in that
  // branch reached the live app because this stub skipped straight to the
  // signed-in state.
  cb(null);
  if (!stubSignedOut) cb({ uid: "u1", email: "owner@example.com" });
  return () => {};
}

export function authErrorKey() {
  return "authErrGeneric";
}
export async function signUp() {
  return { uid: "u1" };
}
export async function signIn() {
  return { uid: "u1" };
}
export async function signOutUser() {}
export async function sendReset() {}
export async function reauthenticate() {}
export async function deleteOwnAccount() {}
export async function getIdToken() {
  return "token";
}
export async function legacyScan() {
  return [];
}
export async function importLegacy() {
  return 0;
}

export const storage = {
  async get() {
    return null;
  },
  async set() {
    return {};
  },
  async delete() {
    return {};
  },
  async list() {
    return { keys: [] };
  },
};
