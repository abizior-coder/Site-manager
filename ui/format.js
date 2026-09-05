// Keys and formats every part of the app agrees on.
//
// Day and month keys are the phone's local calendar: a roofer who taps
// "Tag starten" at 00:30 is on today's sheet, not yesterday's, and the month
// turns at midnight here, not at midnight in London. Instants (createdAt,
// editedAt) stay epoch milliseconds; pure date arithmetic on ISO strings
// (reports.js weekOf, accounting-export monthDays) is UTC by design because
// it never looks at "now".
const pad2 = (n) => String(n).padStart(2, "0");
export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
export function monthKey(d = new Date()) {
  return todayKey(d).slice(0, 7);
}
// The local day `days` from `from` (a due date, an expiry look-ahead).
export function dateKeyOffset(days, from = new Date()) {
  return todayKey(new Date(from.getFullYear(), from.getMonth(), from.getDate() + (Number(days) || 0)));
}
// Document ids: a UUID where the platform has one (every browser and Node
// this app runs on), a wide random string where it does not.
export function uid() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}
export function fmtHM(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}
