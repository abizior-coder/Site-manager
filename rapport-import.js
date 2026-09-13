// Turns a transcribed weekly paper Rapport or a material/tool list (one row
// per {site, day, qty, unit, description, kind}) into a plan of projects to
// create and entries to write, against the projects that already exist.
// Pure — no Firebase here; see scripts/import-rapport.mjs for the script
// that writes the plan for real.
// docs/specs/2026-09-13_weekly-rapport-bulk-import.md
// docs/specs/2026-09-13_material-tool-bulk-import.md

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const KINDS = ["time", "material", "tool"];

/**
 * @param {Array<{date:string, project:string, description:string, kind?:string, qty?:number|string, unit?:string, hours?:number|string, address?:string}>} rows
 * @returns {Array<{date:string, project:string, description:string, kind:string, qty:number, unit:string, address:string|null}>}
 */
export function normaliseImportRows(rows) {
  if (!Array.isArray(rows)) throw new Error("rows must be an array");
  return rows.map((row, i) => {
    if (!row || typeof row !== "object") throw new Error(`row ${i}: not an object`);
    const date = String(row.date || "").trim();
    if (!DATE_RE.test(date)) throw new Error(`row ${i}: date must be YYYY-MM-DD, got ${JSON.stringify(row.date)}`);
    const project = String(row.project || "").trim();
    if (!project) throw new Error(`row ${i}: project is required`);
    const description = String(row.description || "").trim();
    if (!description) throw new Error(`row ${i}: description is required`);
    const kind = row.kind ? String(row.kind).trim() : "time";
    if (!KINDS.includes(kind))
      throw new Error(`row ${i}: kind must be one of ${KINDS.join("/")}, got ${JSON.stringify(row.kind)}`);
    // A time row's quantity was originally just "hours"; kept as the
    // legacy alias so an existing rows file with no kind/qty still works.
    const qtyRaw = row.qty != null ? row.qty : row.hours;
    const qty = typeof qtyRaw === "string" ? parseFloat(qtyRaw) : qtyRaw;
    if (typeof qty !== "number" || !isFinite(qty) || qty <= 0)
      throw new Error(`row ${i}: qty must be a positive number, got ${JSON.stringify(qtyRaw)}`);
    const unit = String(row.unit || (kind === "time" ? "h" : "")).trim();
    if (!unit) throw new Error(`row ${i}: unit is required for a ${kind} row`);
    const address = row.address ? String(row.address).trim() : null;
    return { date, project, description, kind, qty, unit, address };
  });
}

/**
 * Matches each row's project name against existing projects (case-insensitive,
 * exact, trimmed). Rows naming a project not found there are grouped into
 * `toCreate`, one entry per distinct name, using the first address given for
 * that name.
 * @param {ReturnType<typeof normaliseImportRows>} rows
 * @param {Array<{id:string, name:string}>} existingProjects
 */
export function matchProjects(rows, existingProjects) {
  const byName = new Map((existingProjects || []).map((p) => [String(p.name).trim().toLowerCase(), p]));
  const toCreate = new Map(); // lower name -> {name, address}
  const plan = rows.map((row) => {
    const key = row.project.toLowerCase();
    const existing = byName.get(key);
    if (existing) return { ...row, projectId: existing.id, projectName: existing.name };
    if (!toCreate.has(key)) toCreate.set(key, { name: row.project, address: row.address || null });
    else if (row.address && !toCreate.get(key).address) toCreate.get(key).address = row.address;
    return { ...row, projectId: null, projectName: row.project };
  });
  return { toCreate: [...toCreate.values()], plan };
}
