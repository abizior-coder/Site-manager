// Plans and documents: the pure parts. What a file is, how big it may be,
// how its size reads on a phone. The Worker enforces the same limit on its
// side; this copy exists so a 40 MB plan is refused before it leaves the
// phone's data plan, with a message instead of a spinner.

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export const FILE_KINDS = ["plan", "offer", "contract", "delivery", "photo", "other"];

export function isImage(type) {
  return /^image\//i.test(type || "");
}

export function isPdf(type, name) {
  return /pdf$/i.test(type || "") || /\.pdf$/i.test(name || "");
}

// A guess at what was uploaded, from the name and the mime type. Only used to
// pre-select the kind chip; the person can always override it.
export function guessKind(name, type) {
  const n = String(name || "").toLowerCase();
  if (isImage(type)) return "photo";
  if (/\.(dwg|dxf|dwf|ifc|skp|rvt)$/.test(n) || /(plan|grundriss|schnitt|ansicht|dach)/.test(n)) return "plan";
  if (/(offerte|offer|angebot|devis|kostenvoranschlag)/.test(n)) return "offer";
  if (/(vertrag|contract|auftrag|werkvertrag)/.test(n)) return "contract";
  if (/(lieferschein|delivery|rechnung|invoice)/.test(n)) return "delivery";
  if (isPdf(type, n)) return "plan";
  return "other";
}

export function fmtSize(bytes) {
  const b = Number(bytes) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(b < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

// Sorted the way a Polier reads them: plans first, then the paperwork, newest
// first inside a kind. Links sit with their kind.
export function sortFiles(files) {
  const rank = Object.fromEntries(FILE_KINDS.map((k, i) => [k, i]));
  return (files || [])
    .slice()
    .sort(
      (a, b) =>
        (rank[a.kind] ?? 99) - (rank[b.kind] ?? 99) ||
        (b.createdAt || 0) - (a.createdAt || 0) ||
        String(a.name || "").localeCompare(String(b.name || "")),
    );
}

// An external link needs a scheme a browser will open and nothing that runs.
export function normaliseLink(url) {
  let u = String(url || "").trim();
  if (!u) return "";
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = "https://" + u;
  if (!/^https?:\/\//i.test(u)) return "";
  return u;
}
