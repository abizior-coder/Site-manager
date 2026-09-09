// Stub for render tests: docs/specs/2026-09-09_login-audit.md.
// Default rows so the owner's Cockpit card has something to render; a test
// that needs the empty state calls setStubLoginEvents([]).
let stubLoginEvents = [
  { id: "le3", uid: "u1", name: "Chef", role: "owner", at: Date.now() - 1000 },
  { id: "le2", uid: "u2", name: "Mitarbeiter", role: "crew", at: Date.now() - 3600000 },
  { id: "le1", uid: "u3", name: "Polier", role: "supervisor", at: Date.now() - 7200000 },
];
export function setStubLoginEvents(rows) {
  stubLoginEvents = rows;
}
export async function recordLogin(uid, name, role) {
  const row = { id: "le-new", uid, name: name || "", role: role || "crew", at: Date.now() };
  stubLoginEvents = [row, ...stubLoginEvents];
  return { id: row.id, at: row.at };
}
export async function listLoginEvents() {
  return [...stubLoginEvents].sort((a, b) => b.at - a.at);
}
export function claimLoginSlot(storage, uid) {
  try {
    const key = "site-log-login-recorded-" + uid;
    if (storage?.getItem(key)) return false;
    storage?.setItem(key, "1");
    return true;
  } catch {
    return false;
  }
}
export function recordThisSession(uid, name, role) {
  if (claimLoginSlot(sessionStorage, uid)) recordLogin(uid, name, role);
}
