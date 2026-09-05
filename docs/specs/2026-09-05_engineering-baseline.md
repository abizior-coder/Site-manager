# Engineering baseline: tooling, repository hygiene, releases, pinned SDK

**Status: implemented 2026-09-05** (accepted the same day; engineering audit H3, H5, M2, L1; owner:
"1 potem 2 potem 3").

## Goal

The repository looks and behaves like a maintained product to the next
engineer, to a pilot's IT person and to a buyer's due diligence:

1. **Tooling.** ESLint (flat config, recommended rules, JSX-aware) and
   Prettier with a checked-in config; `.editorconfig`; `engines` and
   `.nvmrc` say Node 24; CI runs `npm run lint` and `npm run format:check`
   before the suites. The codebase is formatted once, and that commit is
   listed in `.git-blame-ignore-revs`.
2. **Repository hygiene.** `README.md` (what it is, how to run, test and
   deploy, where the docs are), `LICENSE` (proprietary, all rights
   reserved) with `"license": "UNLICENSED"` and `"version"` in
   `package.json`, `SECURITY.md` (how to report, what is in scope, what to
   expect), `CHANGELOG.md` in Keep-a-Changelog form starting at 0.9.0.
3. **Releases.** After a successful Pages deploy the workflow creates the
   tag `v<version>` and a GitHub Release with that version's CHANGELOG
   section, once per version. Bumping the version and the changelog is
   the release act; every other deploy is a build under the same version.
4. **Dependencies.** `esbuild` and `lucide-react` current; `react` and
   `react-dom` are dev-only (the REACT=1 test harness); `npm audit` clean.
5. **Pinned, bundled Firebase SDK.** `firebase-client.js` imports
   `firebase/app`, `firebase/firestore` and `firebase/auth` from the npm
   package (exact version in the lockfile) through a dynamic import, so
   esbuild emits them as a content-addressed chunk under `build/` that the
   service worker treats as immutable. The CDN route disappears from the
   service worker. A logic test reports the SDK chunk size under its own
   budget (600 KB raw) so it is seen, not hidden.

## Out of scope

- TypeScript or JSDoc types across the code (a migration of its own).
- Branch protection on `main` (a GitHub setting the owner applies; with
  direct pushes it would force a pull-request flow).
- Tailwind 4 (a migration of its own).

## Found on the way

ESLint's `no-undef` showed that `savePhoto` and `deletePhoto` had been
left in `ui/entries.jsx` without an export when the entry list was cut out
of the app on 2026-09-03, while the app kept calling them at eleven sites
(every photo save, the signature on a Rapport): a `ReferenceError` on each
of those paths since that day, and the most likely cause of the "photo
cannot be saved" report of 2026-09-04. Exported and imported; `uid` was
also missing from that module. Nineteen unused icon imports and four dead
functions went with it.
