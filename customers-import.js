// A customer list from a file: bexio's contact export or any plain list.
// Loaded only when the owner picks a file, so it costs the first paint nothing.
import { detectDelimiter, splitRow } from "./price-list.js";
import { uid } from "./ui/format.js";

// Column names an office exports: German, English, French, Italian, and
// bexio's contact export (Kontaktart, Name, Vorname, Kontaktperson 1 …).
const HEADERS = {
  kind: ["kontaktart", "typ", "type", "art", "contact type"],
  name: ["name", "nachname", "kunde", "kundenname", "customer", "nom", "cognome", "last name", "lastname", "surname"],
  first: ["vorname", "first name", "firstname", "pr\u00e9nom", "prenom", "nome"],
  company: ["firma", "firmenname", "company", "unternehmen", "soci\u00e9t\u00e9", "societe", "azienda", "ditta"],
  phone: [
    "telefon",
    "phone",
    "tel",
    "tel.",
    "telefon fix",
    "telefon mobil",
    "mobile",
    "mobil",
    "natel",
    "t\u00e9l\u00e9phone",
    "telefono",
    "handy",
  ],
  email: ["e-mail", "email", "mail", "e-mail-adresse", "courriel"],
  street: ["adresse", "strasse", "stra\u00dfe", "street", "address", "rue", "via", "indirizzo"],
  zip: ["plz", "postleitzahl", "zip", "postal code", "npa", "cap", "code postal"],
  town: ["ort", "stadt", "city", "town", "lieu", "localit\u00e9", "citt\u00e0", "citta", "ville"],
  notes: ["bemerkung", "bemerkungen", "notiz", "notizen", "notes", "note", "remarque", "remarques"],
  cpLast: ["kontaktperson 1 nachname", "kontaktperson nachname", "ansprechpartner", "ansprechperson"],
  cpFirst: ["kontaktperson 1 vorname", "kontaktperson vorname"],
  cpEmail: ["kontaktperson 1 e-mail"],
  cpPhone: ["kontaktperson 1 telefon"],
};
const FIRMA = ["firma", "company", "soci\u00e9t\u00e9", "azienda", "ditta", "unternehmen"];

function headerField(h) {
  const k = String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  for (const [f, aliases] of Object.entries(HEADERS)) if (aliases.includes(k)) return f;
  return null;
}

// Rows of {name, company, phone, email, address, notes}; a line without a
// name and without a company is dropped. Line-based: a quoted field with a
// line break inside is not supported (bexio exports none).
export function parseCustomersCsv(text) {
  const lines = String(text || "")
    .replace(/^\ufeff/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim());
  const warnings = [];
  if (!lines.length) return { rows: [], warnings: ["empty"] };
  const delim = detectDelimiter(lines[0]);
  const cols = {};
  splitRow(lines[0], delim).forEach((h, i) => {
    const f = headerField(h);
    if (f) (cols[f] = cols[f] || []).push(i);
  });
  if (!cols.name && !cols.company && !cols.cpLast) return { rows: [], warnings: ["no-name-column"] };
  const rows = [];
  let dropped = 0;
  for (const line of lines.slice(1)) {
    const cells = splitRow(line, delim);
    const get = (f) => {
      for (const i of cols[f] || []) {
        const v = String(cells[i] || "").trim();
        if (v) return v;
      }
      return "";
    };
    const kind = get("kind").toLowerCase();
    const person = [get("first"), get("name")].filter(Boolean).join(" ");
    const contact = [get("cpFirst"), get("cpLast")].filter(Boolean).join(" ");
    let company = get("company");
    let name = person;
    if (FIRMA.includes(kind)) {
      company = company || get("name");
      name = contact;
    }
    if (!name) name = contact || company;
    if (!name) {
      dropped++;
      continue;
    }
    const address = [get("street"), [get("zip"), get("town")].filter(Boolean).join(" ")].filter(Boolean).join("\n");
    rows.push({
      name,
      company,
      phone: get("phone") || get("cpPhone"),
      email: get("email") || get("cpEmail"),
      address,
      notes: get("notes"),
    });
  }
  if (dropped) warnings.push(`${dropped} ohne Name`);
  return { rows, warnings };
}

const norm = (s) =>
  String(s || "")
    .trim()
    .toLowerCase();

// New customers appended; a row with a known e-mail, or a known name and
// company, is skipped rather than doubled.
export function mergeCustomers(existing, rows) {
  const byEmail = new Set((existing || []).map((c) => norm(c.email)).filter(Boolean));
  const byName = new Set((existing || []).map((c) => `${norm(c.name)}|${norm(c.company)}`));
  const added = [],
    skipped = [];
  for (const r of rows || []) {
    const e = norm(r.email),
      k = `${norm(r.name)}|${norm(r.company)}`;
    if ((e && byEmail.has(e)) || byName.has(k)) {
      skipped.push(r);
      continue;
    }
    if (e) byEmail.add(e);
    byName.add(k);
    added.push({
      id: uid(),
      name: r.name,
      company: r.company || "",
      phone: r.phone || "",
      email: r.email || "",
      address: r.address || "",
      notes: r.notes || "",
      contacts: [],
      createdAt: Date.now(),
    });
  }
  return { customers: [...(existing || []), ...added], added, skipped };
}
