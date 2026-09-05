# A deploy never strands an open app: every chunk cached, stale builds reload

**Status: implemented 2026-09-05** (owner's screenshot: E91 "Failed to
fetch dynamically imported module … chunk-MW6346ZB.js", version
0501d6bff8, after a day with seven deploys).

## What happened

Chunks are content-addressed and each deploy replaces `build/` on the
server. The service worker precached only the first paint, so a phone
holding an older shell fetched a lazy chunk (the Cockpit, the Material
tab) from the network after a newer deploy had removed it. The crash
capture from patch 1 made that visible as E91; before it, the tab simply
stayed empty.

## Design

1. `scripts/stamp.mjs` precaches **every** `build/*.js` chunk, so the
   worker that installed a build can serve that build whole, however many
   deploys follow; the update bar offers the newer build.
2. `errors-client.js` recognises a chunk-load failure; `entry.jsx` then
   reloads the page once (a `sessionStorage` mark per build stops a loop)
   and, if it happens again, shows **E92 STALE** with the reload advice
   instead of E91.
3. `docs/ERROR_CODES.md` gains E92.

## Definition of done

- Logic tests: the generated `sw.js` precaches every chunk in `build/`; a
  chunk-load message is classified as stale and calls `onStale`, not
  `show`.
