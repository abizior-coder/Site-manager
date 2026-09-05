// A list with nothing in it says what would be here and how the first item
// gets in, instead of a bare line or an empty card. `name` marks the state
// for tests (`[data-empty="photos"]`).
import { COLORS } from "./theme.js";

export function EmptyState({ name, icon: Icon, title, hint, action, onAction, compact = false }) {
  return (
    <div
      data-empty={name}
      style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, color: COLORS.muted }}
      className={`rounded-xl text-center flex flex-col items-center gap-2 ${compact ? "px-4 py-4" : "px-4 py-6"}`}
    >
      {Icon && <Icon size={compact ? 18 : 24} color={COLORS.muted} aria-hidden="true" />}
      <div style={{ color: COLORS.text }} className="text-sm font-semibold">
        {title}
      </div>
      {hint && <div className="text-xs leading-relaxed max-w-xs">{hint}</div>}
      {action && onAction && (
        <button
          onClick={onAction}
          style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
          className="mt-1 px-4 py-2.5 rounded-lg text-xs font-bold uppercase"
        >
          {action}
        </button>
      )}
    </div>
  );
}
