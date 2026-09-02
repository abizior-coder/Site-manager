// The report model: a report is a view over entries plus a small record of
// when it was sent. Nothing is copied until a signature freezes it.
//
// This file holds the pure parts so they can be tested without a browser.
// Two facts drove it. A report used to be a fresh uid() and a copy of every
// entry, so two taps made two reports and a corrected quantity in the log
// never reached the report the supervisor had. And the monthly report re-sent
// everything the daily ones already had, with nothing marking what was new.

// One report per person, period and date. Sending it again updates this
// record instead of making a second one.
export function reportId(userId, period, periodLabel) {
  return `${userId || "anon"}-${period}-${periodLabel}`;
}

// The rows a report shows right now. New-style reports carry entry ids and
// are joined against the live log, so a fix in the log shows up here. An
// entry that has since been deleted is kept as a row marked deleted rather
// than vanishing -- the supervisor may already have the old figure. Reports
// from before this model still carry their own copies and render from them.
export function reportRows(report, entries) {
  if (!report) return [];
  const excluded = new Set(report.excludedIds || []);
  if (!Array.isArray(report.entryIds)) {
    return (report.entries || []).filter((e) => !excluded.has(e.id));
  }
  const byId = new Map((entries || []).map((e) => [e.id, e]));
  const labels = report.entryLabels || {};
  return report.entryIds
    .filter((id) => !excluded.has(id))
    .map((id) => byId.get(id) || { id, description: labels[id] || "", type: "note", qty: "", unit: "", deleted: true });
}

// Hours, counts and sites from a list of rows. Deleted rows count for
// nothing: they are shown, not summed.
export function reportTotals(rows) {
  let hours = 0;
  let materialsCount = 0;
  let toolsCount = 0;
  const projIds = [];
  for (const r of rows || []) {
    if (r.deleted) continue;
    if (r.type === "time") hours += parseFloat(r.qty || 0) || 0;
    else if (r.type === "material") materialsCount++;
    else if (r.type === "tool") toolsCount++;
    if (r.projectId && !projIds.includes(r.projectId)) projIds.push(r.projectId);
  }
  return { hours: Math.round(hours * 100) / 100, materialsCount, toolsCount, projIds };
}

// A short label per entry, stored with the report so a deleted entry can
// still be named. Metadata for the audit trail, not a source of truth.
export function entryLabels(rows) {
  const out = {};
  for (const e of rows || []) {
    out[e.id] = `${e.description || ""}${e.qty ? ` · ${e.qty}${e.unit ? " " + e.unit : ""}` : ""}`.trim();
  }
  return out;
}

// The month's entries that no daily report of this person has carried yet.
// The owner's decision (2026-09-02): the monthly report excludes what the
// daily ones already sent, rather than flagging it, so the supervisor gets
// what is new and nothing twice. The count of what was left out is returned
// so the report can say so.
export function unsentMonthEntries(monthEntries, sentReports, userId, monthLabel) {
  const sent = new Set();
  for (const r of sentReports || []) {
    if (r.period !== "daily") continue;
    if (userId && r.userId && r.userId !== userId) continue;
    if (monthLabel && String(r.periodLabel || "").slice(0, 7) !== monthLabel) continue;
    const ids = Array.isArray(r.entryIds) ? r.entryIds : (r.entries || []).map((e) => e.id);
    ids.forEach((id) => sent.add(id));
  }
  const entries = (monthEntries || []).filter((e) => !sent.has(e.id));
  return { entries, alreadySent: (monthEntries || []).length - entries.length };
}

// Adds one send to a report's history. The first entry of an old report is
// reconstructed from its single sentAt so nothing is lost on the way over.
export function withSend(report, via, at = Date.now()) {
  const history = Array.isArray(report.sends)
    ? report.sends
    : report.sentAt ? [{ at: report.sentAt, via: "mail" }] : [];
  return { ...report, sends: [...history, { at, via }], sentAt: at };
}

// Whether the day's log no longer matches what the customer signed. The
// signed record stays untouched; this only tells the Polier an addendum is
// due. Compares what the Rapport carried: hours and the material lines.
export function rapportChanged(report, dayEntries) {
  if (!report || !Array.isArray(dayEntries)) return false;
  const norm = (d, q, u) => `${String(d || "").trim().toLowerCase()}|${String(q || "").trim()}|${String(u || "").trim().toLowerCase()}`;
  const signed = (report.lines || []).map((l) => norm(l.description, l.qty, l.unit)).sort();
  const now = dayEntries
    .filter((e) => e.type === "material" || e.type === "tool")
    .map((e) => norm(e.description, e.qty, e.unit))
    .sort();
  if (signed.length !== now.length || signed.some((v, i) => v !== now[i])) return true;
  const hoursNow = dayEntries.filter((e) => e.type === "time").reduce((s, e) => s + (parseFloat(e.qty || 0) || 0), 0);
  return Math.abs(hoursNow - (parseFloat(report.hours || 0) || 0)) > 0.01;
}
