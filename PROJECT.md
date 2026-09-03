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

## 2. Architecture

| Piece | File | Role |
|---|---|---|
| App | `roofing-site-manager.jsx` | The whole app — one ~7,800-line React component tree |
| Translations | `i18n/<lang>.json`, `i18n/index.js` | One file per language; non-English falls back to English per key |
| Price lists | `price-list.js` | Parses supplier CSV / DATANORM into the article master |
| Mount | `entry.jsx` | Build entry; mounts `SiteManager` into `#root` |
| Shell | `index.html` | Tailwind CDN only — deliberately no app logic |
| Firebase | `firebase-client.js` | SDK boot, auth, offline cache |
| Company store | `company-store.js` | Company-scoped storage, diff writes, invites, migration |
| QR-bill | `swiss-qr.js` | Swiss QR-Rechnung payload |
| Rules | `firestore.rules` | The real access control |
| Tests | `logic.test.mjs`, `render.test.mjs`, `order-flow.test.mjs`, `rules.test.mjs` | `npm test` runs all four |
| Bundle | `bundle.js` | **Generated — never edit by hand** |
| Cache-bust | `scripts/stamp.mjs` | Stamps `bundle.js?v=<hash>` into `index.html` |
| AI proxy + files | `worker/src/index.js`, `worker/src/files.js` | Cloudflare Worker holding the Anthropic key; `/files/*` serves plans from R2. `node worker/files.test.mjs` runs it against an in-memory bucket |

**Build and deploy:**

```text
npm run build      # esbuild -> bundle.js, then stamps the hash
git push origin main   # GitHub Pages deploys from main
```

There is no CI. Pushing `main` publishes. Always run `npm run build` before
committing, or the deployed app will not contain your change.

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
| `companies/{cid}/members/{uid}` | `role: owner \| supervisor \| crew` |
| `companies/{cid}/kv/{key}` | Photos (`photo-<id>`), prefs, tech library, `site-meta`, `clock-<uid>`, `xl-<projectId>` (note translations, `{entryId: {lang: text}}`, shared so a note is translated once for the crew) |
| `users/{uid}` | Which company the account belongs to |
| `invites/{code}` | Short-lived join codes |

The app still holds `projects`, `entries`, `customers` and `documents` as
arrays in React state. `persist()` **diffs each array against the last known
one and writes only changed documents** (`syncCollection`), which is what
keeps two phones from overwriting each other. Call sites did not have to
change; do not "simplify" persist back into a single write.

**Entries** use a `type` discriminator: `time`, `material`, `tool`, `order`,
`note`, `photo`, `pickup`, `inspection`. Materials and tools shown in a
project are *filtered slices* of the entries array.

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
11. **Note translation goes through the Claude proxy, not DeepL.** DeepL's free
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
