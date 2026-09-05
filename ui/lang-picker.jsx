// The language picker shown before anyone is signed in: a crew member's own
// choice, in a native select with an accessible name.
import { Globe } from "lucide-react";
import { LANGS } from "../i18n/index.js";
import { COLORS } from "./theme.js";

export function AuthLangPicker({ lang, onChange, label }) {
  return (
    <label data-auth-lang-label className="flex items-center gap-2 mt-6 text-xs" style={{ color: COLORS.muted }}>
      <Globe size={14} aria-hidden="true" />
      <span>{label}</span>
      <select
        data-auth-lang
        aria-label={label}
        value={lang}
        onChange={(e) => onChange(e.target.value)}
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
        className="flex-1 rounded-lg px-2 py-2 text-sm outline-none"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
