// What a person sees while a lazy chunk or a photo is on its way: a spinner
// with a word, never a blank area. `Loading` fills the space a tab leaves;
// `LoadingOverlay` dims the screen for the overlays (job hub, photo viewer,
// editor) so the tap is visibly taken before the chunk lands. Kept small on
// purpose: it is in the first paint (the ring is `.site-log-spinner` in
// tailwind.src.css).
import { COLORS } from "./theme.js";

export function Loading({ t = {}, overlay = false }) {
  const inner = (
    <>
      <span aria-hidden="true" className="site-log-spinner" />
      <span className="text-sm font-semibold">{t.loading || "Loading…"}</span>
    </>
  );
  return overlay ? (
    <div
      data-loading
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <div
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
        className="rounded-xl px-5 py-4 flex items-center gap-3 shadow-lg"
      >
        {inner}
      </div>
    </div>
  ) : (
    <div
      data-loading
      role="status"
      aria-live="polite"
      style={{ color: COLORS.muted }}
      className="flex flex-col items-center justify-center gap-3 py-16"
    >
      {inner}
    </div>
  );
}

export function LoadingOverlay({ t }) {
  return <Loading t={t} overlay />;
}
