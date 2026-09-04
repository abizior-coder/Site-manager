# Offline app shell (service worker)

**Status: implemented 2026-09-04** (owner's go the same morning). Verified in the Browser pane with the static server stopped: navigation, stylesheet, entry and every chunk served by the worker, sign-in and the app rendered, console clean; a language never fetched (Bulgarian) refused with the toast and the current language kept; a newer build offered a restart on the sign-in screen and in the app, never reloading by itself. The page learns of a newer build by asking the worker its version and comparing it with the build named in its own `<meta name="site-log-build">` (race-free, unlike `controllerchange` alone).

## Goal

A crew member on a roof with no signal opens Site Log and gets the app,
not a browser error page. Today the data layer already works offline
(Firestore keeps a local cache and queues writes), but the *shell* does
not: without a connection the phone cannot load `index.html`, the bundle or
a language file, so the offline cache is never reached. A service worker
closes that gap. It is the single biggest product gap named in the value
plan and the first thing a pilot firm will notice.

## Constraints

- GitHub Pages: static files only, scope `./`, no server logic.
- The build is already split into hashed chunks (`build/chunk-*.js`), and
  `index.html` carries `?v=` stamps for the entry and the stylesheet, so
  every file the shell needs is either immutable by name or versioned by
  query. The worker must never serve a stale `index.html` against new
  chunks: the shell is updated as one unit.
- The Firebase SDK is loaded at runtime from Google's CDN
  (`firebase-client.js`, dynamic `import(CDN + …)`); offline it must come
  from the cache too. Cross-origin module scripts with CORS are cacheable.
- The Worker (AI, files, metrics) and Open-Meteo are online-only; the
  worker must not cache them and must fail fast offline so the app's own
  fallbacks (toast, "offline" banner) show.
- No third-party library (no Workbox): one hand-written `sw.js`, readable
  end to end, generated at build time from the real file list.

## Design

- `scripts/stamp.mjs` (already run last in `npm run build`) also writes
  `sw.js` from a template: a **precache list** = `./`, `index.html`,
  `tailwind.css?v=…`, `build/bundle.js?v=…`, its static chunks, the EN and
  DE language chunks, `manifest.webmanifest`, the icons; and a **version
  string** = hash of that list. Every build changes the version → a new
  worker installs.
- Routing in the worker (pure function `routeFor(request)` in
  `sw-routes.js`, unit-tested without a browser):
  - navigation requests → cache `index.html` first, network to refresh in
    the background (stale-while-revalidate on the shell is safe because
    chunks are content-addressed);
  - `build/chunk-*.js` → cache-first, immutable (other languages, the job
    view, tabs: cached the first time they are used);
  - the Firebase SDK from `www.gstatic.com/firebasejs/` → cache-first;
  - everything else (Firestore/Auth endpoints, the Worker, Open-Meteo,
    images) → network only, untouched.
- Update flow: new worker → `skipWaiting` + `clients.claim`; the page
  listens for `controllerchange` and shows a toast
  "Neue Version geladen — neu starten" with a reload button. No silent
  reload while someone is typing a Rapport.
- Registration from `entry.jsx` after mount, only on `https:` or
  `localhost`; failure is logged and ignored (the app runs as before).
- Storage: the precache is ~470 KB; cached chunks and the SDK add ~1.5 MB
  at most. Old caches are deleted on activate by version prefix.

## Definition of done

- With the network disabled after one online visit, `index.html`, the
  app, German and English, the Today tab and a job open; a saved entry
  appears and syncs when the connection returns (Firestore's own queue).
- Switching to a language never loaded while offline shows the offline
  toast and keeps the current language; online it loads and is cached.
- A new deploy shows the "new version" toast on the next open, and a
  reload runs the new build; no mixed old-shell/new-chunk state.
- `npm run build` regenerates `sw.js`; CI's "bundle matches source" check
  covers it. A logic test asserts the precache list names every file the
  entry statically imports plus the stylesheet, and that no Worker or
  Google API URL is in it.
- Emulator walkthrough with the Browser pane: registration state, Cache
  Storage contents, and a reload with the network throttled to offline
  (Chrome DevTools protocol offline emulation if the pane exposes it;
  otherwise `fetch` interception is verified through the worker's cache).

## Out of scope

- Background sync of uploads to R2 (plans/photos chosen offline are not
  queued; the file picker says so). Later spec.
- Push notifications.
- iOS "Add to Home Screen" polish beyond what the manifest already does.
