# Transport: the full trip record, tappable, and a scanned slip

**Status: proposed 2026-09-09.** Requested by the owner.

## Goal

1. The trip row on a job (`tabs/ProjectDetail.jsx`'s `[data-job-trips]`
   list) is **tappable** and opens every field the trip actually has — not
   the four-value summary line it shows today (date, from → to, load kind,
   weight, hours, km). Six fields the record does not carry yet join it:
   an empty-run flag, a return-to-yard flag, waiting minutes, the
   Lieferschein/Waagschein number, the helper who rode along, and the
   Abfallcode (Swiss waste code) for a waste trip.
2. A photo of the paper slip (Lieferschein or Waagschein) can be scanned
   through the existing Worker AI proxy, the same one delivery-note scans
   already use — the proxy reads the slip and **proposes** field values.
   Nothing is written until a person looks at the proposal and confirms
   it, the same shape `runScan`/`confirmScan` already use for material
   deliveries.
3. None of this reaches the public demo's real Firestore or the real
   Worker. Demo mode gets the full form; it does not get the scan button.

## Constraints

- PROJECT.md §3: no Blaze plan, no Cloud Functions, no server of Site
  Log's own beyond the Cloudflare Worker already there. This spec adds no
  new backend — the scan goes through the same `POST /` proxy
  (`worker/src/index.js`) every other AI call already uses, with the same
  per-account/per-company KV limits (`worker/src/limits.js`); nothing here
  raises them or adds a route.
- PROJECT.md §2b: pure logic in a tested module; dates local, instants
  UTC; ids from `crypto.randomUUID()` (`uid()` from `ui/format.js`, which
  every entry already goes through via `newEntry()`).
- **Build every entry through `newEntry()`** (PROJECT.md's own warning):
  the rules reject a create whose `userId` is not the signed-in user. The
  edit path for an existing trip must therefore never rebuild the
  `userId`, `id` or `createdAt` fields — only the trip fields change.
- No rules change is needed for editing: `firestore.rules`'s `entries`
  match already allows `update` by the entry's own author or a manager,
  with `userId` unchanged (`request.resource.data.userId ==
  resource.data.userId`) — exactly the policy a trip edit needs. This spec
  does not touch `firestore.rules`.
- Demo mode (`docs/specs/2026-09-09_public-demo.md`): `isDemoMode()`
  (`firebase-client.js`) is checked once already, structurally, for every
  Firestore write — `initFirebase()` never imports the real SDK while
  `?demo=1` is active, so a trip saved (new or edited) in the demo can
  only ever land in `demo-store.js`'s in-memory fixture, never production.
  That guarantee is inherited, not built here. The **scan** button is a
  different case: `callClaude()` (`roofing-site-manager.jsx`) fetches the
  Worker's hardcoded `CLAUDE_PROXY_URL` directly, not through `getSdk()`,
  so demo mode's structural isolation does not cover it on its own — this
  spec adds an explicit `isDemoMode()` check that hides the scan button
  entirely in demo mode, the same guard the sign-in screen's own Demo
  control already reads to decide what to show.
- PROJECT.md §1b: no manual step per customer. The scan needs nothing an
  owner configures — it reuses the Worker secret already set
  (`ANTHROPIC_API_KEY`).

## Design

### The six new fields

Added to the `transport` entry shape (PROJECT.md §4 already lists
`vehicle, from, to, departTime, arriveTime, hours, km, loadKind,
weightKg, mulde, disposalSite, notes`):

| Field | Type | Meaning |
|---|---|---|
| `emptyRun` | boolean | Leerfahrt — no load carried this trip |
| `returnToYard` | boolean | Rückfahrt zum Lager/Betriebshof |
| `waitMin` | number (minutes) | Wartezeit — time spent waiting on site or at disposal, **not** subtracted from `hours`. `tripHours()` (`roof-tiles.js`) keeps computing the total from `departTime`/`arriveTime` exactly as it does today; a waiting-excluded net figure is a different, unbuilt calculation and this spec does not start it (see Out of scope) |
| `slipNo` | string | Lieferschein or Waagschein number, free text (formats differ by supplier and by disposal site) |
| `helper` | string | Free text, not a member picker — a helper riding along is often a subcontractor or a driver outside the crew, not necessarily a Site Log account. Matches `disposalSite`'s own free-text precedent rather than inventing a lookup this spec has no data for |
| `wasteCode` | string | Abfallcode (VeVA), free text — like `disposalSite`, no fabricated reference list; disposal sites already print the code they want on the Waagschein, which is exactly what the scan (below) can read back |

`emptyRun`/`returnToYard` are independent flags, not a mode switch — a
Leerfahrt back to the yard is both at once, and neither excludes any other
field. Checking `returnToYard` prefills `to` from the firm's own address
(`billing.companyName`/`street`/`postalCode`/`town`, already loaded into
app state by `loadReportProfile()` for every role that issues a report)
when `to` is still empty — a convenience, not a requirement; the field
stays editable and nothing is enforced.

### Tappable, and editable in place

`tabs/ProjectDetail.jsx`'s trip row becomes a `<button>` (currently a
plain `<div>`), opening the same trip modal `openTrip()` already builds
for a new trip — pre-filled from the tapped entry and carrying its `id`.
`saveTrip()` gains an update branch: when the modal carries an `id`, it
writes `entries.map(e => e.id === id ? {...e, ...changedFields} : e)`
through `persist()` instead of prepending a new entry — `userId`,
`id` and `createdAt` are never rewritten, matching exactly how the
inspection edit (`docs/specs/2026-09-03_inspection-and-transport.md`'s
2026-09-04 amendment) already changes the same entry rather than
duplicating it. The rules already allow this (see Constraints); no new
permission logic is needed in the app either — the same
author-or-manager check `openEditEntry` already applies before opening
any entry for edit covers this modal too.

The modal shows every field, always — not a separate "detail" read view
layered on top of a smaller "edit" form. A viewer who is neither the
trip's author nor a manager opens it the way a read-only entry already
renders elsewhere in this app: every field visible, every control
disabled, no save button. This is the same shape, not a new one.

### The scan

A camera/file control inside the trip modal, next to `slipNo` — visually
and behaviourally the same kind of control `scanModal`'s image picker
already is, going through `fileToScaledImage` (canvas re-encode, max
1568 px, JPEG 0.85 — the same fix for size *and* format the delivery-note
scan already depends on; iPhone HEIC and files over ~5 MB of base64 are
rejected the same way there). Hidden entirely when `isDemoMode()` is true
(see Constraints) — not shown-but-disabled, since a disabled button a
crew member cannot explain is worse than no button.

Sending the photo through `callClaude()` with a prompt asking for a
strict JSON object — the same "respond ONLY with JSON" shape `runScan`'s
own prompt already uses — covering exactly the fields a slip can answer:
`{"from":string|null,"to":string|null,"weightKg":number|null,
"slipNo":string|null,"wasteCode":string|null,"disposalSite":string|null}`.
A field the model could not read comes back `null` and is left alone in
the form, never guessed — the same discipline `tileWaste()` already
applies to an unknown tile model (PROJECT.md §8: never present an
estimate as fact).

**The proposal never writes anything by itself.** The returned values
populate the *already-open* trip form's fields — visibly, so a person
sees exactly what changed — and the person still has to press the
form's own Save. There is no separate "confirm" step distinct from the
form's existing save button, unlike `confirmScan`'s per-item checklist:
a trip is one record, not a list of proposed items, so the review surface
*is* the form itself. If a field the scan filled needs correcting, the
person edits it right there before saving, same as they would if they
had typed it by hand. A scanned image is **not stored** as the trip's own
photo — the AI proxy sees it once, over the wire, and the result is a
JSON object, not a data URL; nothing about this spec adds a new
`photo-<id>` document. (If the owner wants the slip photo kept as
evidence later, that is a different, unbuilt feature — see Out of scope.)

### Rate limits, unchanged

The scan is one more `callClaude()` call, charged to the same
per-account/per-minute/per-company KV caps every AI call already shares
(`worker/src/limits.js`: 20/min/account, 200/day/account,
600/day/company). No new limit, no new KV key — a slip scan is not
meaningfully more frequent than a delivery-note scan for the same crew.

## Definition of done

- `roof-tiles.js`'s `tripHours` is unchanged; `waitMin` is stored and
  displayed but never subtracted from it.
- Logic tests: none needed for the six new fields themselves (they are
  plain strings/numbers/booleans persisted as-is, the same as `notes` or
  `km` today); a test confirms `tripHours` still ignores `waitMin` if a
  call site is tempted to pass it in.
- Render tests: the job's trip row is a `<button>` and opens the modal on
  tap; the modal shows all twelve original fields plus the six new ones;
  an edit by the entry's own author updates the same entry (no new row
  appended, `id` unchanged); a manager can edit another member's trip; a
  crew member who is neither sees every field disabled and no save
  button; the scan control is present for a signed-in owner/crew render
  and **absent** when `renderAs(..., signedOut)`'s demo-mode equivalent
  (or a direct `isDemoMode()` stub, whichever the render harness already
  has a hook for) is active.
- Emulator: scan a real slip photo (`fileToScaledImage` path), confirm
  the proposed fields land in the form and only in the form, edit one,
  save, and confirm the same entry `id` was updated, not a new one
  created; confirm a KV-limit refusal (already tested by
  `worker/*.test.mjs`) shows the same friendly-message-plus-`errDetail`
  pattern `runScan` already uses, not a bare failure.
- `docs/CODE_MAP.md` gains a line for the modal's new fields and the scan
  handler names once they exist; `docs/DEVLOG.md` gets the implementation
  entry — both in the commit that adds the code, not part of this spec.

## Out of scope

- Maps, routing, or any km/route figure computed rather than typed in —
  `km` stays a free-text number, as it is today.
- GPS of any kind — no location capture at departure, arrival, or on the
  slip photo's EXIF (which is not read at all).
- Charging a trip into job costing or invoicing (PROJECT.md §4 already
  rules this out generically: "Charging transport into job costing
  (later, with the Bexio export)" — unchanged by this spec).
- Storing the scanned slip photo itself as evidence on the entry. If that
  is wanted later, it is a small, separate addition (the same
  `savePhoto`/`photoId` path every other entry photo already uses) — not
  started here because the ask was specifically the *data* on the slip,
  not an image archive.
- A reference list for Abfallcode or for helpers (member picker). Both
  stay free text, per the Design section's reasoning.
- Any change to `firestore.rules` — none is needed (Constraints).
- Editing `emptyRun`/`returnToYard`/`waitMin`/`slipNo`/`helper`/
  `wasteCode` on entries saved before this spec: they simply read as
  unset (`false`/`0`/`""`), the same as any field added to an existing
  entry shape elsewhere in this app already does. No migration.
