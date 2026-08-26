# CRM foundation — customers, pipeline, contact log

## Where the app stands

Site Log currently records **what happened on site**: hours, materials, tools,
photos, safety. That is the *Baustelle* half of what Swiss trade software like
ToolTime and Craftboxx offers. The *Büro* half — who the customer is, what was
quoted, what it earned — is absent.

The structural blocker: **a customer is not an entity.** `project.client` is a
free-text string. Nothing can hang off a string — no history, no second job for
the same person, no follow-up, no quote, no invoice.

## What comparable products have that this lacks

| Capability | JobNimbus / AccuLynx | ToolTime / Craftboxx | Site Log |
|---|---|---|---|
| Customer records | yes | yes | **no — free text** |
| Lead pipeline | yes | yes | no |
| Quotes / Offerten | yes | yes | no |
| Invoices | yes (1-click from estimate) | yes | no |
| Scheduling / dispatch | yes | yes | leave only |
| Job costing / margin | yes | partly | **data exists, unused** |
| Contact history | yes | yes | no |
| Time tracking on site | yes | yes | **yes** |
| Material logging | yes | yes | **yes, AI-assisted** |
| Photo documentation | yes | yes | **yes** |

Site Log is already competitive on the site-facing half and absent on the
office-facing half.

## Goal (this patch)

Make the customer a first-class record, so later work (quotes, invoices,
costing) has something to attach to.

1. **Customer entity** — name, company, phone, email, address, notes.
2. **Projects link to a customer** (`customerId`), migrating existing
   `client` strings automatically rather than discarding them.
3. **Pipeline** — extend project status with `lead`, `quoted` and `lost`, so
   the existing badge becomes a real funnel instead of only execution states.
4. **Contact log** — calls, site visits, emails and notes against a customer,
   with an optional follow-up date and an overdue indicator.
5. **Customer detail** — their projects, contact history, and one-tap call /
   email / WhatsApp / directions.

## Constraints

- Same no-Blaze, static-hosting constraints as the rest of the app
  (PROJECT.md §3).
- Must not regress the site-facing flows crews depend on.
- All new UI strings translated across the nine languages.
- Existing projects must keep working with no manual cleanup.

## Definition of done

- A customer can be created, edited and deleted.
- Existing projects show their original client, now as a linked customer.
- Project list can be filtered by pipeline stage.
- A contact entry can be logged against a customer with a follow-up date, and
  overdue follow-ups are visible.
- Verified in a browser against real data, with test records removed after.

## Out of scope (next patches)

- **Quotes and invoices**, including the Swiss **QR-Rechnung** standard and
  MWST handling — the largest single piece of remaining value, deserves its
  own spec.
- **Job costing** — hours × rate + materials vs quoted. The inputs are already
  captured; only a labour rate and a margin view are missing.
- Crew scheduling and dispatch.
- Payments, e-signature, accounting export.

## Risk

Customer records are **personal data**. The database is currently
world-readable and writable (PROJECT.md §5.1). Shipping this increases the
consequence of that defect from "someone sees your job log" to "someone
harvests your clients' contact details", which under the Swiss nFADP is a
disclosure risk. **Auth should land immediately after this, and before this
is used with real client data.**
