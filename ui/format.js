// Keys and formats every part of the app agrees on.
export function todayKey(d = new Date()) { return d.toISOString().slice(0, 10); }
export function monthKey(d = new Date()) { return d.toISOString().slice(0, 7); }
export function uid() { return Math.random().toString(36).slice(2, 10); }
export function fmtHM(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}
