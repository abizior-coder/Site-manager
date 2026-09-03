// The two GAV breaks of a site day as tappable chips.
import { Check, Coffee, Utensils } from "lucide-react";
import { BREAKS, breakTaken } from "../breaks.js";
import { COLORS } from "./theme.js";
import { todayKey } from "./format.js";

export function BreakChips({ entries, userId, onToggle, t }) {
  const today = todayKey();
  const mine = (entries || []).filter((e) => e.date === today && e.userId === userId);
  return (
    <div className="mt-3">
      <div style={{ color: COLORS.muted }} className="text-[10px] uppercase tracking-wide mb-1.5">{t.breaksTitle}</div>
      <div className="grid grid-cols-2 gap-2">
        {BREAKS.map((b) => {
          const on = breakTaken(mine, b.key);
          const Icon = b.key === "mittag" ? Utensils : Coffee;
          return (
            <button
              key={b.key}
              data-break={b.key}
              onClick={() => onToggle(b.key)}
              style={{
                background: on ? "#B48EAD22" : COLORS.cardAlt,
                border: `1px solid ${on ? "#B48EAD" : COLORS.border}`,
                color: on ? "#B48EAD" : COLORS.muted,
              }}
              className="py-2.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            >
              {on ? <Check size={14} /> : <Icon size={14} />}
              <span className="truncate">{t[`break_${b.key}`]} {b.start} · {b.minutes} min</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
