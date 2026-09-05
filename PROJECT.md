# Site Log — project brief

Read this before changing anything. It records **what the app is, what has
been decided, and what will bite you**. Chat memory does not survive; this
file does. If chat contradicts this file, this file wins until a human
updates it.

Live: <https://abizior-coder.github.io/Site-manager/>

---

## 1. What this is

A mobile-first site log for Swiss construction / roofing crews. A worker on
a roof opens it on their phone to clock in, log what they used, photograph
a delivery, and send hours to their supervisor.

**Design consequence: the phone is the primary device, not the desktop.**
Anything that only works with a mouse is broken. Anything that needs a
steady connection or careful typing will not survive a wet Tuesday on a
roof.

Interface languages: `de, gsw, fr, it, en, sq, ro, bg, hu, pl, pt, es, sk,
cs` (German first — the primary users are German-speaking Swiss crews; the
crews themselves are often not).

Only `de`, `gsw`, `fr`, `it`, `en`, `es`, `pt`, `pl`, `sk`, `cs` and `sq` are
actually translated. `ro`, `bg` and `hu` are listed in the picker but still
fall back to English for almost everything — **finish those before telling
anyone the app speaks their language.** Albanian covers the crew-facing
surface only; the office screens fall back to English by design.

## 1a. Competitive reality (2026-09-06) — read before any product or pricing decision

`docs/research/2026-09-06_swiss-competitors.md` is the reference. The
Swiss market already has ALBAU/OF-Bau (Orbit, built for Spenglerei and
Bedachung by name), SORBA (Dachdecker/Spengler by name, DE/EN/FR/IT app),
Werkli (Dachdecker page, CHF 50–170/month, offline, QR from the Rapport),
noovi (CHF 19–49/user, AI dictation, 1000+ firms), Baunex (DE/FR/IT,
dialect voice, OCR, bexio two-way, from CHF 24/user), BRIXX (CHF 150
flat) and Technoova. Rapport, Zeiterfassung, QR-Rechnung, offline, bexio
and "AI" are table stakes there. The earlier line that Site Log is
"functionally ahead of the competition" was based on German tools and is
withdrawn; the CHF 290/firm price in the value plan is above the market.
The only visible gap is a crew interface in the crews' own languages —
a hypothesis to be tested with roofing firms before any further product
work. The roofing/Spengler sector is about 850 firms with 4,000
employees under the GAV: not a multi-million market on its own.

## 1b. Product principle: scale without the founder (owner's decision, 2026-09-06)

Site Log is built as a **scalable product**, not a service. Selling it must
never load the owner with onboarding, hand-holding or per-customer work,
and must never lower what the owner can earn per hour. Concretely:

- A new firm sets itself up, invites its crew, imports its customers and
  connects its accounting **without anyone from Site Log** (the
  onboarding spec of 2026-09-05 is the baseline; every new feature keeps
  it that way).
- Help lives in the app and in the runbooks (`docs/runbooks/`), not in
  the owner's inbox: empty states say what to do, errors carry codes,
  the Cockpit nags about backups and tokens.
- Anything that needs a manual step per customer (a setting only the
  developer can flip, a migration run by hand, a document produced on
  request) is a **defect**, not a process. Fix it in the product.
- Pricing is per firm or per seat, paid in-app or by yearly invoice;
  support is best-effort by e-mail with the SLA written down, never a
  call the owner has to take.
- Measure: the owner's time per new firm. Target zero; anything above
  thirty minutes is a bug to spec and fix.

Every spec and every Patch Advisor answer weighs the change against this
principle: does it add work per customer? Then it is not done yet.

## 2. Architecture

| Piece | File | Role |
|---|---|---|
| App | `roofing-site-manager.jsx` | The whole app — one ~7,800-line React component tree |
| Translations | `i18n/<lang>.json`, `i18n/index.js` | One file per language; non-English falls back to English per key |
| Price lists | `price-list.js` | Parses supplier CSV / DATANORM into the article master |
| Import guard | `import-guard.js` | Cuts a pasted share code or a restored backup to shape: known fields, capped sizes, fresh ids, photos re-keyed and image-only |
| Mount | `entry.jsx` | Build entry; mounts `SiteManager` into `#root` |
| Shell | `index.html` | Static Tailwind (`tailwind.src.css` → `tailwind.css`), stamped hashes, no app logic |
| Firebase | `firebase-client.js` | SDK boot (bundled from npm, pinned by the lockfile, a lazy chunk), auth, offline cache |
| Company store | `company-store.js` | Company-scoped storage, diff writes, invites, migration |
| QR-bill | `swiss-qr.js` | Swiss QR-Rechnung payload |
| Rules | `firestore.rules` | The real access control |
| Tests | `logic.test.mjs`, `render.test.mjs`, `order-flow.test.mjs`, `dock.test.mjs`, `rules.test.mjs`, `worker/*.test.mjs` | `npm test` runs them all; `npm run lint` and `npm run format:check` run first in CI |
| Tooling | `eslint.config.js`, `.prettierrc`, `.editorconfig`, `.nvmrc` | ESLint recommended + JSX, Prettier at 120 columns, Node 24 |
| Bundle | `bundle.js` | **Generated — never edit by hand** |
| Cache-bust | `scripts/stamp.mjs` | Stamps `bundle.js?v=<hash>` into `index.html` |
| AI proxy + files | `worker/src/index.js`, `worker/src/files.js`, `worker/src/limits.js` | Cloudflare Worker holding the Anthropic key; `/files/*` serves plans from R2. Every proxy call names the company it is charged to; membership is checked as the caller and three KV caps apply (20/min/account, 200/day/account, **600/day/company** — the one that protects the bill, since a company takes an invite to enter). `npm run test:worker` |

**Build and deploy:**

```text
npm run build      # esbuild -> bundle.js, then stamps the hash
git push origin main   # CI, then (green only) the Pages deploy
```

Pushing `main` runs CI (`.github/workflows/ci.yml`, every suite incl. the
rules emulator); **the Pages deploy runs only after CI is green for that
commit** (`pages.yml` on `workflow_run`, checkout of the tested sha; a
manual `workflow_dispatch` stays possible). Always run `npm run build`
before committing — both workflows refuse a stale `build/`.

> **A successful push does not mean the site deployed.** GitHub Pages builds
> separately and can fail while the repository looks perfectly healthy — it
> did, silently, for two commits, and the live site served a 404 the whole
> time while the code was correct. `.nojekyll` removes the step that was
> failing (this is a plain static site; Jekyll only adds a way to break).
> After pushing anything beyond app code, check the build rather than
> assuming propagation delay:
>
> ```text
> gh api repos/abizior-coder/Site-manager/pages/builds --jq ".[0].status"
> ```

### Services

| Service | Identifier | Notes |
|---|---|---|
| Firebase | project `site-log-ab6a9` | Firestore only. **Spark (free) plan** |
| Cloudflare Worker | `site-log-claude-proxy.abizior.workers.dev` | Secret: `ANTHROPIC_API_KEY` |
| Weather | Open-Meteo | `meteoswiss_icon_ch1` model, falls back to default |

## 2b. Engineering standard (owner's decision, 2026-09-05)

Every change from here on is made **as a software engineer holding industry
standards**, not as a quick fix. A change is done only when:

- it has a spec in `docs/specs/` with goal, constraints, definition of done;
- pure logic lives in a tested module, not in the app component; money,
  hours and dates have unit tests;
- every suite is green locally (`node <suite>.test.mjs`, exit codes checked)
  and in CI; the Pages deploy runs only after green CI;
- it is verified on the emulator and, after deploy, on production;
- it meets the accessibility bar: accessible names on controls, dialog
  semantics on modals, at least 24 px (target 44 px) touch targets, at least
  12 px type, `lang` correct, focus visible;
- dates are local calendar dates, instants are UTC; ids come from
  `crypto.randomUUID()`; personal data never leaves the app to an undeclared
  third party;
- the first paint stays under the 350 KB budget (own code) and the SDK is
  pinned;
- the change is recorded: spec status, `docs/JOURNAL.md`, CHANGELOG entry
  once it exists, a semver tag per deploy once tagging exists.

The engineering audit of 2026-09-05 (`docs/engineering-audit-*.md`, local)
lists what is still below this bar and the order to close it.

### The gate before every commit (owner's decision, 2026-09-06)

Two roles look at every change before it is committed:

1. **Interface engineer** (a subagent with the brief in
   `docs/ui-audit-checklist.md`): walks the built app on the emulator as
   owner and as crew at 375 px and 1280 px, checks every tab, modal, list,
   report view, loading, empty and error state against the checklist,
   writes findings to `docs/ui-audit-<date>.md`, and fixes display bugs in
   the industry-standard way — without committing.
2. **Software engineer**: reviews the diff against the spec, runs the
   failsafe, verifies on the emulator, commits and deploys.
3. Both check the change against section 1b: no new manual step per
   customer, no dependence on the owner at run time.
4. Every commit carries an entry in `docs/DEVLOG.md` (the hook refuses a
   source change without one) and keeps `docs/CODE_MAP.md` true (a logic
   test names every source file). Both are the model's source of truth at
   the start of a session — read them instead of searching.

The technical failsafe is the git hook `.githooks/pre-commit`
(`npm run prepare` points git at it; `npm run precommit` runs it by hand):
lint, format check, build, the logic/render/order/dock suites and the
Worker suites must be green, and the build output is staged with the
commit. The rules emulator and the Chromium e2e run in CI.

## 3. Hard constraints

- **No Firebase Blaze plan.** Cloud Functions are therefore unavailable
  (they need Blaze for outbound calls). That is *why* the Claude proxy is a
  Cloudflare Worker and not a Firebase Function. Do not "simplify" it back.
- **GitHub Pages is static.** No server, no secrets, no env vars in the
  page. Any API key must live behind the Worker.
- **The Anthropic key is never in the repo or the client.** It exists only
  as a Cloudflare secret (`wrangler secret put ANTHROPIC_API_KEY`).
- The Anthropic API bills separately from any claude.ai subscription and
  needs its own prepaid credit balance.

## 4. Data model

Everything is scoped to a **company**, not to a person. Storage lives in the
bundle (`firebase-client.js`, `company-store.js`), never in `index.html`.

| Path | Contents |
|---|---|
| `companies/{cid}/projects/{id}` | One document per project |
| `companies/{cid}/entries/{id}` | One per entry, each carrying `userId` |
| `companies/{cid}/customers/{id}` | One per customer, with `contacts` history |
| `companies/{cid}/documents/{id}` | Quotes and invoices — **owner only** |
| `companies/{cid}/files/{id}` | Plans and documents on a job — **metadata only**: `name, size, type, kind (plan\|offer\|contract\|delivery\|photo\|other), projectId, uploadedBy, createdAt`, or `url` for an external link. The bytes live in **Cloudflare R2** (`site-log-files`, key `companies/{cid}/files/{id}`) behind the Worker's `/files/{cid}/{projectId}` (POST), `/files/{cid}/{id}` (GET, DELETE). The Worker checks membership on every call by reading `/members/{uid}` **as the caller** through the Firestore REST API — the rules are the check, no service account. 25 MB per file, executables refused. Members read; create needs `uploadedBy == auth.uid`; delete by a manager or the uploader (same rule in Firestore and in the Worker). |
| `companies/{cid}/sentReports/{id}` | Reports sent to a supervisor. **One per person, period and day** (`id = userId-period-periodLabel`); a re-send appends to `sends`, never a second record. Carries `entryIds` (+ `entryLabels`, `excludedIds`), not copies — rendered by joining the live log (`reports.js`). Pre-model reports still carry `entries` and render from those. Monthly = the month minus what daily reports already sent (owner's decision, 2026-09-02). |
| `companies/{cid}/assignments/{id}` | Who works where on a given day — members read, managers write. **Several per person and day are normal** (morning on one roof, afternoon on another); a drop adds, a click on a chip removes that one. The day is started *inside the job* (`startDayOn`), not from a list on Today — the Polier assigns, the worker opens the job and taps. |
| `companies/{cid}/leave/{id}` | Absences — anyone raises their own, only a manager decides |
| `companies/{cid}/private/finance` | Labour rate, IBAN, billing — **owner only** |
| `companies/{cid}/members/{uid}` | `role: owner \| supervisor \| crew`, `active` — **`active: false` is not a member** (rules, Worker and `loadMembership` agree); the owner removes people from the Team tab, the document stays so their entries keep a name |
| `companies/{cid}/kv/{key}` | Flat keys, **rules by prefix and caller** (since the 2026-09-03 audit): `site-profile-<uid>`, `site-docs-<uid>`, `site-dock-pins-<uid>`, `site-lang-<uid>`, `clock-<uid>` are the person's alone (managers may *read* clocks); `photo-<id>` carries `by` (creator) and only they or a manager may change/delete it, `kind: 'signature'` is immutable; `site-material-catalog`, `site-tech-library`, `site-langs` (`{uid: lang}`, translation targets), `xl-<projectId>` (note translations) are member-written; anything else is managers'. Values ≤ 1 MB. **Listing the collection is refused** — read keys by name (the dashboard reads `clock-<uid>` per member). |
| `users/{uid}` | Which company the account belongs to |
| `invites/{code}` | Join codes, **3 days, one person each**: joining is one batch (membership + `users` record + `usedBy`), and the rules check it as one — `getAfter` on the invite, `existsAfter` on the membership. Nothing else can mark a code used. |

The app still holds `projects`, `entries`, `customers` and `documents` as
arrays in React state. `persist()` **diffs each array against the last known
one and writes only changed documents** (`syncCollection`), which is what
keeps two phones from overwriting each other. Call sites did not have to
change; do not "simplify" persist back into a single write.

**Entries** use a `type` discriminator: `time`, `break`, `material`, `tool`,
`order`, `transport`, `note`, `photo`, `pickup`, `inspection`. Materials and
tools shown in a project are *filtered slices* of the entries array.
An `inspection` carries `checklist` (item → `ok`/`mangel`), `tiles[]`
(`{model, count}` against `roof-tiles.js`), `wasteKg`, `areaM2`; it starts from
the job view and can be saved without the AI. A `transport` carries the trip
(`vehicle, from, to, departTime, arriveTime, hours, km, loadKind, weightKg,
mulde, disposalSite`); its hours are reported apart from worked hours, and a
waste trip is offered the job's inspection waste not yet carried
(spec: `docs/specs/2026-09-03_inspection-and-transport.md`).

Every material, tool and hour also carries a **`trade`** (`steildach`,
`flachdach`, `spengler`, `holz`, `geruest`, `unterhalt`, `other`) and,
optionally, `supplier` and `artNo`. A Swiss roofing job is several trades
sharing one address, costed separately; the job view groups by trade once
more than one is on site.

An **`order`** entry is a material request with `orderStatus`: `requested` →
`ordered` → `delivered`. Marking it delivered rewrites the entry to
`type: "material"`, which is what puts it into costing. Do not "tidy" orders
into their own collection — the rules already let crew create their own
entries, and a separate collection would need its own.

The **dock** is the tray of job tiles at the bottom of every screen: jobs
with status `construction` plus the ones this account pinned
(`personalKey("site-dock-pins")` — pins are personal, not company-wide). It
takes real height in the main column rather than floating, so nothing
scrolls under it. Tiles accept two drag payloads: `text/member-uid` (a
person → the job's crew, managers only) and `text/material` (JSON
`{name, kind, qty?, unit?, basketId?}` → a material/tool entry through
`newEntry()`, unit/price/supplier/article number filled from the article
master, filed under the job's dominant trade). The payload is always a
name, never an index — the basket re-renders between dragstart and drop.
Touch has no HTML5 drag, so on a phone the tiles are shortcuts and the
basket picker stays.

**Photos** open full-screen (pinch/scroll zoom) and can be marked up (pen,
arrow, box, circle, text) in a canvas editor. A marked-up photo is a **new**
`photo-<id>` document; the entry's `photoId` moves to it and the original is
kept in `originalPhotoId` so it can be restored. The pen is offered only to
the entry's author or a manager — the same people the rules let update the
entry — so nobody draws for a minute and is told "could not save" at the end.

The **article master** (`site-material-catalog` in `kv`) holds what each
material name knows about itself: unit, price, supplier, article number. It
replaced two parallel maps (`site-material-units`, `site-material-prices`),
which are folded into it on first load. A price-list import writes into it.
Filling a form from it only ever touches blank fields.

> **Build every entry through `newEntry()`.** The rules reject a create whose
> `userId` is not the signed-in user, so an entry object assembled by hand is
> silently refused. This already broke clock-out, AI scans, inspections,
> pickup codes, basket transfer and project import at once.

> The clock is **per person** (`clock-<uid>`), not per company.

> Reordering a slice must write the new order back into **only the array
> slots that slice occupies** — see `reorderEntries`. Rebuilding the array
> naively will scramble time entries and other projects.

**Customers** are first-class records holding contact details plus a
`contacts` history (calls, visits, emails, notes, each with an optional
`followUp` date). Projects reference one via `customerId`. The legacy
free-text `project.client` is still written for older code paths, but the
customer link is the source of truth — `migrateClientsToCustomers` promotes
any project that still has only a string, once, on load.

> Client strings were migrated by exact (case-insensitive) name match, so
> spelling variants became separate customers — real data produced both
> "Susan & Peter" and "Susan&Peter". There is **no merge feature yet**;
> deliberately not auto-merged, because two similar names can be two
> different people.

Projects carry `category` (`PROJECT_CATEGORIES`) and `status`
(`PROJECT_STATUSES`: lead / quoted / waiting / construction / hold / completed / lost). Projects
saved before statuses existed have no `status` field and must read as
`waiting` — always go through `statusMeta(p.status || DEFAULT_PROJECT_STATUS)`.

## 5. Known problems — read before planning work

These are real and currently unfixed. Ordered by how much damage they do.

1. **Old public data still sits in `local/*`.** Rules deny it to everyone, so
   it is unreachable rather than exposed, but it has not been deleted. Remove
   the `local` collection in the Firebase console once you are satisfied the
   company copy is complete.
2. **A shared project's photos are unreadable to the recipient.** Share codes
   carry `photoId` references, and those documents belong to the sending
   company. Fixing it needs cross-company sharing, which does not exist. The
   downloadable backup does include photos.
3. **Real jobs already run through this app.** Treat it as production, not
   a prototype: a careless migration loses someone's working week. Still
   untried by anyone: the AI scan and inspection flows (they need a real photo
   and cost real API credit), printing a QR-bill, and the supervisor webhook.
4. **Romanian, Bulgarian and Hungarian are in the language picker but not
   translated.** They fall back to English. Either finish them or take them
   out of the picker — offering a language and then not speaking it is worse
   than not offering it.
5. **The CPR and emergency first-aid strings have never been checked by a
   native speaker** in any language but German. They are translated rather
   than left in English, on the grounds that imperfect Albanian beats
   unreadable English in an emergency, but this is a judgement call that
   deserves a real review.
6. **The price-list import reads DATANORM by a published field order that
   has not been checked against a real merchant file.** Field order varies
   between wholesalers. The import previews and warns before writing; keep
   both. CSV is the tested path.
7. **HGC offers OCI free to any shop customer** (article number, name,
   quantity, *your* net price, product hierarchy). Their net-price ERP
   interface is *not* open — it is limited to AbaBau, BauBit PRO and Sorba.
   OCI returns the basket as an HTTP POST, which a static GitHub Pages site
   cannot read; the existing Cloudflare Worker would have to receive it and
   hand it over. Not built: it needs an HGC OCI access, which the owner must
   request with their customer number.
8. **`sentReports` created before 2026-09-02 have no `userId`** — the app
   never set one, and the rules require it on create, so those sends were
   refused and never stored (the mail still opened). Anything you see from
   before that date came through the old `site-meta` migration. Fixed in
   `sendReportToSupervisor`; nothing to migrate because nothing was written.
9. **Files need the R2 bucket bound and the Worker deployed** (`worker/wrangler.toml`,
   `npx wrangler deploy` from `worker/`). Without the binding the Worker answers
   503 and the app says "Dateiablage ist noch nicht eingerichtet" instead of
   spinning. R2 is on the Cloudflare free tier (10 GB, zero egress) but needed a
   payment method on the account to enable. Firebase Storage was ruled out:
   the Spark plan has had no buckets at all since February 2026.
10. **The emulator cannot exercise uploads.** The Worker verifies ID tokens
   against Google, and emulator tokens are not real, so plans can only be
   tested end to end in the live app with a real account. The Worker's own
   suite covers routing, limits and who-may-delete with a fake bucket.
11. **Notes are translated on save, automatically, into the languages the crew reads** — the set of UI languages found in the members' `site-lang-<uid>` kv keys, plus the reader's and German. One proxy call per note returns all of them as JSON; the result is cached in `xl-<projectId>` and shown under the original for every reader. The per-note button remains for a language that joined later. Translation goes through the Claude proxy, not DeepL. DeepL's free
   API could not be relied on (its Free plan is reported closed to new
   sign-ups, and Albanian/Swiss German support was uncertain); the Worker we
   already run handles all 14 UI languages, is signed-in and rate-limited
   (200 calls/day/account, shared with scans), and costs about a tenth of a
   Rappen per note. Swap the backend inside `translateNote` if DeepL is ever
   wanted; the cache and UI do not care.
12. **No merge for duplicate customers.** Migrated client strings produced
   spelling variants as separate records. Deliberately not auto-merged,
   because two similar names can be two different people.
13. `roofing-site-manager.html` was an unused stale duplicate and has been
   deleted.

### Data safety

`syncCollection` diffs the app's arrays against the last known state, which
is what stops two phones overwriting each other — and also means **a stale
array deletes real records**. Two guards exist and should stay:

- `persist()` refuses to run before the first load has landed, when the
  arrays are empty or partial.
- `syncCollection` refuses to delete more than a handful at once, or to act
  on an empty array against populated data, and reports instead.

If either guard fires it means something upstream is wrong. Do not raise the
threshold to make the message go away.

## The desktop layout

The phone layout is right for a roof and wrong for a desk. On a phone the
navigation is a hamburger in the header (a drawer with every tab); the bottom
edge belongs to the dock. Above 1024px the same app rearranges: a sidebar
appears, dialogs centre instead of rising from the bottom edge, and the
overview becomes a three-column grid.
One codebase, Tailwind `lg:` breakpoints — **do not fork a desktop build**.

`board` is the desktop command centre for managers: the month with each day
carrying the colour of what is planned on it, and beneath it the jobs as a
tree that opens into hours, material, tools, photos, Regie and Rapporte.
Projects keep a stable colour derived from their id (`projectColour`), so the
same job looks the same everywhere.

### Running the app locally as every role

The authenticated app cannot be reached from a signed-out browser, which is
why several bugs reached users instead of tests. To drive it for real:

```text
npm run emulators     # auth + firestore, needs Java
npm run seed          # wipes and seeds a company, chef, Polier, two crew
python -m http.server 5566
# then open http://localhost:5566/index.html?emulator=1
```

Accounts are `chef@test.local`, `polier@test.local`, `crew1@test.local`,
`crew2@test.local`, password `test1234`. All disposable localhost fixtures;
nothing touches production.

Emulator mode is opt-in via `?emulator=1` **and** only on localhost, so a
deployed page can never be pointed at a local emulator. Offline persistence
is disabled there, or a cache surviving between runs would make results
depend on the previous run.

> The seed deliberately goes through the real flows — invites are redeemed by
> the invitee, entries and leave are written by their own author — because the
> rules reject every shortcut. If seeding fails, the rules changed.

### Swiss QR-bill

`swiss-qr.js` builds the QR-Rechnung payload: **31 lines terminated by `EPD`**,
per the SIX implementation guidelines. Field *order and count* are what make it
scannable — the seven blank ultimate-creditor lines are load-bearing, and
removing them shifts every later field so banks reject the bill.

- The QR is rendered **locally** (`qrcode` package). Never move this to a QR
  image service: the payload carries an IBAN plus the customer's name and
  address.
- `SCOR` requires a real ISO 11649 reference. Passing a bare invoice number
  produces a bill that scans and is then rejected — `buildQrPayload` formats
  it unless an `RF…` reference is supplied.
- The payment part is printed **only** when `validateBillingProfile` passes.
  A QR-bill with a wrong IBAN scans perfectly and sends money to the wrong
  account, so no slip is much better than a plausible one.
- Verified by decoding a generated QR back to the exact payload. **Not
  verified against a bank** — before sending real invoices, run a sample
  through the official SIX validation portal.
- VAT rates in `VAT_RATES` are the 2024 federal rates. They have changed
  before; check estv.admin.ch rather than trusting the constant.

## 6. Gotchas that have already cost time

- **`index.html` and `bundle.js` cache independently.** A phone once ran new
  bundle code against a months-old cached `index.html`, so a global defined
  in the HTML was missing and every AI scan failed with
  `window.callClaude is not a function`. **Therefore: app logic must not
  depend on globals injected by `index.html`.** The Claude call now lives in
  the bundle (`CLAUDE_PROXY_URL`). Keep it that way.
- **Never store an image inside one of the JSON blobs.** Firestore allows
  1 MB per document, and a scaled photo is 200–500 KB, so a couple of inline
  photos used to push `site-data` over the limit and make every later save
  fail — silently, because `persist()` sets React state before writing.
  Photos now go through `savePhoto` / `loadPhoto` into their own
  `photo-<id>` documents; records hold a `photoId`. Legacy inline `photo`
  fields still render, via `StoredImage`.
- **Phone photos cannot be sent raw.** The vision API rejects images over
  ~5 MB of base64, and iPhone HEIC is not an accepted format. Every image
  goes through `fileToScaledImage` (canvas re-encode, max 1568 px, JPEG
  0.85), which fixes size *and* format. Do not bypass it.
- **Never persist `URL.createObjectURL()` output.** A `blob:` URL dies with
  the page session, so stored photos showed as broken after reload and never
  reached other devices. Store data URLs.
- **Touch has no HTML5 drag-and-drop.** Reordering uses pointer events
  (`ReorderList`), dragged from a grip handle only so rows stay tappable and
  the list still scrolls.
- **Scan failures show a friendly message that hides the cause.** A small
  technical line (`errDetail`) shows the real error, image count, payload
  size and build hash underneath. It exists because guessing wasted hours —
  leave it in.
- **Offline persistence hides server rejections.** `setDoc` resolves as soon
  as the write is queued locally, so a rules denial surfaces later as a silent
  rollback. Onboarding once appeared to succeed and then didn't. For anything
  that must be true before the app moves on, read it back with
  `getDocFromServer` rather than trusting the write.
- **Rules tests must cover the founding case.** Seeding members with rules
  disabled hid a rule that required `isOwner()` to create the owner's own
  membership — so a new owner had to already be an owner, and creating a
  company was impossible. Test the paths where *nothing exists yet*: they are
  exactly the ones a seeded fixture skips. The same pass caught deletes
  failing because `request.resource` is null on a delete.
- **Testing hits live production data.** There is no staging Firestore
  project. Snapshot before, restore after, or add a test project.

## 7. Working agreement

- Non-trivial work gets a short spec in `docs/specs/` first: **Goal,
  Constraints, Definition of done, Out of scope.** Plan, get agreement,
  then implement.
- Do not expand scope mid-change ("while I'm here…"). Open a new spec.
- Small commits explaining *why*, not what.
- Before claiming done: `npm run build` must pass, and the change should be
  exercised in a browser — this app has no test suite.
- Durable decisions and new gotchas go in this file. One-off errors and
  transient noise do not.

## 8. Accuracy rules

- Yahoo-style "it worked on my machine" is not verification — this app's
  failures have been device- and cache-specific every single time.
- Do not claim a feature works without having exercised it. Much of the
  app (reports, sharing, backup codes, calendar, safety) has **never been
  systematically tested**.
- The AI scan is an estimate. Never present its material quantities as
  authoritative for billing.
- Safety content (SUVA / BauAV, CPR) is a summary only. The binding text
  governs and can change. Do not reword it to sound more definitive.

## Module map (since 2026-09-03)

The full map lives in **`docs/CODE_MAP.md`** (every file, what it holds,
the handlers inside the app component, test hooks, commands) and is kept
current with every commit; a logic test fails when a source file is not
named there. `docs/DEVLOG.md` holds one entry per commit. Read both
before searching the code.

Rules for the next cut: a tab component renders only; handlers and state
stay in `roofing-site-manager.jsx` until a real store exists. Shared
pieces go to `ui/`, never the other way round. `fmtHM` is re-exported from
the monolith because the logic tests import it from there.

**Usage metrics** are counts per company and day — event names such as
`open`, `entry.material`, `report.sent`, `rapport.sign`, `file.upload`,
`translate` — plus a 12-hex hash per active account. No text, no site, no
name. The owner sees them on the Cockpit ("Nutzung").

**Build (since 2026-09-03 evening):** `npm run build` writes `build/bundle.js`
plus hashed chunks (esbuild `--splitting`), `tailwind.css` (Tailwind 3.4 CLI
from the classes the JSX uses, `lg` at 900px) and stamps both into
`index.html`. The shipped UI runtime is **Preact through `preact/compat`**
(esbuild aliases in the build script); React stays installed for the
harnesses' `REACT=1` opt-out. Languages load per file (`loadLang`), English
and German before the first paint. The first paint is the entry plus its
static chunks — 319 KB on 2026-09-03 — and a logic test fails the suite
above 350 KB. `qrcode` loads when a bill is drawn. The old play-CDN Tailwind
is gone (audit L1 closed).

One Preact difference matters for tests: state set in an input event
renders a tick later than in React, so a test must wait a moment between
typing and clicking. A person cannot click that fast.

**Offline shell (since 2026-09-04):** `sw.js` is generated by
`scripts/stamp.mjs` on every build from `sw-routes.js` (routing, unit-tested)
and `scripts/sw.template.js` (the worker body). It precaches the first
paint -- shell, stylesheet, entry, its static chunks, English and German --
under a cache named by a version that turns with the file list and the
worker code; other chunks and the Firebase SDK from gstatic are cached on
first use; Firestore, Auth, the Worker and the weather are never touched.
A new build takes over with `skipWaiting` + `clients.claim`, and the app
shows a restart bar (`site-log:update` event) rather than reloading under
someone's fingers. A language chosen offline that was never loaded is
refused with a toast and the current language stays. Registration happens
after the first paint, on https or localhost only. Firestore's own
persistent cache does the data side, as before.

**DSG paperwork (since 2026-09-04):** `docs/legal/` holds the
Datenschutzerklärung (also served as `datenschutz.html`, linked from the
sign-in screen and Mein Profil), the AVV template with Anhänge
(Gegenstand, Subprozessoren, TOM), the Verzeichnis der
Bearbeitungstätigkeiten and the Subprozessoren list. Operator named in
all of them: Andrzej Bizior, Si‑Ma, Birmensdorf. Every fact in them is
taken from the code (what goes where, how long it stays); when the code
changes one of those facts, the documents change with it, and a logic
test keeps the page and the markdown on the same date. Two follow-ups
sit with the owner: confirm the Firebase region in the console, and have
a Datenschutzberater read the set before the first pilot.

**Errors (since 2026-09-04):** every failure a person sees goes through
`showError(e, context)` and appears as one panel in the middle of the
screen with a code (E1x save, E2x photo, E3x AI, E4x language, E5x files,
E9x other), the meaning in German or English, the raw detail and the
build. `errors.js` classifies by the error's shape; `docs/ERROR_CODES.md`
explains every code and a logic test keeps the two in step. The toast at
the top is for successes. Mein Profil shows the build and has "App neu
laden" (unregister workers, drop caches, reload) for a phone stuck on an
old version.

**Layout since 2026-09-04 (from `docs/research/2026-09-04_competitor-ux.md`):**
on a phone a bottom bar `Heute · Baustellen · + · Rapport · Mehr`
(`data-tab-bar`); the «+» sheet (`data-quick-add`) opens the composers
for the current site; «Mehr» is the drawer. The Rapport tab has Tag
(hours split Normal / Überstunden / Reisezeit against weeklyHours/5,
`reports.js: splitDayHours`), Woche (`weekRows`, CSV via `weekCsv`) and
Monat. The job view is a hub (`data-hub-tab`): Übersicht · Zeiten ·
Material · Fotos · Pläne · Rapporte · Chat; tests that look for a job's
materials, plans or photos must open that tab first.

**CI** (`.github/workflows/ci.yml`) runs every suite, rules included, on
every push and pull request; the Pages deploy still checks that the
committed bundle matches the source.

**Languages:** all 14 files carry every key (a logic test guards it);
RO/BG/HU were completed on 2026-09-03; the SUVA safety texts exist in
every language. Albanian still shows English on the manager-only screens.
