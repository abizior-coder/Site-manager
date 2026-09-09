// Add-to-home-screen detection, pure and small (docs/specs/2026-09-09_pwa-
// install.md) -- eager, like onboarding.js, not lazy: the hint has to be
// there on the very first screen a not-yet-installed visitor sees, so
// deferring the code that decides whether to show it saves nothing.
//
// Every function takes what it reads as a parameter rather than touching
// `navigator`/`matchMedia`/`localStorage` itself, so a test can supply
// either without stubbing real globals.

// iPadOS reports as a desktop Mac unless it also has touch points -- an
// iPad without that check would get the Android instructions instead of
// the Share-sheet ones, which do not exist on it either way but still
// mislead.
export function isIOS(userAgent) {
  const ua = String(userAgent || "");
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && typeof navigator !== "undefined" && (navigator.maxTouchPoints || 0) > 1;
}

// Already running as an installed app: nav.standalone is iOS Safari's own
// flag (matchMedia's display-mode query is unreliable on older iOS); the
// media-query match covers Android and desktop Chromium.
export function isStandalone(nav, mql) {
  return (nav && nav.standalone === true) || !!(mql && mql.matches);
}

const DISMISS_KEY = "site-log-install-hint";

// Per device, like the first-steps card's own dismissal
// (docs/specs/2026-09-05_self-service-onboarding.md) -- never reappears on
// this device once someone has said no, whatever they do afterwards.
export function installHintDismissed(storage) {
  try {
    return (storage || (typeof localStorage !== "undefined" ? localStorage : null))?.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissInstallHint(storage) {
  try {
    (storage || (typeof localStorage !== "undefined" ? localStorage : null))?.setItem(DISMISS_KEY, "1");
  } catch {}
}
