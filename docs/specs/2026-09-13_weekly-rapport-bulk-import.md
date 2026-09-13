# Weekly Rapport bulk import

Status: implemented (2026-09-13)

## Goal

The owner (Andrzej) fills a paper Wochen-Rapport by hand and photographs it.
Today, getting that week's hours into Site Log means retyping every row by
hand through the "+" sheet, once per site, once per day. Give him a
repeatable way to turn a transcribed photo into real projects and time
entries for himself, without a developer in the loop each week (PROJECT.md
§1b).

The transcription itself (reading the handwriting) stays a human/agent step
for now — seeded from the photo into a small JSON file. This spec covers
what happens **after** that: turning the JSON into real `projects` and
`entries` documents.

## Constraints

- **No new report engine.** Entries are built with the exact shape
  `newEntry()`/`addEntry()` produce (`docs/CODE_MAP.md` — entries area);
  projects with the exact shape `addProject()` produces. Reports keep
  reading them through `reports.js` unchanged.
- **No service account, no admin SDK.** PROJECT.md §3/§6: there is no
  Blaze plan and no backend of our own; the owner's credentials are never
  handled by the agent. The import runs as a small Node script using the
  same **client** Firebase SDK the app itself ships (`firebase` npm
  package, already a dependency), signed in as the owner's own account —
  the owner types the password when *he* runs the script, not the agent.
  `firebase-client.js`'s `firebaseConfig` is exported and imported directly
  rather than duplicated (it is public web config, not a secret — the
  rules are the real access control, PROJECT.md §4).
- Firestore rules already allow this: a project write needs `canManage()`
  (owner/supervisor); an entry create needs `userId == auth.uid` **or**
  `canManage()` (`firestore.rules` "projects"/"entries" — read during this
  spec's research). Andrzej's account is the owner, so both are satisfied
  by simply signing in as himself.
- Projects are matched to existing ones by **case-insensitive exact name
  match**; no fuzzy matching (the earlier `migrateClientsToCustomers`
  gotcha: near-duplicate names are usually two different customers, not
  worth auto-merging — PROJECT.md §4).
- A new project gets only `name` (+ `address` if the row carries one) and
  the same defaults `addProject()` uses (`category: "flat"`,
  `status: DEFAULT_PROJECT_STATUS`) — the owner recategorises/edits it
  normally afterwards. Existing projects are never modified by this tool
  (no silent address overwrite of real data).
- **Dry run by default.** The script prints the plan (which projects match,
  which get created, every entry with its date/project/hours/description)
  and writes nothing until re-run with `--commit`. There is no undo path
  once written (PROJECT.md §6: "testing hits live production data").
- Pure parts (row validation, project name matching) live in a tested
  module (`rapport-import.js`), not inline in the script — `docs/CODE_MAP.md`
  §2b: pure logic lives in a tested module.

## Design

`rapport-import.js` (new, pure, unit-tested in `logic.test.mjs`):

- `normaliseImportRows(rows)` — validates each `{date, project, description,
  hours, address?}` (date `YYYY-MM-DD`, hours a positive number, project and
  description non-empty strings), trims strings, throws with the row index
  on anything malformed.
- `matchProjects(rows, existingProjects)` — case-insensitive exact match on
  `project.name` (trimmed). Returns `{ toCreate: [{name, address}], plan:
  [{...row, projectId|null, projectName}] }` — one `toCreate` entry per
  distinct new name, address taken from the first row that carries one.

`scripts/import-rapport.mjs` (new):

1. Reads a rows JSON file (path from argv), calls `normaliseImportRows`.
2. Signs in (`SITE_LOG_EMAIL`/`SITE_LOG_PASSWORD` env vars, else an
   interactive prompt — password input is not echoed) via
   `firebase/auth`'s `signInWithEmailAndPassword`, using
   `firebase-client.js`'s exported `firebaseConfig`.
3. Resolves the signed-in user's `companyId` from `users/{uid}`, reads
   `companies/{cid}/projects`.
4. Calls `matchProjects`, prints the plan (existing vs. new projects,
   every entry row with computed total hours).
5. Without `--commit`: stops here (dry run).
6. With `--commit`: writes new project docs (same shape `addProject()`
   builds, `id: randomUUID()`, `createdAt: Date.now()`), then one entry doc
   per row (same shape `newEntry()` builds: `id`, `type: "time"`, `date`,
   `projectId`, `description`, `qty: String(hours)`, `unit: "h"`,
   `userId: auth uid`, `createdAt: Date.now()`, `srcLang: "de"`), via
   `setDoc` to `companies/{cid}/projects/{id}` / `companies/{cid}/entries/{id}`.

`firebase-client.js`: `firebaseConfig` becomes `export const` (was a
private `const`) — no behaviour change, just makes it importable instead of
duplicating the object in the script.

## Definition of done

- `rapport-import.js` exists, is named in `docs/CODE_MAP.md`, and has unit
  tests in `logic.test.mjs` (valid rows, a bad row throws with its index,
  case-insensitive matching, an unmatched name lands in `toCreate` once
  even if several rows share it).
- `scripts/import-rapport.mjs` exists, is named in `docs/CODE_MAP.md`
  ("Scripts and config"), dry-runs by default, only writes with `--commit`.
- `node logic.test.mjs` green; failsafe (`npm run precommit`) green.
- `docs/DEVLOG.md` gets an entry.
- Andrzej's 2026-09-07…11 Wochen-Rapport is imported for real (this spec's
  first real use): projects Reilling, Ott, Vetter, Knecht, Risch and
  Blumenau (8184 Bächenbülach) created; Waltz (Stallikerstrasse 14, 8143
  Stallikon), Bosaert and Nützli matched to the existing projects the owner
  named; every row from the photo becomes one time entry, dated and
  described as transcribed, all under the owner's own account.

## Out of scope

- Reading the photo itself (OCR/handwriting) — done by the agent this time,
  by hand, into the rows JSON; not automated here.
- Creating entries for a crew member other than the person running the
  script (would need resolving a name/email to a `members` uid — a real
  need for future weeks, but a separate spec).
- Editing an existing project's address/fields from this tool.
- Any UI for this — command line only, run by the owner.
