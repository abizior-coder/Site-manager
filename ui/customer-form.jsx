// The customer add/edit form (docs/specs/2026-09-09_customer-fields.md).
// Lazy for the same reason ReportSignModal/DayScanModal are: the full field
// set (anrede/uidChe/role/phoneMobile/phoneOffice/lang/objectAddress/
// billingAddress/preferredChannel/a repeating contactPersons[]/source, on
// top of the original five fields) pushed the eager first-paint bundle
// over its 350 KB budget. State (`customerForm`) and the handlers
// (`submitCustomer`, `deleteCustomer`) stay in roofing-site-manager.jsx —
// this file only draws them, passed in as props.
import { useRef } from "react";
import { X } from "lucide-react";
import { COLORS } from "./theme.js";
import { useDialog } from "./dialog.js";
import { uid } from "./format.js";
import { LANGS } from "../i18n/index.js";

// Duplicated rather than imported from roofing-site-manager.jsx's own
// Modal/Field -- pulling a monolith-only symbol across a lazy-chunk
// boundary that doesn't otherwise need it has already cost budget
// elsewhere (ui/trip-modal.jsx's own header comment, ui/day-scan-modal.jsx's).
function CustomerFormShell({ title, onClose, children, t = {} }) {
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

function Field({ label, children }) {
  return (
    <label className="block">
      <span style={{ color: COLORS.muted }} className="block text-xs mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

export function CustomerFormModal({
  t,
  customerForm,
  onChange,
  onClose,
  onSubmit,
  deleteAsk,
  onAskDelete,
  onCancelDelete,
  onDelete,
}) {
  return (
    <CustomerFormShell t={t} onClose={onClose} title={customerForm.id ? t.editCustomer : t.newCustomer}>
      <Field label={t.anredeLabel}>
        <select
          data-customer-anrede
          value={customerForm.anrede || ""}
          onChange={(e) => onChange((s) => ({ ...s, anrede: e.target.value }))}
          style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
          className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none"
        >
          <option value="">{t.anredeNone}</option>
          <option value="herr">{t.anredeHerr}</option>
          <option value="frau">{t.anredeFrau}</option>
          <option value="firma">{t.anredeFirma}</option>
        </select>
      </Field>
      {[
        ["name", t.customerNameLabel, "text"],
        ["company", t.companyLabel, "text"],
        ...(customerForm.company ? [["uidChe", t.uidCheLabel, "text"]] : []),
        ["role", t.customerRoleLabel, "text"],
        ["phoneMobile", t.phoneMobileLabel, "tel"],
        ["phoneOffice", t.phoneOfficeLabel, "tel"],
        ["email", t.emailLabel, "email"],
        ["objectAddress", t.objectAddressLabel, "text"],
        ["billingAddress", t.billingAddressLabel, "text"],
        ["source", t.sourceLabel, "text"],
      ].map(([field, label, type]) => (
        <Field key={field} label={label}>
          <input
            value={customerForm[field] || ""}
            onChange={(e) => onChange((s) => ({ ...s, [field]: e.target.value }))}
            type={type}
            style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none"
          />
        </Field>
      ))}
      <Field label={t.customerLangLabel}>
        <select
          data-customer-lang
          value={customerForm.lang || ""}
          onChange={(e) => onChange((s) => ({ ...s, lang: e.target.value }))}
          style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
          className="w-full rounded-lg px-3 py-2 text-sm mb-2 outline-none"
        >
          <option value="">{t.customerLangNone}</option>
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t.preferredChannelLabel}>
        <select
          data-customer-preferred-channel
          value={customerForm.preferredChannel || ""}
          onChange={(e) => onChange((s) => ({ ...s, preferredChannel: e.target.value }))}
          style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
          className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none"
        >
          <option value="">{t.preferredChannelNone}</option>
          <option value="call">{t.callLabel}</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">{t.emailLabel}</option>
          <option value="post">{t.channelPost}</option>
        </select>
      </Field>
      <div className="mb-3">
        <div style={{ color: COLORS.muted }} className="text-xs mb-1">
          {t.contactPersonsLabel}
        </div>
        {(customerForm.contactPersons || []).map((p) => (
          <div
            key={p.id}
            data-contact-person-row
            style={{ background: COLORS.cardAlt }}
            className="grid grid-cols-2 gap-2 rounded-lg p-2 mb-2"
          >
            {[
              ["name", t.customerNameLabel, "text"],
              ["role", t.customerRoleLabel, "text"],
              ["phoneMobile", t.phoneMobileLabel, "tel"],
              ["email", t.emailLabel, "email"],
            ].map(([field, label, type]) => (
              <Field key={field} label={label}>
                <input
                  value={p[field] || ""}
                  type={type}
                  onChange={(e) =>
                    onChange((s) => ({
                      ...s,
                      contactPersons: s.contactPersons.map((x) =>
                        x.id === p.id ? { ...x, [field]: e.target.value } : x,
                      ),
                    }))
                  }
                  style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
                  className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                />
              </Field>
            ))}
            <button
              data-contact-person-remove
              onClick={() => onChange((s) => ({ ...s, contactPersons: s.contactPersons.filter((x) => x.id !== p.id) }))}
              style={{ color: COLORS.dangerText }}
              className="col-span-2 tap text-xs font-bold uppercase"
            >
              {t.contactPersonRemove}
            </button>
          </div>
        ))}
        <button
          data-contact-person-add
          onClick={() =>
            onChange((s) => ({
              ...s,
              contactPersons: [
                ...(s.contactPersons || []),
                { id: uid(), name: "", role: "", phoneMobile: "", email: "" },
              ],
            }))
          }
          style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
          className="w-full py-2 rounded-lg text-xs font-bold uppercase"
        >
          {t.contactPersonAdd}
        </button>
      </div>
      <Field label={t.notesLabel}>
        <textarea
          value={customerForm.notes || ""}
          onChange={(e) => onChange((s) => ({ ...s, notes: e.target.value }))}
          rows={3}
          style={{ background: COLORS.shell, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
          className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none resize-none"
        />
      </Field>
      <button
        onClick={onSubmit}
        style={{ background: COLORS.accent }}
        className="w-full py-3 rounded-lg font-bold uppercase text-sm"
      >
        {t.saveLabel}
      </button>
      {customerForm.id &&
        (deleteAsk ? (
          <div data-customer-delete-confirm className="flex flex-wrap items-center justify-center gap-2 mt-2">
            <span style={{ color: COLORS.dangerText }} className="text-xs font-bold">
              {t.customerDeleteConfirm}
            </span>
            <button
              data-customer-delete-yes
              onClick={() => onDelete(customerForm.id)}
              style={{ background: COLORS.danger }}
              className="px-2.5 py-1.5 rounded text-xs font-bold uppercase"
            >
              {t.deleteLabel}
            </button>
            <button
              onClick={onCancelDelete}
              style={{ color: COLORS.muted }}
              className="tap px-2 py-1.5 text-xs font-bold uppercase"
            >
              {t.back}
            </button>
          </div>
        ) : (
          <button
            data-customer-delete
            onClick={onAskDelete}
            style={{ color: COLORS.dangerText }}
            className="w-full py-3 text-xs font-bold uppercase"
          >
            {t.deleteLabel}
          </button>
        ))}
    </CustomerFormShell>
  );
}
