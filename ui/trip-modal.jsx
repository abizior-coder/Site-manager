// The trip modal, tappable and showing every field
// (docs/specs/2026-09-09_transport-detail-and-scan.md). Render only --
// state and handlers stay in roofing-site-manager.jsx (setTripField,
// saveTrip, scanTripSlip, canEditTrip); this file only draws them. Lazy on
// purpose: the full field set made the eager first-paint bundle miss its
// 350 KB budget outright, and unlike login-events.js's lesson
// (docs/DEVLOG.md, 2026-09-09) this feature is genuinely large enough that
// moving it out is a net win even after esbuild's usual lazy-chunk tax.
import { useRef } from "react";
import { Camera, X } from "lucide-react";
import { COLORS } from "./theme.js";
import { useDialog } from "./dialog.js";
import { tripHours } from "../roof-tiles.js";

const VEHICLES = ["lieferwagen", "pritsche", "anhaenger", "lkw_kran", "mulden_service", "pw"];
const LOAD_KINDS = ["material", "waste", "tools", "scaffold", "other"];
const MULDE_SIZES = ["", "3", "7", "10", "15", "20"];

// The same small modal shell roofing-site-manager.jsx's own Modal already
// is (focus trap, Escape, aria-modal) -- duplicated rather than imported
// across the lazy boundary, since importing a monolith-only symbol into a
// new lazy chunk is exactly the kind of cross-chunk edge that cost budget
// elsewhere (see the file header above).
function TripModalShell({ title, onClose, children, t = {} }) {
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

export function TripModal({
  t,
  tripModal,
  projects,
  wasteOpen,
  demoMode,
  onClose,
  onField,
  onSave,
  onScanFile,
  tripSlipFileRef,
}) {
  const hours = tripHours(tripModal.departTime, tripModal.arriveTime);
  const field = { background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text };
  const lbl = (s) => (
    <div style={{ color: COLORS.muted }} className="text-xs uppercase tracking-wide">
      {s}
    </div>
  );
  const ro = !!tripModal.readOnly;
  return (
    <TripModalShell t={t} onClose={onClose} title={tripModal.id ? t.tripEditTitle : t.tripAdd}>
      <div className="flex flex-col gap-2.5">
        {ro && (
          <div data-trip-readonly style={{ color: COLORS.muted }} className="text-xs">
            {t.tripReadOnly}
          </div>
        )}
        {lbl(t.tripProject)}
        <select
          aria-label={t.tripProject}
          data-trip-project
          value={tripModal.projectId || ""}
          onChange={(e) => onField("projectId", e.target.value)}
          disabled={ro}
          style={field}
          className="rounded-lg px-2 py-2 text-sm outline-none"
        >
          <option value="">—</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <div>
            {lbl(t.tripVehicle)}
            <select
              aria-label={t.tripVehicle}
              data-trip-vehicle
              value={tripModal.vehicle}
              onChange={(e) => onField("vehicle", e.target.value)}
              disabled={ro}
              style={field}
              className="w-full rounded-lg px-2 py-2 text-sm outline-none"
            >
              {VEHICLES.map((v) => (
                <option key={v} value={v}>
                  {t[`vehicle_${v}`]}
                </option>
              ))}
            </select>
          </div>
          <div>
            {lbl(t.tripDate)}
            <input
              aria-label={t.tripDate}
              type="date"
              value={tripModal.date}
              onChange={(e) => onField("date", e.target.value)}
              disabled={ro}
              style={field}
              className="w-full rounded-lg px-2 py-2 text-sm outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            {lbl(t.tripFrom)}
            <input
              aria-label={t.tripFromPh}
              data-trip-from
              value={tripModal.from}
              onChange={(e) => onField("from", e.target.value)}
              placeholder={t.tripFromPh}
              disabled={ro}
              style={field}
              className="w-full rounded-lg px-2 py-2 text-sm outline-none"
            />
          </div>
          <div>
            {lbl(t.tripTo)}
            <input
              aria-label={t.tripToPh}
              data-trip-to
              value={tripModal.to}
              onChange={(e) => onField("to", e.target.value)}
              placeholder={t.tripToPh}
              disabled={ro}
              style={field}
              className="w-full rounded-lg px-2 py-2 text-sm outline-none"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.text }}>
            <input
              data-trip-empty-run
              type="checkbox"
              aria-label={t.tripEmptyRun}
              checked={!!tripModal.emptyRun}
              onChange={(e) => onField("emptyRun", e.target.checked)}
              disabled={ro}
            />
            {t.tripEmptyRun}
          </label>
          <label className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.text }}>
            <input
              data-trip-return-to-yard
              type="checkbox"
              aria-label={t.tripReturnToYard}
              checked={!!tripModal.returnToYard}
              onChange={(e) => onField("returnToYard", e.target.checked)}
              disabled={ro}
            />
            {t.tripReturnToYard}
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            {lbl(t.tripDepart)}
            <input
              aria-label={t.tripDepart}
              data-trip-depart
              type="time"
              value={tripModal.departTime}
              onChange={(e) => onField("departTime", e.target.value)}
              disabled={ro}
              style={field}
              className="w-full rounded-lg px-2 py-2 text-sm outline-none"
            />
          </div>
          <div>
            {lbl(t.tripArrive)}
            <input
              aria-label={t.tripArrive}
              data-trip-arrive
              type="time"
              value={tripModal.arriveTime}
              onChange={(e) => onField("arriveTime", e.target.value)}
              disabled={ro}
              style={field}
              className="w-full rounded-lg px-2 py-2 text-sm outline-none"
            />
          </div>
          <div>
            {lbl(t.tripKm)}
            <input
              aria-label={t.tripKm}
              data-trip-km
              value={tripModal.km}
              onChange={(e) => onField("km", e.target.value)}
              inputMode="decimal"
              placeholder="0"
              disabled={ro}
              style={field}
              className="w-full rounded-lg px-2 py-2 text-sm outline-none"
            />
          </div>
        </div>
        {hours > 0 && (
          <div data-trip-hours style={{ color: COLORS.amber }} className="text-xs font-bold">
            {t.tripHours}: {hours} h
          </div>
        )}
        <div>
          {lbl(t.tripWaitMin)}
          <input
            aria-label={t.tripWaitMin}
            data-trip-wait
            value={tripModal.waitMin}
            onChange={(e) => onField("waitMin", e.target.value)}
            inputMode="decimal"
            placeholder="0"
            disabled={ro}
            style={field}
            className="w-full rounded-lg px-2 py-2 text-sm outline-none"
          />
        </div>
        {lbl(t.tripLoad)}
        <div className="flex flex-wrap gap-1.5">
          {LOAD_KINDS.map((k) => (
            <button
              key={k}
              data-trip-load={k}
              onClick={() => !ro && onField("loadKind", k)}
              disabled={ro}
              style={{
                background: tripModal.loadKind === k ? COLORS.accent : COLORS.card,
                border: `1px solid ${COLORS.border}`,
              }}
              className="px-2.5 py-1.5 rounded-full text-xs font-bold"
            >
              {t[`load_${k}`]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            {lbl(t.tripWeight)}
            <input
              aria-label={t.tripWeight}
              data-trip-weight
              value={tripModal.weightKg}
              onChange={(e) => onField("weightKg", e.target.value)}
              inputMode="decimal"
              placeholder="kg"
              disabled={ro}
              style={field}
              className="w-full rounded-lg px-2 py-2 text-sm outline-none"
            />
          </div>
          {tripModal.loadKind === "waste" && (
            <div>
              {lbl(t.tripMulde)}
              <select
                aria-label={t.tripMulde}
                data-trip-mulde
                value={tripModal.mulde}
                onChange={(e) => onField("mulde", e.target.value)}
                disabled={ro}
                style={field}
                className="w-full rounded-lg px-2 py-2 text-sm outline-none"
              >
                {MULDE_SIZES.map((m) => (
                  <option key={m} value={m}>
                    {m ? `${m} m³` : "—"}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {tripModal.loadKind === "waste" && wasteOpen > 0 && (
          <div data-trip-waste-hint style={{ color: COLORS.muted }} className="text-xs">
            {t.tripWasteOpen.replace("{kg}", String(wasteOpen))}
          </div>
        )}
        {tripModal.loadKind === "waste" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              {lbl(t.tripDisposal)}
              <input
                aria-label={t.tripDisposalPh}
                data-trip-disposal
                value={tripModal.disposalSite}
                onChange={(e) => onField("disposalSite", e.target.value)}
                placeholder={t.tripDisposalPh}
                disabled={ro}
                style={field}
                className="w-full rounded-lg px-2 py-2 text-sm outline-none"
              />
            </div>
            <div>
              {lbl(t.tripWasteCode)}
              <input
                aria-label={t.tripWasteCodePh}
                data-trip-waste-code
                value={tripModal.wasteCode}
                onChange={(e) => onField("wasteCode", e.target.value)}
                placeholder={t.tripWasteCodePh}
                disabled={ro}
                style={field}
                className="w-full rounded-lg px-2 py-2 text-sm outline-none"
              />
            </div>
          </div>
        )}
        <div>
          {lbl(t.tripSlipNo)}
          <div className="flex gap-2">
            <input
              aria-label={t.tripSlipNoPh}
              data-trip-slip-no
              value={tripModal.slipNo}
              onChange={(e) => onField("slipNo", e.target.value)}
              placeholder={t.tripSlipNoPh}
              disabled={ro}
              style={field}
              className="flex-1 rounded-lg px-2 py-2 text-sm outline-none"
            />
            {!ro && !demoMode && (
              <>
                <button
                  data-trip-scan
                  aria-label={t.a11yScan}
                  title={t.a11yScan}
                  onClick={() => tripSlipFileRef.current?.click()}
                  disabled={tripModal.scanLoading}
                  style={{
                    background: COLORS.cardAlt,
                    border: `1px solid ${COLORS.border}`,
                    opacity: tripModal.scanLoading ? 0.6 : 1,
                  }}
                  className="tap rounded-lg px-3 flex items-center justify-center shrink-0"
                >
                  <Camera size={16} color={COLORS.accentText} />
                </button>
                <input
                  ref={tripSlipFileRef}
                  type="file"
                  accept="image/*"
                  aria-label={t.a11yScan}
                  onChange={onScanFile}
                  className="hidden"
                />
              </>
            )}
          </div>
          {tripModal.scanLoading && (
            <div style={{ color: COLORS.muted }} className="text-xs mt-1">
              {t.tripScanning}
            </div>
          )}
          {tripModal.scanError && (
            <div style={{ color: COLORS.dangerText }} className="text-xs mt-1">
              {tripModal.scanError}
            </div>
          )}
          {tripModal.scanDetail && (
            <div style={{ color: COLORS.muted }} className="text-xs mt-1 break-all">
              {tripModal.scanDetail}
            </div>
          )}
        </div>
        <div>
          {lbl(t.tripHelper)}
          <input
            aria-label={t.tripHelperPh}
            data-trip-helper
            value={tripModal.helper}
            onChange={(e) => onField("helper", e.target.value)}
            placeholder={t.tripHelperPh}
            disabled={ro}
            style={field}
            className="w-full rounded-lg px-2 py-2 text-sm outline-none"
          />
        </div>
        {lbl(t.notesLabel)}
        <textarea
          aria-label={t.notesLabel}
          value={tripModal.notes}
          onChange={(e) => onField("notes", e.target.value)}
          rows={2}
          disabled={ro}
          style={field}
          className="rounded-lg px-2 py-2 text-sm outline-none resize-none"
        />
        {!ro && (
          <button
            data-trip-save
            onClick={onSave}
            style={{ background: COLORS.accent }}
            className="w-full py-3 rounded-lg font-bold uppercase text-sm"
          >
            {t.tripSave}
          </button>
        )}
      </div>
    </TripModalShell>
  );
}
