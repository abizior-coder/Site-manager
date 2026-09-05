# Self-service plan and billing: trial, Abo, invoice and payment without the founder

**Status: proposed 2026-09-06** (from PROJECT.md §1b — the product scales
without the founder; owner: "weź pod uwagę tę zmienną i rozplanuj
następne zadanie"). Waiting for the owner's "1" and the pricing decision
below.

## Why this is next

Today a firm can set itself up, invite its crew, import its customers and
connect bexio without anyone from Site Log. What still needs the owner's
hands is the money: there is no plan, no trial clock, no invoice and no
way to know who paid. Selling therefore means e-mails, a hand-written
invoice and a bank-statement check per firm — exactly the load §1b
forbids. This spec closes that loop.

## Goal

1. **Every company has a plan.** `trial` for 30 days from the company's
   `createdAt`, then `paid` for the period bought, then `expired` after a
   14-day grace. The Cockpit shows an **Abo** card (plan, seats in use,
   days left, price); everyone sees a quiet banner in the last 7 days of a
   trial and a clear one when expired.
2. **The owner buys in the app.** «Jahresrechnung anfordern» sends seats
   and the billing profile to the Worker, which creates the invoice in
   **Site Log's own bexio** (operator account, Personal Access Token as
   the Worker secret `BEXIO_OPERATOR_TOKEN`, contact = the firm) and lets
   bexio e-mail it with the QR-bill. No inbox, no typing.
3. **Payment marks itself.** bexio's bank reconciliation marks the invoice
   paid; the Worker asks bexio for the invoice status when the plan is
   read (at most once an hour per company) and turns the plan `paid` with
   `paidUntil = +1 year`. The owner's only job is to keep bexio's bank
   sync on.
4. **Language before sign-in.** A language picker on the sign-in and
   onboarding screens (stored on the device), so an Albanian-speaking
   roofer never sees a screen in the browser's language. Small, and a
   self-service blocker today.
5. **Enforcement, phase 1 (this spec): soft.** An expired plan shows the
   banner, hides the «+» sheet and the add buttons, keeps reading and
   exporting (nobody is locked away from their own data). Phase 2 (own
   spec): hard enforcement in the Firestore rules through a `plan` field
   on the company document written by the Worker with a service-account
   credential kept as a Worker secret — a security design of its own.

## Design

- Worker `worker/src/plan.js`: `GET /plan/<cid>` (member), `POST
  /plan/<cid>/order` (owner), pure `planState({ createdAt, paidUntil,
  now })`, `priceFor(seats)`, `invoiceFor(company, seats)`; KV
  `plan:<cid>`; bexio calls through the existing `bexio.js` helpers with
  the operator token; tests with a fake bexio and a fake clock.
- App: `PlanCard` in the Cockpit (lazy chunk), the banner in the shell
  (tiny), the sign-in language picker (`entry`-level, tiny), a read-only
  mode flag that hides the add controls when expired.
- Pricing (from the value plan, to confirm): 290 CHF per firm per month
  up to 10 seats, 39 CHF per seat above; yearly invoice at −15 %; VAT
  8.1 % on top; trial 30 days; grace 14 days.
- i18n ×14; runbook `docs/runbooks/billing.md` (what the owner checks
  once a month: bexio open invoices, nothing else).

## Definition of done

- Worker tests: trial → paid → expired with the fake clock; an order
  creates one invoice in the fake operator bexio with the right amount
  and contact and never twice; a paid invoice turns the plan paid; a
  non-owner cannot order; missing operator token → 503.
- Render tests: the Abo card with days left; the banner at 5 days left
  and when expired; the sign-in picker switches the sign-in texts; the
  «+» sheet is absent when expired.
- e2e: sign-in language picker in Chromium.
- Emulator: a seeded company created 40 days ago shows expired; the
  owner orders (dry run against the fake) and the card shows the invoice
  number.
- The owner's time per new paying firm: zero.

## Out of scope

- Card payments (Stripe): yearly invoice is how Swiss B2B buys; add when
  a pilot asks.
- Hard enforcement in rules (phase 2 spec).
- Ownership transfer / company deletion and the landing page with demo:
  the next two specs after this one.

## Owner decisions needed

1. Confirm the prices and the trial/grace lengths above.
2. Create a Personal Access Token in **Site Log's** bexio (the operator
   account) and set it with `npx wrangler secret put BEXIO_OPERATOR_TOKEN
   --name site-log-claude-proxy` — the token stays out of this chat.
3. Turn on bexio's bank reconciliation for the operator account.
