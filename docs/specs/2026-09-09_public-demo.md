# Public demo: try Site Log without a real firm

**Status: proposed 2026-09-09.** Requested by the owner. Feeds the "Demo"
CTA on `docs/specs/2026-09-09_landing-page.md`, which may still be
unwritten — this spec does not depend on it; `?demo=1` on the existing
`index.html` is a complete entry point on its own.

## Goal

A visitor tries the crew side of Site Log for five minutes — clock in,
log a material, attach a photo, send a Rapport — with **no real firm, no
founder involvement, and no possibility of touching a real company's
data**, however they got to the page and however carelessly they tap.
Reloading leaves nothing behind.

## Constraints

- PROJECT.md §1a: no live or seeded demo was to exist before the
  crew-language hypothesis is tested. This spec's page costs nothing
  until built and nothing is promoted by writing it — see the same note
  in the landing-page spec. Building it is covered here; announcing it
  is the owner's separate call.
- PROJECT.md §1b: nothing about trying the demo may need a manual step
  from the owner — it must work at 3 a.m. with nobody watching.
- PROJECT.md §3: no Firebase Blaze, no Cloud Functions, GitHub Pages
  static, no server of the demo's own. The demo cannot be "a second
  Firebase project" or "a Worker route" — either needs money, secrets or
  both. It runs entirely in the visitor's own browser.
- **No real customer names, photos or invoices anywhere in the demo
  data.** Every name, address and job in it is invented.
- Demo data is **canned and local**: a fixed, small, in-browser fixture,
  not the emulator seed (`scripts/seed-emulator.mjs`, which only exists
  for `localhost` and is never reachable from the public site) and not a
  real company in `site-log-ab6a9`.
- **Reload = clean demo.** No explicit reset control is needed if the
  design below is followed: nothing demo-related is written to
  `localStorage`, `sessionStorage` or IndexedDB, so a full page reload
  wipes it by the ordinary behaviour of a browser tab, for free.
- Out of scope: App Store / Play Store, a Capacitor/Cordova wrapper,
  billing, the private-server migration, report Phase 2.

## Design

### The isolation guarantee, and where it actually lives

The strongest, simplest guarantee is not "the demo's writes are blocked
by a rule" — it is **the real Firebase SDK is never imported while the
demo is active.** Every real Firestore/Auth call in the app, in both
`firebase-client.js` and `company-store.js`, is reachable only through
`initFirebase()` → `boot()` (`firebase-client.js`), which is the one
place that does `import("firebase/app")`, `import("firebase/firestore")`
and `import("firebase/auth")` — those three dynamic imports do not run
today until something calls `initFirebase()`. If `initFirebase()` checks
demo mode **before** calling `boot()` and, when active, resolves to a
lazily-imported demo module instead, the real SDK code is never fetched,
never parsed, and never executed for a demo session — not "its writes
fail", but "it was never there to write with." This is checkable
mechanically (see Tests) rather than only by review.

`getSdk()` and `currentUser()` (`firebase-client.js`) are the two
functions almost everything else — inside that file and inside
`company-store.js` — reads state through. Company-store's own many
functions (`ENTITY_COLLECTIONS`, `loadCollection`, `subscribeCollection`,
`syncCollection`, `getRole`, `isOwner`, `canManage`, …) do not each need
their own demo awareness: the ones the demo slice actually exercises are
overridden in `company-store.js` at the same seam
`docs/specs/2026-09-06_private-server-migration.md` already names —
"`company-store.js` and `firebase-client.js` become the only two files
that know the backend." Demo-awareness is new work in exactly those two
files and nowhere else; every call site in `roofing-site-manager.jsx`
keeps calling the same imported names it already does.

### File names

- **`demo-store.js`** (new, lazy — imported only when demo mode is
  active, never part of the first paint). Holds both the fixture data
  and the small function surface the demo slice needs, combined in one
  file since the demo has no reason to mirror the production split
  between "the SDK" and "the company layer" — that split exists so
  `company-store.js` can share one initialised Firebase app, which the
  demo has none of.
  - Fixture: one fictional firm, reusing the naming convention already
    established in `scripts/seed-emulator.mjs` and
    `test-stubs/company-store.js` rather than inventing new names to
    vet — "Dach AG", a Chef Muster / Hans Arbeiter pair, a project named
    "Steildach Lettenring" with a fictional address, a couple of
    material rows, no `supervisorEmail`/`supervisorPhone`/`webhookUrl`
    set (see "Send Rapport", below).
  - Functions: `getCompanyId`, `getRole`, `isOwner`, `canManage`,
    `currentUser`, an `initFirebase`-shaped no-op that resolves
    immediately, `loadCollection`/`subscribeCollection` returning the
    fixture arrays (a `subscribeCollection` that fires its callback once
    with the fixture and never again — no live updates to simulate),
    and a `persist`-reachable write path that mutates an in-memory
    object only — never `localStorage`, `sessionStorage` or IndexedDB.
  - Contains **no import** of `firebase-client.js`, `company-store.js`,
    or any `firebase/*` package — a fact a test asserts mechanically
    (below), not merely a design intention.
- **`firebase-client.js`** (existing, small addition): a pure
  `isDemoMode(search)` helper (`location.search.includes("demo=1")`,
  the same shape as the existing `useEmulator` check two lines above
  it), and `initFirebase()` branches on it before calling `boot()`.
- **`company-store.js`** (existing, small addition): the handful of
  functions the demo slice calls check the same flag and delegate to a
  lazily-imported `demo-store.js` instead of their real body. Every
  other exported function is untouched.
- **`roofing-site-manager.jsx`** (existing, the one deliberately small
  addition): a "Demo ausprobieren" link/button on the sign-in screen
  (`[data-demo-button]`, `href="?demo=1"` — or a click handler setting
  `location.search`), and, while demo mode is active, a small fixed
  banner ("Demo — keine echten Daten", not dismissible, always visible)
  so a visitor can never mistake it for a real account. This is the one
  place this spec accepts first-paint weight, sized like the whole-crew
  toggle added for the reporting spec (a few hundred bytes) — the
  implementation re-measures `node logic.test.mjs`'s first-paint figure
  against budget the same way every other change this project has.
  i18n key ×14 for the button label and the banner text.

### What five minutes looks like

Heute (clock-in already "on" from the fixture so the visitor sees a live
day immediately, or a single tap to start it — decide by trying both on
the emulator during implementation), add one material entry, attach a
photo (a bundled placeholder image shipped in the demo chunk, not a real
device photo capture — the visitor never grants a camera/file permission
to try the demo), then Rapport → Tag → "An Vorgesetzten senden". Because
the fixture leaves `supervisorEmail`/`supervisorPhone`/`webhookUrl`
unset, the app's existing logic already stops short of any real network
call there (no `mailto:`, no `wa.me`, no webhook `fetch`) and instead
opens the profile prompt the app already shows for that case — the demo
does not need new code to make sending safe, it needs the fixture to
simply not configure a destination. If that turns out to read as a dead
end rather than a satisfying finish, the smaller alternative allowed by
this spec's Must list — clock-in, one material, one photo — ships
without the send step; decide during implementation by checking whether
the "nothing happens" state reads as confusing on the emulator.

### Entry points

- `index.html?demo=1` directly — the landing page's "Demo" CTA (once
  that page exists) is a plain link here, no new code on that page's
  side beyond the link itself.
- The sign-in screen's new "Demo ausprobieren" link, for a visitor who
  reaches `index.html` without the landing page (a bookmark, a shared
  link, a search result).
- Once `?demo=1` is present, the app mounts straight into the demo
  fixture — no sign-in, no account, no company creation. Leaving the
  demo (a "Zurück zur Anmeldung" link, part of the banner) simply
  navigates to `index.html` with no query string.

## Definition of done

- `demo-store.js` exists, is never imported except behind the
  `isDemoMode()` gate, and contains no reference to `firebase-client.js`,
  `company-store.js`, or `firebase/app|firestore|auth`.
- `initFirebase()` never calls `boot()` when `isDemoMode()` is true.
- The five-minute slice (or the smaller Must-list slice, if sending
  proves confusing) works end to end on the emulator with `?demo=1` —
  no Firestore/Auth network activity at all, checkable by reading
  `read_network_requests` during the emulator check and confirming
  nothing goes to `127.0.0.1:8080` / `127.0.0.1:9099` or
  `*.firebaseio.com` / `*.googleapis.com`.
- A full reload of `index.html?demo=1` shows the fixture exactly as it
  started — no leftover state from the previous visit.
- `docs/CODE_MAP.md` gains a row for `demo-store.js` next to the other
  lazy modules, and notes the `isDemoMode()` seam on the
  `firebase-client.js`/`company-store.js` rows; `docs/DEVLOG.md` gets
  the implementation entry — both in the commit that adds the code, not
  part of this spec.

### Tests that will exist once this is implemented

- **Logic (`logic.test.mjs`)**
  - "demo writes go nowhere": reads `demo-store.js`'s source text and
    asserts it contains no `import` of `firebase-client.js`,
    `company-store.js`, or any `firebase/` package — the same
    mechanical-source-check pattern used for `willkommen.html`'s
    zero-coupling claim in the landing-page spec, applied to code
    instead of HTML.
  - `isDemoMode(search)` is a pure function: true for `?demo=1` and
    `?foo=1&demo=1`, false for no query string, `?demo=0`, or
    `?emulator=1` alone.
  - The demo fixture itself: every entry it seeds has a `userId` that
    resolves inside the fixture's own team list (no dangling
    references), and `supervisorEmail`/`supervisorPhone`/`webhookUrl`
    are confirmed unset, so the "send" step's safety is enforced by a
    test, not only by not typing a value into the fixture by hand.
- **Render (`render.test.mjs`)**: the sign-in screen shows the
  `[data-demo-button]` link with an accessible name; a render mounted
  with `?demo=1` (a new `renderAs` variant or a dedicated harness call)
  shows the demo banner and the fixture's project name, and never shows
  a real `loadFinance`/`loadReportProfile` call — the existing test
  stubs are not used for a demo-mode render, so this proves the demo
  path is genuinely separate code, not the same stubbed path the rest
  of the render suite already uses for unrelated reasons.
- **e2e smoke (later, `e2e/demo.spec.mjs`, Playwright, the existing
  `e2e/*.spec.mjs` pattern)**: navigates to `?demo=1` without touching
  the emulator flags, walks clock-in → material → photo → send, and
  asserts `read_network_requests`-equivalent (Playwright's own request
  log) shows no request to a Firebase or Firestore host for the whole
  walk. Not part of this spec's Definition of done — named here so the
  later implementation knows what "smoke" means without re-deriving it.

## Out of scope

- App Store / Play Store, Capacitor/Cordova.
- Billing, an Abo, Stripe, the private-server migration.
- Report Phase 2.
- The landing page itself (separate spec, may land first, second, or
  not at all before this).
- A guided tour, tooltips, or an interactive walkthrough beyond the
  fixture existing and being usable — the five minutes is the visitor
  exploring the real UI with fake data, not a scripted demo sequence.
