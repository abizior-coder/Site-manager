# The language before signing in

**Status: implemented 2026-09-06** (UI audit pass 2, finding 20; PROJECT.md
§1b: a crew member must be able to sign in without help).

## Goal

The sign-in and onboarding screens carry a language picker (all fourteen
languages, a select with an accessible name). The choice is kept on the
device (, ), loaded with the first paint, and
applied everywhere; after sign-in it is also written to the person's
profile as before.

## Definition of done

- e2e (Chromium): choosing Albanian on the sign-in screen changes the
  sign-in button to Albanian before any account exists.
- The picker exists on the onboarding screen too.
