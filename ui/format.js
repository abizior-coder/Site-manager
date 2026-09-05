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
// Dates as a person reads them, in their language: the ISO keys the app
// stores ("2026-09-05", "2026-09") never reach a title. Intl does the work;
// the map picks the Swiss variant where one exists, and a language Intl
// does not know reads Swiss German rather than whatever the machine has.
// The weekday loses its trailing dot ("Sa." in German) and starts with a
// capital, so a title reads the same in every language.
const LOCALES = { de: "de-CH", gsw: "de-CH", fr: "fr-CH", it: "it-CH", en: "en-GB" };
const FULL = { day: "2-digit", month: "2-digit", year: "numeric" };
function intl(lang, opts) {
  const l = LOCALES[lang] || lang;
  let known = false;
  try {
    known = !!l && Intl.DateTimeFormat.supportedLocalesOf([l]).length > 0;
  } catch {}
  return new Intl.DateTimeFormat(known ? l : "de-CH", opts);
}
function dateOf(iso) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(String(iso || ""));
  return m ? new Date(+m[1], m[2] - 1, +(m[3] || 1)) : null;
}
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// "Sa, 05.09.2026"
export function fmtDate(iso, lang) {
  const d = dateOf(iso);
  if (!d) return String(iso || "");
  return `${capital(intl(lang, { weekday: "short" }).format(d).replace(/\.$/, ""))}, ${intl(lang, FULL).format(d)}`;
}
// "September 2026"
export function fmtMonth(iso, lang) {
  const d = dateOf(iso);
  return d ? capital(intl(lang, { month: "long", year: "numeric" }).format(d)) : String(iso || "");
}
// "31.08.2026 – 06.09.2026". Both dates in full: the short day-month form
// differs by locale ("31.8" in Albanian, "08. 31." in Hungarian) and a week
// label must read the same everywhere.
export function fmtDateRange(fromIso, toIso, lang) {
  const a = dateOf(fromIso);
  const b = dateOf(toIso);
  if (!a || !b) return `${fromIso || ""} – ${toIso || ""}`;
  const f = intl(lang, FULL);
  return `${f.format(a)} – ${f.format(b)}`;
}
export function fmtHM(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}
