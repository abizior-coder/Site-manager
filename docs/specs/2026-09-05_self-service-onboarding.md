# Self-service onboarding: a firm sets itself up without the developer

**Status: implemented 2026-09-05** (accepted the same day; value plan 2B.2; owner: "continue" after
the accounting export).

## What exists already

Sign-up, "Firma erstellen" (company + owner membership + users record),
"Firma beitreten" with a code, invite codes per role from the Team tab
(three days, one person each). What a new firm still needs a person for:
the crew must type a code by hand, nobody tells the owner what to set up
first, and the customer list has to be typed in one by one.

## Goal

1. **Invite link.** Every code also exists as a link
   `…/index.html?join=CODE`. The Team tab offers *Link kopieren* and
   *Teilen* (the phone's share sheet when there is one, clipboard
   otherwise) with a short text naming the firm. Opening the link lands
   on the sign-in screen in *Konto erstellen* mode with a notice that an
   invite was recognised; after sign-up the onboarding screen is already
   in *beitreten* mode with the code filled in. The parameter is removed
   from the address bar once read.
2. **Erste Schritte** for the owner on Heute, until done or dismissed:
   Wochenstunden + Stundensatz (opens Rechnungsangaben), first Baustelle
   (opens the new-site form), crew invited (Team), customers (Kunden).
   Each shows done/open; the card hides itself when all four are done.
   Dismiss is per device (localStorage).
3. **Kunden importieren** on the Kunden tab: a CSV/TXT file, delimiter
   detected, headers in DE/EN/FR/IT and bexio's contact export layout
   (Kontaktart, Name, Vorname, Adresse, PLZ, Ort, Telefon, E-Mail,
   Kontaktperson 1 …). A preview says how many rows were read, how many
   are new and how many already exist (same e-mail, or same name and
   company), then one tap imports. Firma rows become customers with the
   company set and the contact person as the name; without a person the
   company name is the name.
4. Invite hint text says three days, not fourteen (the code has been three
   days since the audit).

## Design

- `onboarding.js` (new, pure, tested, in the first paint): `inviteUrl(code, href)`,
  `joinCodeFromSearch(search)`, `withoutJoinParam(href)`,
  `firstSteps({ projects, customers, members, invites, billing })`.
- `customers-import.js` (new, pure, tested, loaded when a file is picked so
  the 350 KB budget holds): `parseCustomersCsv(text)`, `mergeCustomers(existing, rows)`.
  Parsing reuses `detectDelimiter`/`splitRow` from `price-list.js`
  (line-based: a quoted field with a line break inside is not supported;
  bexio exports none).
- App: a mount effect reads `?join=`; Team tab invite rows get the two
  buttons; Heute gets `FirstSteps` (owner only) through a `topCard` prop
  on `TodayTab`; Kunden tab gets the import button, hidden file input and
  preview modal; `persist({ customers })` writes the merged list.
- i18n: `onbLinkNotice, inviteLinkCopy, inviteShare, inviteShareText,
  teamInviteHint, firstSteps*, importCustomers*` ×14.

## Definition of done

- Logic tests: link and code round-trip, first steps done/open, bexio and
  plain CSV parsed, duplicates skipped.
- Render tests: the owner sees the first-steps card with four items (or
  none when all done); the Kunden tab has the import button; a crew member
  sees no first-steps card.
- Emulator: a fresh account opened with `?join=CODE` joins the seeded firm
  without typing the code; a CSV of three customers imports with one
  duplicate skipped.

## Out of scope

- A sample Baustelle with demo entries (clutters real data).
- E-mail sending of invites (needs a mail service).
- Payment/plan selection.
