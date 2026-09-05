// Uncaught errors on a phone used to vanish. This captures them, shows the
// error panel once per distinct message per minute (a loop cannot flood the
// screen), and reports a small, nameless payload to the Worker. Everything
// is injected so it can be tested without a browser. It imports nothing:
// it sits in the entry chunk, ahead of the app, and must stay small.

const head = (s, n) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);

export function uaFamily(ua) {
  const s = String(ua || "");
  if (/iPhone|iPad|iPod/.test(s)) return "ios";
  if (/Android/.test(s)) return "android";
  if (/Windows/.test(s)) return "windows";
  if (/Macintosh/.test(s)) return "mac";
  if (/Linux/.test(s)) return "linux";
  return "other";
}

export function createCrashGate({ now = () => Date.now(), windowMs = 60000 } = {}) {
  const seen = new Map();
  return (key) => {
    const t = now();
    const last = seen.get(key);
    if (last != null && t - last < windowMs) return false;
    seen.set(key, t);
    return true;
  };
}

// What leaves the phone: build, code, tag, message head, stack head, path,
// language, device family. No account id, no site names, no photos.
export function crashPayload(err, { build, path, lang, ua } = {}) {
  const e = err instanceof Error ? err : new Error(typeof err === "string" ? err : (err && err.message) || String(err));
  // E91 CRASH in errors.js; the constant is repeated here so this file has no imports.
  return { build: head(build, 16), code: "E91", tag: "CRASH", message: head(e.message, 200), stack: head(e.stack, 400), path: head(path, 80), lang: head(lang, 5), ua: uaFamily(ua) };
}

// Browser noise that is not a crash of ours.
export const IGNORED = [/ResizeObserver loop/i, /^Script error\.?$/];

export function installCrashCapture({ target, report, show, build = "", lang = () => "", path = () => "", ua = "", gate = createCrashGate() }) {
  const handle = (err) => {
    try {
      const payload = crashPayload(err, { build, path: path(), lang: lang(), ua });
      if (!payload.message || IGNORED.some((re) => re.test(payload.message))) return null;
      if (!gate(payload.message)) return null;
      try { show(payload); } catch {}
      Promise.resolve().then(() => report(payload)).catch(() => {});
      return payload;
    } catch { return null; }
  };
  target.addEventListener("error", (e) => handle(e && (e.error || e.message)));
  target.addEventListener("unhandledrejection", (e) => handle(e && e.reason));
  return handle;
}
