// AI day scan (docs/specs/2026-09-14_ai-day-scan.md): a photo and/or a
// typed or dictated description of a day's work, turned into a reviewable
// mix of time/material/tool/note entries via the same Claude Worker proxy
// runScan/confirmScan already use. Lazy on purpose, same exception
// ReportSignModal already established in this file's sibling
// (docs/specs/2026-09-09_report-phase-2.md): the trigger button and the
// `dayScanModal` state stay in roofing-site-manager.jsx, but this component
// owns the Claude call and the save logic itself, because that logic living
// eagerly is exactly the kind of miss the budget has no room for.
import { useRef } from "react";
import { Camera, X, Loader2, Sparkles, Mic } from "lucide-react";
import { COLORS } from "./theme.js";
import { useDialog } from "./dialog.js";
import { uid } from "./format.js";
import { buildDayScanPrompt, parseDayScanResponse } from "../day-scan.js";

// Duplicated rather than imported from roofing-site-manager.jsx's own
// Modal or ui/trip-modal.jsx's TripModalShell -- pulling a symbol across a
// lazy-chunk boundary that doesn't otherwise need it has already cost
// budget elsewhere (ui/trip-modal.jsx's own header comment).
function DayScanShell({ title, onClose, children, t = {} }) {
  const ref = useDialog({ onClose });
  const titleId = useRef(`dlg-${Math.random().toString(36).slice(2, 8)}`);
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        tabIndex={-1}
        style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}` }}
        className="relative w-full max-w-md lg:max-w-xl rounded-t-2xl lg:rounded-2xl p-5 lg:p-6 max-h-[85vh] overflow-y-auto outline-none"
      >
        <div className="flex items-center justify-between mb-4">
          <div id={titleId.current} className="font-black text-lg uppercase">
            {title}
          </div>
          <button
            data-dialog-close
            onClick={onClose}
            aria-label={t.a11yClose || "Close"}
            title={t.a11yClose || "Close"}
            className="tap"
          >
            <X size={20} color={COLORS.muted} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function DayScanModal({
  t,
  state,
  onChange,
  onClose,
  callClaude,
  persist,
  entries,
  newEntry,
  fileToScaledImage,
  showToast,
  onVoiceNote,
  voiceActive,
}) {
  const fileRef = useRef(null);

  async function addImage(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const { b64, mediaType } = await fileToScaledImage(file);
      onChange({ ...state, images: [...state.images, { b64, mediaType }] });
    } catch {
      onChange({ ...state, error: t.scanErrorHint });
    }
  }

  function removeImage(i) {
    onChange({ ...state, images: state.images.filter((_, idx) => idx !== i) });
  }

  async function analyze() {
    onChange({ ...state, loading: true, error: null });
    try {
      const content = [
        ...state.images.map((img) => ({
          type: "image",
          source: { type: "base64", media_type: img.mediaType, data: img.b64 },
        })),
        { type: "text", text: buildDayScanPrompt(state.text) },
      ];
      const raw = await callClaude(content);
      const parsed = parseDayScanResponse(raw);
      onChange({
        ...state,
        loading: false,
        step: "review",
        hours: parsed.hours != null ? String(parsed.hours) : "",
        items: parsed.items.map((it) => ({ ...it, id: uid(), checked: true })),
        note: parsed.note || state.text.trim(),
      });
    } catch {
      onChange({ ...state, loading: false, error: t.scanErrorHint });
    }
  }

  function updateItem(id, patch) {
    onChange({ ...state, items: state.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  }

  function save() {
    const hoursNum = parseFloat(state.hours);
    const newOnes = [];
    if (state.hours && !isNaN(hoursNum) && hoursNum > 0) {
      newOnes.push(
        newEntry({
          type: "time",
          date: state.date,
          projectId: state.projectId,
          description: state.note.trim() || "",
          qty: String(hoursNum),
          unit: "h",
        }),
      );
    }
    for (const it of state.items) {
      if (!it.checked) continue;
      newOnes.push(
        newEntry({
          type: it.kind,
          date: state.date,
          projectId: state.projectId,
          description: it.name,
          qty: String(it.qty),
          unit: it.unit,
        }),
      );
    }
    if (state.note.trim()) {
      newOnes.push(
        newEntry({ type: "note", date: state.date, projectId: state.projectId, description: state.note.trim() }),
      );
    }
    if (!newOnes.length) return;
    persist({ entries: [...newOnes, ...entries] });
    showToast(t.dayScanSaved);
    onClose();
  }

  const canAnalyze = (state.text.trim() || state.images.length > 0) && !state.loading;
  const canSave = state.step === "review" && (state.hours || state.items.some((it) => it.checked) || state.note.trim());

  return (
    <DayScanShell t={t} title={t.dayScanTitle} onClose={onClose}>
      <div className="flex flex-col gap-3">
        {state.step === "capture" && (
          <>
            <div className="flex gap-2">
              <textarea
                data-day-scan-text
                value={state.text}
                onChange={(e) => onChange({ ...state, text: e.target.value })}
                placeholder={t.dayScanDescribePlaceholder}
                rows={4}
                style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none resize-none"
              />
              <button
                data-voice-note
                type="button"
                onClick={onVoiceNote}
                title={t.speakBtn}
                aria-label={t.a11yVoice}
                style={{
                  background: voiceActive ? COLORS.danger : COLORS.cardAlt,
                  border: `1px solid ${COLORS.border}`,
                }}
                className="tap rounded-lg px-3 flex items-center justify-center shrink-0"
              >
                <Mic size={16} color={voiceActive ? "#fff" : COLORS.muted} />
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {state.images.map((img, i) => (
                <div key={i} className="relative">
                  <img
                    src={`data:${img.mediaType};base64,${img.b64}`}
                    alt=""
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <button
                    data-day-scan-remove-image
                    onClick={() => removeImage(i)}
                    style={{ background: COLORS.danger }}
                    className="absolute -top-1 -right-1 rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <X size={12} color="#fff" />
                  </button>
                </div>
              ))}
              <button
                data-day-scan-add-photo
                onClick={() => fileRef.current?.click()}
                style={{ background: COLORS.cardAlt, border: `1px dashed ${COLORS.border}` }}
                className="w-16 h-16 rounded-lg flex flex-col items-center justify-center gap-1"
              >
                <Camera size={16} color={COLORS.muted} />
                <span style={{ color: COLORS.muted }} className="text-[10px]">
                  {t.dayScanAddPhoto}
                </span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={addImage} className="hidden" />
            {state.error && (
              <div style={{ color: COLORS.dangerText }} className="text-xs">
                {state.error}
              </div>
            )}
            <button
              data-day-scan-analyze
              onClick={analyze}
              disabled={!canAnalyze}
              style={{ background: COLORS.success, opacity: canAnalyze ? 1 : 0.5 }}
              className="w-full py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-center gap-2"
            >
              {state.loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {state.loading ? t.dayScanAnalyzing : t.dayScanAnalyze}
            </button>
            {!state.text.trim() && state.images.length === 0 && (
              <div style={{ color: COLORS.muted }} className="text-xs">
                {t.dayScanEmptyHint}
              </div>
            )}
          </>
        )}

        {state.step === "review" && (
          <>
            <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">
              {t.dayScanReviewHint}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span style={{ color: COLORS.muted }} className="w-20 shrink-0">
                {t.dayScanHours}
              </span>
              <input
                data-day-scan-hours
                type="number"
                min="0"
                step="0.25"
                value={state.hours}
                onChange={(e) => onChange({ ...state, hours: e.target.value })}
                style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                className="flex-1 rounded-lg px-3 py-2 outline-none"
              />
            </label>
            {state.items.length === 0 && (
              <div style={{ color: COLORS.muted }} className="text-xs">
                {t.dayScanNoItems}
              </div>
            )}
            {state.items.map((it) => (
              <div
                key={it.id}
                style={{ background: COLORS.cardAlt }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
              >
                <input
                  data-day-scan-item-check
                  type="checkbox"
                  checked={it.checked}
                  onChange={() => updateItem(it.id, { checked: !it.checked })}
                />
                <select
                  data-day-scan-item-kind
                  value={it.kind}
                  onChange={(e) => updateItem(it.id, { kind: e.target.value })}
                  style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}` }}
                  className="rounded px-1 py-1 text-xs"
                >
                  <option value="material">{t.dayScanKindMaterial}</option>
                  <option value="tool">{t.dayScanKindTool}</option>
                </select>
                <input
                  data-day-scan-item-name
                  value={it.name}
                  onChange={(e) => updateItem(it.id, { name: e.target.value })}
                  style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                  className="flex-1 min-w-0 rounded px-2 py-1 text-xs outline-none"
                />
                <input
                  data-day-scan-item-qty
                  type="number"
                  value={it.qty}
                  onChange={(e) => updateItem(it.id, { qty: parseFloat(e.target.value) || 0 })}
                  style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                  className="w-14 rounded px-1 py-1 text-xs outline-none"
                />
                <input
                  data-day-scan-item-unit
                  value={it.unit}
                  onChange={(e) => updateItem(it.id, { unit: e.target.value })}
                  style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                  className="w-12 rounded px-1 py-1 text-xs outline-none"
                />
              </div>
            ))}
            <label className="flex flex-col gap-1 text-sm">
              <span style={{ color: COLORS.muted }}>{t.dayScanNote}</span>
              <textarea
                data-day-scan-note
                value={state.note}
                onChange={(e) => onChange({ ...state, note: e.target.value })}
                rows={2}
                style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                className="rounded-lg px-3 py-2 text-sm outline-none resize-none"
              />
            </label>
            <button
              data-day-scan-save
              onClick={save}
              disabled={!canSave}
              style={{ background: COLORS.accent, opacity: canSave ? 1 : 0.5 }}
              className="w-full py-3 rounded-lg font-bold uppercase text-sm mt-2"
            >
              {t.dayScanSave}
            </button>
          </>
        )}
      </div>
    </DayScanShell>
  );
}
