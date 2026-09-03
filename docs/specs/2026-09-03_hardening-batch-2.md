# Hardening, batch 2 — the shared bucket, invites, offboarding, caps

**Status: proposed — batch 1 (XSS paths, attribution, signed reports,
webhook) is deployed; this batch changes behaviour and needs a go.**

Source: the security audit of 2026-09-03 (local only; the repo is public).
Findings C1, H3, M1, M2, M3 remain open after batch 1.

## C1 — `kv/{key}` is readable and writable by every member

What lives there today and who should touch it:

| Key | Holds | Read | Write |
|---|---|---|---|
| `site-profile-<uid>` | name, private phone, emergency contact, supervisor mail, webhook | **owner of the key only** | owner of the key |
| `site-docs-<uid>` | insurance cards, certificates | **owner only** | owner |
| `site-dock-pins-<uid>` | pinned jobs | owner | owner |
| `site-lang-<uid>` | UI language (a code) | members — the translation targets need it | owner |
| `clock-<uid>` | running clock | owner + **managers** (dashboard: who is on site) | owner |
| `photo-<id>` | site photos and **Rapport signatures** | members | creator or manager; signatures never |
| `site-material-catalog`, `site-tech-library` | article master, tech sheets | members | members (crew learn units/prices while logging) — accepted risk, low sensitivity |
| `xl-<projectId>` | note translations | members | members |
| `site-meta` and anything else | legacy | members | managers |

**Rule design** (keys are flat strings; the rules match on prefix and on the
caller's uid):

```
match /kv/{key} {
  // Personal: only the person.
  allow read, write: if isMember(cid) && (
       key == 'site-profile-' + request.auth.uid
    || key == 'site-docs-' + request.auth.uid
    || key == 'site-dock-pins-' + request.auth.uid
    || key == 'site-lang-' + request.auth.uid
    || key == 'clock-' + request.auth.uid);
  // Language codes and clocks are readable more widely.
  allow read: if isMember(cid) && key.matches('site-lang-.*');
  allow read: if canManage(cid) && key.matches('clock-.*');
  // Shared, member-written.
  allow read: if isMember(cid) && !(key.matches('site-(profile|docs|dock-pins)-.*') || key.matches('clock-.*'));
  allow write: if isMember(cid) && (key == 'site-material-catalog' || key == 'site-tech-library' || key.matches('xl-.*'));
  // Photos: anyone may add one; only its creator or a manager may change or
  // remove it; a signature (kind == 'signature') is immutable once written.
  allow create: if isMember(cid) && key.matches('photo-.*') && request.resource.data.by == request.auth.uid;
  allow update, delete: if key.matches('photo-.*') && resource.data.kind != 'signature'
                        && (canManage(cid) || resource.data.by == request.auth.uid);
  // Everything else: managers.
  allow write: if canManage(cid);
}
```

**Client changes:** `savePhoto` stamps `by: uid` (and `kind: 'signature'` from
`saveRapport`); re-saving an edited photo entry creates a new photo doc
instead of overwriting (create-only path for crew); the dashboard's clock
read stays on the manager path; the member-language scan keeps working
(`site-lang-*` stays member-readable). Existing photos have no `by` — only
managers can change or delete them, which is acceptable.

**Migration:** none. Old keys keep working under the new rules; nothing is
rewritten.

**Tests:** rules — crew cannot read a colleague's `site-docs`/`site-profile`,
cannot overwrite a colleague's clock, cannot overwrite a signature, can
create a photo with `by`, cannot create one without; manager can read all
clocks; member can read every `site-lang-*`. Render — profile save, photo
add, Rapport sign, dashboard still walk.

Effort **M**. This is the single most valuable change left: it closes the
personal-data exposure and the signature tampering the audit demonstrated.

## H3 — invites are reusable and can be burnt by strangers

Make redemption atomic: the membership `create` rule requires the invite to
be unused, **and** the same batched write flips `invites/{code}.usedBy` to
the joiner; the invite `update` rule allows exactly that transition (unused →
`usedBy == request.auth.uid`) and nothing else. Default expiry 72 h. A
stranger can no longer burn a code (the update rule requires the joiner to
also become a member in the batch), and a code onboards one person.
`joinCompanyWithCode` does the batch. Effort **M**.

## M1 — deactivated members keep access; no way to remove one

`isMember` checks `active != false`. Owner gets a "remove from company"
action on the Team tab that sets `active: false` (rather than deleting the
member doc, so their entries keep a name). The Worker already honours the
flag. Effort **M**.

## M2 — open sign-up defeats the daily caps

Worker: a **company-level** daily cap on the AI proxy (KV key per company,
counted after membership is known — the files routes already know the
company; the AI proxy would look it up the same way) and a small
per-account request rate (e.g. 20/min). Rules: `request.resource.size() <
1048576` where it is not already implied, and refuse `users/{uid}/kv/*`
writes over 256 KB. Effort **M**.

## M3 — backup and share import trust the pasted JSON

`decodePayload` validates shape (arrays of objects with string ids), assigns
**new** ids to imported entries/photos (never adopts a pasted id, so a pasted
photo can never land on a signature's key), and drops unknown top-level
keys. Effort **M**.

## Order

C1 → M1 → H3 → M2 → M3. C1 and M1 together are one rules deploy and a
small Team-tab change; H3 touches onboarding and should be tried on the
emulator with the seed flow before deploy.

## Out of scope

- Moving photos and signatures to R2 (would make C1 simpler later; separate
  migration).
- Building Tailwind statically (L1) — a build-chain change, no security
  urgency.
