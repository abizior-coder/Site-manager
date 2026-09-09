# Dev log — one entry per commit

The model-facing record: what changed, why, which files, what proves it.
Newest first. The pre-commit hook refuses a source change without a new
entry here; `docs/CODE_MAP.md` is updated in the same commit when a file
is added, moved or changes its job.

## 2026-09-09 — Transport: the full trip record, tappable, and a scanned slip

- **Why:** `docs/specs/2026-09-09_transport-detail-and-scan.md` — the job's
  trip row showed a four-value summary and nothing was tappable; six
  fields (empty run, return to yard, waiting minutes, Lieferschein/
  Waagschein number, helper, Abfallcode) had nowhere to live at all.
- **What:** `roofing-site-manager.jsx`'s `openTrip(projectId, entry)` now
  edits in place when `entry` is given (pre-fills every field, carries the
  entry's `id`/`userId`), the same shape `openInspection`'s own edit path
  already uses. `saveTrip()` gained an update branch — `userId`, `id` and
  `createdAt` are never rewritten. `canEditTrip(entry)` mirrors
  `canEditInspection` exactly (author or manager). `scanTripSlip` sends a
  photo of the paper slip through the existing Worker AI proxy
  (`callClaude`, `fileToScaledImage`) with a strict-JSON prompt covering
  `from`/`to`/`weightKg`/`slipNo`/`wasteCode`/`disposalSite`; a field the
  model could not read comes back `null` and is left alone — the proposal
  only ever fills the *already-open* form, there is no separate confirm
  step, and nothing is written until the person presses the form's own
  Save. `tabs/ProjectDetail.jsx`'s `[data-job-trip-row]` is now a
  `<button>` (delete stays a sibling button, not nested inside it —
  button-in-button is invalid HTML) calling the app's new `onEditTrip`
  prop. A viewer who is neither the trip's author nor a manager gets every
  field `disabled` and no Save button.
- **The scan and demo mode:** `callClaude()` fetches the Worker's
  `CLAUDE_PROXY_URL` directly, not through `getSdk()`, so the demo's
  structural Firestore isolation (`isDemoMode()`/`demo-store.js`) does not
  cover it on its own — `[data-trip-scan]` reads `isDemoMode()` itself and
  hides entirely (not disabled) whenever `?demo=1` is active, so a demo
  session can never reach the real Worker either.
- **Budget, the real story of this commit:** the full field set, built
  inline the way `inspectionModal`/`scanModal` already are, pushed the
  eager bundle to 355 KB against the 350 KB cap. Splitting the pure
  session-marker logic out (the `login-events.js` lesson, 2026-09-09) does
  not apply here — this is real UI weight, not a phantom esbuild-splitting
  tax. Fix: the trip modal moved to a genuinely lazy component,
  `ui/trip-modal.jsx` (`lazy(() => import(...))` + `Suspense`, exactly
  like every tab already is) — render only, every handler and every byte
  of state stays in `roofing-site-manager.jsx`. `LOAD_KINDS`/`MULDE_SIZES`
  moved with it (duplicated as tiny local consts, cheaper than a cross-
  chunk import); `VEHICLES` stays in the app file (still used by
  `openTrip`'s own defaults). Landed at 349.x KB.
- **Tests:** `logic.test.mjs` — a third argument to `tripHours` (e.g.
  `waitMin`) changes nothing, confirming it is never subtracted (1 check,
  358 total). `render.test.mjs` — a new opt-in `setStubExtraEntries`
  (`test-stubs/company-store.js`, a `renderAs` seventh parameter) keeps
  two fixture trips (`e5` owned by the harness's fixed `currentUser().uid`,
  `e6` owned by someone else) out of `SAMPLE.entries` itself, since every
  pre-existing Transport-tab test already assumes no trips exist there;
  polluting the shared fixture broke four of them on the first attempt,
  reverted before landing. Nine checks: the row is a button and tapping it
  opens the modal; every one of the eighteen fields (twelve original, six
  new) is present; the scan control shows for a real session and hides in
  demo mode; the trip's own author can edit it; saving does not append a
  row; a manager can edit someone else's trip; a non-author non-manager
  gets every field disabled and no Save button. A dialog-selection bug
  surfaced while writing these — `document.querySelector('[role="dialog"]')`
  picks the *first* (outer, the job sheet) of two nested dialogs, not the
  trip modal on top of it; fixed to `[...  .querySelectorAll(...)].pop()`,
  the same pattern the file's own `topDialog()` helper already uses
  elsewhere. 358/195/11/21/37 green (logic/render/order/dock/worker);
  first paint back under budget.
- **Verified live** on the emulator as chef (owner): saved a new trip with
  every new field filled (empty run checked, 20 min waiting, a slip
  number, a helper name) — no error; opened the job, the trip row showed
  and was tappable; the modal opened pre-filled with all of it, including
  the scan control (real session, not demo); edited the slip number and
  saved — the job still showed exactly one trip row, and reopening it
  read back the edited value, confirming the same entry was updated, not
  duplicated. The scan call itself (a real slip photo through the Worker)
  was not exercised — same as every other AI scan feature, PROJECT.md §5
  already names this untried pending a real photo and API credit.
- **Not started:** nothing from this spec's Definition of done was
  skipped except exercising the live AI scan call itself (see above) —
  storing the slip photo as evidence, a reference list for Abfallcode or
  helpers, and any rules change were all explicitly out of scope per the
  spec and remain so.

## 2026-09-09 — Login audit: who signed in, when, from which role

- **Why:** `docs/specs/2026-09-09_login-audit.md` — the owner asked for a
  plain access log: who signed in, when, in which role, visible only to
  them.
- **What:** `login-events.js` (new, lazy — reached only through
  `import("./login-events.js")`, never a static import): `recordLogin`/
  `listLoginEvents` (Firestore `companies/{cid}/loginEvents`), `idsToPrune`
  (pure, bounded retention at 200 rows, pruned inside `listLoginEvents`
  since only the owner's own session can delete), `claimLoginSlot` (pure,
  once per authenticated session via a `sessionStorage` marker, the same
  shape `entry.jsx`'s stale-chunk reload-once guard already uses),
  `recordThisSession` (the mount effect's single entry point).
  `roofing-site-manager.jsx`'s membership-resolved mount effect calls it
  once per session with a name/role **snapshot** (not a live join, so a row
  still reads correctly after a promotion, a rename, or the person
  leaving); `loadLoginEvents()` (also there, one more `import()` of the
  same file, matching the two-call-site shape `report-document.js` already
  has) is passed down to `tabs/CockpitTab.jsx`'s new `LoginsCard`
  (`[data-logins-card]`), owner-only, newest first, `EmptyState` when
  empty, no filter or pagination. `firestore.rules` gains a `loginEvents`
  match: read owner-only (narrower than `canManage()` — the ask was
  specifically the owner), create self-only (unlike `entries`/`leave`/
  `reports`, no manager-files-for-someone-else escape hatch, since the
  point is that a row reflects who actually authenticated), no update
  ever, delete owner-only (the retention prune). Account deletion
  (`docs/specs/2026-09-05_account-deletion-backup.md`) is untouched by
  design — a login row is a firm record like an entry, not a personal
  preference, and already reads fine with no member document behind it.
- **Budget note, for whoever touches this next:** this file went eager
  first (small CRUD-shaped functions, matching `loadReportProfile`'s own
  style in `company-store.js`) and that cost ~900 B, blowing the 350 KB
  budget outright. Going lazy as one single new dynamic-import target
  *also* initially cost more than expected — not from this feature's own
  code, but because adding any new `import()` root changed how esbuild's
  splitting factors out unrelated shared modules (`ui/format.js` among
  them) elsewhere in the graph, independent of how much code sat behind
  it. Trimmed the actual logic (`idsToPrune`/`claimLoginSlot` replaced a
  more verbose `oldestToPrune`/`loginAlreadyRecorded`+`markLoginRecorded`
  pair; the prune reuses `listLoginEvents`'s own already-fetched rows
  instead of a second query from `recordLogin`) until lazy-with-everything-
  in-one-file landed under budget by about 20 bytes. If this feature grows,
  re-measure before assuming either direction is free.
- **Tests:** `rules.test.mjs` (emulator) — crew creates its own row, cannot
  create one naming someone else, owner reads the list, crew's `get` and
  `list` are both refused, no one may update a row, the owner may delete
  one (the prune), crew may not (8 checks). `logic.test.mjs` — `idsToPrune`
  below/at/past the cap, a non-array input; `claimLoginSlot` claims once
  and never twice for the same uid, a different uid claims independently
  (6 checks). `render.test.mjs` — the owner's Cockpit shows the card with
  every stub row, newest first; a supervisor's Cockpit (reachable, since
  supervisors can manage) does not show it; crew never even reaches a
  Cockpit tab that could; an explicit empty row set renders `EmptyState`,
  not a blank card (the harness's `renderAs` gained a fifth parameter,
  `loginEvents`, pre-claiming the session slot so the mount effect's own
  real recording does not splice an extra row into a test that asked for
  none) (6 checks). 357/184/11/21/37 green (logic/render/order/dock/
  worker), rules 132/132 (8 of them new); first paint 349.98 KB — 20 bytes
  of headroom left, see the budget note above.
- **Verified live** on the emulator: signed in as chef (owner), Hans
  Arbeiter (crew) in turn — each sign-in produced exactly one Firestore
  row with the right name/role/timestamp; the owner's Cockpit showed both,
  newest first; crew has no Cockpit tab at all to reach the card from;
  reloading the same signed-in tab added no further rows (the session
  marker held); no console or React errors either way.
- **Not started:** `docs/legal/`'s Verzeichnis der Bearbeitungstätigkeiten
  (should gain `loginEvents`, per the spec's own note — a follow-up, not
  part of this implementation's scope), e2e coverage — neither is part of
  this spec's Definition of done.

## 2026-09-09 — Add to home screen: the install hint and beforeinstallprompt capture

- **Why:** `docs/specs/2026-09-09_pwa-install.md` — the manifest, icons and
  offline shell already make an install correct once it happens, but
  nothing in the app told a visitor they could, and Android's own install
  event was never even listened for. Implementing only the hint and the
  capture, per that spec's Definition of done — no manifest, icon, or
  service-worker change (none was needed; none was made).
- **What:** `install.js` (new, eager, alongside `onboarding.js`): `isIOS`,
  `isStandalone`, `installHintDismissed`/`dismissInstallHint` — pure,
  reading UA/`matchMedia`/`localStorage` only through parameters (except
  the dismissal pair's own default to real `localStorage`). `ui/install-
  hint.jsx` (new): `InstallHint`, a compact `[data-install-hint]` banner
  on Heute — iOS gets the Share-sheet instruction only, Android also gets
  `[data-install-button]` calling the captured event's own `.prompt()`,
  either way a `[data-install-hint-dismiss]` with an accessible name.
  `entry.jsx` gains one `beforeinstallprompt` listener (`preventDefault`,
  stores the event on `window.__siteLogInstallPrompt`, dispatches
  `site-log:install-available` — the same shape `site-log:update` already
  uses). `roofing-site-manager.jsx` computes `alreadyStandalone`/
  `installPlatform` next to the existing `firstStepsCard` logic and wires
  `installHintCard` into `TodayTab`'s new `installHint` slot, rendered
  right after `topCard`. Never shown once standalone or once dismissed on
  that device; neither platform detected (desktop, an unsupported mobile
  browser) means no banner, not a generic nag.
- **Tests:** `logic.test.mjs` — `isIOS` true for iPhone/iPad/iPod UAs,
  false for Android/desktop; `isStandalone` true from either input, false
  from neither; the dismiss pair round-trips through a stubbed storage
  (4 checks). `render.test.mjs`'s harness gains a fourth `renderAs`
  parameter, `install` (`{ua, standalone, dismissed, androidPrompt}`),
  layered onto the existing `matchMedia` stub and a UA override — 9 new
  checks: the hint appears for an iOS UA and for an Android UA with a
  captured prompt (different content each time, no button on iOS), stays
  hidden once standalone and once dismissed, the dismiss control has an
  accessible name, and dismissing it both removes the banner and persists
  to `localStorage` immediately. Verified live on the emulator as
  crew1 (mobile viewport, real Android UA): with no captured event the
  banner correctly shows nothing; dispatching a stand-in
  `beforeinstallprompt` shows the Android variant, its button calls
  `.prompt()` and dismisses; overriding the UA to an iPhone string shows
  the Share-sheet variant instead; dismissing either persists across a
  reload; no console or React errors either way. 351/178/11/21/37 green
  (logic/render/order/dock/worker); first paint unchanged at 349 KB.
- **Not started:** e2e coverage for this (the spec calls it out as later,
  since Playwright's real Chrome does not fire `beforeinstallprompt`
  under automation), the maskable-icon safe-zone visual check, verifying
  `start_url` on a real Android device through `?demo=1` — all named as
  open items in the spec, none of them part of this commit's Definition
  of done.

## 2026-09-09 — A signed-out render harness, for the Demo control

- **Why:** the previous commit covered `[data-demo-button]` only by e2e,
  because `render.test.mjs` had no way to reach the sign-in screen at
  all — `docs/CODE_MAP.md` said so outright ("no signed-out harness (use
  e2e)"), and the test stub's `onAuthChange` fired `cb(null)` then
  `cb(user)` back to back, so the app was always past the sign-in screen
  before a test's first assertion ran. Asked again for render coverage
  specifically, so this turn builds that harness rather than repeating
  the e2e-only answer.
- **What:** `test-stubs/firebase-client.js` gains `setStubSignedOut(v)`
  (the same small-toggle pattern `setStubRole`/`setStubWeeklyHours`
  already use); `onAuthChange` and `currentUser` both honour it, so a
  test can hold the stub in the "nobody is signed in yet" state instead
  of racing past it. `render.test.mjs`'s generated entry exposes it as
  `window.__setSignedOut`, and `renderAs(role, weeklyHours, signedOut)`
  gained the third parameter, called before `__mount()` — every existing
  call site is unaffected, `signedOut` defaults to `false`.
  `docs/CODE_MAP.md`'s `render.test.mjs` row is corrected: it no longer
  says there is no signed-out harness, because there now is one.
- **Tests:** a new signed-out render block — the sign-in screen renders
  without error, `[data-demo-button]` is present with an accessible
  name, `href="?demo=1"`, the `.tap` touch-target class, and sits
  alongside `[data-auth-lang]` on the same screen (7 checks); the
  existing owner render gained one line confirming the control is gone
  once signed in. 347/**169**/11/21/37 green (logic/render/order/dock/
  worker; render was 161); e2e still 4/4 (unaffected — it runs against
  the real built app and real emulators, not this stub); first paint
  unchanged at 347 KB (the stub only runs inside the test bundle, never
  the shipped one).
- **Not started:** the landing page, the fuller walkthrough, a demo
  banner, billing, a native wrapper — unchanged from the last two
  commits.

## 2026-09-09 — The visible Demo control on the sign-in screen

- **Why:** `docs/specs/2026-09-09_public-demo.md`, the visible entry
  point only — the previous commit built the isolation layer and canned
  data, reachable only by typing `?demo=1` by hand.
- **What:** a "Demo ausprobieren" link (`[data-demo-button]`,
  `href="?demo=1"`) on the sign-in screen, right under `AuthLangPicker`
  — same position, same pattern. Styled like the screen's other small
  text controls (`Passwort vergessen?`) and given the same `.tap`
  pseudo-element (`tailwind.src.css`) that already gives every small
  text control on this screen a 44×44 hit area from a visually smaller
  label, comfortably over the 24 px Must. It is inside the `if (!user)`
  branch, so it needs no demo-mode check of its own to disappear once
  anyone is signed in — real or the demo's own fake user, both make
  `user` truthy the same way. New i18n key `demoButtonLabel` ×14.
- **Tests:** the sign-in screen has no signed-out render harness
  (`docs/CODE_MAP.md`: "no signed-out render harness (use e2e)"), so —
  matching the exact precedent the language picker itself set — this is
  covered by `e2e/crew-morning.spec.mjs`, not `render.test.mjs`: a new
  test opens the sign-in screen, confirms the link is visible and has
  the `.tap` class the whole screen's touch-target guarantee rests on,
  clicks it, confirms the URL carries `demo=1` and the app mounts
  straight into Heute, and confirms the link is then gone; the existing
  crew sign-in test gained one line confirming it is also gone after a
  real account signs in. 4/4 e2e green; 347/161/11/21/37 green
  (logic/render/order/dock/worker) — unchanged, this turn touches
  nothing those suites exercise; first paint unchanged at 347 KB.
- **Verified live** on the emulator at 375 px: the link renders between
  the language picker and the Datenschutz note, clicking it lands in
  the demo (confirmed via `read_page`, not only the automated click).
- **Not started:** the landing page, the 5-minute walkthrough beyond
  what already existed (add material, attach a photo, send), a demo
  banner, billing, a native wrapper.

## 2026-09-09 — Public demo: isolation layer and canned data

- **Why:** `docs/specs/2026-09-09_public-demo.md`, the isolation layer
  and canned demo data only — not the visible entry point, not the
  landing page. A visitor must be able to try Site Log without ever
  being able to reach the real `site-log-ab6a9` project, deliberately
  or by accident.
- **What:** every real Firestore/Auth call in the app already funnels
  through `firebase-client.js`'s `initFirebase()` → `boot()`, the one
  place that imports the real `firebase/app`/`firestore`/`auth`
  packages. `initFirebase()` now checks a new, pure, testable
  `isDemoMode(search)` (`?demo=1`, works on any host — unlike
  `?emulator=1`, which is localhost-only by design, the demo is meant
  for the public page) **before** calling `boot()`; when true it never
  calls it at all, and instead lazily imports the new **`demo-store.js`**
  and uses its `createDemoSdk()` — the same `{ app, db, auth, fs,
  authApi }` shape `boot()` itself produces. Every other function in
  `firebase-client.js` and every function in `company-store.js` (which
  reads Firestore only through `getSdk().fs`/`.db`) needed **zero
  changes** — they already work against whatever shape `sdk` holds, real
  or fake. `roofing-site-manager.jsx` needed zero changes too: nothing
  calls `initFirebase()` directly, so no call site anywhere had to learn
  about demo mode.
  `demo-store.js` holds a small, generic in-memory stand-in for the
  handful of Firestore operations actually used (doc/collection/
  getDoc(FromServer)/getDocs/setDoc/updateDoc/deleteDoc/onSnapshot/
  writeBatch — `query`/`where` are pass-through and `writeBatch` runs
  sequentially, both fine since their only real callers, `listInvites`
  and `joinCompanyWithCode`, are unreachable from a demo that never
  signs in or joins by code) and the canned fixture itself: a fictional
  "Dach AG" owned by "Chef Muster", one project ("Steildach
  Lettenring", a fictional address and client), three entries for
  today. Every write lands only in that module's own `Map` — nothing
  demo-related ever touches `localStorage`, `sessionStorage` or
  IndexedDB, so a reload re-evaluates the module and starts over with
  no reset code needed. `demo-store.js` imports nothing from
  `firebase-client.js`, `company-store.js` or any `firebase/*` package.
- **Not this turn:** no visible "Demo" button or banner anywhere in the
  app — `entry.jsx` (the mount, per `docs/CODE_MAP.md`) turned out to
  need no change either, since the app's existing sign-in-check effect
  already calls `onAuthChange` → `initFirebase()` on its own, which is
  now demo-aware. Today the only way in is typing `?demo=1`. The
  landing page, the visible entry point, and the actual five-minute
  walkthrough (add material, attach a photo, send) are separate,
  unstarted work.
- **Tests:** `logic.test.mjs` — `demo-store.js`'s source contains no
  import of the real backend (the mechanical proof, not just a design
  intention); `isDemoMode` is pure (`?demo=1`, `?foo=1&demo=1` on,
  nothing, `?demo=0`, `?emulator=1` alone off); the fixture's every
  entry belongs to its own member, that member is an owner, and no
  seeded document ever sets `supervisorEmail`/`supervisorPhone`/
  `webhookUrl` (so the eventual "send" step cannot reach a real mail
  client or webhook by construction, not by remembering to leave a
  field blank); the fake Firestore itself reads, lists, writes and
  deletes correctly against the fixture (5 checks). 347/161/11/21/37
  green (logic/render/order/dock/worker); first paint unchanged at
  347 KB — `demo-store.js` is reached only through a dynamic `import()`
  inside `initFirebase()`, so esbuild keeps it a separate lazy chunk.
- **Verified live** on the emulator's static server, emulators
  deliberately stopped: `index.html?demo=1` alone (no other code
  change) mounted straight past sign-in into Heute showing "3 erfasste
  Einträge" and the owner-only "Übersicht" tab (confirming `role:
  "owner"` reached `canManage()`/`isOwner()` correctly); the full
  network log for that load and a reload showed **zero** requests to
  any `127.0.0.1:8080`, `127.0.0.1:9099`, `googleapis.com` or
  `firebase*` host, and no console errors; reloading reproduced the
  identical fixture.
- **Not started:** the visible Demo entry point, the landing page, the
  add-material/photo/send walkthrough, e2e smoke — all separate,
  unstarted turns.

## 2026-09-08 — An excluded, unresent entry can be sent again — Phase 1 done

- **Why:** `docs/specs/2026-09-08_report-correctness.md`, defect 8, the
  last of Phase 1. `unsentMonthEntries` read a daily report's `entryIds`
  as-is without checking `excludedIds`: an entry taken out of a daily
  report via the modal (`toggleReportEntry` + `saveReportEdits`) without
  a resend still sat in the last-sent `entryIds`, so it counted as
  already sent and never reached the month report, or any report, again
  — silently covered forever.
- **What:** `reports.js`'s `unsentMonthEntries` now filters a daily
  report's ids by its own `excludedIds` before adding them to the
  "already sent" set. `reportRows` and `saveReportEdits` needed no code
  change — `reportRows` already correctly hid an excluded row from what
  the sender was shown (confirmed by a new test, not a fix), and
  `saveReportEdits` already just persists the modal's `excludedIds`
  verbatim; the bug was entirely in how the month subtraction read that
  field back.
- **Tests:** `logic.test.mjs` — `reportRows` hides the excluded row (the
  premise: it genuinely was never shown); the same entry still appears
  in that month's report once its daily report is checked with
  `unsentMonthEntries` (2 new checks). 332/161/11/21/37 green
  (logic/render/order/dock/worker); first paint 347 KB, unchanged.
- **Verified live** on the emulator: excluded a 7.5 h entry from the
  day's sent report (13.5 h → 6 h shown, "Nicht in diesem Bericht (1)"),
  saved without resending, then Monat's hours rose from 12.0 to 19.5 and
  "already sent" dropped from 7 to 6 — the entry reappeared instead of
  staying buried.
- **Phase 1 of the reporting roadmap is done**: all six defects in
  `docs/specs/2026-09-08_report-correctness.md` are implemented and
  tested (day-report scope, PDF completeness, the weekly target and firm
  address for every role, Regie on the report, and the two month-report
  correctness fixes above). Phase 2 (the arrangeable report — letterhead,
  a field toggle, photo thumbnails, signature on the supervisor report),
  from the 2026-09-07 reporting roadmap given to the owner in chat (not
  saved as a file), is next and is not started.

## 2026-09-08 — Month report agrees with the day-report scope of defect 1

- **Why:** `docs/specs/2026-09-08_report-correctness.md`, defect 7 only.
  `unsentMonthEntries` subtracted only the sender's own daily-report
  entryIds. Since defect 1 made a daily report person-scoped by default
  with a manager's whole-crew toggle, a colleague's whole-crew daily
  already carried this person's entries too, but the month subtraction
  never recognised it — the same entries could go out once on that
  colleague's daily and again on this person's monthly.
- **What:** `sendReportToSupervisor` (`roofing-site-manager.jsx`) now
  takes the scope it was called with and persists it on the record as
  `wholeCrew` (daily reports only; a monthly report leaves it unset).
  Both daily call sites (the Tag card's send button, `generateDayReport`
  for the Board's day action) pass the same `canManage() &&
  reportWholeCrew` value already used to build the scoped entry list, so
  the record always matches what it actually carried. `reports.js`'s
  `unsentMonthEntries` now counts a daily report toward "already sent" if
  it is this person's own (any scope, unchanged) **or** it is marked
  `wholeCrew` regardless of who sent it — a colleague's person-scoped
  daily is still skipped, since `dayReportScope` never lets it carry
  anyone else's entries anyway, so including it would be a no-op.
- **Tests:** `logic.test.mjs` — "unsentMonthEntries excludes entries
  already covered by a colleague's whole-crew daily report" and "...still
  includes a colleague's entries when no whole-crew report covered them"
  (2 new checks); the existing "another person's daily report does not
  hide my entries" regression guard stays green unchanged, proving a
  person-scoped colleague report still cannot hide anything. 330/161/11/
  21/37 green (logic/render/order/dock/worker); first paint 347 KB (1.2 KB
  of margin, unchanged).
- **Verified live** on the emulator: the owner sent a whole-crew daily
  report (13.5 h, carrying two crew members' entries); signed in as one
  of those crew members, their own Monat view correctly listed the
  owner's daily report under "Gesendete Berichte" and did not double-count
  those entries as still unsent — before this fix it would have.
- **Not started:** defect 8 of the same spec.

## 2026-09-08 — Regie marked on the report a supervisor sees

- **Why:** `docs/specs/2026-09-08_report-correctness.md`, defect 6 only:
  `entryLabels` carried no Regie marker, so the mail body and the PDF
  never showed which hours were extra work outside the agreed scope —
  it only ever surfaced in the customer-signed Rapport and the owner's
  own Regie billing. The spec named `buildReportHtml` in
  `roofing-site-manager.jsx`; that function moved to `report-document.js`
  in the 2026-09-08 PDF-completeness commit, so this lands there instead.
- **What:** `reports.js` gains `regieIds(rows)` — a parallel field
  alongside `entryLabels` (not baked into the label string, which stays
  untranslated everywhere in this file; "Regie" itself is a translated
  word, `t.regieShort`) — and `reportTotals` gains `regieHours`, a subset
  of `hours`, not additional to it. `reportRows`' deleted-row fallback
  now carries `.regie` through from `report.regieIds`, so a Regie entry
  that gets deleted after being reported still reads as Regie. In the
  app: `sendReportToSupervisor` persists `regieIds`/`regieHours` on the
  record; `reportFigures` exposes `regieHours`; `reportSendText`'s mail
  body states it on its own line (`t.regieLabour`, already existed) only
  when it is greater than zero, the same pattern already used for
  `transportHours`. In `report-document.js`: material/tool rows (which
  already carry `.regie` natively as live entries) and "other" rows now
  render the same `t.regieShort` tag `printRapport` already uses on the
  signed Rapport, styled to match.
- **Tests:** `logic.test.mjs` — `regieIds` names only the Regie rows;
  `regieHours` is always ≤ `hours` and counts only Regie time entries; a
  deleted row's fallback still reads as Regie, a non-Regie one does not
  (5 new checks); one pre-existing `reportTotals` object-equality test
  updated for the new `regieHours` field. 328/161/11/21/37 green
  (logic/render/order/dock/worker); first paint 347 KB (1.2 KB of
  margin). The mail body's own string assembly is not separately tested
  beyond the pure `regieHours` math feeding it — the same level of
  coverage `transportHours` already had before this change.
- **Not started:** defects 7, 8 of the same spec.

## 2026-09-08 — Weekly target and firm address readable by every role

- **Why:** `docs/specs/2026-09-08_report-correctness.md`, defect 5 only:
  `private/finance` was owner-only in `firestore.rules`, so a supervisor's
  or crew member's own Woche view showed no target and their signed
  Rapport printed an empty firm address — Firestore rules cannot restrict
  by field, only by document, so hiding the money meant hiding the address
  and the target too.
- **What:** a new document, `companies/{cid}/private/reportProfile`
  (`firestore.rules`: member-readable, owner-writable), carries only
  `weeklyHours`, `companyName`, `street`, `buildingNumber`, `postalCode`,
  `town` — never `labourRate` or `iban`, which stay solely in
  `private/finance`. `company-store.js` gains `loadReportProfile`/
  `saveReportProfile`. The app loads it for every role (unconditionally,
  before the still owner-gated `loadFinance`) and `saveBilling` writes
  both documents together, so the two never drift and the owner does
  nothing extra. `printRapport`, the Woche target calculation and the
  "not configured" hint already read `billing.weeklyHours`/`billing.*`
  address fields — no code change needed there, they just start seeing
  data for every role.
- **Tests:** `rules.test.mjs` — a crew member and a supervisor may read
  `reportProfile` but not write it, `reportProfile` never carries
  `labourRate`/`iban`, the owner may write it (124 rules tests green,
  fresh emulator on port 8085). `render.test.mjs` — a crew member's
  Woche table shows the firm's weekly target (a new `renderAs(role,
  weeklyHours)` parameter, bridged into the jsdom-eval'd bundle via
  `window.__setWeeklyHours`, mirroring how the role stub already
  worked); every existing owner-flow test (first steps, the billing
  modal) stays green because the test stub's weekly hours default to
  unset, same as before. 322/161/11/21/37+12+17+14+29+7 green
  (logic/render/order/dock/worker); first paint unchanged (346 KB).
- **Fixed along the way:** the very fix broke six owner-role render tests
  the first time (the billing modal's opener, the first-steps count) —
  the test stub's `loadReportProfile` had started returning a truthy
  `weeklyHours` unconditionally, hiding the "set up billing" first step
  the owner tests still expect to see; the stub now defaults to unset
  and a test opts in explicitly.
- **Not started:** defects 6, 7, 8 of the same spec.

## 2026-09-08 — PDF carries every entry type, one net-hours figure

- **Why:** `docs/specs/2026-09-08_report-correctness.md`, defect 3 only:
  the PDF rendered only material/tool/note rows and summed time gross,
  while the modal and the mail already used `reportTotals`' net-of-breaks
  figure — the same day printed two different numbers.
- **What:** `reports.js` gains `reportSiteGroups(rows, siteKeyOf)` and
  `OTHER_ENTRY_TYPES` (break, transport, photo, inspection, order,
  pickup) — a pure function that groups a report's rows by site and
  sorts every type into material/tool/note/other, with each site's hours
  computed by `reportTotals` (net of that site's own breaks). The PDF
  builder (`buildReportHtml`, `buildProjectsReportHtml`,
  `renderReportDocument`, `clientNameFor`) moved out of the app file into
  a new lazy chunk, **`report-document.js`** — the same "only load it
  when someone prints" pattern as `swiss-qr-bill.js`, needed to keep the
  first-paint budget after the new "other entries" table. `saveReportAsPdf`
  and `generateProjectsReport` are now async and `await import(...)` it;
  both were fixed to open the print tab *before* that await (the tab must
  open on the click's own stack or a real browser's popup blocker eats
  it) and hand the already-open tab to `openPrintable`, which now accepts
  one. New i18n key `otherEntriesLabel` in all 14 files.
- **Tests:** `logic.test.mjs` — every `OTHER_ENTRY_TYPES` entry lands in
  the new bucket and nothing is dropped, material/tool/note keep their
  own tables, a deleted entry is dropped from every bucket, a site's
  hours equal `reportTotals`' net hours, and per-site hours across
  several sites sum to the same net figure `reportTotals` gives for the
  whole report. 322/160/11/21/37+12+17+14+29+7 green (logic/render/
  order/dock/worker); first paint 346 KB (4.2 KB of margin, up from 0 KB
  after the last commit — the lazy split paid for itself and then some).
  Emulator: the day report's PDF chunk (`report-document.js`, 1.1 KB) and
  the print-chrome chunk both fetch and run without error when "Als PDF
  speichern" is tapped; the popup itself cannot be observed in this
  sandboxed browser (`window.open` is unconditionally blocked here, even
  for a bare synchronous call), so the tab-opening fix rests on reading
  the code against the pre-existing `printRapport`/`printDocument`
  convention, not on seeing the window.
- **Not started:** defects 5, 6, 7, 8 of the same spec.

## 2026-09-08 — Report scope: sender by default, whole crew by manager toggle

- **Why:** `docs/specs/2026-09-08_report-correctness.md` (Phase 1 of the
  reporting roadmap, approved 2026-09-08), defect 1 only: a day report
  went out under the sender's name but carried every member's entries.
- **What:** `reports.js` gains `dayReportScope(entries, dateStr, userId,
  wholeCrew)`, a pure filter (own entries unless `wholeCrew`). Both
  places that build a daily report — the Tag card's send button and
  `generateDayReport` (the Board's day action) — use it; `wholeCrew` is
  gated on `canManage()` at both the call sites and a new checkbox
  (`[data-report-whole-crew]`), shown only to owners/supervisors, next to
  the send button. New i18n key `reportWholeCrewLabel` in all 14 files.
- **Tests:** `logic.test.mjs` — the default/whole-crew/other-day scoping,
  and that `reportRows` carries each row's `userId` once entries are
  joined in; `render.test.mjs` — the toggle is offered and off by default
  for the owner, offered for the supervisor, absent for crew. 312/160/11/21
  green (logic/render/order/dock); first paint 350 KB, at budget.
- **Not started:** defects 3, 5, 6, 7, 8 of the same spec.

## 2026-09-06 — Build reproducible across platforms (.gitattributes, LF)

- **Why:** CI's "Bundle matches source" failed on d08d677: a `git stash
  pop` on Windows had rewritten the working copies with CRLF (autocrlf),
  Prettier restored LF only where it runs, the language JSON files (in
  `.prettierignore`) kept CRLF, esbuild's text loader embedded `` into
  the language chunks, and the committed chunk hashes differed from the
  Linux build. The deploy was skipped, production stayed on b05d5bff84.
- **What:** every tracked text file normalised to LF; `.gitattributes`
  pins `* text=auto eol=lf` so every checkout on every platform is LF;
  the build is committed again with the hashes CI produces.
- **Lesson:** never trust the working copy's line endings after a git
  checkout/stash on Windows; the attributes file now makes that moot.

## 2026-09-06 — UI audit pass 3 fixes; bexio card in the reader's language

- **Why:** the two-role gate for the language picker commit (audit after
  the fact), the open pass-2 findings 19/23/24/25, and finding 26 (English
  Worker text under every flag). Maintenance for the owner's own use; no
  new product work (see the competitor research entry below).
- **Interface engineer (subagent), `docs/ui-audit-2026-09-06-pass3.md`:**
  picker 47 px with a visible focus ring and dark native list; `tap` on
  the onboarding mode switch and both Datenschutz links; invite delete
  two-step (`[data-invite-delete]`, `[data-invite-delete-yes]`, key
  `inviteDeleteConfirm`); roster «Heute:» group (`[data-roster-today]`,
  key `rosterToday`); Board › Woche on phone: pinned name column, today
  scrolled into view, touch hint instead of the drag hint (key
  `plannerHintTouch`); `Field` helper gives Kunden, Kontakt and Profil
  fields visible labels (no placeholder-as-label). Open: app-wide input
  focus ring (`outline-none` everywhere) → spec; sign-in labels → product;
  crew seeing Bearbeiten on a customer → permissions decision.
- **Software engineer:** Worker refusals carry a stable `code`
  (`worker/src/index.js` verify, `worker/src/bexio.js`; 6 tests, 29
  green; Worker 7db33cac live); `BexioCard` maps codes and push statuses
  to `bexioErr*`/`bexioSt*` keys (14 new keys × 14 files); network
  failure → `bexioErrNetwork`; bexio's own detail stays after the
  sentence.
- **Tests:** render 156, logic 308 (+ key guards), order 11, dock 21,
  worker 30+6, e2e 3. First paint 357 919 bytes (481 under budget).
  Emulator: Worker answers 401 `auth_invalid` for emulator tokens and the
  card shows the German sentence instead of the English one.

## 2026-09-06 — Swiss competitor research (correction of 2026-09-04)

- **Why:** the owner pointed out that the 2026-09-04 research covered
  plancraft and ToolTime (German market) and none of the Swiss vendors.
- **What:** `docs/research/2026-09-06_swiss-competitors.md` from the
  vendors' own pages: ALBAU/OF-Bau, SORBA, Werkli, noovi, Baunex, BRIXX,
  Technoova (+ Jobilino for languages); feature-by-feature against Site
  Log; prices; market size (~850 firms / 4,000 employees under the GAV).
  PROJECT.md §1a records the reality and withdraws the "ahead of the
  competition" line and the CHF 290 price. The private-server plan and
  the billing/landing steps are parked until the crew-language hypothesis
  is tested with real firms.

## 2026-09-06 — Plan: Site Log on a private server (spec, proposed)

- **Why:** the owner asked for a plan to move the whole suite to a private
  server so database and file size limits stop shaping the product.
- **What:** `docs/specs/2026-09-06_private-server-migration.md` — the
  limits today (1 MiB documents, 900 KB photos, 25 MB files, Spark quotas,
  KV-only server state, rules DSL, emulator blind to uploads) and what
  removes each; target: Caddy + Fastify API + PostgreSQL 16 + MinIO in
  Docker Compose on a Swiss VPS; auth stays Firebase until phase 3; a
  change-feed sync (SSE + IndexedDB mirror) replaces `onSnapshot`; four
  phases (seams/local stack → files+photos → data → auth+Worker jobs →
  hosting+paperwork) with read-back checks and a month-long way back.
- **Waits on the owner:** provider, location, budget, phase order.
- **Effect on the open batch:** the Abo (billing) moves to the API in
  phase 3; `worker/src/plan.js` stays an uncommitted draft; ownership
  transfer and company deletion are planned on the API, not on Firestore.

## 2026-09-06 — Language before sign-in; QR-bill code lazy; code map + dev log

- **Why:** UI audit pass 2 finding 20 and PROJECT.md §1b — a crew member
  must be able to sign in without help, in their own language. The owner
  asked for a code map and a per-commit log so a session starts from the
  map instead of searching.
- **Language:** `ui/lang-picker.jsx` (`AuthLangPicker`, `[data-auth-lang]`,
  14 languages, accessible name `t.languageLabel`) on the sign-in and the
  onboarding screen; `lang` state initialised from `localStorage`
  `site-log-lang` (validated with `isLang`); `changeLang` writes it;
  `entry.jsx` preloads the saved language with en/de. New i18n key
  `languageLabel` in all 14 files.
- **Budget:** the picker pushed the first paint 194 bytes over 350 KB, so
  the QR-bill payload/QR/Swiss cross moved to `swiss-qr-bill.js`, loaded
  when a bill is printed or a pickup QR is drawn; `swiss-qr.js` keeps the
  validation the billing form needs at render time. First paint 349 KB.
- **Tooling:** `.*-under-test.mjs` (the suites' temporary bundles) ignored
  by ESLint, Prettier and git — a crashed suite had left one behind and
  lint failed on it. `docs/CODE_MAP.md`, this log, a logic test that every
  source file is named in the map, and the hook rule for this log.
- **Tests:** e2e `crew-morning.spec.mjs` "sign-in screen: the language
  picker works before signing in and is remembered" (select sq → button
  "Hyr", `html[lang=sq]`, reload keeps it); logic 305, render 150, order
  11, dock 21, worker 30, e2e 3 — all green. Emulator: picker 39 px high,
  Albanian applied to the whole sign-in screen, kept after reload.
- **Noted:** one Playwright run timed out on the owner spec (60 s waiting
  for the sign-in screen) and passed on the rerun; watch for it in CI.
- **Not committed:** `worker/src/plan.js` draft for the Abo (waits for the
  private-server migration plan, which decides where billing lives).
