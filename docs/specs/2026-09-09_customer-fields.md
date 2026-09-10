# Customer record: the fields a Swiss office actually needs

**Status: proposed 2026-09-09.** Requested by the owner.

## Goal

Expand the customer record (`docs/specs/2026-08-26_crm-foundation.md`'s
"name, company, phone, email, address, notes") with the fields a Swiss
trade office actually fills in on a new customer: `anrede` (salutation),
company, a UID/CHE number, the contact's role at the company, a mobile
and an office phone kept separate, e-mail, a preferred language, an
object (site) address and a billing address kept separate, a preferred
contact channel, more than one contact person, notes, and where the lead
came from. WhatsApp opens from the mobile number only — never a second
number, never the WhatsApp Business API. Every added control is a single
phone-sized tap or a short type-in, matching the rest of this app. The
public demo's canned customer stays exactly where it already lives,
`demo-store.js`, untouched by any of this.

## Constraints

- PROJECT.md §3: no Blaze, no Cloud Functions, no new backend. Every new
  field is a plain string/boolean stored on the same
  `companies/{cid}/customers/{id}` document that already exists — no new
  collection, no new Worker route.
- `firestore.rules`'s `customers` match (`allow read: if isMember(cid);
  allow write: if canManage(cid);`) already covers the whole document,
  whatever fields it carries. This spec adds no rule and touches no
  permission.
- PROJECT.md §2b / the CRM foundation spec's own Definition of done:
  **existing customers must keep working with no manual cleanup.** Two
  fields are being split in two (`phone` → mobile/office, `address` →
  object/billing); neither split runs a migration. A customer saved
  before this spec simply has the old field and nothing in the new ones,
  and every read site falls back to it (see Design) — the same "no
  migration, old field still works" shape `docs/specs/2026-09-09_
  transport-detail-and-scan.md` already used for its own new fields.
- **Never split `name` into first/last.** `accounting-export.js`'s own
  `contactRows` already explains why: Swiss offices write both "Teresa
  Sutter" and "Sutter Teresa", and a wrong automatic split is worse than
  none. "Names" in the ask is `name` (already a field) plus the new
  `anrede` (a salutation, not a name) — nothing here re-opens that
  decision.
- **WhatsApp is `wa.me` from `phoneMobile` only.** The existing `waHref()`
  helper (`roofing-site-manager.jsx`) is reused as-is; it is simply pointed
  at `phoneMobile` instead of the old single `phone`. No WhatsApp
  Business API, no message-template account, nothing that needs Meta
  approval or a phone-number-verification flow — a plain `https://wa.me/`
  link is all this has ever been and all it stays.
- Demo mode: `demo-store.js`'s fixture carries no `customers/{id}`
  document today (only a legacy `project.client` string) — this spec adds
  none either. Whatever a demo *session* creates through the customer form
  lands in `demo-store.js`'s in-memory Firestore stand-in the same
  structural way every other demo write already does
  (`isDemoMode()`/`initFirebase()`, `docs/specs/2026-09-09_public-demo.md`)
  — nothing new to build for that guarantee, and nothing in the canned
  fixture itself changes.
- Every new label goes into all 14 `i18n/*.json` files (PROJECT.md's own
  translation-completeness rule, guarded by a logic test already).

## Design

### The fields, and what happens to what already exists

| Field | Type | Replaces / relates to |
|---|---|---|
| `anrede` | `""\|"herr"\|"frau"\|"firma"` | new — a salutation for the letter/e-mail opener, not a name |
| `name` | string | unchanged |
| `company` | string | unchanged |
| `uidChe` | string, free text | new — the Swiss UID (`CHE-123.456.789`), only shown/asked when `company` is set. Free text, no format validation: a firm without one yet, or a foreign supplier, must not be blocked by a regex guessing at a format this app has no authority over |
| `role` | string, free text | new — the contact person's function at the company ("Bauleiterin", "Geschäftsführer"). Free text, like `disposalSite`/`helper` in the transport spec: no invented reference list |
| `phoneMobile` | string | **replaces** the sole use of `phone` for WhatsApp and is the default "Call" number. A customer saved before this spec has `phone` and no `phoneMobile`; every read site (the call/WhatsApp buttons, search, CSV export) reads `phoneMobile \|\| phone` — the old field keeps working, forever, until someone types a mobile number into the new one |
| `phoneOffice` | string | new — a second, optional number (reception/Sekretariat). Never wired to WhatsApp |
| `email` | string | unchanged |
| `lang` | one of the 14 UI language codes, or `""` | new — the language to write to this customer in. A `<select>` built from the same `LANG_NAMES` map the app's own language picker already uses (`roofing-site-manager.jsx`), not a new list |
| `objectAddress` | string (multi-line, same shape as today's `address`) | new — the site/property being worked on. A customer saved before this spec has `address` and no `objectAddress`; the "Route" tap-button and any future site-address use read `objectAddress \|\| address` |
| `billingAddress` | string (same shape) | new — where the invoice/QR-bill goes. Reads `billingAddress \|\| address` — today's single `address` field already feeds the QR-bill "Zahlbar durch" block and the printed invoice's "to" address (`roofing-site-manager.jsx`'s `printDocument`), and that is exactly the billing use, so the fallback is not a guess, it is what the field already does today |
| `preferredChannel` | `""\|"call"\|"whatsapp"\|"email"\|"post"` | new — which of the tap-row's actions this customer actually answers on. `"post"` exists because some customers, disproportionately older private clients, are not digital at all — the office still needs to say so somewhere. Purely informational: it reorders or highlights nothing that isn't already offered, it just answers "which one do I try first" the way the firm's own supervisor-contact logic (`resolveChannel`-style code, `roofing-site-manager.jsx` around the report-send flow) already answers the same question for a different contact |
| `contactPersons` | array of `{id, name, role, phoneMobile, email}` | new — **more than one** person at the same company (a site contact and an office contact are routinely different people). Deliberately a **different array from the existing `contacts[]`**, which is the calls/visits/notes activity log the CRM foundation spec already built — same word, two unrelated meanings already existed before this spec (a customer's contact-log entry is called a "contact"; a person is also called a "contact"), and this spec does not rename either existing thing, so the code and this document both say `contactPersons` for the new array to keep them apart in conversation even though nothing forces that name technically |
| `notes` | string | unchanged |
| `source` | string, free text | new — how this lead arrived (referral, website, walk-in …). Free text: a fixed picklist would need real usage data behind it, which does not exist yet, the same reasoning that kept `wasteCode`/`disposalSite` free text in the transport spec |

`anrede`, `preferredChannel` and `lang` are the only three fixed-choice
fields; everything else typed in is free text, matching how every other
form in this app already treats names, addresses and notes.

### The form

`customerForm`'s field list (`roofing-site-manager.jsx`, currently a
`[[field, label], …].map()` loop building five `Field`-wrapped inputs)
grows to cover the new scalar fields the same way — one more `[field,
label]` pair each for `phoneOffice`, `uidChe` (shown only while `company`
is non-empty), `role`, `objectAddress`, `billingAddress`, `source`; `name`
is renamed in the loop's own label lookup from the generic "phone" to
`phoneMobile` (still the same input, same position, same `tel` type).
`anrede`, `lang` and `preferredChannel` are three short `<select>`s
alongside the loop, not inside it, the same way the trip modal's own
`loadKind`/`vehicle` pickers sit next to its plain text inputs
(`docs/specs/2026-09-09_transport-detail-and-scan.md`). `contactPersons`
gets its own small repeating block under the scalar fields — an "add
person" button appending `{id: uid(), name: "", role: "", phoneMobile:
"", email: ""}`, each row four short inputs and a remove button, the same
shape the inspection form's replaced-tile rows already use for "one more
row of a repeating thing" (`docs/specs/2026-09-03_inspection-and-transport
.md`).

### The tap row

The customer detail view's four-button tap row (Call, WhatsApp, Mail,
Route) changes only its data source, not its shape or count:

- **Call** (`telHref`): `c.phoneMobile || c.phone || c.phoneOffice` — a
  customer with only an office number can still be called; WhatsApp
  cannot use it.
- **WhatsApp** (`waHref`): `c.phoneMobile || c.phone` — **never**
  `phoneOffice`. If neither is set, the button is absent, exactly like
  today's `c.phone ? … : <div />` pattern.
- **Mail**: unchanged, `c.email`.
- **Route** (`mapsUrl`): `c.objectAddress || c.address` — the site, not
  the biller.

None of the four buttons changes what it *does* (still a plain `tel:`,
`wa.me`, `mailto:`, Google Maps URL, all opened the same way as today);
only which field feeds it changes. `preferredChannel`, if set, is shown
as a small label next to the customer's name ("bevorzugt: WhatsApp") —
informational only, per Design above.

### What does not change

- `documents`/`printDocument`/the QR-bill payload keep reading a
  customer's billing details the same way; only the source field changes
  from `c.address` to `c.billingAddress || c.address`, a one-line change
  at each of the three read sites already found (`roofing-site-manager.jsx`
  lines building the printed quote/invoice and the QR "payable by" block).
- `customers-import.js` (CSV/bexio import) and `accounting-export.js`
  (bexio contact push) are **not touched** by this spec — an imported
  customer keeps arriving with only the original flat shape
  (`name/company/phone/email/address/notes`), which is exactly what the
  fallback chain above already handles with no extra code. Wiring the
  importer/exporter to the new fields is a natural follow-up, not part of
  this patch (see Out of scope).
- `firestore.rules`, the Worker, and demo isolation are all unchanged
  (Constraints).

## Definition of done

- The customer form (`customerForm`) offers every field in the table
  above; `submitCustomer()` persists all of them plus `contactPersons`
  unchanged in shape (array, own ids) alongside the untouched `contacts[]`
  activity log.
- A customer saved before this spec still opens, edits and saves with no
  error and no data loss; its Call/WhatsApp/Route buttons still work
  from the old `phone`/`address` fields via the fallback chain.
- Logic tests (a small pure module, not inline in the app component, per
  PROJECT.md §2b): the four fallback rules (`phoneMobile || phone`,
  `phoneMobile || phone` again for WhatsApp specifically — same value,
  different caller — `objectAddress || address`, `billingAddress ||
  address`) as one small pure function each, or one function taking the
  customer and returning `{callNumber, whatsAppNumber, objectAddr,
  billingAddr}`; a case with only the legacy fields set, a case with only
  the new fields set, a case with both (new one wins).
- Render tests: the customer form shows every new field; a `company`-less
  customer does not show the UID/CHE field; adding and removing a
  `contactPersons` row works and survives a save; the WhatsApp button's
  `href` is built from `phoneMobile` even when a different `phone` is
  also set, and is absent when neither is set; the Call button still
  offers a number when only the legacy `phone` exists.
- `docs/CODE_MAP.md` gains a line for the new pure module (if the fallback
  logic becomes one) and updates the customer-form description if it
  already names the field list; `docs/DEVLOG.md` gets the implementation
  entry — both in the commit that adds the code, not part of this spec.

## Out of scope

- Any change to `customers-import.js` or `accounting-export.js`'s bexio
  contact push — the new fields are not yet read or written by either.
  A follow-up spec, once it is clear which of them (UID/CHE into bexio's
  own UID field, `contactPersons` into bexio's own multiple-contact
  support) is worth the work.
- UID/CHE format validation or a lookup against the Swiss UID register —
  free text only, per Design.
- A picklist for `source` — free text only, per Design.
- Splitting `name` into first/last — explicitly rejected, per Constraints.
- The WhatsApp Business API, message templates, or anything needing a
  Meta-approved sender — `wa.me` only, as today.
- Any rules, Worker, or demo-fixture change — none is needed.
- Merging duplicate customers — PROJECT.md §5 already tracks this as a
  known, deliberately-unfixed gap; unrelated to this spec.
