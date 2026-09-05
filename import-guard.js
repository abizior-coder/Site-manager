// What a pasted code or a restored backup is allowed to put into the app.
//
// A share code or a backup file is JSON somebody else produced. Before this,
// whatever it held was spread straight into state and persisted: any key, any
// id -- including a photo id that happened to be a signature's. Now the shape
// is checked, the sizes are capped, the ids are fresh, and a photo is only a
// photo if it looks like one.

const STR = (v, max = 500) => (typeof v === "string" ? v.slice(0, max) : "");
const NUM = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

const ENTRY_TYPES = new Set(["time", "break", "material", "tool", "order", "photo", "pickup", "inspection", "note"]);
const MAX = {
  projects: 2000,
  entries: 50000,
  customers: 5000,
  documents: 5000,
  assignments: 20000,
  leave: 5000,
  reports: 5000,
  sentReports: 5000,
  photos: 3000,
};

// A photo is a data URL of an image and under the document limit. Anything
// else -- a script, a page, a link -- is not a photo and is dropped.
export function isPhotoDataUrl(v) {
  return (
    typeof v === "string" &&
    /^data:image\/(jpeg|jpg|png|webp|gif|heic|heif);base64,[A-Za-z0-9+/=]+$/.test(v) &&
    v.length <= 1000000
  );
}

function cleanEntry(e, makeId, photoMap, userId) {
  if (!isObj(e)) return null;
  const type = ENTRY_TYPES.has(e.type) ? e.type : "note";
  const out = {
    id: makeId(),
    type,
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(e.date || "")) ? e.date : new Date().toISOString().slice(0, 10),
    createdAt: NUM(e.createdAt) || Date.now(),
    userId: userId || null,
    projectId: STR(e.projectId, 100) || null,
    description: STR(e.description, 2000),
    qty: STR(e.qty, 20),
    unit: STR(e.unit, 20),
  };
  if (e.unitPrice != null && NUM(e.unitPrice) != null) out.unitPrice = e.unitPrice;
  if (e.regie === true) out.regie = true;
  if (typeof e.trade === "string") out.trade = STR(e.trade, 30);
  if (typeof e.supplier === "string") out.supplier = STR(e.supplier, 100);
  if (typeof e.artNo === "string") out.artNo = STR(e.artNo, 60);
  if (typeof e.breakKey === "string") out.breakKey = STR(e.breakKey, 20);
  if (typeof e.orderStatus === "string") out.orderStatus = STR(e.orderStatus, 20);
  if (typeof e.startTime === "string") out.startTime = STR(e.startTime, 5);
  if (typeof e.endTime === "string") out.endTime = STR(e.endTime, 5);
  // Photos come only through the remap: a pasted id is never adopted.
  if (photoMap && typeof e.photoId === "string" && photoMap.has(e.photoId)) out.photoId = photoMap.get(e.photoId);
  if (photoMap && typeof e.originalPhotoId === "string" && photoMap.has(e.originalPhotoId))
    out.originalPhotoId = photoMap.get(e.originalPhotoId);
  return out;
}

// A project from a share code: name, client, address, category, status and
// its entries. Nothing else travels.
export function sanitiseProjectCode(obj, { makeId, userId }) {
  if (!isObj(obj) || !STR(obj.name, 200)) return null;
  const entries = (Array.isArray(obj.entries) ? obj.entries : [])
    .slice(0, 5000)
    .map((e) => cleanEntry(e, makeId, null, userId))
    .filter(Boolean);
  return {
    id: makeId(),
    name: STR(obj.name, 200),
    client: STR(obj.client, 200),
    address: STR(obj.address, 300),
    category: STR(obj.category, 30) || "other",
    status: STR(obj.status, 30) || "waiting",
    createdAt: Date.now(),
    entries,
  };
}

function cleanRecord(r, makeId, keep) {
  if (!isObj(r)) return null;
  const out = { id: makeId() };
  for (const [k, max] of Object.entries(keep)) {
    if (!(k in r)) continue;
    const v = r[k];
    if (max === "num") {
      const n = NUM(v);
      if (n != null) out[k] = n;
    } else if (max === "bool") {
      out[k] = v === true;
    } else if (max === "obj") {
      if (isObj(v)) out[k] = v;
    } else if (max === "arr") {
      if (Array.isArray(v)) out[k] = v.slice(0, 500).filter(isObj);
    } else if (typeof v === "string") out[k] = v.slice(0, max);
    else if (v === null) out[k] = null;
  }
  return out;
}

// A full backup. Every collection is a capped array of cleaned records with
// fresh ids; photos are re-keyed, and every reference follows the new key.
export function sanitiseBackup(data, { makeId, userId }) {
  if (!isObj(data) || !Array.isArray(data.projects)) return null;
  const photoMap = new Map();
  const photos = {};
  if (isObj(data.photos)) {
    for (const [oldId, value] of Object.entries(data.photos).slice(0, MAX.photos)) {
      if (!isPhotoDataUrl(value)) continue;
      const id = makeId();
      photoMap.set(String(oldId), id);
      photos[id] = value;
    }
  }
  const projIdMap = new Map();
  const projects = data.projects
    .slice(0, MAX.projects)
    .map((p) => {
      const r = cleanRecord(p, makeId, {
        name: 200,
        client: 200,
        address: 300,
        category: 30,
        status: 30,
        customerId: 100,
        createdAt: "num",
        crew: "arr",
        quotedAmount: 40,
      });
      if (!r || !r.name) return null;
      if (isObj(p) && typeof p.id === "string") projIdMap.set(p.id, r.id);
      return r;
    })
    .filter(Boolean);
  const remapProject = (pid) => (typeof pid === "string" && projIdMap.get(pid)) || null;

  const entries = (Array.isArray(data.entries) ? data.entries : [])
    .slice(0, MAX.entries)
    .map((e) => {
      const c = cleanEntry(e, makeId, photoMap, userId);
      if (c) c.projectId = remapProject(e.projectId);
      return c;
    })
    .filter(Boolean);
  const customers = (Array.isArray(data.customers) ? data.customers : [])
    .slice(0, MAX.customers)
    .map((c) =>
      cleanRecord(c, makeId, {
        name: 200,
        company: 200,
        phone: 60,
        email: 200,
        address: 300,
        notes: 4000,
        contacts: "arr",
        followUp: 20,
        createdAt: "num",
      }),
    )
    .filter((c) => c && c.name);
  const documents = (Array.isArray(data.documents) ? data.documents : [])
    .slice(0, MAX.documents)
    .map((d) => {
      const r = cleanRecord(d, makeId, {
        type: 20,
        number: 40,
        date: 10,
        dueDate: 10,
        status: 20,
        notes: 4000,
        customerId: 100,
        projectId: 100,
        lineItems: "arr",
        vatRate: "num",
        paidAmount: "num",
        createdAt: "num",
      });
      if (r) r.projectId = remapProject(d && d.projectId);
      return r;
    })
    .filter(Boolean);
  const assignments = (Array.isArray(data.assignments) ? data.assignments : [])
    .slice(0, MAX.assignments)
    .map((a) => {
      const r = cleanRecord(a, makeId, { date: 10, userId: 100, projectId: 100, createdAt: "num" });
      if (r) r.projectId = remapProject(a && a.projectId);
      return r;
    })
    .filter((a) => a && a.projectId && a.date);
  const leaveRequests = (Array.isArray(data.leaveRequests) ? data.leaveRequests : [])
    .slice(0, MAX.leave)
    .map((l) => cleanRecord(l, makeId, { date: 10, userId: 100, type: 20, note: 1000, status: 20, createdAt: "num" }))
    .filter((l) => l && l.date);
  const siteReports = (Array.isArray(data.siteReports) ? data.siteReports : [])
    .slice(0, MAX.reports)
    .map((r) => {
      const c = cleanRecord(r, makeId, {
        projectId: 100,
        date: 10,
        userId: 100,
        hours: 20,
        lines: "arr",
        note: 4000,
        signerName: 200,
        signedAt: "num",
        createdAt: "num",
      });
      if (!c) return null;
      c.projectId = remapProject(r && r.projectId);
      // A signature only follows if it came along as a photo of its own.
      if (r && typeof r.signatureId === "string" && photoMap.has(r.signatureId))
        c.signatureId = photoMap.get(r.signatureId);
      return c;
    })
    .filter((r) => r && r.projectId);
  const sentReports = (Array.isArray(data.sentReports) ? data.sentReports : [])
    .slice(0, MAX.sentReports)
    .map((r) =>
      cleanRecord(r, makeId, {
        period: 10,
        periodLabel: 10,
        userId: 100,
        notes: 4000,
        hours: "num",
        materialsCount: "num",
        toolsCount: "num",
        sitesVisited: "arr",
        entries: "arr",
        entryIds: "arr",
        excludedIds: "arr",
        entryLabels: "obj",
        sends: "arr",
        sentAt: "num",
        editedAt: "num",
        createdAt: "num",
      }),
    )
    .filter(Boolean);

  return {
    projects,
    entries,
    customers,
    documents,
    assignments,
    leaveRequests,
    siteReports,
    sentReports,
    photos,
    profile: isObj(data.profile) ? data.profile : null,
    insurance: Array.isArray(data.insurance) ? data.insurance.slice(0, 50).filter(isObj) : null,
    certificates: Array.isArray(data.certificates) ? data.certificates.slice(0, 200).filter(isObj) : null,
    techLibrary: Array.isArray(data.techLibrary) ? data.techLibrary.slice(0, 2000).filter(isObj) : null,
    dropped: { photos: isObj(data.photos) ? Object.keys(data.photos).length - Object.keys(photos).length : 0 },
  };
}
