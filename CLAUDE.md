# Agent manual for Site Log

1. Read `PROJECT.md` (decisions; wins over chat), then `docs/CODE_MAP.md`
   (where everything is) and the top of `docs/DEVLOG.md` (what changed
   last). Do not grep the tree for what the map already says.
2. Spec before code: `docs/specs/YYYY-MM-DD_short-name.md` with Goal,
   Constraints, Definition of done, Out of scope; status line at the top.
3. Work as a software engineer holding industry standards (PROJECT.md §2b)
   and the product principle (§1b: no manual step per customer).
4. Before every commit: the interface-engineer audit
   (`docs/ui-audit-checklist.md`) when the display changed, then the
   failsafe `.githooks/pre-commit` (lint, format, build, suites), the
   emulator check, a `docs/DEVLOG.md` entry, and `docs/CODE_MAP.md` kept
   true. Never `--no-verify`.
5. Run suites with `node x.test.mjs` (exit codes), never trust `npm run`
   on Windows. Deploy only through CI on green.
6. Never handle the owner's real credentials or API keys; secrets are set
   by the owner with `wrangler secret put`. Test credentials only from the
   localhost emulator fixture.
