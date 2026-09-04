// What the service worker does with a request, decided from the URL alone so
// it can be tested without a browser. The worker file inlines this module.
//
//   "shell"     the page itself: cached index.html first, refreshed in the
//               background (chunks are content-addressed, so a shell one
//               build old never mixes with new code: it names its own)
//   "immutable" our own static files under the scope: cache-first
//   "sdk"       the Firebase SDK from Google's CDN: cache-first
//   "network"   everything else -- Firestore, Auth, the Worker, the weather:
//               untouched, so the app's own offline handling sees the failure

export const SDK_ORIGIN = "https://www.gstatic.com";
export const SDK_PATH = "/firebasejs/";

export function routeFor({ url, mode, method }, scope) {
  if (method && method !== "GET") return "network";
  let u;
  try { u = new URL(url); } catch { return "network"; }
  const s = new URL(scope);
  if (u.origin === SDK_ORIGIN && u.pathname.startsWith(SDK_PATH)) return "sdk";
  if (u.origin !== s.origin || !u.pathname.startsWith(s.pathname)) return "network";
  const rel = u.pathname.slice(s.pathname.length);
  // Only the app's own page is the shell. Another page under the scope --
  // the privacy notice, say -- is a navigation of its own and must not be
  // answered with the app.
  if (rel === "" || rel === "index.html") return "shell";
  if (mode === "navigate") return "network";
  if (rel.startsWith("build/") || rel === "tailwind.css" || rel === "manifest.webmanifest" || rel.endsWith(".svg")) return "immutable";
  return "network";
}

// Never precache anything that talks to a server on our behalf.
export function precacheAllowed(url) {
  return !/googleapis\.com|workers\.dev|open-meteo\.com|firestore|identitytoolkit/.test(url);
}
