import { createRoot } from "react-dom/client";
import SiteManager from "./roofing-site-manager.jsx";
import { storage } from "./firebase-client.js";
import { loadLang } from "./i18n/index.js";
import { installCrashCapture } from "./errors-client.js";

// Uncaught errors: shown once, handed to the app as an event (the app knows
// the company and the sign-in and posts the nameless payload to the Worker).
// Crashes before the app listens wait in a short queue it drains on mount.
installCrashCapture({
  target: window,
  build: document.querySelector('meta[name="site-log-build"]')?.content || "",
  lang: () => document.documentElement.lang || "de",
  path: () => location.pathname,
  ua: navigator.userAgent,
  show: (p) => window.dispatchEvent(new CustomEvent("site-log:error", { detail: { code: p.code, detail: p.message } })),
  report: (p) => {
    const q = (window.__siteLogCrashes = window.__siteLogCrashes || []);
    q.push(p);
    if (q.length > 10) q.shift();
    window.dispatchEvent(new CustomEvent("site-log:crash", { detail: p }));
    return true;
  },
});

// The app calls window.storage throughout. Defining it here — from the bundle
// rather than from index.html — means a stale cached shell cannot leave the
// app wired to an old, unauthenticated storage layer.
window.storage = storage;

// German is the UI's first language and English the fallback for any key a
// translation lacks; both are in hand before the first paint. Other
// languages load when chosen.
await Promise.all([loadLang("en"), loadLang("de")]);
createRoot(document.getElementById("root")).render(<SiteManager />);

// The offline shell. Registered after the first paint so it never delays
// it; a failure leaves the app exactly as it was. When a new build takes
// over, the app is told and offers a restart -- never a silent reload.
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  const shellBuild = document.querySelector('meta[name="site-log-build"]')?.content || "";
  const announce = () => {
    if (window.__siteLogUpdateReady) return;
    window.__siteLogUpdateReady = true;
    window.dispatchEvent(new Event("site-log:update"));
  };
  // Ask the worker in charge which build it is. A page served from a shell
  // of build A while worker B is in charge is exactly the moment to offer a
  // restart -- and only then, so a first install stays silent.
  const compare = () => {
    const w = navigator.serviceWorker.controller;
    if (!w || !shellBuild) return;
    const ch = new MessageChannel();
    ch.port1.onmessage = (e) => { if (e.data && e.data.version && e.data.version !== shellBuild) announce(); };
    try { w.postMessage({ type: "version" }, [ch.port2]); } catch {}
  };
  navigator.serviceWorker.addEventListener("controllerchange", compare);
  navigator.serviceWorker.register("./sw.js").then(compare).catch((e) => console.warn("service worker:", e && e.message));
}
