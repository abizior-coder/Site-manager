# Plans and documents on a job

**Status: implemented 2026-09-02** (owner enabled R2 and said "rób bucket"; bucket `site-log-files`, Worker deployed).

## Goal

A Polier opens a job on the roof and finds the plan. A Chef drops the
architect's PDF, the offer and the contract onto the job from the desk. Both
see the same list, on any device, without asking anyone where the file is.

"Plans and projects" in the owner's words. Plans are PDFs of 2–20 MB, DWG/DXF
from the architect, photos and scans. Project documents are offers,
contracts, order confirmations, delivery notes.

## Why this is not just another entry

Photos today live inside Firestore documents as data URLs, scaled down to fit
under the **1 MB document limit** (`fileToScaledImage`). A plan cannot be
scaled down: a 12 MB PDF is a 12 MB PDF. And the Spark plan's whole Firestore
quota is 1 GiB — a season of plans would fill it. Files need a place of
their own.

## Options

| | Firestore chunks | Firebase Storage | **Cloudflare R2 + our Worker** | Own server (VPS) | External links only |
|---|---|---|---|---|---|
| Works on Spark (no card) | yes | **no** — since Feb 2026 Spark has no buckets at all (402/403) | no — R2 needs a card on the Cloudflare account, even at $0 | no | **yes** |
| Monthly cost at our scale | 0, until the 1 GiB quota is gone | ≈ 0 storage; **egress to Europe is billed** (~0.12 $/GB; the free 100 GB is North America only) | **0** — 10 GB, 1M writes, 10M reads free, **zero egress**, no expiry | 4–8 CHF + your evenings | 0 |
| Code to write | chunking, reassembly, size games | client SDK + storage rules (+ emulator exists) | ~150 lines in the Worker we already run; auth already there | upload API, TLS, backups, updates, monitoring | a URL field |
| Who maintains it | nobody should | Google | Cloudflare | **you** | nobody |
| Offline | no | browser cache | browser cache | no | no |
| Risk | corrupt plans, blown quota | pay-as-you-go opens the *whole* Firebase project to billing; a runaway loop costs money | none beyond a card on file | a machine nobody patches | the link dies when the architect moves the folder |

**Recommendation: Cloudflare R2 behind the Worker we already have, plus a
plain link field for files that already live in somebody's Dropbox or
SharePoint.** No server. The owner adds a payment method to the Cloudflare
account (R2 will not enable without one); the bill stays at 0 within the free
tier, which is roughly 400 plans of 25 MB.

Why not a VPS, since the owner offered to buy one: everything a VPS gives us,
R2 gives us for nothing, and a VPS adds the one thing a one-person project
cannot afford — a machine to patch, back up and watch. Why not Blaze: it
would also work and would let photos move out of Firestore later, but it puts
a credit card behind every Firestore read in the app, and plan downloads from
Switzerland are billed egress. Keep Blaze as the fallback if Cloudflare
refuses the card.

## Architecture

```
phone/desk ──(ID token)──▶ Worker ──▶ R2  companies/{cid}/files/{fileId}
      │                      │
      │                      └──▶ Firestore REST, *with the user's own token*:
      │                           GET companies/{cid}/members/{uid}
      │                           200 = member (rules decide), 403 = not
      └────────────────────▶ Firestore  companies/{cid}/files/{fileId}  (metadata)
```

- **Upload:** `POST /files/{cid}/{pid}` multipart, `Authorization: Bearer
  <ID token>`. The Worker verifies the token the way it already does for the
  AI proxy, checks membership by reading the member document *as that user*
  (no service account, the rules are the check), refuses anything over
  25 MB or of an executable type, stores the object, returns `{id, size,
  type}`. The client then writes the metadata document.
- **Metadata** `companies/{cid}/files/{id}`: `name, size, type, kind
  (plan | offer | contract | delivery | photo | other), projectId,
  uploadedBy, createdAt, r2Key`, or `url` for an external link (no R2
  object). Rules: members read; create needs `uploadedBy == auth.uid`;
  delete by a manager or the uploader.
- **Open:** the client fetches `GET /files/{cid}/{id}` with the token, gets
  the bytes, and shows them from a `blob:` URL — images inline, PDFs in an
  `<iframe>` (every phone browser renders PDF), everything else as a
  download. No signed URLs, nothing public, nothing cacheable by a proxy.
- **Delete:** `DELETE /files/{cid}/{id}` → Worker removes the object; the
  client removes the metadata. Same authorisation as create.
- **Drag and drop:** files dropped on the "Pläne & Dokumente" section of a
  job upload there; files dropped on a **dock tile** upload to that job —
  same tray, same gesture as material and people.
- **Local testing:** `wrangler dev` simulates R2 locally, so upload and
  download get a test before the bucket exists in the cloud.

## What the job view gets

A "Pläne & Dokumente" container, like the others: rows with a type icon,
name, size, who and when; tap to open, long-press/menu to delete; a "+ Datei"
button (multiple files, kind chips: Plan, Offerte, Vertrag, Lieferschein,
Foto, Sonstiges) and "+ Link" for a URL. Crew can add and open; only managers
or the uploader can delete.

## Constraints

- 25 MB per file. Plans bigger than that are the architect's problem to
  export sensibly; say so in the error.
- The Worker never trusts the client's `cid`: membership is checked on every
  request, read and write.
- Files are not in the pasteable share code or the backup code (too big);
  the downloadable full backup lists their metadata and links.
- Photos stay where they are for now. Moving them to R2 is a separate,
  later spec — it removes the 1 MB squeeze, but it is a migration of live
  data and gets its own plan.

## Definition of done

- A PDF and a JPG uploaded from the desk open on a phone signed in as crew
  of the same company; a member of another company gets 403 from the Worker.
- A dropped file on a dock tile lands on that job.
- An external link opens in a new tab.
- Delete works for the uploader and a manager, not for other crew.
- Rules tests for `files/*` (create ownership, read, delete); a Worker test
  against local R2 for upload → download → delete and for the 403 path.
- 25 MB limit and type refusal produce a readable message, not a spinner.

## Out of scope

- Viewing DWG/DXF in the app (needs a converter; download only).
- Annotating plans.
- Moving existing photos to R2.
- Bulk project import from CSV / SIA 451 — a different feature ("load
  projects" as data, not files); cheap, separate spec if wanted.

## What the owner has to do (nobody else can)

1. Cloudflare dashboard → R2 → enable; add a payment method (it will not
   enable without one; the bill stays at 0 within the free tier).
2. Nothing else. The bucket, the binding and the deploy are `wrangler`
   commands from here.

## Files

- `worker/src/index.js`: routes `/files/*`, membership check, R2 put/get/delete.
- `worker/wrangler.toml`: `[[r2_buckets]] binding = "FILES"`.
- `firestore.rules` + `rules.test.mjs`: `companies/{cid}/files/{id}`.
- `roofing-site-manager.jsx`: files section in the job view, dock drop of
  files, viewer modal.
- `files.js`: pure helpers (kind from mime, size formatting, allowed types).
