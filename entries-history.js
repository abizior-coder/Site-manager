// What happens to an entry between two saves: changes are stamped, changes
// to an entry a sent Rapport covers are recorded, an entry that left the
// visible list is marked deleted rather than dropped, and only an explicit
// purge removes a record. Pure, so the rules are tested without the app.

export const HISTORY_MAX = 20;
// Fields that are bookkeeping, not content: a change to these alone is not a change.
const META = new Set([
  "updatedAt",
  "updatedBy",
  "history",
  "deleted",
  "deletedAt",
  "deletedBy",
  "deleteReason",
  "restoredAt",
  "restoredBy",
]);

// The ids every sent Rapport names.
export function coveredEntryIds(sentReports) {
  const ids = new Set();
  for (const r of sentReports || []) {
    const list = Array.isArray(r.entryIds) ? r.entryIds : (r.entries || []).map((e) => e && e.id);
    for (const id of list) if (id) ids.add(id);
  }
  return ids;
}

// The content fields whose value differs, with the previous value.
export function changedFields(prev, next) {
  const before = {};
  const keys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);
  for (const k of keys) {
    if (META.has(k)) continue;
    const a = prev ? prev[k] : undefined,
      b = next ? next[k] : undefined;
    if (JSON.stringify(a) !== JSON.stringify(b)) before[k] = a === undefined ? null : a;
  }
  return before;
}

export function reconcileEntries(
  prevAll,
  nextVisible,
  { by = null, now = Date.now(), covered = new Set(), reason = "", purge = [] } = {},
) {
  const prevById = new Map((prevAll || []).map((e) => [e.id, e]));
  const nextIds = new Set((nextVisible || []).map((e) => e.id));
  const purged = new Set(purge || []);
  const out = [];
  for (const n of nextVisible || []) {
    const p = prevById.get(n.id);
    if (!p) {
      out.push(n);
      continue;
    }
    const before = changedFields(p, n);
    const restoring = !!p.deleted && !n.deleted;
    if (Object.keys(before).length === 0 && !restoring) {
      out.push(p);
      continue;
    }
    const stamped = { ...n, updatedAt: now, updatedBy: by };
    if (restoring) {
      stamped.deleted = false;
      stamped.restoredAt = now;
      stamped.restoredBy = by;
    }
    if (covered.has(n.id)) {
      stamped.history = [...(p.history || []), { at: now, by, reason: String(reason || ""), before }].slice(
        -HISTORY_MAX,
      );
    }
    out.push(stamped);
  }
  for (const p of prevAll || []) {
    if (nextIds.has(p.id)) continue;
    if (purged.has(p.id)) continue;
    if (p.deleted) {
      out.push(p);
      continue;
    }
    const gone = { ...p, deleted: true, deletedAt: now, deletedBy: by, deleteReason: String(reason || "") };
    if (covered.has(p.id))
      gone.history = [
        ...(p.history || []),
        { at: now, by, reason: String(reason || ""), before: { deleted: false } },
      ].slice(-HISTORY_MAX);
    out.push(gone);
  }
  return out;
}
