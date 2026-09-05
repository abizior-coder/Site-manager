// --- service worker body; scripts/stamp.mjs prepends VERSION, PRECACHE and
// --- the routing function from sw-routes.js and writes the result to sw.js.
/* global VERSION, PRECACHE, routeFor */

const CACHE = "site-log-" + VERSION;
const PREFIX = "site-log-";
const SHELL = "index.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// The shell: what is cached, at once; the network's copy replaces it for
// the next open. A shell can only be one build old, and that build's chunks
// are still on the server by their hashed names.
async function shell(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(SHELL);
  const refresh = fetch(request).then((res) => {
    if (res && res.ok) cache.put(SHELL, res.clone());
    return res;
  }).catch(() => null);
  if (cached) { refresh.catch(() => {}); return cached; }
  const fresh = await refresh;
  return fresh || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && (res.ok || res.type === "opaque")) cache.put(request, res.clone());
  return res;
}

// The page asks which build serves it; a mismatch with its own shell means
// a newer build is live and a restart is worth offering.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "version" && event.ports && event.ports[0]) {
    event.ports[0].postMessage({ version: VERSION });
  }
});

self.addEventListener("fetch", (event) => {
  const route = routeFor({ url: event.request.url, mode: event.request.mode, method: event.request.method }, self.registration.scope);
  if (route === "network") return;
  if (route === "shell") { event.respondWith(shell(event.request)); return; }
  event.respondWith(cacheFirst(event.request));
});
