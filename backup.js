// When the owner last exported, and whether that is long enough ago to say
// so. Pure; the Cockpit card and a test read it.
export const BACKUP_KEY = "site-backup-meta";
export const BACKUP_DAYS = 7;

export function backupDue(lastAt, now = Date.now(), days = BACKUP_DAYS) {
  const last = Number(lastAt) || 0;
  if (!last) return { due: true, never: true, daysAgo: null };
  const daysAgo = Math.floor((now - last) / 86400000);
  return { due: daysAgo >= days, never: false, daysAgo };
}

export function backupMeta(previous, now = Date.now(), by = null) {
  const p = previous && typeof previous === "object" ? previous : {};
  return { lastAt: now, lastBy: by, count: (Number(p.count) || 0) + 1 };
}
