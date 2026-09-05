# Site Log · Baustellenprotokoll

A phone-first site log for Swiss roofing and Spengler crews. A worker on a
roof opens it to clock in, log material, photograph a delivery, sign the
Rapport and send hours to the Polier. The office gets the Rapporte, the
invoices with QR-bill, the accounting export and the customer list.

Live: <https://abizior-coder.github.io/Site-manager/>

## What it does

- **Heute**: start the day on a job, breaks the GAV way, notes by voice in
  the worker's language, translated for the Polier.
- **Baustellen**: one hub per job with time, material, photos with markup,
  plans, Rapporte, a translated chat, roof inspection with waste weight,
  transport log.
- **Material**: supplier price lists as a searchable sheet, basket, orders,
  pickup codes drawn locally.
- **Rapport**: day with the GAV split, week with CSV, month; signed Rapporte
  sent to the supervisor.
- **Cockpit** (owner): money, hours to approve, usage, errors, accounting
  export for the Treuhänder and bexio.
- Fourteen interface languages (German first, Schwiizerdütsch, French,
  Italian, English, Albanian, Romanian, Bulgarian, Hungarian, Polish,
  Portuguese, Spanish, Slovak, Czech).
- Works offline: app shell in a service worker, Firestore's local cache.

## How it is built

| Piece | Where |
|---|---|
| App | `roofing-site-manager.jsx` (Preact via `preact/compat`), `tabs/`, `ui/` |
| Pure logic with tests | `reports.js`, `documents.js`, `accounting-export.js`, `price-list.js`, `barcode.js`, `onboarding.js`, `customers-import.js`, `errors.js`, `swiss-qr.js`, … |
| Data | Firebase Auth + Firestore, company-scoped, rules in `firestore.rules` |
| Files and AI | Cloudflare Worker in `worker/` (R2 for plans, KV for caps, metrics and crash reports, Anthropic proxy) |
| Build | esbuild with code splitting into `build/`, Tailwind built statically, `scripts/stamp.mjs` writes the cache-busted shell and the service worker |
| Hosting | GitHub Pages, deployed by CI only after every suite is green |

Read [PROJECT.md](PROJECT.md) before changing anything: it records the
decisions, the data model and what will bite you. Every change starts as
a spec in `docs/specs/`.

## Run it locally

Requires Node 24 (`.nvmrc`) and Java 21 for the Firestore emulator.

```bash
npm ci
npm run build
npm run emulators      # Auth 9099, Firestore 8080
npm run seed           # a firm with chef / polier / crew1 / crew2 @test.local, password test1234
python -m http.server 5566
```

Open `http://localhost:5566/index.html?emulator=1`. The emulator flag only
works on localhost; a deployed page can never point at it.

## Test

```bash
npm test               # logic, worker, render, order, dock, rules (needs the emulator)
npm run lint
npm run format:check
```

Run a single suite with `node logic.test.mjs` and read the exit code; on
Windows `npm run` inside a shell chain can swallow it.

## Deploy

Push to `main`. CI runs lint, format check, build check and every suite;
only a green run triggers the Pages deploy, which then tags `v<version>`
and publishes a GitHub Release when the version in `package.json` is new.
The Worker is deployed separately with `npx wrangler deploy` from
`worker/`; its secret `ANTHROPIC_API_KEY` is set with `wrangler secret put`.

## Documents

- `docs/specs/` — one spec per change, with status.
- `docs/ERROR_CODES.md` — the codes the error panel shows.
- `docs/legal/` — Datenschutzerklärung, AVV, Verzeichnis, Subprozessoren.
- `docs/research/` — what the market does and what was adopted.
- `CHANGELOG.md`, `SECURITY.md`, `LICENSE`.

## Licence

Proprietary; see [LICENSE](LICENSE). The code is public so customers and
reviewers can read what runs on their data.
