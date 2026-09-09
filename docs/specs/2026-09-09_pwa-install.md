# Add to home screen: a hint, not a wrapper

**Status: proposed 2026-09-09.** Requested by the owner.

## Goal

A crew member on an iPhone or an Android phone can add Site Log to their
home screen straight from the live GitHub Pages URL and open it like an
app afterwards — no App Store, no Play Store, no Capacitor/Cordova
wrapper, no build step beyond what already exists.

## Constraints

- PROJECT.md §1: the phone is the primary device; anything here that
  needs a mouse, a steady connection, or careful reading under a wet sky
  is broken by definition.
- PROJECT.md §3: GitHub Pages is static, no server, no secrets. This
  spec adds no backend of any kind — everything here is client-side
  detection and a piece of UI.
- PROJECT.md §1b: no manual step per customer — the hint must work for
  every firm without the owner configuring anything.
- Out of scope: a native wrapper (Capacitor/Cordova), push
  notifications, billing, the landing page, report Phase 2.
- No fabricated App Store / Play Store listing anywhere — this app is
  not published to either, and nothing here should read as if it is.

## What already works

Checked against the live files, not assumed:

- **`manifest.webmanifest`** is complete: `name`/`short_name`, a German
  `description`, `start_url: "./index.html"`, `scope: "./"`, `display:
  "standalone"`, `background_color`/`theme_color` both `#1B1B1A`, and
  five icon entries — `icon-192.png`, `icon-512.png`,
  `icon-maskable-512.png` (192/512 px PNGs, one of them marked
  `purpose: "maskable"`), plus `icon.svg`/`icon-maskable.svg`. All five
  files exist at the repo root.
- **`index.html`**'s `<head>` already links the manifest
  (`<link rel="manifest">`), an SVG favicon, an `apple-touch-icon`
  (`icon-180.png`, also present), a `<meta name="theme-color">` matching
  the manifest, and every iOS-specific tag Safari reads for a home-
  screen app: `apple-mobile-web-app-capable`,
  `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`
  — plus the newer, non-Apple-specific `mobile-web-app-capable` for
  Android/Chromium. None of this needs to be built; it needs to be
  found and used by an actual visitor, which is this spec's whole job.
- **The offline shell** (`docs/CODE_MAP.md`: `sw-routes.js` +
  `scripts/sw.template.js` → generated `sw.js`, stamped in by
  `scripts/stamp.mjs`): precaches the first paint, offers a restart bar
  on a new build, survives a dropped connection. Already exhaustively
  specced and tested (`docs/specs/2026-09-05_offline-app-shell.md`,
  `docs/CODE_MAP.md`'s own `sw-routes.js` row). Nothing here changes it.
- **display: standalone** and **theme color** are therefore already
  correct, not gaps — an install today already opens without browser
  chrome, in the app's own dark palette.

## The real gaps

- **No hint of any kind.** Nothing in the app currently tells a visitor
  they *can* add it to their home screen, on either platform. A manifest
  alone changes nothing a person notices.
- **iOS has no install prompt to catch.** Safari never fires a
  `beforeinstallprompt` event and exposes no scriptable "install" action
  — the only path is the visitor's own Share sheet → "Zum Home-
  Bildschirm". The gap is purely an in-app instruction for that manual
  path; there is nothing to automate.
- **Android's install prompt is never captured.** Checked directly:
  neither `entry.jsx` nor `roofing-site-manager.jsx` nor the service-
  worker files listen for `beforeinstallprompt` anywhere. Chrome may
  still show its own generic mini-infobar unprompted, but a page that
  captures the event and offers its own "Installieren" control gets a
  visitor who actually notices it, in the app's own language and
  moment, instead of a browser chrome element easy to miss or dismiss
  without reading.
- **No "already installed" detection.** Nothing checks
  `display-mode: standalone` (or iOS's `navigator.standalone`), so a
  hint has no way to know it should never appear once someone has
  already installed the app — today that check does not exist to be
  wrong, it simply is not there.
- **`start_url` and the public demo.** The manifest's `start_url` is
  fixed to `./index.html` — a real visit through `?demo=1`
  (`docs/specs/2026-09-09_public-demo.md`) does not change what an
  install would launch, because per the manifest spec a browser installs
  against the manifest's declared `start_url`, not the page's current
  URL. That is the correct behaviour without any change: installing
  while trying the demo produces a shortcut to the real app, not a
  permanent demo bookmark — worth confirming on an actual Android device
  during implementation (browser adherence to this part of the spec is
  not perfectly uniform), not assumed correct from the manifest text
  alone.
- **Maskable icon safe zone.** `icon-maskable-512.png` and
  `icon-maskable.svg` exist and are marked `purpose: "maskable"`, but
  whether the artwork actually sits inside the safe circle a maskable
  icon is cropped to has not been checked visually — a five-minute look
  at implementation time (or Chrome DevTools' own maskable-icon
  preview), not a rebuild.

## Design

### Detection (pure, testable)

A new small module, **`install.js`** (root, alongside `onboarding.js` —
this is the same kind of small, pure, first-paint-eager helper that
file already is, not a lazy feature):

- `isIOS(userAgent)` — `/iPhone|iPad|iPod/.test(userAgent)`, iPadOS's
  desktop-class UA (`Macintosh` + touch points) included since Safari
  on an iPad reports as a Mac otherwise.
- `isStandalone(nav, mql)` — `nav.standalone === true` (iOS's own flag)
  `|| (mql && mql.matches)` (`display-mode: standalone`, works on
  Android/desktop and current iOS). Takes its inputs as parameters
  rather than reading `navigator`/`matchMedia` itself, so a test can
  supply either without touching real globals.
- `installHintDismissed()` / `dismissInstallHint()` — `localStorage`,
  one key (`site-log-install-hint`), the same per-device dismissal
  pattern the first-steps card already uses
  (`docs/specs/2026-09-05_self-service-onboarding.md`).

### The banner

A new **`ui/install-hint.jsx`** component, the same kind of small,
focused file `ui/break-chips.jsx` or `ui/empty-state.jsx` already are —
not a lazy chunk: it has to be visible on the very first screen a
visitor who is not yet installed sees, so lazy-loading it would only
delay the one moment it needs to appear, for no budget benefit (nothing
is saved by deferring code that is needed immediately). Sized like the
other small first-paint additions this project has made (the whole-crew
toggle, the sign-in Demo control) and re-measured against
`node logic.test.mjs`'s first-paint figure at implementation time, the
same as every one of them was.

- Rendered on **Heute**, for every role — this is a crew tool most of
  all, and Heute is where a crew member already is every day. Placed so
  it never sits between a visitor and "Tag starten": a compact,
  dismissible banner, not a modal, not blocking any control underneath
  it, matching the accessibility bar the rest of the app already holds
  to (an accessible name, a real dismiss control with its own name,
  `text-xs` minimum, ≥ 24 px targets, focus never stolen since nothing
  here is a dialog).
- Shown only when **not already standalone** and **not previously
  dismissed** — both checked before render, so a visitor who has already
  installed, or who already said no once, sees nothing.
- **iOS**: a short instruction — the Share icon, then "Zum Home-
  Bildschirm" — since there is no button to press that does it for
  them. One line, one icon, a dismiss control.
- **Android/Chromium**: `window.addEventListener("beforeinstallprompt",
  ...)` in `entry.jsx` (the mount, per `docs/CODE_MAP.md`) — the event
  is captured and `preventDefault()`-ed once, stored, and handed to the
  banner as a prop; tapping "Installieren" calls the stored event's own
  `.prompt()`. If the event never fires (unsupported browser, criteria
  Chrome itself decides are unmet, already installed), the Android
  banner variant simply never appears — no dead button, nothing to
  explain.
- **Neither platform detected** (desktop, an unsupported mobile
  browser): no banner at all. This is a phone-first hint for the two
  platforms crews actually carry, not a generic "install this site"
  nag.

## Definition of done

- `install.js` exists with the three functions above, pure, no DOM
  globals read except through parameters.
- `ui/install-hint.jsx` exists, renders on Heute for every role, shows
  the iOS variant, the Android variant, or nothing, per the rules above.
- `entry.jsx` captures `beforeinstallprompt` once and makes it available
  to the app; nothing about the existing crash-capture or service-
  worker registration code changes.
- Dismissing the banner persists per device and it never reappears on
  that device afterwards, in either browser session or after a reload.
- The first-paint budget test (`node logic.test.mjs`) still passes after
  the addition; if it does not, the addition is trimmed until it does —
  this spec does not pre-approve a budget increase.
- `docs/CODE_MAP.md` gains rows for `install.js` and
  `ui/install-hint.jsx`; `docs/DEVLOG.md` gets the implementation entry
  — both in the commit that adds the code, not part of this spec.

### Tests that will exist once this is implemented

- **Logic (`logic.test.mjs`)**: `isIOS` true for an iPhone/iPad UA
  string, false for Android/desktop UAs; `isStandalone` true when either
  input says so, false when neither does; the dismiss functions round-
  trip through a stubbed `localStorage` the way other `localStorage`-
  backed pure checks in this suite already do.
- **Render (`render.test.mjs`)**: the hint appears on Heute for a
  role rendered as "not standalone, not dismissed" (an iOS UA and an
  Android UA case, since the two show different content); it does not
  appear when rendered as already standalone; it does not appear when
  rendered as already dismissed; the dismiss control has an accessible
  name and, once activated, the banner is gone and the dismissal
  persisted. This needs the render harness to accept the same kind of
  extra, testable parameter `renderAs(role, weeklyHours, signedOut)`
  gained for the Demo control's signed-out render
  (`docs/DEVLOG.md`'s 2026-09-09 "signed-out render harness" entry) —
  an install-context parameter (UA string, standalone flag, dismissed
  flag), not a new harness from scratch.
- **e2e, later**: not part of this spec's Definition of done. A
  `beforeinstallprompt` event is not something Playwright's real Chrome
  fires under normal automation, so an e2e test here would mean faking
  the event through `page.evaluate` — worth doing once the feature
  exists, not specified further here.
- **Explicitly not a test**: nothing that asserts an App Store or Play
  Store listing, a review count, or any fact about a store presence this
  app does not have and this spec does not create.

## Out of scope

- A native wrapper of any kind (Capacitor, Cordova, a WebView shell) —
  this spec is the alternative to that, not a step toward it.
- Push notifications (a home-screen PWA does not need them to be useful
  here, and they need a service worker capability and a permission
  prompt this spec does not touch).
- Billing, the landing page, report Phase 2.
- Re-checking or redesigning the manifest, the icons, or the offline
  shell — all three already work; this spec is only the missing hint
  that tells someone they can use them.
