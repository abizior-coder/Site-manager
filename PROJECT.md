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

Interface languages: `de, fr, it, en, es, pt, pl, sk, cs` (German first —
the primary users are German-speaking Swiss crews).

## 2. Architecture

| Piece | File | Role |
|---|---|---|
| App | `roofing-site-manager.jsx` | The whole app — one ~4,700-line React component tree |
| Mount | `entry.jsx` | Build entry; mounts `SiteManager` into `#root` |
| Shell | `index.html` | Tailwind CDN + Firebase Firestore shim (`window.storage`) |
| Bundle | `bundle.js` | **Generated — never edit by hand** |
| Cache-bust | `scripts/stamp.mjs` | Stamps `bundle.js?v=<hash>` into `index.html` |
| AI proxy | `worker/src/index.js` | Cloudflare Worker holding the Anthropic key |

**Build and deploy:**

```text
npm run build      # esbuild -> bundle.js, then stamps the hash
git push origin main   # GitHub Pages deploys from main
```

There is no CI. Pushing `main` publishes. Always run `npm run build` before
committing, or the deployed app will not contain your change.

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

All persistence goes through `window.storage`, defined in the **bundle**
(`firebase-client.js`, wired up in `entry.jsx`) — not in `index.html`.
Every document is scoped to the signed-in account at
**`users/{uid}/kv/{key}`**, and reads/writes throw while signed out.
`firestore.rules` enforces that server-side; the client cannot bypass it.

| Key | Contents |
|---|---|
| `site-data` | `{ projects, entries, customers, documents, activeClock, leaveRequests, sentReports }` — **as a JSON string** |
| `site-billing` | Company name, address, IBAN, VAT number, payment term |
| `site-material-prices` | Remembered unit price per material name |
| `photo-<id>` | **One document per photo** (data URL). Referenced by `photoId` |
| `site-profile` | User + supervisor details, webhook URL |
| `site-docs` | `{ insurance, certificates }` |
| `site-tech-library` | Scanned spec-sheet entries |
| `site-material-units` | Remembered unit per material name |
| `site-lang`, `site-weather-loc` | Preferences |

**Entries are one flat array** with a `type` discriminator:
`time`, `material`, `tool`, `note`, `photo`, `pickup`, `inspection`.
Materials and tools shown in a project are *filtered slices* of this array.

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
(`PROJECT_STATUSES`: waiting / construction / hold / completed). Projects
saved before statuses existed have no `status` field and must read as
`waiting` — always go through `statusMeta(p.status || DEFAULT_PROJECT_STATUS)`.

## 5. Known problems — read before planning work

These are real and currently unfixed. Ordered by how much damage they do.

1. **Old public data still sits in `local/*`.** Rules now deny it to
   everyone, so it is unreachable rather than exposed, but it has not been
   deleted. Remove it from the Firebase console once you are satisfied the
   imported copy under your account is complete.
2. **Whole-document writes.** Every change rewrites all entries, so two
   phones editing concurrently silently clobber each other. Fix: split into
   `projects/{id}` and `entries/{id}` collections.
3. **The Worker has no rate limit.** It caps images per request
   (`MAX_IMAGE_BLOCKS = 4`) but nothing stops repeated calls running up the
   Anthropic bill. It is a public endpoint.
4. **Backup and share codes do not carry photo contents.** They reference
   `photoId`s, so a backup restored where those photo documents are not
   readable will show empty images. Acceptable while everything lives in one
   Firestore project; revisit alongside auth.
5. `roofing-site-manager.html` is an unused stale duplicate of the shell.
   It is not the deployed entry point (`index.html` is) and can be deleted.

### Changing security rules

`firestore.rules` is the real access control — the app UI is not. Hiding a
panel is not permission; a crew member with the browser console must still be
unable to read the labour rate.

There is a test suite. **Run it after any rules change:**

```text
npm run test:rules
```

It asserts what the server allows: crew cannot read invoices or finance,
cannot edit another person's hours, cannot promote themselves, and expired or
forged invite codes are rejected. Requires Java (Temurin JRE) for the
Firestore emulator.

Then deploy and re-check from a real browser:

```text
firebase deploy --only firestore:rules
```

A rules file that deploys cleanly but does not deny is worse than none,
because it creates false confidence.

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
