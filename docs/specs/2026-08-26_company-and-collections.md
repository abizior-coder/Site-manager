# Company accounts and per-record storage

Foundations for an owner's command centre. Deliberately one spec: both change
the same storage layer, and doing them separately would migrate live
production data twice.

## Why now

Two facts block everything else:

1. **The app is single-user.** One account owns one dataset. An owner
   dashboard would only ever show the owner's own work.
2. **Everything lives in one `site-data` blob.** Every save rewrites all
   records. With one user that is a rare annoyance; with a crew it is daily
   data loss — two phones saving at once silently clobber each other. This is
   known problem #2 in PROJECT.md, and multi-user is where it turns fatal.

So the collection split is not a nice-to-have alongside crew accounts. It is
a precondition for them.

## Data model

```
companies/{companyId}
  name, ownerUid, createdAt
  publicSettings: { currency, vatNumber, companyAddress }   // members may read

companies/{companyId}/private/finance                        // OWNER ONLY
  labourRate, iban, paymentDays, defaultVatKey

companies/{companyId}/members/{uid}
  role: "owner" | "crew", name, email, active, joinedAt

companies/{companyId}/projects/{id}
companies/{companyId}/entries/{id}      // + userId, so hours roll up per person
companies/{companyId}/customers/{id}
companies/{companyId}/documents/{id}    // quotes + invoices, OWNER ONLY
companies/{companyId}/photos/{id}
companies/{companyId}/kv/{key}          // material units/prices, tech library

users/{uid}
  companyId, displayName

invites/{code}
  companyId, role, expiresAt, usedBy
```

### Why finance is a separate document

A crew member must not see the labour rate or job margins — that is what they
cost the company. Firestore rules apply per document, so anything the owner
alone may read has to live in its own document, not as fields on one the crew
can read. Quotes and invoices are owner-only for the same reason.

## Access rules

| Collection | Crew | Owner |
|---|---|---|
| `projects`, `customers` | read | read/write |
| `entries` | read all; create with own `userId`; edit own | read/write all |
| `documents` (quotes, invoices) | **no access** | read/write |
| `private/finance` | **no access** | read/write |
| `members` | read | read/write |

Crew editing only their own entries is deliberate: a site log is a record of
what happened, and one worker silently rewriting another's hours defeats it.

## Joining a company

Owner generates a short-lived invite code. The crew member signs up, enters
the code, and the app creates their own member document — a signed-in user may
create `members/{their own uid}` only when a matching unexpired invite exists.
Codes expire, so a leaked code is not permanent access.

## Migration

The riskiest step in the project so far: live records move from one blob into
many documents.

1. Owner-triggered, never automatic — the pattern that worked for the auth
   migration.
2. **Copy, never move.** The existing `users/{uid}/kv/*` documents stay
   untouched, so rollback is possible if anything looks wrong.
3. Counts verified after writing: projects, entries, customers, documents and
   photos in must equal out, and the result is shown before the app switches
   over.
4. Photos are already separate documents and only need re-pointing.

## Offline

Firestore's IndexedDB persistence should be enabled as part of this. Crews
work on roofs with poor signal, and the app currently does one-shot reads that
simply fail when the connection drops. This is a real benefit of the move
beyond multi-user, and it changes reads from "fetch once" to "listen", which
is also what live crew status on the dashboard needs.

## Definition of done

- An owner can create a company, invite crew, and see the member list.
- A crew member joins by code and sees the company's projects.
- A crew member cannot read invoices, the labour rate, or margins — verified
  by attempting the reads while signed in as crew, not merely by hiding the UI.
- Two devices editing different entries at the same time both keep their work.
- Existing data is migrated with verified counts, original blob intact.
- The app works with the connection dropped, and syncs on reconnect.

## Out of scope

- The dashboard itself, invoice payment status, and scheduling — those follow
  and are comparatively small.
- Multiple companies per user; one company per account is assumed.
- Removing the legacy blob. It stays as a rollback path until the owner is
  satisfied.

## Risks

- **Every read and write in a ~5,000-line file changes.** This is larger than
  any patch so far.
- Firestore rules using `get()` for role checks cost a read and are limited to
  ten per request; role lookups must stay shallow.
- A crew of 5–10 stays inside the free tier, but live listeners increase read
  volume and should be watched after rollout.
