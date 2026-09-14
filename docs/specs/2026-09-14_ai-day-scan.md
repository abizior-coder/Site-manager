# AI day scan: photo or voice → time/material/tool/note entries

Status: implemented (2026-09-14)

## Goal

A crew member (or the owner) finishes a stretch of work and wants to log
it in one go — by talking through what they did, or by photographing a
delivery slip/material stack — instead of opening the "+" sheet
repeatedly for each hour, material line and tool used. This is the
in-app version of what `scripts/import-rapport.mjs`
(`docs/specs/2026-09-13_weekly-rapport-bulk-import.md`,
`…material-tool-bulk-import.md`, `…note-bulk-import.md`) already does for
a photographed paper Rapport, but live, from the job itself, without a
CLI or the owner's own password.

**What already exists, checked before writing this** (so this spec adds
only what's missing):

- `runScan()`/`confirmScan()` (`roofing-site-manager.jsx`) already turns a
  **photo** into **material** entries via the Claude Worker proxy
  (`callClaude`) — a real, working, in-app AI scan. It does not classify
  anything as a tool, does not extract hours, and has no voice/text path.
- `toggleVoiceInput` (fixed 2026-09-13) now dictates continuously into a
  plain text field — a chat note or a project note. It is not connected
  to anything that turns speech into structured entries.
- `scanTripSlip`, `runInspection` show the established patterns for
  photo/text → Claude → structured JSON → a review step before saving —
  this spec follows the same shape, not a new one.

So the actual gap is: **no single flow accepts either a photo or a
description and produces a reviewable mix of time + material + tool +
note entries.**

## Constraints

- **Reuse, do not fork.** One Claude call via the existing `callClaude`
  (Worker proxy, already signed-in, already rate-limited — no Worker
  change). Entries are built with the exact shapes `newEntry()` already
  produces for `type: "time"|"material"|"tool"|"note"` — the same four
  kinds `rapport-import.js` already named for the CLI tool, kept as the
  same vocabulary on purpose.
- **Never write anything without a review step.** Same rule as
  `runScan`/`scanTripSlip`: the model's output is a proposal, shown
  checkbox-by-checkbox with editable fields; nothing is saved until the
  person confirms. PROJECT.md §8: "The AI scan is an estimate. Never
  present its material quantities as authoritative for billing" — hours
  are money even more directly than materials, so this applies at least
  as strongly to the extracted `hours` figure.
- **Never invent an hours figure.** The prompt must return `hours: null`
  unless a duration was actually stated or clearly computable (a start
  and end time, an explicit "8 Stunden") — never a guess dressed as a
  number, the same rule `scanTripSlip`'s prompt already states for its
  own fields ("never guess").
- **First-paint budget.** A Claude-call function plus a multi-field
  review UI is real weight; it must not sit in the eager
  `roofing-site-manager.jsx`. Follows the exact precedent
  `ReportSignModal` set (`docs/specs/2026-09-09_report-phase-2.md`): the
  trigger button and modal-open boolean stay eager, the modal component
  owns its own Claude-call/save logic inside an already-lazy chunk.
- **No new Firestore rule.** Entries are created by the signed-in member
  through the existing client SDK/`persist()` path — same `userId ==
  auth.uid` rule every other entry already satisfies; a manager scanning
  on someone else's behalf is out of scope (see below).
- Every new UI string ships in all 14 `i18n/*.json` files (logic test
  already enforces completeness).

## Design

### Entry point

A new button in the job hub's Übersicht tab (`tabs/ProjectDetail.jsx`),
next to the existing quick actions: **"Tag erfassen" / "Log the day"**
(`[data-day-scan]`). Opens `dayScanModal` (state lives in
`roofing-site-manager.jsx`, same as `scanModal`/`tripModal` today).

### Capture step

One new lazy component, `ui/day-scan-modal.jsx` (`DayScanModal`) —
follows `ui/trip-modal.jsx`'s established exception: it owns its Claude
call and save logic itself (persist/`newEntry`/`showToast` wired in as
props), because that logic living eagerly is exactly the kind of miss
`ReportSignModal` already fixed once.

- A textarea for a free-text description, with the existing mic button
  (`toggleVoiceInput`, passed down the same way `ProjectDetail`'s chat
  composer already receives it) — continuous dictation, fixed
  2026-09-13.
- A photo picker (reusing `fileToScaledImage`), 1–3 images.
- At least one of {non-empty text, ≥1 photo} is required before
  "Analysieren" enables.

### The Claude call

One call, `callClaude([...imageBlocks, {type:"text", text: prompt}])`,
prompt along these lines:

> You are helping a Swiss roofing crew log a day's work. {photo(s)
> attached / a spoken description follows: "..."}. Identify: (1) hours
> worked, only if a duration is explicitly stated or computable from
> given times — otherwise null; (2) materials consumed (name, qty, unit);
> (3) tools/machines used (name, qty, unit — hours if that's how usage
> was described, otherwise a count); (4) a short one-line summary of the
> work for a chat note. Respond ONLY with JSON: {"hours": number|null,
> "items": [{"kind": "material"|"tool", "name": string, "qty": number,
> "unit": string}], "note": string|null}. Keep the list short and
> practical. Never invent a number that was not stated or shown.

`day-scan.js` (new, pure, unit-tested — same split `rapport-import.js`
already established): `parseDayScanResponse(text)` — `parseJsonSafe`
through a stricter shape check (drops a malformed item rather than
throwing, since this is live user-facing flow, not a batch import that
should fail loudly).

### Review step

Same modal, second step:

- Date (defaults to today, editable — logging retroactively is normal).
- Hours (prefilled if the model gave one, always editable, optional).
- One row per proposed item: checkbox, kind (material/tool segmented
  control), name, qty, unit — all editable, same interaction shape
  `scanModal`'s existing item list already has.
- Note (prefilled with the model's one-liner or the typed/dictated text
  verbatim if the model gave none), optional.

### Save

One call to a new `saveDayScanEntries(projectId, payload)` in
`roofing-site-manager.jsx` (state/handlers stay in the app component,
same rule every other lazy tab already follows): builds an array via
`newEntry()` — one `type: "time"` if hours given, one `type:
"material"|"tool"` per checked item, one `type: "note"` if the note
field is non-empty — and a single `persist({ entries: [...] })` call,
matching how `confirmScan` already batches its own writes.

## Definition of done

- `day-scan.js`: `parseDayScanResponse` unit-tested — a well-formed
  response, a malformed item dropped without throwing, `hours` passed
  through only when it's a number (string/undefined/negative → `null`).
- `ui/day-scan-modal.jsx`: lazy, `[data-day-scan]` opens it,
  `[data-day-scan-analyze]`/`[data-day-scan-save]` hooks for tests.
- `render.test.mjs`: opening the modal, a mocked `callClaude` response
  populating the review step, unchecking an item excludes it from what's
  saved, no hours field left blank still allows saving material/tool/note
  entries (hours is optional, not required).
- First-paint budget stays under 350 KB — verified after the feature
  lands, not assumed.
- All 14 `i18n/*.json` carry the new keys.
- `docs/CODE_MAP.md`/`docs/DEVLOG.md` updated; failsafe green.

## Out of scope (this pass)

- A manager scanning a day on behalf of someone else — every entry is
  attributed to whoever is signed in, same as `runScan` today.
- Any change to `runScan`/`confirmScan`'s own material-only flow, or to
  `scanTripSlip`/`runInspection` — untouched.
- Combining several days in one scan — one scan, one day, same as the
  CLI tool's "one row is one entry" rule.
- Any change to Worker-side rate limits — the existing per-account/
  company caps already cover this call like any other scan.
