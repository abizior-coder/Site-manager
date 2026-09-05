// The language picker shown before anyone is signed in: a crew member's own
// choice, in a native select with an accessible name. The select is as tall
// as the inputs above it (a 44 px target), keeps the base focus ring (no
// `outline-none`) and opens a dark native list on the desktop.
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
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          color: COLORS.text,
          colorScheme: "dark",
        }}
        className="flex-1 min-w-0 rounded-lg px-2 py-3 text-sm"
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
