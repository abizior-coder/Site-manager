# UI audit 2026-09-06, pass 2 (interface engineer, per `docs/ui-audit-checklist.md`)

Pass 1 covered Heute, the job hub, Material, Rapport, Übersicht, Team (roster
only), the menu drawer and the sent-report modal. This pass walked the rest on
the emulator (seed of `scripts/seed-emulator.mjs`): Kunden (list, search rule,
detail with contacts and follow-ups, new/edit form, CSV import modal), Kalender
(month, the day modal as manager and as crew, the range-leave modal), Board
(week and month), Team (roster, invite modal with the link/share/copy/delete
row, remove member), Transport, Sicherheit (SUVA texts, the emergency screen),
Mein Profil (all sections, insurance card and certificate forms, backup, the
delete-account dialog as owner and as crew), the «+» sheet and every modal it
reaches (start day, material with the supplier row, photo, note, trip,
inspection), the material basket and the request flow, sign-in, sign-up and the
`?join=CODE` banner, the language switch to `sq`, `hu` and `bg` on Cockpit,
Rapport and the job hub, and the 1280 px layout everywhere (sidebar, Cockpit
grid, job sheet as a pane, Kunden, Kalender, Board, Team, Profil modal).
Roles: owner (chef), supervisor (polier) and crew (crew1) at 375×812 and
1280×800. Screenshots worked this time; each finding still carries the DOM
number that proves it (`getBoundingClientRect`, `scrollWidth > clientWidth`,
`document.activeElement`, the accessible-name probe).

Not walked: the onboarding screen after sign-up (create / join a company). It
needs a new account, which this audit does not create; the `?join=CODE` banner
on the sign-up form («Einladung erkannt …») was verified signed out.

## Findings

| # | Screen | Viewport | Role | What is wrong | Sev | Standard it breaks | Fix |
|---|---|---|---|---|---|---|---|
| 1 | «+» sheet › Notiz | all | all | `openAdd("note")` opens the add modal, whose title falls through to «Foto hinzufügen» and whose body is the material form: «Was wurde verwendet», Menge, Einheit, Einzelpreis, Regie, Lieferant, Artikel-Nr. A note ends up saved with material fields. Reproduced twice (dialog title «Foto hinzufügen», six material inputs). | H | Checklist 8: the same wording for the same action; a form must be the form its title names. | A note branch in the add modal: title «Notiz», one textarea (the job hub's comment placeholder), no trade row; `submitAdd` writes `{type:"note", projectId, description}` and translates it like the job hub does. Render test: the note action opens a dialog titled Notiz with a textarea and no quantity input. |
| 2 | Photo modal («+» › Foto, job hub › Foto) | all | all | `useDialog` focuses the first focusable, which is the hidden `<input type=file class="hidden">`; `focus()` on a `display:none` element does nothing, so `document.activeElement` stays `BODY`, the dialog's keydown listener never fires: **Escape does not close the photo modal, Tab is not trapped, focus does not return**. Measured: after opening, `activeElement = BODY`, `insideDialog = false`; Escape left `dialogs = 1`. The note modal (first focusable is a text input) closes fine. | H | Checklist 10: Escape closes, focus returns; PROJECT.md 2b: dialog semantics. | `focusable()` in `ui/dialog.js` skips elements whose computed `display` is `none` or `visibility` is `hidden` (jsdom computes inline styles, so the helper stays testable). Logic test: a hidden file input is not a focus target. |
| 3 | Every screen in `sq` — Cockpit (Outstanding, Overdue, Received this month, Pipeline, Invoice, Hours to approve, Absences to decide, On site now, Nobody clocked in, Planned today, Hours this month, Jobs running, Follow-ups due, Needs attention, the footnote), Rapport (Sent reports, Save as PDF, Resend to supervisor), job hub (Customer, Reorder), Kunden (every string), Team (Members, Invite codes, Owner/Crew/Supervisor), Board, backup, weather, billing, onboarding, the SUVA disclaimer | all | all | **200 keys of `i18n/sq.json` are the English text verbatim** (a script over en vs sq, ignoring the tolerated cognates), plus short ones (`All`, `VAT`, `Due`, `No.`, `Fog`). `sq` is also missing from the logic test's list of checked languages, which is why nothing caught it. `hu` (5 identical: Link, Chat, Info, bexio, Personal Access Token) and `bg` (2: bexio, Personal Access Token) are clean cognates. | H | Constraint: no English under another flag (pass-1 finding 15). | All 200 keys and the short ones translated into Albanian, in the vocabulary the file already uses (punishte, klient, mbikëqyrës, ekipa, raport, faturë, ofertë, kopje rezervë); `sq` added to the logic test's list. |
| 4 | Board › Monat | 375 | manager | Month cells are 24 px of text: every chip is cut to one letter — «H…» for «Hans · Krankheit» (94 > 24), «P…» for «Peter · Steildach Lettenring» (149 > 21), the note «Re…». Nothing readable. At 1280 the same chips truncate with the name visible (149 > 113), which is fine. | M | Checklist 1: labels fit or truncate meaningfully. | Under `sm` the cell shows a strip of coloured dots (one per assignment, amber for leave, a count) instead of labels; the labels stay from `sm` up. Render test: a month cell carries `[data-board-dots]`. |
| 5 | Dachinspektion modal | 375 | all | The row Startzeit / Leiter (m) / Anzahl PSA is three `flex-1` inputs without `min-w-0`: the row is 571 px wide in a 333 px modal (Startzeit 21–206, Leiter 214–399, Anzahl PSA 407–592 on a 375 px screen) — the third field is off-screen. The checklist tiles in a 3-column grid cut their labels: «Anschlüsse…», «Rinne / Abl…», «Unterdach …», «Moos / Rei…» (104 > 75, 97 > 75, 101 > 75). The ziegel `select` has no accessible name; «Modell hinzufügen» is a 16 px target. | M | Checklist 1; Checklist 6; PROJECT.md 2b accessible names. | `grid grid-cols-3` with `min-w-0` inputs; the tiles wrap their label (no `truncate`, `leading-tight`) in a 2-column grid on the phone, 3 from `sm`; `aria-label` on the select; `tap` on the button. |
| 6 | Team › invite modal, invite row | 375 | owner | Four 14 px icon buttons (Teilen, Link kopieren, Kopieren, Löschen) at x = 269, 291, 313, 335: 22 px apart. Each carries the 44 px `.tap` hit area, so the areas overlap by 22 px — a thumb between two icons hits an undefined one, and Löschen sits 22 px from Kopieren. | M | WCAG 2.5.8 (24 px target or spacing); Checklist 6. | Real 36 px boxes (`w-9 h-9 rounded-lg`) with `gap-1`: 40 px pitch, no overlap, no `.tap` needed. Render test: the four buttons carry `w-9`. |
| 7 | Kunden list › Fällige Wiedervorlagen «2026-09-02 · …», customer detail «Wiedervorlage 2026-09-02», contact history «31.08.2026» next to «1.09.2026» (`toLocaleDateString()` = browser locale, not the app language, not 2-digit), Team invites «Läuft ab 8.09.2026», Kalender day modal title «Wer arbeitet wo · 2026-09-08» (manager) and «2026-09-10» (crew), Transport day headings «2026-09-05 · Heute», Cockpit rows «2026-09-05 · Steildach Lettenring», «2026-09-08 · Ferien», «Overdue — 2026-08-26», «Follow-up 2026-09-02», bexio «since», backup «last» | all | all | ISO keys and browser-locale dates shown to people — the pass-1 standard (`fmtDate`) reached Rapport only. | M | PROJECT.md 2b: dates are local calendar dates, shown as such; Checklist 8: one format. | `fmtDate(iso, lang)` in all of them (the instants `k.at`, `i.expiresAt`, `s.since`, `lastAt` through `todayKey(new Date(ms))`); `CockpitTab` receives `lang`. Render tests: the customer follow-up row and the Cockpit hours row carry no ISO date. |
| 8 | Kunde bearbeiten › Löschen | all | manager | One tap on «Löschen» at the bottom of the edit form deletes the customer (and unlinks their jobs) with no question. The contact-history trash does the same for a contact record. | M | Checklist 9: destructive actions ask. | The inline two-step confirm the Team tab already uses: the first tap shows «Kunde löschen? …» with Löschen / Zurück. Render test: the first tap keeps the customer. |
| 9 | «+» sheet | 375 | all | «Neue Dachinspektion» is cut to «Neue Dachins…» (121 > 91) in the 3-column action grid; the tiles are 68 px tall with room for two lines. | M | Checklist 1. | The label wraps to two lines (`line-clamp-2 leading-tight`), no `truncate`. Render test: no action label carries `truncate`. |
| 10 | Kontakt erfassen › Wiedervorlage (date); Mehrere Tage frei › Von / Bis (dates); Neue Fahrt › Baustelle, Fahrzeug (selects), Datum, Abfahrt, Ankunft, Notizen; Dachinspektion › Ziegelmodell (select); Warenkorb › Menge | all | all | Form controls without an accessible name: the visible label is a `div` above them, not associated. The accessible-name probe lists eleven. | M | PROJECT.md 2b: accessible names on controls (WCAG 1.3.1 / 4.1.2). | `aria-label` from the visible label on each. Render test: the trip modal has no unnamed control. |
| 11 | Kunden list rows | all | all | The phone icon is an `<a>` inside the row `<button>` (interactive content inside a button is invalid HTML; screen readers announce the row's text for both), 32 px, no accessible name. | M | HTML content model; PROJECT.md 2b accessible names; Checklist 6. | The row is a `div` with the name button and the call link as siblings; the link gets `aria-label` + `title` + `tap` and a 40 px box. Render test: no `a` inside a `button` on the customers tab. |
| 12 | Heute › Pausen chips | 375 | all | «Znüni 09:00 · 30 min» → «Znüni 09:00 · 30 …» (115 > 109), «Mittag 12:00 · 60 …» (121 > 110): the minutes are the information and they are the part that is cut (pass-1 finding 16). | M | Checklist 1: truncate meaningfully. | Two lines: the name, then «09:00 · 30 min» — each part fits the 109 px chip in every language; no `truncate`. Render test: a break chip carries no `truncate` and two lines. |
| 13 | Kalender › month arrows | all | all | The next-month arrow is named «Öffnen» (`a11yOpen`) and the previous one «Zurück» (`a11yBack`): a screen reader hears Open / Back, not the month. | M | PROJECT.md 2b: accessible names that say what the control does. | Two keys in all 14 languages: «Vorheriger Monat» / «Nächster Monat». Render test: the calendar's arrows carry those names. |
| 14 | Notfall screen › «Schliessen & protokollieren» | 375 | all | The only way out of the full-screen emergency view is a 188×16 px bordered text button top-right (Escape works too, but not on a phone). | M | Checklist 6: 44 px targets. | `py-2.5 px-3` (≥ 40 px) — it stays where it is, the numbers stay first. Render test: the close button has vertical padding. |
| 15 | Transport (no trips) | all | all | «Noch keine Fahrten. Die erste erfassen …» as a bare paragraph over the mountain backdrop; the «0» trip count is `COLORS.accent` (the button red) as text. | M | Checklist 3: empty states; Checklist 7: the accent red is never body text. | `EmptyState` (`[data-empty="trips"]`, icon, hint, «Neue Fahrt» action); the count in `COLORS.accentText`. Render test: crew Transport shows `[data-empty="trips"]`. |
| 16 | Heute › Erste Schritte | all | owner | «**Ekipa** einladen» — a Slavic/Albanian word in the German UI (`de.json` `firstStepsCrew`), on the first screen every new owner sees. | M | Constraint: the language under the flag. | «Team einladen». Logic test: `de.json` carries no «Ekipa». |
| 17 | Kunden › «Kunden importieren» | 375 | manager | 157 px of label in a 164 px button with no horizontal padding (the text touches the dashed border at 3 px); `hu` «Ügyfelek importálása» and `sq` «Importo klientë» are longer and will overflow. | M | Checklist 1; Checklist 8: one button style. | `px-2`, the label wraps (`leading-tight text-center`). |
| 18 | Small text controls: Team «Aus dem Team entfernen» (178×16), Heute «Ort ändern» (78×16), Board «Abgeschlossene zeigen» (169×16), Warenkorb «Warenkorb leeren» (122×16), Cockpit «Stunden & Ferien» (114×16), job sheet «Bearbeiten» (71×16), sign-in «Konto erstellen» (86×16) / «Passwort vergessen?» (108×16) / «Datenschutz» (65×16 and 333×16 in Profil) | all | all | Text-only buttons and links 16 px tall — under the 24 px minimum, far from the 44 px target. | M | Checklist 6; WCAG 2.5.8. | The `tap` class (the 44 px hit area the project already uses for icons) on each. |
| 19 | Team roster | 375 | all | The chip next to a name («Steildach Lettenring») is today's assignment; the line under it says «Keine Baustelle zugeteilt» (the job's crew list). Two concepts, no label — reads as a contradiction. | L | Checklist 8: one wording for one thing. | `title={t.schedToday}` on the chip and the assignment label as a visually-hidden prefix is out of scope; noted for the product (see below). Not fixed. |
| 20 | Sign-in / sign-up | all | — | No language control before signing in: an Albanian-speaking roofer sees the browser's language. The picker exists only behind the header once signed in. | M | Checklist (14 languages); Checklist 8. | Product decision (where the language lives before an account exists) — not fixed here; noted for a spec. |
| 21 | Profil › Webhook hint | all | all | «Fügen **Sie** eine … ein» — the only «Sie» in an app that speaks impersonally («Auf einen Tag tippen …»). | L | Checklist 8: one voice. | The impersonal wording in `de.json`. |
| 22 | Crew's Kalender day modal | 375 | crew | «Noch nichts erfasst.» bare one-liner above the leave form. | L | Checklist 3. | Compact `EmptyState` (`[data-empty="day"]`). |
| 23 | Kunden, Profil, Kontakt forms | all | all | Placeholder-only labels: once a field is filled the label is gone («Firma (optional)» only visible while empty). `aria-label` is present everywhere, so the screen reader is fine. | L | WCAG 3.3.2 (visible labels) — a pattern across the app. | Not fixed: an app-wide form pattern change belongs in a spec. |
| 24 | Board › Woche | 375 | manager | Two day columns visible, today (Sa) out of view; the hint says «Auftrag auf einen Tag ziehen» but HTML5 drag does not exist on touch. Kalender is the phone's planning surface. | L | Checklist 4/8. | Product: hide the drag hint under `sm`, or scroll today into view. Not fixed. |
| 25 | Team › invite row › Löschen | all | owner | A code is deleted on one tap (no ask). Re-issuable in one tap, so low. | L | Checklist 9. | Not fixed. |
| 26 | Cockpit › bexio card | all | owner | «invalid or expired sign-in» in English under every flag — the Worker's status text. | L | Constraint (no English under another flag). | Out of scope (`worker/` untouched); noted. |
| 27 | Material › sub-tabs | 375 | all | «Bibliothek» half visible at the right edge of the scroll strip. | L | — | Accepted: a scroll strip whose last chip peeks is its own affordance. |
| 28 | Dock header | all | all | «Aktive Baustellen» (20 px) and the sort pill (22 px) are under 24 px. | L | Checklist 6. | Accepted in pass 1 (dock.test pins the dock); not touched. |

Counts: **3 H, 15 M, 10 L**; two accepted (27, 28).

Checked and fine: `documentElement.scrollWidth` = viewport on every screen above
at 375 and 1280 as all three roles; no type under 12 px anywhere; every modal
(customer, contact, invite, profile, insurance card, trip, inspection, leave,
SOS, basket picker, language picker) has `role=dialog`, a labelled title, a
44 px close hit area and closes on Escape — except the photo modal (finding 2);
Escape from a stacked modal closes only the top one and focus returns to the one
below; the emergency numbers are `tel:` links 84 px tall in `COLORS.dangerText`;
the CSV import modal reads «3 Zeilen gelesen: 2 neu, 1 schon vorhanden» and
offers one action; the request flow (basket → Anfordern → Projekt wählen →
«Angefordert» toast → «Materialanforderungen (1)» with Bestellt / Geliefert)
works and fits; the `?join=CODE` banner appears on the sign-up form; the
sign-up form uses `autocomplete="new-password"`; `hu` and `bg` fit everywhere
they were opened (Cockpit tiles wrap to two lines, Rapport titles wrap); the
1280 layout has no horizontal overflow, the job sheet centres its content at
`max-w-4xl`, the Profil modal is a 576 px centred pane.

## Fixed in this pass

Spec `docs/specs/2026-09-06_ui-audit-pass2.md` — see its status line for what
landed, the tests that pin each fix and what the emulator showed after the
final build.

## Not fixed (product decisions → a spec, not code)

- A language control on the sign-in screen (finding 20).
- Labelling today's assignment on the Team roster (finding 19).
- Board on a phone: touch drag, today's column (finding 24).
- Confirming invite-code deletion (finding 25).
- Visible labels for the placeholder-only forms (finding 23).
- The Worker's bexio status text in English (finding 26).
- The onboarding screen (create / join a company) was not walked: it needs a
  new account.
