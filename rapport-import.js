// Turns a transcribed weekly paper Rapport (one row per {site, day, hours,
// description}) into a plan of projects to create and entries to write,
// against the projects that already exist. Pure — no Firebase here; see
// scripts/import-rapport.mjs for the script that writes the plan for real.
// docs/specs/2026-09-13_weekly-rapport-bulk-import.md

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @param {Array<{date:string, project:string, description:string, hours:number|string, address?:string}>} rows
 * @returns {Array<{date:string, project:string, description:string, hours:number, address:string|null}>}
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
    const hours = typeof row.hours === "string" ? parseFloat(row.hours) : row.hours;
    if (typeof hours !== "number" || !isFinite(hours) || hours <= 0)
      throw new Error(`row ${i}: hours must be a positive number, got ${JSON.stringify(row.hours)}`);
    const address = row.address ? String(row.address).trim() : null;
    return { date, project, description, hours, address };
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
