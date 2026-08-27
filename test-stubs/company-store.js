// Stub for render tests: an owner inside a company with representative data,
// including the shapes that have caused crashes before — a project with a
// customerId but no client string, an entry with a photoId, an invoice, an
// assignment and a leave request.

export const ENTITY_COLLECTIONS = ["projects", "entries", "customers", "documents", "assignments", "leave", "reports", "sentReports"];

export const SAMPLE = {
  projects: [
    { id: "p1", name: "Trockenbau", customerId: "c1", client: "", address: "Lettenring 21", category: "other", status: "construction", quotedAmount: "1200" },
    { id: "p2", name: "Dach Kontrolle", client: "Alte Schreibweise", address: "", category: "pitched", status: "lead" },
    { id: "p3", name: "Fertig", client: "", address: "", category: "flat", status: "completed" },
  ],
  entries: [
    { id: "e1", type: "time", projectId: "p1", date: new Date().toISOString().slice(0, 10), qty: "7.5", unit: "h", description: "7h 30m", userId: "u1" },
    { id: "e2", type: "material", projectId: "p1", date: new Date().toISOString().slice(0, 10), qty: "8", unit: "m", description: "Siga Risan", unitPrice: "12.50", userId: "u1" },
    { id: "e3", type: "photo", projectId: "p1", date: new Date().toISOString().slice(0, 10), description: "Foto", photoId: "ph1", userId: "u1" },
    { id: "e4", type: "tool", projectId: "p1", date: new Date().toISOString().slice(0, 10), qty: "1", unit: "", description: "Leiter", userId: "u2" },
  ],
  customers: [
    { id: "c1", name: "Sutter Terresa", company: "", phone: "+41 79 000 00 00", email: "s@example.com", address: "Lettenring 21", notes: "",
      contacts: [{ id: "k1", kind: "call", note: "Rückruf vereinbart", followUp: "2020-01-01", at: Date.now() }] },
  ],
  documents: [
    { id: "d1", type: "invoice", projectId: "p1", customerId: "c1", number: "R-2026-001", date: "2026-08-01", dueDate: "2026-08-10",
      lineItems: [{ id: "li1", description: "Arbeit", qty: "7.5", unit: "h", unitPrice: "85" }], vatRate: 8.1, status: "open", notes: "" },
    { id: "d2", type: "quote", projectId: "p2", customerId: "c1", number: "O-2026-001", date: "2026-08-05",
      lineItems: [{ id: "li2", description: "Offerte", qty: "1", unit: "", unitPrice: "500" }], vatRate: 8.1, status: "sent", notes: "" },
  ],
  assignments: [
    { id: "a1", date: new Date().toISOString().slice(0, 10), projectId: "p1", userId: "u1" },
  ],
  reports: [
    { id: "r1", projectId: "p1", date: "2026-08-26", userId: "u2", hours: "7.5",
      lines: [{ description: "Siga Risan", qty: "8", unit: "m" }], note: "",
      signerName: "Frau Sutter", signatureId: "sig1", signedAt: Date.now(), createdAt: Date.now() },
  ],
  leave: [
    { id: "l1", date: "2026-08-27", userId: "u2", type: "vacation", note: "", status: "pending" },
  ],
};

let roleValue = "owner";
export function setStubRole(r) { roleValue = r; }
export function getCompanyId() { return "c1"; }
export function getRole() { return roleValue; }
export function isOwner() { return roleValue === "owner"; }
export function isSupervisor() { return roleValue === "supervisor"; }
export function canManage() { return roleValue === "owner" || roleValue === "supervisor"; }

export async function loadMembership() { return { companyId: "c1", role: roleValue, member: { role: roleValue } }; }
export async function createCompany() { return "c1"; }
export async function joinCompanyWithCode() { return { companyId: "c1", role: "crew" }; }
export async function listMembers() {
  return [
    { uid: "u1", role: "owner", name: "Chef", email: "owner@example.com" },
    { uid: "u2", role: "crew", name: "Mitarbeiter", email: "crew@example.com" },
  ];
}
export async function createInvite() { return "ABCD2345"; }
export async function listInvites() { return [{ code: "ABCD2345", expiresAt: Date.now() + 86400000 }]; }
export async function revokeInvite() {}

export function setBaseline() {}
export async function syncCollection() { return { written: 0, deleted: 0 }; }
export async function loadCollection(name) { return SAMPLE[name] || []; }

export function subscribeCollection(name, cb) {
  cb(SAMPLE[name] || [], { fromCache: false, pending: false });
  return () => {};
}

export const companyStorage = {
  async get(key) {
    if (key === "site-meta") {
      return { key, value: JSON.stringify({
        leaveRequests: [{ id: "l1", date: "2026-08-27", userId: "u2", type: "vacation", note: "", status: "pending" }],
        sentReports: [],
      }) };
    }
    return null;
  },
  async set() { return {}; },
  async delete() { return {}; },
  async list() { return { keys: [] }; },
};

export async function loadFinance() { return { companyName: "Dach AG", labourRate: "85", currency: "CHF", iban: "CH9300762011623852957", postalCode: "8000", town: "Zürich", paymentDays: "30" }; }
export async function saveFinance() {}
export async function migrateFromPersonal() { return {}; }
export async function personalDataSummary() { return { hasData: false }; }
export function resetCompanyState() {}
