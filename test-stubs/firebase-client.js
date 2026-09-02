// Stub for render tests: a signed-in user, no network.
export function initFirebase() { return Promise.resolve({}); }
export function getSdk() { return {}; }
export function currentUser() { return { uid: "u1", email: "owner@example.com" }; }

export async function onAuthChange(cb) {
  // Real Firebase reports "nobody" before it reports the persisted user, so
  // the signed-out branch runs on every cold load. A stale setter in that
  // branch reached the live app because this stub skipped straight to the
  // signed-in state.
  cb(null);
  cb({ uid: "u1", email: "owner@example.com" });
  return () => {};
}

export function authErrorKey() { return "authErrGeneric"; }
export async function signUp() { return { uid: "u1" }; }
export async function signIn() { return { uid: "u1" }; }
export async function signOutUser() {}
export async function sendReset() {}
export async function getIdToken() { return "token"; }
export async function legacyScan() { return []; }
export async function importLegacy() { return 0; }

export const storage = {
  async get() { return null; },
  async set() { return {}; },
  async delete() { return {}; },
  async list() { return { keys: [] }; },
};
