# Errors: one readable panel with a code

**Status: implemented 2026-09-04** (owner: "błędy mają być wyświetlane na
środku w czytelnym dużym polu, z kodami najlepiej; stwórz listę znanych
kodów").

## Goal

A failure is shown where a person on a roof sees it: a large panel in the
middle of the screen, with a code they can read out, the reason in their
language, the raw text for the developer, and the build number. The
small toast at the top stays for successes only. A list of known codes
(`docs/ERROR_CODES.md`) says what each means and what to do.

## Design

- `errors.js`: the registry (`ERROR_CODES`: E1x save, E2x photo, E3x AI,
  E4x language, E5x files, E9x other), `classifyError(e, context)` from
  the error's shape (Firestore codes, HTTP status, the Worker's texts),
  `errorReport()` for the copy line. Pure, unit-tested.
- The app: `showError(e, context)` sets `errorBox`; the panel renders
  centred over everything (`data-error-panel`): the code big, the tag,
  the group title in the person's language, the German/English meaning,
  the raw detail in small mono, the build, and two buttons: copy and OK.
  A `site-log:error` window event opens it too (for the entry and tests).
- Every failure path goes through it: database saves (the 18 places),
  photo decode/encode, translations, the language switch offline, file
  uploads. Scan modals keep their inline error and add the code.
- Mein Profil shows the build and "App neu laden" (unregister workers,
  drop caches, reload); the sign-in footer shows the build.

## Definition of done

- Dispatching `site-log:error` shows the panel with the code; OK closes it.
- A failed photo save shows E10/E11/E12 with the Firestore code in the
  detail; a failed translation shows E30–E36.
- `docs/ERROR_CODES.md` lists every code in `errors.js` (logic test).
- Profile shows the build and the reload button (render test).

## Out of scope

- Sending error reports automatically (the copy line is the report).
- Translating the per-code meaning into all 14 languages (German and
  English; the group title is translated).
