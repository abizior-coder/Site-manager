# Code map — where things are (read this before grepping)

The model-facing map of Site Log. Kept current by hand with every commit
(`docs/DEVLOG.md` records each change; a logic test fails when a source
file is missing from this map). Use names, not line numbers: the app file
moves. `grep -n "function <name>" roofing-site-manager.jsx` finds any
handler below.

## Shape

- Static PWA on GitHub Pages (`index.html`, `build/`, `sw.js`,
  `tailwind.css`, `datenschutz.html`, `404.html`). No server of our own
  except the Cloudflare Worker `site-log-claude-proxy` (`worker/`).
- Preact through `preact/compat`; esbuild `--splitting` (`npm run build`)
  → `build/bundle.js` + hashed chunks; `scripts/stamp.mjs` stamps hashes
  into `index.html` (`<meta name="site-log-build">`) and generates `sw.js`
  (precaches every chunk). Static Tailwind 3.4 (`tailwind.src.css` →
  `tailwind.css`, config `tailwind.config.cjs`).
- Data: Firebase Auth + Firestore (`firestore.rules`), files in
  Cloudflare R2 through the Worker, big blobs in `companies/<cid>/kv`.
  Data model and rules model: PROJECT.md §4.
- First-paint budget: < 350 KB (bundle.js + static chunks; logic test).
  Currently ~349 KB — anything new in the app file must be small or lazy.

## Commands

| What | Command |
|---|---|
| build | `npm run -s build` |
| fast suites (run with `node`, not `npm run`, to see exit codes) | `node logic.test.mjs`, `node render.test.mjs`, `node order-flow.test.mjs`, `node dock.test.mjs` |
| Worker suites | `npm run -s test:worker` (worker/*.test.mjs) |
| rules (emulator) | `npm run test:rules` |
| e2e (Chromium) | `npm run test:e2e`; against running emulators: `npx playwright test` |
| emulators + seed | `npm run emulators` (auth 9099, firestore 8080), `npm run seed` |
| static server for the emulator | `.claude/launch.json` → `site-manager-static`, port 5566, app at `/index.html?emulator=1` |
| failsafe by hand | `npm run precommit` (= `.githooks/pre-commit`) |
| lint / format | `npx eslint .`, `npx prettier --check .` |
| Worker deploy | `cd worker && npx wrangler deploy`; secrets via `npx wrangler secret put <NAME> --name site-log-claude-proxy` |
| rules deploy | `npx firebase deploy --only firestore:rules --project site-log-ab6a9` |
| CI / deploy | push to `main` → `.github/workflows/ci.yml` (lint, format, build, suites, rules, e2e) → `pages.yml` on green (deploy + tag `v<version>` from CHANGELOG) |

Seeded emulator accounts: chef / polier / crew1 / crew2 `@test.local`,
password `test1234` (`scripts/seed-emulator.mjs`).

## Entry and the app component

| File | Holds |
|---|---|
| `entry.jsx` | crash capture install (`installCrashCapture`, stale-chunk reload-once), preload of en/de + the device language (`localStorage` `site-log-lang`), mount, service-worker registration with version compare (`site-log:update`), `beforeinstallprompt` capture (`window.__siteLogInstallPrompt`, `site-log:install-available` — see `install.js`/`ui/install-hint.jsx`). |
| `roofing-site-manager.jsx` (~12.7k lines) | **the app**: constants (TRADES, SAFETY_*, PROJECT_CATEGORIES, PROJECT_STATUSES, VAT_RATES, ORDER_STATES), pure helpers (`encodeProjectCode`/`decodeProjectCode`, `encodeBackup`/`decodeBackup`, `nextDocNumber`, `migrateClientsToCustomers`, `classifyNote`), lazy tab imports, `SiteManager()` = all state + handlers + screens, then `MountainBackground`, `SwissCross`, `Section`, `ReorderList`, `SignaturePad`, `Modal`, `Field` (a `<label>` with visible text above a control). |

Inside `SiteManager()` (grep the name):

| Area | Handlers |
|---|---|
| errors / toasts | `showError(e, context)` → error panel (`[data-error-panel]`, codes from `errors.js`), `showToast` |
| language | `lang` state (initialised from `localStorage`), `changeLang` (loads chunk, `localStorage` + personal kv `site-lang`), `LANG_NAMES` |
| auth screens | `if (!user)` → sign-in (`submitAuth`, `submitReset`, `AuthLangPicker`, the `[data-demo-button]` link to `?demo=1` — see `demo-store.js`), then onboarding (`submitOnboarding`, join codes from `onboarding.js`), `doSignOut`, `deleteOwnAccountFlow` |
| persistence | `persist()` (runs `reconcileEntries` from `entries-history.js`, writes company collections via `company-store.js`), `personalKey`/`getPersonal` (per-user kv), `saveFailed` |
| entries | `openAdd`, `submitAdd`, `newEntry`/`addEntry`, `openEditEntry`, `openEditTime`/`saveEditTime`, `deleteEntryFn`/`confirmDelete`/`restoreEntry`/`purgeEntry`, `approveEntry`, `toggleBreak`, `startDayOn`, `clockOut`, `submitNote`, voice input `toggleVoiceInput` |
| reports (Rapport) | `generateDayReport` (scope via `dayReportScope`, manager-only whole-crew toggle `[data-report-whole-crew]`), `saveReportAsPdf`/`generateProjectsReport` (lazy `report-document.js`), `printRapport`, `sendReportToSupervisor`, `resendReport`, `openRapport`/`saveRapport`, week/day figures from `reports.js` |
| documents (Offerte/Rechnung) | `newDocumentFor`, `saveDocument`, `convertQuoteToInvoice`, `printDocument` (QR-bill via lazy `swiss-qr-bill.js`), `saveBilling`, `createRegieDocument`, money helpers from `documents.js` |
| customers / contacts | `openCustomerForm`, `submitCustomer`, `deleteCustomer` (two-step), `submitContact`, `dueFollowUps`, import via `customers-import.js` (`stageCustomersFile`, `applyCustomersImport`) |
| projects / dock | `addProject`, `saveProjectEdit`, `reorderProjects`, `togglePin`, `cycleDockSort`, `dropOnProject`, `projectCosting`, `commandCentre`, `dailySummary` |
| team | `openTeam`, `makeInvite`/`shareInvite`/`dropInvite` (two-step `[data-invite-delete]`/`-yes`, state `inviteDeleteAsk`), roster today group `[data-roster-today]`, `removeMember`, `toggleAssignment`, leave (`submitLeaveRequest`, `submitRangeLeave`, `setLeaveStatus`) |
| files / photos | `uploadFiles` (queue from `upload-queue.js`), `postFile`, `openFile`, `deleteFile`, `addFileLink`, `openPhoto`, `savePhotoEdit`, `handleFile`, `fileToScaledImage` |
| materials / orders | `addToBasket`, `transferBasketToProject`, `requestBasketForProject`, `setOrderStatus`, `stagePriceList`/`applyPriceList` (`price-list.js`), `openPickup`/`generatePickupCode` (lazy `barcode.js` + `swiss-qr-bill.js`) |
| AI (Worker `/`) | `callClaude`, `translateEntry`/`translateNote`/`autoTranslateNote`, `runScan`/`confirmScan` (delivery notes), library scans, `runInspection` |
| inspection / transport | `openInspection`, `saveInspectionPlain`, `confirmInspection`, `openTrip`/`setTripField`/`saveTrip` (`roof-tiles.js`; `openTrip(projectId, entry)` edits in place when `entry` is given), `canEditTrip`, `scanTripSlip` (Worker AI proxy reads a Lieferschein/Waagschein photo, proposes fields into the open form only — `docs/specs/2026-09-09_transport-detail-and-scan.md`) |
| backup | `downloadFullBackup`, `restoreFullBackup` (`import-guard.js`), `recordBackup` (`backup.js`), `openBackupExport`/`submitBackupImport` (codes) |
| weather | `fetchWeather`, `submitWeatherCity` (open-meteo) |
| profile | `openProfile`, `saveProfileInfo`, docs/insurance/cert forms, language picker modal (`langPickerOpen`) |

Screens: `if (!user)` sign-in → onboarding (no company) → the app: phone
tab bar `[data-tab-bar]` + «+» sheet `[data-quick-add]`, desktop layout
`[data-main-column]`, menu drawer `[data-menu-drawer]` (also
`role=dialog` — select dialogs by content in tests).

## Tabs (lazy chunks, render only; state and handlers stay in the app)

| File | Component(s) | Notes |
|---|---|---|
| `tabs/TodayTab.jsx` | `TodayTab` | day card `[data-day-card]`, `[data-today-date]`, `[data-day-action]`, first steps `[data-first-steps]`, `installHint` slot renders `ui/install-hint.jsx`'s `[data-install-hint]` below `topCard` |
| `tabs/BoardTab.jsx` | `BoardTab` | Board/Übersicht, month dots `[data-board-dots]`, week `[data-woche]` (pinned name column, today `[data-woche-today]` scrolled into view, touch hint `[data-woche-hint-touch]` under `(hover: none)`) |
| `tabs/MaterialsTab.jsx` | `MaterialsTab`, `ArticleSheet` | supplier sheet `[data-article-sheet]`, catalogues from `data/catalog.js` |
| `tabs/CockpitTab.jsx` | `CockpitTab`, `ExportCard`, `UsageCard`, `ErrorsCard`, `BexioCard`, `BackupCard`, `LoginsCard`, `useWorkerData`, `WORKER_URL` | owner cards; most fetch their own Worker data. `LoginsCard` (`[data-logins-card]`) is the exception: Firestore, not the Worker, via the `loadLoginEvents` prop `roofing-site-manager.jsx` passes down (lazy `login-events.js`) — newest first, `EmptyState` when empty |
| `tabs/ProjectDetail.jsx` | `ProjectDetail`, `PhotoViewer`, `PhotoEditor` | the job hub `[data-hub-tabs]` (chat, files, material, inspections, trips), trash `[data-deleted-block]`. Each `[data-job-trip-row]` is tappable (`onEditTrip`, opens `ui/trip-modal.jsx` pre-filled) — delete stays a separate button, not nested inside it. Distinct from the top-level Transport tab's own `[data-trip-row]` list in `roofing-site-manager.jsx` (unrelated, unchanged by `docs/specs/2026-09-09_transport-detail-and-scan.md` — that spec named the job view only). The Fotos hub tab's `[data-photo-add]` (`docs/specs/2026-09-11_photo-add-in-category.md`) calls the app's existing `onAdd("photo")` directly, in both the empty state (`EmptyState`'s `action`) and next to the filled grid's header — no detour through the app-level quick-add sheet or chat, no new save path |

## Shared UI (`ui/`)

| File | Exports |
|---|---|
| `ui/theme.js` | `COLORS`, `accentText`, `dangerText` (contrast-tested) |
| `ui/format.js` | `todayKey`, `monthKey`, `dateKeyOffset` (local calendar), `uid` (`crypto.randomUUID`), `fmtDate`, `fmtMonth`, `fmtDateRange`, `fmtHM` |
| `ui/dialog.js` | `useDialog` (focus trap, Escape, `aria-modal`), `focusable`, `trapTab` |
| `ui/entries.jsx` | `savePhoto`/`loadPhoto`/`deletePhoto` (photo kv), `StoredImage`, `typeMeta`, `Stat`, `EntryRow`, `EntryGroups`, `ENTRY_TYPE_ORDER` |
| `ui/loading.jsx` | `Loading`, `LoadingOverlay` (`[data-loading]`) |
| `ui/empty-state.jsx` | `EmptyState` (`[data-empty]`): optional `action`/`onAction` button, `actionHook` sets a boolean data-attribute on it for tests (e.g. `data-photo-add`) |
| `ui/print.js` | `printChrome`, `withPrintChrome` (toolbar for opened documents) |
| `ui/download.js` | `downloadText` |
| `ui/break-chips.jsx` | `BreakChips` (GAV breaks) |
| `ui/lang-picker.jsx` | `AuthLangPicker` (`[data-auth-lang]`, before sign-in) |
| `ui/install-hint.jsx` | `InstallHint` (`[data-install-hint]`): dismissible Heute banner, `docs/specs/2026-09-09_pwa-install.md`; iOS gets `t.installHintIos` only, Android also gets `[data-install-button]` calling the captured `beforeinstallprompt`; `[data-install-hint-dismiss]` |
| `ui/trip-modal.jsx` | `TripModal` (`docs/specs/2026-09-09_transport-detail-and-scan.md`): every trip field incl. `emptyRun`/`returnToYard`/`waitMin`/`slipNo`/`helper`/`wasteCode`; render only — `roofing-site-manager.jsx`'s `openTrip`/`setTripField`/`saveTrip`/`scanTripSlip`/`canEditTrip` stay put. Lazy (`lazy(() => import("./ui/trip-modal.jsx"))`, `<Suspense>`): the full field set missed the first-paint budget eager, so unlike `install.js`/`login-audit.js` (small, stayed eager) this one moved out — a genuine net win once a feature is this size. `[data-trip-scan]` hides itself when `demoMode` (the app's own `isDemoMode()`, passed as a prop — no Worker call ever leaves the demo). A viewer who is neither the trip's driver nor a manager gets every field `disabled` and no `[data-trip-save]` (`tripModal.readOnly`, decided by `canEditTrip` before the modal opens) |

## Pure modules (root, all unit-tested in `logic.test.mjs` unless noted)

| File | Holds |
|---|---|
| `company-store.js` | Firestore access per company: `ENTITY_COLLECTIONS`, roles (`getRole`, `isOwner`, `canManage`), `createCompany`, invites, `leaveCompany`, `setMemberActive`, kv (`test-stubs/company-store.js` in render tests) |
| `firebase-client.js` | SDK init (npm Firebase, pinned), auth (`signIn`, `signUp`, `reauthenticate`, `deleteOwnAccount`), `storage` (kv facade), `legacyScan`/`importLegacy` (`test-stubs/firebase-client.js` in render tests); `isDemoMode()` + `initFirebase()` gate — in demo mode (`?demo=1`) `boot()` (the only place the real SDK is imported) is never called, `demo-store.js` supplies the `sdk` shape instead |
| `demo-store.js` | Public demo (`docs/specs/2026-09-09_public-demo.md`): `createDemoSdk()` (a small in-memory Firestore + Auth stand-in, `getSdk()`-shaped, lazy — loaded only from `firebase-client.js`'s `initFirebase()` in demo mode), `demoFixture()` (the canned data: fictional "Dach AG" / "Chef Muster" / "Steildach Lettenring"). Imports nothing from `firebase-client.js`, `company-store.js` or any `firebase/*` package — a logic test enforces that from the source text |
| `reports.js` | Rapport model: `reportRows`, `reportTotals`, `dayReportScope` (sender by default, whole crew by manager toggle), `reportSiteGroups`/`OTHER_ENTRY_TYPES` (every entry type sorted into material/tool/note/other, per-site net hours), `splitDayHours` (GAV), `weekOf`, `weekRows`, `weekCsv`, `withSend`, `rapportChanged` |
| `report-document.js` | `buildReportHtml`, `buildProjectsReportHtml` (the printed/PDF supervisor and projects reports; lazy — loaded only by `saveReportAsPdf`/`generateProjectsReport`) |
| `documents.js` | `toRappen`/`fromRappen`, `documentTotals` (Rappen, Swiss rounding), `documentState`, `DOC_STATUSES` |
| `accounting-export.js` | invoice journal + positions, payroll hours, customers for bexio (CSV) |
| `swiss-qr.js` | IBAN validation, `validateBillingProfile` (static) |
| `swiss-qr-bill.js` | `buildQrPayload` (SIX layout), `creditorReference`, `qrDataUrl` (lazy `qrcode`), `SWISS_CROSS_SVG` (lazy) |
| `barcode.js` | Code 128 (`code128Bars`) for pickup codes (lazy) |
| `entries-history.js` | `reconcileEntries` (stamps, history on covered entries, soft delete), `coveredEntryIds` |
| `errors.js` / `errors-text.js` / `errors-client.js` | `ERROR_CODES` + `classifyError`; the sentences (lazy); crash capture (`installCrashCapture`, `isStaleChunkError`, `crashPayload`) |
| `upload-queue.js` | IndexedDB queue for R2 uploads (`openUploadQueue`, `drainQueue`, `memoryQueue`) |
| `import-guard.js` | `sanitiseBackup`, `sanitiseProjectCode`, `isPhotoDataUrl` (lazy) |
| `price-list.js` | supplier price-list parsing/merging, article search/sort (lazy) |
| `customers-import.js` | `parseCustomersCsv` (incl. bexio export), `mergeCustomers` |
| `onboarding.js` | `inviteUrl`, `joinCodeFromSearch`, `firstSteps` |
| `install.js` | Add-to-home-screen detection (`docs/specs/2026-09-09_pwa-install.md`), eager: `isIOS`, `isStandalone`, `installHintDismissed`/`dismissInstallHint` (per-device, `localStorage`) |
| `login-events.js` | Login audit (`docs/specs/2026-09-09_login-audit.md`): `recordLogin`/`listLoginEvents` (Firestore `companies/{cid}/loginEvents`, owner-read-only), `idsToPrune` (bounded retention, 200 rows, pruned in `listLoginEvents`), `claimLoginSlot` (once per session, `sessionStorage`), `recordThisSession` (the mount effect's own entry point). All lazy — reached only through `import("./login-events.js")` from `roofing-site-manager.jsx`'s mount effect and its `loadLoginEvents()` helper (passed to `tabs/CockpitTab.jsx`'s `LoginsCard`); making it eager (tried first) cost more of the first-paint budget than the feature itself, not less — Firestore's path literals do not shrink under minification |
| `roof-tiles.js` | tile catalogue, waste weights, `summariseInspection`, `tripHours` |
| `breaks.js` | GAV breaks (`BREAKS`, `netHours`) |
| `files.js` | file kinds, `MAX_FILE_BYTES`, `normaliseLink` |
| `backup.js` | backup nudge (`backupDue`, `backupMeta`) |
| `metrics-client.js` | usage tracker → Worker `/metrics` |
| `sw-routes.js` + `scripts/sw.template.js` | service-worker routing (tested) + body → generated `sw.js` |
| `i18n/index.js` | `T` (proxy), `LANGS` (14), `isLang`, `loadLang`; `i18n/<code>.json` one file per language, every key in every file (logic test) |
| `data/catalog.js`, `data/logo.js` | shop catalogues (with Materials), printed logo |

## Worker (`worker/`, Cloudflare, KV `RATE_LIMIT`, R2 files)

| File | Route / holds |
|---|---|
| `worker/src/index.js` | `POST /` AI proxy (Firebase token verify, `limits.js`), dispatch to `/metrics`, `/bexio`, `/errors`, `/files`; `corsHeaders` (GET, POST, PUT, DELETE, OPTIONS) |
| `worker/src/files.js` | `/files/<cid>/…` R2 upload/get/delete with membership check |
| `worker/src/metrics.js` | `/metrics/<cid>` counts per day (KV `m:<cid>:<day>`) |
| `worker/src/errors.js` | `/errors/<cid>` crash reports (200/day, 30 days) |
| `worker/src/bexio.js` | `/bexio/<cid>/token|status|push`: PAT encrypted with `BEXIO_TOKEN_KEY` (AES-GCM) in KV, contacts + invoices push, dry run; every refusal carries a stable `code` (`auth_*`, `owners_only`, `token_missing`, `token_refused`, `not_connected`, `not_configured`, `taxes`, `no_tax`, `no_customer`) that `BexioCard` maps to `bexioErr*` i18n keys |
| `worker/src/plan.js` | **uncommitted draft**: `/plan/<cid>` state + `/plan/<cid>/order` (Abo invoice in the operator bexio, secret `BEXIO_OPERATOR_TOKEN`); spec `docs/specs/2026-09-06_self-service-plan-billing.md` (proposed) |
| `worker/src/limits.js` | per-account/company daily and minute limits |
| Secrets | `ANTHROPIC_API_KEY` (owner sets), `BEXIO_TOKEN_KEY` (set, random), `BEXIO_OPERATOR_TOKEN` (not yet) |

## Tests

| Suite | Covers |
|---|---|
| `logic.test.mjs` (~300) | every pure module, i18n completeness, error codes ↔ docs, precache list, first-paint budget, palette contrast, this map's completeness |
| `render.test.mjs` (150+) | jsdom renders of the app per role (`renderAs(role, weeklyHours, signedOut)`, stubs in `test-stubs/`), dialogs, a11y names, `[data-*]` hooks; `signedOut` (via `test-stubs/firebase-client.js`'s `setStubSignedOut`) renders the sign-in screen itself — used for the `[data-demo-button]` Demo control |
| `order-flow.test.mjs`, `dock.test.mjs` | material order flow, dock drag/pins |
| `rules.test.mjs` | Firestore rules on the emulator (`firebase.test.json`) |
| `worker/*.test.mjs` | files, limits, metrics, errors, bexio, cors |
| `e2e/crew-morning.spec.mjs`, `e2e/owner-cockpit.spec.mjs` | Playwright Chromium: the language picker before sign-in, the `[data-demo-button]` Demo control (opens `?demo=1`, gone once signed in), crew sign-in, «+», the hub; the owner's Cockpit cards; helpers in `e2e/helpers.mjs` |

Test conventions: Preact batches state, wait ~300 ms after dispatched
clicks; set input values with the native setter + `input` event; select
dialogs by content; render tests run only the built app (`npm run build`
first).

## Scripts and config

- `scripts/stamp.mjs` (build stamp + `sw.js`), `scripts/seed-emulator.mjs`
  (the fixture firm), `scripts/extract-tab.py` (cuts a tab out of the app
  file), `scripts/sw.template.js`.
- `eslint.config.mjs`, `.prettierrc`, `.prettierignore`, `.editorconfig`,
  `playwright.config.mjs`, `firebase.json` / `firebase.test.json`,
  `tailwind.config.cjs`, `.githooks/pre-commit`, `.github/workflows/`.

## Docs

- `PROJECT.md` — decisions, constraints, data model, gotchas (wins over chat).
- `docs/specs/` — one spec per change, status line at the top.
- `docs/DEVLOG.md` — one entry per commit (what, why, files, tests).
- `docs/ERROR_CODES.md`, `docs/runbooks/`, `docs/legal/`, `docs/ui-audit-checklist.md`.
- Local only (gitignored): `docs/security-audit-*.md`, `docs/engineering-audit-*.md`, `docs/value-plan-*.md`, `docs/JOURNAL.md`.
- `CHANGELOG.md` — user-facing, per release; `.githooks/pre-commit` — the failsafe.
