// AI day scan (docs/specs/2026-09-14_ai-day-scan.md): turns a photo and/or
// a typed or dictated description of a day's work into a validated plan of
// {hours, items, note} for the review step in ui/day-scan-modal.jsx. Pure --
// the Worker call and the review UI live there, not here.

const KINDS = ["material", "tool"];

/**
 * @param {string} text a free-text description, already trimmed by the caller
 * @returns {string} the prompt sent to callClaude alongside any photos
 */
export function buildDayScanPrompt(text) {
  const described = text && text.trim() ? `A spoken/typed description follows: "${text.trim()}".` : "";
  return [
    "You are helping a Swiss roofing crew log a day's work.",
    described,
    "Identify: (1) hours worked, only if a duration is explicitly stated or computable from given times -- otherwise null;",
    "(2) materials consumed (name, qty, unit); (3) tools/machines used (name, qty, unit -- hours if that's how usage was described, otherwise a count);",
    "(4) a short one-line summary of the work for a chat note.",
    'Respond ONLY with JSON, no markdown, no prose: {"hours": number|null, "items": [{"kind": "material"|"tool", "name": string, "qty": number, "unit": string}], "note": string|null}.',
    "Keep the list short and practical. Never invent a number that was not stated or shown.",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * @param {string} rawText callClaude's raw response text
 * @returns {{hours: number|null, items: Array<{kind:"material"|"tool", name:string, qty:number, unit:string}>, note: string|null}}
 */
export function parseDayScanResponse(rawText) {
  let parsed;
  try {
    parsed = JSON.parse(
      String(rawText || "")
        .replace(/```json|```/g, "")
        .trim(),
    );
  } catch {
    parsed = {};
  }
  if (!parsed || typeof parsed !== "object") parsed = {};

  const hours = typeof parsed.hours === "number" && isFinite(parsed.hours) && parsed.hours > 0 ? parsed.hours : null;

  const items = (Array.isArray(parsed.items) ? parsed.items : [])
    .map((it) => {
      if (!it || typeof it !== "object") return null;
      const kind = KINDS.includes(it.kind) ? it.kind : null;
      const name = typeof it.name === "string" ? it.name.trim() : "";
      const qty = typeof it.qty === "number" && isFinite(it.qty) && it.qty > 0 ? it.qty : null;
      const unit = typeof it.unit === "string" ? it.unit.trim() : "";
      if (!kind || !name || qty == null || !unit) return null;
      return { kind, name, qty, unit };
    })
    .filter(Boolean);

  const note = typeof parsed.note === "string" && parsed.note.trim() ? parsed.note.trim() : null;

  return { hours, items, note };
}
