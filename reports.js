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
  let breaks = 0;
  let transportHours = 0;
  for (const r of rows || []) {
    if (r.deleted) continue;
    if (r.type === "time") hours += parseFloat(r.qty || 0) || 0;
    else if (r.type === "break") breaks += parseFloat(r.qty || 0) || 0;
    // Trips are told apart from worked time: the office decides how travel is paid.
    else if (r.type === "transport") transportHours += parseFloat(r.hours || r.qty || 0) || 0;
    else if (r.type === "material") materialsCount++;
    else if (r.type === "tool") toolsCount++;
    if (r.projectId && !projIds.includes(r.projectId)) projIds.push(r.projectId);
  }
  // Net of breaks marked that day: what the supervisor is told is worked time.
  return { hours: Math.max(0, Math.round((hours - breaks) * 100) / 100), breaks: Math.round(breaks * 100) / 100, transportHours: Math.round(transportHours * 100) / 100, materialsCount, toolsCount, projIds };
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

// --- the day as the GAV sees it ----------------------------------------------

// Hours of one day split the way a Swiss payroll reads them: net working
// time up to the contract day is Normal, the rest Überstunden; travel
// (transport entries) is paid but kept apart; breaks are what was marked.
// No contract day set → everything is Normal and the target is null.
export function splitDayHours(dayEntries, contractDaily) {
  const list = dayEntries || [];
  const gross = list.filter((e) => e.type === "time").reduce((s, e) => s + (parseFloat(e.qty || 0) || 0), 0);
  const breaks = list.filter((e) => e.type === "break").reduce((s, e) => s + (parseFloat(e.qty || 0) || 0), 0);
  const travel = list.filter((e) => e.type === "transport").reduce((s, e) => s + (parseFloat(e.hours || e.qty || 0) || 0), 0);
  const net = Math.max(0, gross - breaks);
  const target = contractDaily > 0 ? contractDaily : null;
  const normal = target == null ? net : Math.min(net, target);
  const overtime = target == null ? 0 : Math.max(0, net - target);
  const r = (x) => Math.round(x * 100) / 100;
  return { normal: r(normal), overtime: r(overtime), travel: r(travel), breaks: r(breaks), net: r(net), target };
}

// Monday..Sunday of the week that holds `dateStr` (ISO yyyy-mm-dd).
export function weekOf(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setUTCDate(d.getUTCDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

// One row per day of the week for one person, plus totals against the
// weekly contract.
export function weekRows(entries, userId, weekDates, weeklyHours) {
  const contractDaily = weeklyHours > 0 ? weeklyHours / 5 : 0;
  const rows = weekDates.map((date) => {
    const mine = (entries || []).filter((e) => e.userId === userId && e.date === date);
    return { date, ...splitDayHours(mine, contractDaily) };
  });
  const sum = (k) => Math.round(rows.reduce((s, r) => s + r[k], 0) * 100) / 100;
  const total = { normal: sum("normal"), overtime: sum("overtime"), travel: sum("travel"), breaks: sum("breaks"), net: sum("net") };
  const target = weeklyHours > 0 ? weeklyHours : null;
  const diff = target == null ? null : Math.round((total.net - target) * 100) / 100;
  return { rows, total, target, diff };
}

// Semicolon CSV, the way Excel in a Swiss office opens it without asking.
export function weekCsv(week, personName, labels = {}) {
  const L = { date: "Datum", normal: "Normal", overtime: "Überstunden", travel: "Reisezeit", breaks: "Pausen", net: "Total", total: "Summe", target: "Soll", diff: "Differenz", ...labels };
  const f = (x) => (x == null ? "" : String(x).replace(".", ","));
  const lines = [[personName, "", "", "", "", ""].join(";"), [L.date, L.normal, L.overtime, L.travel, L.breaks, L.net].join(";")];
  for (const r of week.rows) lines.push([r.date, f(r.normal), f(r.overtime), f(r.travel), f(r.breaks), f(r.net)].join(";"));
  lines.push([L.total, f(week.total.normal), f(week.total.overtime), f(week.total.travel), f(week.total.breaks), f(week.total.net)].join(";"));
  if (week.target != null) lines.push([L.target, "", "", "", "", f(week.target)].join(";"), [L.diff, "", "", "", "", f(week.diff)].join(";"));
  return lines.join("\r\n") + "\r\n";
}
