// Files for the office and the Treuhänder: an invoice journal and its
// positions, hours per person for Lohn, customers in bexio's contact layout.
// Semicolon CSV, CRLF, numbers with a point and two decimals — what de-CH
// Excel and bexio read without asking. Headers are German on purpose:
// these are office documents; the buttons around them are translated.
import { splitDayHours } from "./reports.js";
import { documentState } from "./documents.js";

const r2 = (x) => Math.round((parseFloat(x) || 0) * 100) / 100;
export const num = (x) => (x == null || x === "" ? "" : r2(x).toFixed(2));

export function csvField(v) {
  const s = v == null ? "" : String(v);
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers, rows) {
  const lines = [headers.map(csvField).join(";")];
  for (const row of rows) lines.push(row.map(csvField).join(";"));
  return lines.join("\r\n") + "\r\n";
}

// "2026-08" → every day of it, ISO.
export function monthDays(month) {
  const [y, m] = String(month).split("-").map(Number);
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}

const isWeekday = (d) => {
  const wd = new Date(`${d}T00:00:00Z`).getUTCDay();
  return wd >= 1 && wd <= 5;
};

// Monday to Friday count; public holidays are not tracked, the office knows them.
export function workingDays(month) {
  return monthDays(month).filter(isWeekday).length;
}

export function previousMonth(today = new Date()) {
  const d = new Date(Date.UTC(today.getFullYear(), today.getMonth() - 1, 1));
  return d.toISOString().slice(0, 7);
}

const STATUS_DE = { open: "offen", partial: "teilbezahlt", paid: "bezahlt" };
const customerLabel = (customers, id) => {
  const c = (customers || []).find((x) => x.id === id) || {};
  return (c.company || c.name || "").trim();
};
const projectLabel = (projects, id) => ((projects || []).find((x) => x.id === id) || {}).name || "";

function monthInvoices(documents, month) {
  return (documents || [])
    .filter((d) => d.type === "invoice" && (d.status || "draft") !== "draft" && String(d.date || "").startsWith(month))
    .sort((a, b) => String(a.number || "").localeCompare(String(b.number || ""), undefined, { numeric: true }));
}

export const JOURNAL_HEADERS = [
  "Rechnungs-Nr",
  "Datum",
  "Fällig",
  "Kunde",
  "Baustelle",
  "Netto",
  "MWST %",
  "MWST",
  "Brutto",
  "Bezahlt",
  "Offen",
  "Status",
  "Aus Offerte",
];

// One row per invoice of the month; drafts and quotes stay out.
export function invoiceJournal(documents, customers, projects, month, today = `${month}-31`) {
  return monthInvoices(documents, month).map((d) => {
    const st = documentState(d, today);
    return [
      d.number || "",
      d.date || "",
      d.dueDate || "",
      customerLabel(customers, d.customerId),
      projectLabel(projects, d.projectId),
      num(st.totals.net),
      num(st.totals.rate),
      num(st.totals.vat),
      num(st.totals.gross),
      num(st.paid),
      num(st.outstanding),
      STATUS_DE[st.key] || st.key,
      d.fromQuote || "",
    ];
  });
}

export const POSITION_HEADERS = [
  "Rechnungs-Nr",
  "Datum",
  "Kunde",
  "Pos",
  "Beschreibung",
  "Menge",
  "Einheit",
  "Einzelpreis",
  "Betrag",
];

// One row per line item, the invoice number on every row.
export function invoicePositions(documents, customers, month) {
  const rows = [];
  for (const d of monthInvoices(documents, month)) {
    (d.lineItems || []).forEach((li, idx) => {
      const qty = parseFloat(li.qty || 0) || 0,
        price = parseFloat(li.unitPrice || 0) || 0;
      rows.push([
        d.number || "",
        d.date || "",
        customerLabel(customers, d.customerId),
        idx + 1,
        li.description || "",
        num(qty),
        li.unit || "",
        num(price),
        num(qty * price),
      ]);
    });
  }
  return rows;
}

export const PAYROLL_HEADERS = [
  "Mitarbeiter",
  "E-Mail",
  "Arbeitstage",
  "Normal",
  "Überstunden",
  "Reisezeit",
  "Pausen",
  "Netto",
  "Soll",
  "Differenz",
  "Ferien",
  "Krank",
  "Andere Absenzen",
];

const approvedLeave = (leaveRequests, uid, month) =>
  (leaveRequests || []).filter(
    (l) => l.userId === uid && l.status === "approved" && String(l.date || "").startsWith(month),
  );

// One row per member: the month's hours split the GAV way, the target as
// contract day × (working days − approved absences), the e-mail bexio
// Payroll matches on.
export function payrollRows(entries, members, month, weeklyHours, leaveRequests) {
  const contractDaily = weeklyHours > 0 ? weeklyHours / 5 : 0;
  const days = monthDays(month);
  return (members || []).map((m) => {
    const mine = (entries || []).filter((e) => e.userId === m.uid && String(e.date || "").startsWith(month));
    const perDay = days.map((d) =>
      splitDayHours(
        mine.filter((e) => e.date === d),
        contractDaily,
      ),
    );
    const sum = (k) => r2(perDay.reduce((s, x) => s + x[k], 0));
    const leave = approvedLeave(leaveRequests, m.uid, month);
    const count = (type) =>
      leave.filter((l) => (type ? l.type === type : !["vacation", "sick"].includes(l.type))).length;
    const absentWeekdays = leave.filter((l) => isWeekday(l.date)).length;
    const target = contractDaily > 0 ? r2(contractDaily * Math.max(0, workingDays(month) - absentWeekdays)) : null;
    const net = sum("net");
    return {
      uid: m.uid,
      name: m.name || m.email || m.uid,
      email: m.email || "",
      worked: perDay.filter((x) => x.net > 0).length,
      normal: sum("normal"),
      overtime: sum("overtime"),
      travel: sum("travel"),
      breaks: sum("breaks"),
      net,
      target,
      diff: target == null ? null : r2(net - target),
      vacation: count("vacation"),
      sick: count("sick"),
      other: count(null),
    };
  });
}

export function payrollCsv(rows) {
  return toCsv(
    PAYROLL_HEADERS,
    rows.map((r) => [
      r.name,
      r.email,
      r.worked,
      num(r.normal),
      num(r.overtime),
      num(r.travel),
      num(r.breaks),
      num(r.net),
      r.target == null ? "" : num(r.target),
      r.diff == null ? "" : num(r.diff),
      r.vacation,
      r.sick,
      r.other,
    ]),
  );
}

export const PAYROLL_DAY_HEADERS = [
  "Mitarbeiter",
  "E-Mail",
  "Datum",
  "Normal",
  "Überstunden",
  "Reisezeit",
  "Pausen",
  "Netto",
  "Baustellen",
];

// One row per person and day with hours, the sites of that day named.
export function payrollDays(entries, members, projects, month, weeklyHours) {
  const contractDaily = weeklyHours > 0 ? weeklyHours / 5 : 0;
  const rows = [];
  for (const m of members || []) {
    const mine = (entries || []).filter((e) => e.userId === m.uid && String(e.date || "").startsWith(month));
    for (const d of monthDays(month)) {
      const day = mine.filter((e) => e.date === d);
      const h = splitDayHours(day, contractDaily);
      if (h.net <= 0 && h.travel <= 0) continue;
      const sites = [...new Set(day.map((e) => projectLabel(projects, e.projectId)).filter(Boolean))].join(", ");
      rows.push([
        m.name || m.email || m.uid,
        m.email || "",
        d,
        num(h.normal),
        num(h.overtime),
        num(h.travel),
        num(h.breaks),
        num(h.net),
        sites,
      ]);
    }
  }
  return rows;
}

export const CONTACT_HEADERS = [
  "Kontaktart",
  "Name",
  "Vorname",
  "Adresse",
  "PLZ",
  "Ort",
  "Land",
  "Telefon",
  "E-Mail",
  "Kontaktperson 1 Nachname",
  "Kontaktperson 1 Vorname",
];

// "Dorfstrasse 5\n8903 Birmensdorf" or "Dorfstrasse 5, 8903 Birmensdorf":
// the Swiss four-digit PLZ line becomes PLZ + Ort, the rest is the street.
export function splitAddress(text) {
  const lines = String(text || "")
    .split(/\r?\n|,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  let postalCode = "",
    town = "";
  const idx = lines.findIndex((l) => /^(?:CH-)?\d{4}\s+\S/.test(l));
  if (idx >= 0) {
    const m = lines[idx].match(/^(?:CH-)?(\d{4})\s+(.+)$/);
    postalCode = m[1];
    town = m[2].trim();
    lines.splice(idx, 1);
  }
  return { street: lines.join(", "), postalCode, town };
}

// bexio's contact layout: Firma when a company is set (the person becomes
// Kontaktperson 1), otherwise Privat. The whole name goes into Name, bexio's
// mandatory field, and Vorname stays empty: Swiss offices write both
// "Teresa Sutter" and "Sutter Teresa", and a wrong split is worse than none.
export function contactRows(customers) {
  return (customers || []).map((c) => {
    const a = splitAddress(c.address);
    const person = String(c.name || "").trim();
    const firma = String(c.company || "").trim();
    if (firma)
      return ["Firma", firma, "", a.street, a.postalCode, a.town, "CH", c.phone || "", c.email || "", person, ""];
    return ["Privat", person, "", a.street, a.postalCode, a.town, "CH", c.phone || "", c.email || "", "", ""];
  });
}
