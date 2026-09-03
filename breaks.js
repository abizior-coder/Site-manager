// The two breaks of a Swiss site day: Znüni at nine, Mittag at noon. They
// are marked, not timed -- a tap says "taken", and the day's hours are shown
// net of them. The clock entry itself stays gross, so what was signed on a
// job is never changed by a break marked later on the phone.
//
// A break is an entry (type "break") with a date and a userId, so it rides
// on the same rules and the same sync as everything else.

export const BREAKS = [
  { key: "znuni", start: "09:00", minutes: 30 },
  { key: "mittag", start: "12:00", minutes: 60 },
];

export function breakMeta(key) {
  return BREAKS.find((b) => b.key === key) || null;
}

// Hours of breaks marked in a list of entries (already filtered to the
// person and period the caller cares about).
export function breakHours(list) {
  let h = 0;
  for (const e of list || []) {
    if (e.type !== "break") continue;
    const meta = breakMeta(e.breakKey);
    h += meta ? meta.minutes / 60 : parseFloat(e.qty || 0) || 0;
  }
  return Math.round(h * 100) / 100;
}

// Time logged minus breaks marked, never below zero: a break marked on a day
// with no clock entry yet must not read as negative work.
export function netHours(list) {
  const gross = (list || []).filter((e) => e.type === "time").reduce((s, e) => s + (parseFloat(e.qty || 0) || 0), 0);
  return Math.max(0, Math.round((gross - breakHours(list)) * 100) / 100);
}

export function breakTaken(list, key, date, userId) {
  return (list || []).some((e) => e.type === "break" && e.breakKey === key && (!date || e.date === date) && (!userId || e.userId === userId));
}
