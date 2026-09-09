# Login audit: who signed in, when, from which role

**Status: proposed 2026-09-09.** Requested by the owner.

## Goal

The firm owner can open the Cockpit and see who signed in, when, and in
which role — a plain audit trail of access to the firm's data. Nobody
else sees it: a crew member cannot see when a colleague signed in, only
the owner can.

## Constraints

- PROJECT.md §3: no Blaze plan, no Cloud Functions. Every write here
  happens from the signed-in client, through `firestore.rules`, the same
  way every other collection in this app is written. No server-side
  trigger records anything.
- This is **not** the existing usage-metrics system
  (`metrics-client.js` → Worker `/metrics`, `docs/CODE_MAP.md`'s
  "Usage metrics" note in PROJECT.md's module map): those are anonymous
  counts per company and day, explicitly "no text, no site, no name."
  A login audit is the opposite by design — it names a person — so it
  cannot reuse that pipeline or that KV store, and the owner-only
  visibility rule here must not leak into the anonymous one.
- PROJECT.md §2b: dates are local calendar dates, instants are UTC; ids
  come from `crypto.randomUUID()`; personal data never leaves the app to
  an undeclared third party. A sign-in record is personal data of the
  person who signed in — it stays inside `companies/{cid}`, never sent
  anywhere else (no Worker call, no analytics vendor).
- PROJECT.md §1b: no manual step per customer. The audit trail exists for
  every firm the moment they sign in; the owner configures nothing to get
  it.
- Demo mode (`docs/specs/2026-09-09_public-demo.md`) must not be able to
  write a login record into any real company, ever — see "Demo mode"
  below for why this is already structurally true rather than something
  this spec has to enforce itself.

## What is stored

One document per sign-in, under `companies/{cid}/loginEvents/{id}`
(`id = crypto.randomUUID()`, the same convention every other collection
in this app uses):

| Field | Meaning |
|---|---|
| `uid` | `request.auth.uid` — who signed in |
| `name` | A **snapshot** of the member's display name at the moment of sign-in, copied from `companies/{cid}/members/{uid}`'s own `name` field — not a live join. If the person's name changes later, or they leave, old rows still read correctly; this is the same reasoning `sentReports`/`reports` already apply to `entryLabels` (PROJECT.md §4: "Carries `entryIds` ... not copies"; the label pattern is inverted here on purpose because a login row must stay readable even after the member document is gone). |
| `role` | A snapshot of `owner \| supervisor \| crew` at the moment of sign-in, from the same member document. The role at the time of the visit, not the role right now — a promotion or demotion afterwards must not rewrite history. |
| `at` | `Date.now()` at the moment of sign-in — UTC milliseconds, the same instant convention every timestamp in this app already uses (`expiresAt`, `createdAt`, etc.). The Cockpit formats it for display; the stored value is not a local string. |

**No password, no token, no session id, and no field recording "demo or
real" is stored** — see below for why that field would be meaningless
here.

### Demo mode

`firebase-client.js`'s `isDemoMode()` gate means the real Firebase SDK
(`boot()`, the only place it is imported) is **never called** while
`?demo=1` is active — `demo-store.js` hands back a small in-memory
Firestore-and-Auth stand-in instead, seeded with the fixed
`DEMO_UID`/`DEMO_CID` fixture, and `demo-store.js` imports nothing from
`firebase-client.js` or any `firebase/*` package (enforced by an existing
logic test on the source text). A `companies/{cid}/loginEvents` write
issued while browsing the demo therefore physically cannot reach
production Firestore: it either lands in the demo store's in-memory Map,
which is discarded when the tab closes, or — since the demo fixture's
`DEMO_CID` does not exist as a real company — it has nowhere real to go
at all. This is why the record carries no "demo vs real" flag: every
document that can ever actually exist under a real `companies/{cid}` was,
by construction, written through the real SDK by a real signed-in
member, never through the demo path. Nothing new has to be built to
guarantee this; it falls out of the isolation layer that already exists.

## Where it lives, and who may read or write it

New match block in `firestore.rules`, sibling to `entries`/`sentReports`:

```text
match /loginEvents/{id} {
  allow read: if isOwner(cid);
  allow create: if isMember(cid)
                && request.resource.data.uid == request.auth.uid;
  allow update: if false;   // a login record is a fact, not editable
  allow delete: if isOwner(cid);
}
```

- **Read: owner only**, not `canManage()`. The goal is specifically "the
  firm owner can see" — a supervisor is not granted this even though
  supervisors can manage projects and reports elsewhere in this app.
  Reusing `canManage()` here would be scope creep past what was asked.
- **Create: the signed-in member, for themselves only.** The same shape
  as `entries`' own-id check, but without the `canManage()` escape hatch
  `entries`/`leave`/`reports` grant a manager: nobody may write a login
  record on someone else's behalf, because the whole point is that the
  record reflects who actually authenticated.
- **No update, ever.** A login record is written once and never touched
  again — there is nothing about a past sign-in that should change.
- **Delete: owner only**, needed for the retention rule below (there is
  no Cloud Function to run scheduled cleanup on the Spark plan, so
  pruning is a client-side write the owner's own session performs).
- A crew member cannot list another member's rows: Firestore security
  rules apply to queries as well as `get`s, so a `where uid == X` query
  from a crew account is refused by the same `allow read: if isOwner(cid)`
  line — there is no separate query-shape hole to close.

## Retention, and what account deletion removes

Per `docs/specs/2026-09-05_account-deletion-backup.md`: when a person
deletes their own account, their **personal** data goes (profile,
documents, dock pins, language, clock, the legacy personal store,
`users/{uid}`), but records they made **for the firm** stay, the same as
their entries, photos and signatures do — the modal already tells them
so. A login record is the same kind of firm record, not a personal
preference: it is the owner's evidence of who accessed company data and
when, and it is the owner's to keep for exactly the reason the goal of
this spec states. **`loginEvents` rows are therefore not touched by
`deleteOwnAccount()`** — the `name`/`role` snapshot already means a row
reads correctly with no live member document behind it, the same as an
entry keeps a name after its author leaves (PROJECT.md §4: "the owner
removes people from the Team tab, the document stays so their entries
keep a name"). This spec adds no new deletion step to that flow; the
existing one already does the right thing here by leaving `loginEvents`
alone.

What is bounded, and why: an unbounded per-account audit log is still
personal data collecting indefinitely, which sits uneasily next to
PROJECT.md's DSG posture even though nobody has a standing right to
erase someone else's access-log entry about them. The record is capped
at **the most recent 200 rows per company**, pruned oldest-first: when a
sign-in would create row 201, the same write also deletes the oldest row
(a bounded, client-driven prune — the write and the prune are two
separate rule-checked operations, not a transaction, so a crash between
them leaves at most one extra row, corrected on the next sign-in). Two
hundred rows comfortably covers months of activity for a firm's whole
crew and keeps the collection small enough that the Cockpit list never
needs pagination. `docs/legal/` is not updated by this spec (spec-only,
no other file touched); a follow-up should add `loginEvents` to the
Verzeichnis der Bearbeitungstätigkeiten's data-model table before this
ships, the same way every other collection is already listed there.

## When a record is written

Once per authenticated session, not once per page load: a sign-in that
persists across a reload (Firebase's own persistence, or the offline
cache) must not write a fresh row every time the phone wakes up, or 200
rows would be consumed by one person in a single day. Guarded the same
way `entry.jsx`'s stale-chunk reload already guards against reacting
twice — a `sessionStorage` marker keyed by `uid`, set the first time this
tab observes that uid as signed in with a resolved company and role. A
genuinely new sign-in (`submitAuth` succeeding, or a new browser tab/
session picking up a persisted Firebase session for the first time) gets
exactly one row; staying on the page, switching tabs within the app, or
an SDK-internal token refresh does not.

## Cockpit view

A new Cockpit card, owner-only (the existing cards are already grouped
that way — `ExportCard`, `UsageCard`, `ErrorsCard`, `BexioCard`,
`BackupCard` in `tabs/CockpitTab.jsx`, each fetching or reading its own
data): a plain list, newest first, one line per row — name, role, the
timestamp formatted with the existing `fmtDate`/`fmtHM`-style helpers
(`ui/format.js`) rather than a new formatter. No filters, no search, no
pagination control, no export button of its own — "no extra product
chrome" per the ask; if the 200-row cap is ever too small to answer a
real question the owner has, that is a reason to revisit the cap, not to
add UI around it. Empty state: the existing `EmptyState` component
(`ui/empty-state.jsx`), matching every other empty list in the app.

## Definition of done

- `firestore.rules` gains the `loginEvents` match block above; rules
  tests cover: a member creates their own row; a member cannot create a
  row naming another uid; the owner reads the collection; a crew member's
  read (`get` and `list`) is refused; no update is ever allowed; the
  owner deletes (prune) a row, a non-owner cannot.
- A pure function for the prune decision (which row, if any, to delete
  alongside a new write once the count would exceed 200) is unit-tested
  in `logic.test.mjs`, not inlined and untested in the app component —
  PROJECT.md §2b: "pure logic lives in a tested module."
- Render tests: the Cockpit shows the login list for the owner; a crew
  or supervisor render never requests or shows it; the list orders
  newest first; the empty state renders with no rows.
- Emulator: chef/polier/crew1/crew2 sign in in turn (`npm run seed`
  accounts); the owner's Cockpit shows all four with correct roles and
  ascending-then-reversed order (newest first); crew1's own session
  cannot read the collection (checked via the rules emulator, not just
  the UI hiding it); reloading the crew1 tab several times adds no
  further rows; deleting crew1's account (existing flow) leaves crew1's
  rows in place and still readable by the owner afterwards.
- First-paint budget (`node logic.test.mjs`) still passes — the Cockpit
  card is behind the existing Cockpit lazy chunk (`tabs/CockpitTab.jsx`
  is already lazy per `docs/CODE_MAP.md`'s Tabs table), so this should
  cost nothing against the eager budget; if it does, trim until it
  passes rather than approving an increase here.
- `docs/CODE_MAP.md` gains the `loginEvents` row (data model) and the new
  Cockpit card; `docs/DEVLOG.md` gets the implementation entry — both in
  the commit that adds the code, not part of this spec.

## Out of scope

- GPS or any location capture at sign-in.
- IP-based geolocation, or any IP address at all beyond whatever Firebase
  Auth's own token already carries internally (which this app does not
  read or store today, and this spec does not start reading).
- Billing, the PWA install hint, the landing page — unrelated work
  already specced or shipped separately.
- A UI to change the 200-row cap, or per-company retention settings —
  one constant, changed in code if it ever needs to change, per PROJECT.md
  §1b (no per-customer configuration knob).
- Alerting the owner about a login (e-mail, push, webhook) — this is a
  list the owner opens, not a notification.
- Failed sign-in attempts. This spec covers a successful, authenticated
  session only; a login-attempt/lockout audit is a different feature with
  different abuse considerations and is not started here.
