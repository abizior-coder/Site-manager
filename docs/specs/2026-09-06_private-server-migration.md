# Site Log on a private server — migration plan

**Status: proposed 2026-09-06 — needs the owner's acceptance of the phases,
the provider and the budget before any code.** Owner's ask: "migrate the
entire suite to a private server so all constraints regarding database and
file sizes are avoided."

## Goal

Run Site Log on infrastructure we control — one private server in
Switzerland (or the EU) with PostgreSQL for data, an object store for files
and photos, and our own API — so that no document, photo, file or company is
limited by a hosting tier, and so that server-side work the product needs
(billing, ownership transfer, company deletion, exports) runs where it
belongs instead of in a Worker with a KV store. Real jobs run on the app
today: the migration loses nothing and never puts a crew in front of an
empty screen.

## What limits us today, and what removes each limit

| Constraint now | Where it bites | After the migration |
|---|---|---|
| Firestore document ≤ 1 MiB; kv values ≤ 1 MB (rules), photos scaled to ≤ 900 KB data URLs, personal kv ≤ 256 KB | photos lose detail; catalogues and translation caches must stay small; a big backup cannot be stored | photos and blobs go to the object store as originals (JPEG/HEIC at full size, plus a thumbnail); rows in PostgreSQL have no practical size cap (JSONB up to 1 GB) |
| Firebase Spark quotas: 1 GiB stored, 50k reads / 20k writes / 20k deletes per day, no Cloud Functions, no Storage buckets | the free tier is shared by every firm; a busy month of pilots can hit the daily read quota; no server-side code | our PostgreSQL, our disk; server-side code is ordinary API code |
| Files ≤ 25 MB through the Worker; R2 free tier 10 GB per account | large plans (DWG/PDF scans, drone videos) refused; 10 GB across all firms | per-file cap set by us (start 500 MB, streamed uploads, resumable); disk sized per need (100 GB block storage, grows) |
| Worker KV as the only server state (bexio tokens, metrics, errors, the planned Abo) | eventual consistency, 25 MB values, no queries, no joins | PostgreSQL tables with proper queries, transactions and backups |
| Firestore rules as the only authorisation | every rule is a string in a DSL that only the emulator tests | authorisation in the API in one tested module, same roles (owner / supervisor / crew) |
| Emulator cannot exercise uploads (Worker verifies real tokens) | e2e cannot cover files | the whole stack runs in Docker locally and in CI; e2e covers uploads |
| Data at Google (Firestore region set by Firebase) and Cloudflare (R2, Worker) | Datenschutzerklärung names two US providers | one Swiss (or EU) provider; the subprocessor list shrinks to one host plus Anthropic for the AI calls |

## Target architecture

One server, everything in Docker Compose, reproducible from the repo:

- **Caddy** — TLS (Let's Encrypt), serves the static app (`build/`,
  `index.html`, `sw.js`) and reverse-proxies `/api`. GitHub Pages can stay
  as a mirror during the transition; the custom domain points at the server.
- **API** — Node 24, Fastify, ES modules like the app. Endpoints per
  company: collections (projects, entries, customers, documents, files
  metadata, assignments, leave, reports, sentReports, members, invites, kv),
  a change feed, uploads, exports, and everything the Worker does today
  (AI proxy with the same limits, metrics, crash reports, bexio, the Abo).
  Authorisation in one module (`server/src/authz.js`) mirroring
  `firestore.rules`, unit-tested with the same cases as `rules.test.mjs`.
- **PostgreSQL 16** — one table per collection with `company_id`, `id`,
  `data JSONB`, `updated_at`, `updated_by`, `deleted_at`, plus a
  `changes` table (company, seq, table, id, op, at) that drives live sync
  and offline catch-up. Indexes on `(company_id, updated_at)`.
- **Object store** — MinIO (S3-compatible, on the same server, on a block
  storage volume) for files and photo originals; keys
  `companies/<cid>/files/<id>` and `companies/<cid>/photos/<id>`. Thumbnails
  made on upload (sharp). Presigned URLs for direct download.
- **Auth** — phase 1–2 keep Firebase Auth (no re-registration, the API
  verifies the ID token with Google's public keys exactly as the Worker
  does). Phase 3 replaces it with self-hosted auth (Better Auth on the API:
  e-mail + password with Argon2id, sessions, password reset by e-mail via
  the provider's SMTP), with a one-time migration that asks each person to
  set a password once; Firebase Auth is then switched off.
- **Sync** — the app keeps its arrays and `persist()`; the store behind
  `company-store.js` changes from the Firestore SDK to the API: `GET
  /api/c/<cid>/<collection>?since=<seq>` for catch-up, Server-Sent Events
  `/api/c/<cid>/events` for live changes (replacing `onSnapshot`), writes
  as `PUT`/`DELETE` with `updated_at` for conflict detection (last write
  wins per document, as Firestore did; a conflict on an entry covered by a
  sent Rapport keeps history as `entries-history.js` already does).
  Offline: the existing IndexedDB upload queue grows into a write queue for
  documents; reads come from an IndexedDB mirror of the last sync (the
  role Firestore's persistent cache plays now). No third-party sync engine
  in the first version; ElectricSQL or PowerSync remain the fallback if the
  custom feed proves insufficient.
- **Ops** — nightly `pg_dump` + MinIO snapshot to an off-site bucket
  (restic, encrypted), tested restore in a runbook; uptime check
  (external), logs to journald with 30-day retention, unattended OS
  updates, firewall (22 with key only, 80, 443), fail2ban. No per-customer
  step anywhere (PROJECT.md §1b): a new firm is a row.

## Provider and cost (owner's decision)

| Option | Location | Size for ≤ 50 firms | Cost | Note |
|---|---|---|---|---|
| Infomaniak Public Cloud / VPS | Geneva (CH) | 2 vCPU, 4 GB, 100 GB | ≈ CHF 15–30 / month | Swiss, DSG-friendly, S3-compatible storage available |
| Exoscale | Zürich / Geneva (CH) | same | ≈ CHF 25–40 / month | Swiss, mature, object storage (SOS) |
| Hetzner Cloud | Germany / Finland (EU) | CX32 + volume | ≈ EUR 12–20 / month | cheapest; EU with SCC, not Swiss |

Recommendation: a Swiss provider — the Datenschutzerklärung then names one
Swiss host, which is a selling point for Swiss roofing firms. Budget for
year one including off-site backups: under CHF 500.

## Phases (each gets its own spec, tests and rollout note)

**Phase 0 — seams and a local stack (1–2 days).** `company-store.js` and
`firebase-client.js` become the only two files that know the backend;
everything else already goes through them. Add `server/` with Docker
Compose (Caddy, API skeleton, PostgreSQL, MinIO), CI job that boots it. No
behaviour change.

**Phase 1 — files and photos to the server (3–5 days).** Uploads and
downloads move from the Worker/R2 to the API/MinIO; photos stop being kv
data URLs and become objects with a thumbnail (the kv path stays readable
for old photos until a one-off migration copies them). This alone removes
the 25 MB and 900 KB caps. Rollout: the app uploads to the new store,
reads from both; a script copies R2 → MinIO; R2 is emptied after a month.

**Phase 2 — data to PostgreSQL with live sync (2–3 weeks).** The API
serves the collections; the app's store talks to it with the change feed
above; the Firestore rules become `authz.js` tests. Rollout: export every
company from Firestore (the existing backup format), import into
PostgreSQL, run both for one week with a read-back check (every write to
Firestore is also written to the API by a shadow script and compared),
then switch the app's store, keep Firestore read-only for a month, then
delete it. The crew sees nothing but a "new version" bar.

**Phase 3 — auth and the Worker's jobs (1–2 weeks).** Self-hosted auth with
a one-time password set; AI proxy, metrics, crash reports, bexio push and
the Abo move into the API (`worker/src/*` become `server/src/*`, the tests
come along). The Cloudflare Worker and KV are retired.

**Phase 4 — hosting and paperwork (1 week).** Custom domain on Caddy,
GitHub Pages retired, Datenschutzerklärung / AVV / Subprozessoren updated
to the one host, runbooks (deploy, restore, rotate secrets, scale up),
uptime and error alerts by e-mail.

## Constraints

- **No data loss and no downtime for crews.** Every phase has a read-back
  comparison before the switch and a way back for a month.
- **Industry standard throughout** (PROJECT.md §2b): specs, tests on the
  Docker stack in CI, the pre-commit gate, the e2e suite extended to
  uploads, the dev log and the code map.
- **No new manual step per customer** (§1b). Ops work is per product, is
  automated, and has a runbook.
- **Secrets** stay on the server (`.env` outside the repo, never in the
  page); the owner sets them; the agent never sees them.
- **First-paint budget** stays: the API client is smaller than the Firebase
  SDK chunk (575 KB today), so the phone gets faster.

## Definition of done (for this plan)

- The owner has chosen the provider, the location and the budget, and
  accepted the phase order.
- Phase 0's spec exists and the local Docker stack boots in CI.

## Out of scope

- Multi-region high availability (one server with tested backups is the
  right size until there are dozens of paying firms; a second server and a
  managed PostgreSQL are a later spec).
- Kubernetes, service meshes, a message queue — not needed at this size.
- Keeping Firebase as a long-term mirror.

## Alternative considered

Firebase Blaze (pay-as-you-go) would lift the quotas and add Cloud
Functions and Storage for a few francs a month, with less effort than
phases 2–3. It would not lift the 1 MiB document limit, would keep the
data at Google and Cloudflare, and would keep authorisation in the rules
DSL. The owner's ask is independence from hosting tiers; this plan
delivers that, and the phase order lets the cheap wins (files, photos)
land first.
