# Authentication and Firestore security rules

## Problem

The database is world-readable and world-writable. Anyone who opens the public
GitHub Pages URL can read and modify everything — and since the CRM landed,
"everything" includes clients' names, phone numbers, e-mail addresses and home
addresses. Exposed personal data is a Swiss nFADP problem, not just untidy.

There is also no separation between devices: every browser shares one dataset
at fixed document ids (`local/site-data`).

## Goal

Only the account owner can read or write their data, enforced by the server.

## Approach

1. **Firebase Auth (email + password).** Works on the Spark plan, so the
   no-Blaze constraint holds.
2. **Per-user document paths** — `users/{uid}/kv/{key}` instead of
   `local/{key}`.
3. **Firestore security rules** deny everything except a signed-in user
   reading and writing their own subtree. Security is enforced *server-side*,
   so an old cached client cannot bypass it.
4. **Firebase moves into the app bundle.** Currently `index.html` defines
   `window.storage`. Per PROJECT.md §6, app behaviour must not depend on
   globals from a separately cached HTML file — that already caused a
   full outage of the AI features. esbuild leaves a dynamic
   `import(CDN + "…")` untouched, so the bundle can load the Firebase SDK at
   runtime without bloating itself and without a shell dependency.

## Definition of done

- Signed-out users see a login screen and can reach no data.
- Sign up, sign in, sign out and password reset all work.
- All reads/writes go to `users/{uid}/kv/*`.
- Deployed rules reject reads of another user's subtree and of the old public
  paths — verified by attempting both.
- Existing production data is preserved under the owner's account.

## Migration

Existing data lives at the public `local/*` paths. It is **not** claimed
automatically: whoever signed in first would take ownership, and the data is
currently readable by anyone. Instead it is copied deliberately into the
owner's account once, after that account exists, and the old paths are then
denied by rules.

## Out of scope

- Multiple crew members sharing one company dataset. Today the model is one
  account per dataset — signing in with the same account on several devices
  reproduces current behaviour. A company/roles model deserves its own spec.
- Social / SSO providers, e-mail verification enforcement, 2FA.

## Risk

Rules must be deployed for any of this to matter. Until `firebase deploy
--only firestore:rules` runs, the database stays open regardless of the app UI.
