// The add-to-home-screen hint (docs/specs/2026-09-09_pwa-install.md): a
// small, dismissible banner on Heute, never a dialog, never between a
// visitor and "Tag starten" -- the day card that holds that button is
// always rendered above this one (roofing-site-manager.jsx's topCard /
// installHint slots).
import { Smartphone, X } from "lucide-react";
import { COLORS } from "./theme.js";

// platform is "ios" | "android" | null (nothing to show); onInstall is only
// ever called for "android", where a real captured beforeinstallprompt
// event exists to call .prompt() on -- iOS never gets a button that cannot
// do anything, only the instruction for the Share-sheet path.
export function InstallHint({ t, platform, onInstall, onDismiss }) {
  if (!platform) return null;
  return (
    <div
      data-install-hint
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
      className="rounded-xl p-3 flex items-start gap-2"
    >
      <Smartphone size={16} color={COLORS.accentText} className="shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 text-xs" style={{ color: COLORS.muted }}>
        {platform === "ios" ? t.installHintIos : t.installHintAndroid}
        {platform === "android" && (
          <button
            data-install-button
            onClick={onInstall}
            style={{ color: COLORS.accentText }}
            className="tap block mt-1.5 font-bold uppercase text-xs"
          >
            {t.installButtonLabel}
          </button>
        )}
      </div>
      <button
        data-install-hint-dismiss
        className="tap shrink-0"
        aria-label={t.a11yClose}
        title={t.a11yClose}
        onClick={onDismiss}
        style={{ color: COLORS.muted }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
