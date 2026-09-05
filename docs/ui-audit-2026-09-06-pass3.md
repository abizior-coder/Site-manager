# UI audit 2026-09-06, pass 3 (interface engineer, per `docs/ui-audit-checklist.md`)

Scope of this pass: the language picker that landed after pass 2
(`ui/lang-picker.jsx`, `[data-auth-lang]`) on the sign-in screen and on the
onboarding screen (a throwaway account `p3-audit-<ms>@test.local` was created
on the auth emulator to reach it), the four findings pass 2 left open (19, 23,
24, 25), and a regression walk over sign-in, Heute, Team, Board and Kunden after
the last three commits (language picker, QR-bill split, LF normalisation).
Roles: owner (chef) and crew (crew1) at 375×812 and 1280×800, in `de` and
`sq`. Every number below is a DOM probe (`getBoundingClientRect`,
`scrollWidth`, `getComputedStyle`, `document.activeElement`,
`matchMedia("(hover: none)")`); screenshots confirmed the look at 375.

## Findings

| # | Screen | Viewport | Role | What is wrong | Sev | Standard it breaks | Status |
|---|---|---|---|---|---|---|---|
| 1 | Sign-in / onboarding › language picker | 375, 1280 | — | The `<select>` is 39 px tall beside 46 px inputs (one form, two control heights); its class `outline-none` (Tailwind: `outline: 2px solid transparent`) beats the base `:focus-visible` rule, so keyboard focus on it is invisible; `color-scheme` is `normal`, so the native list opens white on the desktop. Layout, contrast (muted label 5.9:1 on shell, text on card > 10:1), name (`aria-label` «Sprache» / «Gjuha»), 14 options and no overflow (`scrollWidth` = viewport in de and sq at both widths) were fine. | M | WCAG 2.4.7 (focus visible), 2.5.8 (target); Checklist 6, 8. | **Fixed** in `ui/lang-picker.jsx`: `py-3` (measured 47 px), `min-w-0`, no `outline-none`, `colorScheme: "dark"`. Verified: keyboard focus shows `outline: rgb(218,41,28) solid 2px`, `:focus-visible` true; 47×255 px at 375, 47×323 px at 1280; the language change re-renders the whole screen («Hyr», «Krijo një llogari», `html[lang=sq]`, `localStorage site-log-lang`). |
| 2 | Onboarding: «Ich habe einen Einladungscode» / «Kam një kod ftese» (384×16), «Datenschutz» link (16 px); sign-in «Datenschutz» (65×16) | all | — | Text-only controls 16 px tall without the `tap` hit area. Pass 2 finding 18 listed the sign-in «Datenschutz» as fixed; it was not. | M | WCAG 2.5.8; Checklist 6. | **Fixed**: `tap` on all three (`::before` 44 px measured on the sign-in link). «Abmelden» on onboarding already had it. |
| 3 | Sign-in, onboarding and every form: text inputs | all | all | Every `<input>`/`<textarea>` carries `outline-none`, which beats the base `:focus-visible` ring — keyboard focus on the e-mail and password fields is invisible (measured: focused e-mail input `outline: rgba(0,0,0,0) solid 2px`, `:focus-visible` = true, no box-shadow, border unchanged). | M | WCAG 2.4.7; PROJECT.md 2b «focus visible». | **Not fixed** (app-wide pattern, the same rule as pass 2 finding 23: a spec). One rule in `tailwind.src.css` `@layer base` does it — `input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid …; outline-offset: 2px }` (specificity 0,1,1 beats `.outline-none`) — but the colour needs a decision: the accent red on a field reads as «invalid»; a text-colour ring is the alternative. |
| 4 | Team › invite row › Löschen (pass 2 finding 25) | all | owner | A code was deleted on one tap. | L | Checklist 9: destructive actions ask. | **Fixed**: the customer pattern — the first tap (`[data-invite-delete]`) swaps the four icons for «Code löschen?» + Löschen (`[data-invite-delete-yes]`) + Zurück; `dropInvite` and `openTeam` reset the ask. New key `inviteDeleteConfirm` ×14. Verified at 375: confirm row 196×60 px inside the 333 px row, no dialog overflow, Zurück restores the icons, the code stays. Render test: first tap asks, second tap deletes. |
| 5 | Team roster › today chip (pass 2 finding 19) | all | all | The chip beside a name is today's assignment, the line under it the job's crew list — no label, reads as a contradiction («Steildach Lettenring» / «Keine Baustelle zugeteilt»). | L | Checklist 8: one wording for one thing. | **Fixed**: a muted «Heute:» prefix in the chip group (`[data-roster-today]`, `title` kept), key `rosterToday` ×14 («Hüt:», «Sot:», «Днес:», «Ma:», …). Verified as owner and crew at 375 (group 139×42 px, wraps to prefix + chip) and 1280. Render test: the group starts with «Heute:». |
| 6 | Board › Woche (pass 2 finding 24) | 375 | manager | Opened on Monday with today out of view; «Auftrag auf einen Tag ziehen» on a device without drag; a drag strip of jobs that does nothing on touch. | L | Checklist 4, 8. | **Fixed** in `tabs/BoardTab.jsx` (lazy chunk, no first-paint cost): the name column is pinned (`sticky left-0`, a box-shadow paints the 6 px gap), today's header carries `[data-woche-today]` and a `useEffect` scrolls the box to it when the week opens or changes; under `(hover: none)` the drag hint and the strip are hidden and `plannerHintTouch` («Einteilen im Kalender. Auf ein belegtes Feld tippen, um es zu leeren.», ×14) shows. Verified at 375: `scrollLeft` 348 of 760, «Sa 5» at x 183–312 inside the 37–338 px box, name cell `position: sticky` at x 37, touch hint visible, drag hint and strip hidden; at 1280 the drag hint shows and nothing scrolls. Render test: the hooks and the two hint classes. |
| 7 | Kunden form, Kontakt form, Mein Profil (pass 2 finding 23) | all | all | Placeholder-only labels: the label vanished once a field was filled. | L | WCAG 3.3.2 (visible labels). | **Fixed**: a `Field` helper (a `<label>` with a muted 12 px text above the control, the control keeps `w-full`; no `aria-label`, no placeholder-as-label) on the six customer fields, the contact note (label «Notizen», the question stays as placeholder) and Wiedervorlage, and the eight profile fields; the webhook field is now named by its section label instead of the example URL. Verified on the emulator (Kunden and Profil at 375, Kunden and Kontakt at 1280 on the final build): every field has `labels.length === 1`, no placeholder-as-label, 333 px wide at 375 and 526 px in the 576 px desktop pane; the edit form is 616 px tall at 375 (fits 812 without scrolling), no dialog overflows. The render probe «every rendered input has a label» accepts an implicit label; a customer-form test pins it. Not done: the sign-in/onboarding fields (E-Mail, Passwort, Ihr Name, Firmenname) keep placeholder-only labels — the first screen's look is a product decision and the e2e helper selects them by placeholder. |
| 8 | Kontakt erfassen | all | manager | Two label styles in one form: «Notizen» (new, sentence case) above «WIEDERVORLAGE» (uppercase, tracked). | L | Checklist 8: one style. | **Fixed**: Wiedervorlage is a `Field` too; uppercase stays for section headings (Profil), sentence case for field labels. |
| 9 | Kunden › customer detail | all | crew | «Bearbeiten» and «Kontakt erfassen» are offered to crew; whether the rules accept the write is a permissions question, not a display one. | L | — | Noted, not touched (`canManage` gate is a product/rules decision). |

Counts: **0 H, 3 M, 6 L**; 7 fixed, 2 open (3 → spec, 9 → product).

Checked and fine (this pass): `documentElement.scrollWidth` = viewport on
sign-in, onboarding, Heute, Team, Board, Kunden (list, detail, edit form,
contact form), Mein Profil at 375 and 1280 as owner and as crew; no visible
text under 12 px on Heute (probe over every leaf); the day card shows the local
date «Sa, 05.09.2026» with a 56 px first action («Baustelle wählen» / «Baustelle
öffnen»); the menu drawer (287 px) does not overflow; the customer rows' call
links are named («Anrufen: Sutter Teresa»); every dialog opened (Team, Kunde
bearbeiten, Kontakt erfassen, Mein Profil) has `role=dialog`, a title, a 44 px
close and closes on Escape; the crew's drawer has no Board and the crew's Team
roster has no Einladen/entfernen; the picker's language change survives a
reload; the sign-up form keeps `autocomplete="new-password"`; the `?join=`
onboarding path (Kam një kod ftese ⇄ Krijo firmën) switches without layout
shift.

## Fixed in this pass

| Task | Files | Hooks / keys | Test |
|---|---|---|---|
| A picker | `ui/lang-picker.jsx`, sign-in + onboarding in `roofing-site-manager.jsx` | `[data-auth-lang]`, `tap` on the three text controls | e2e (existing) «the language picker works before signing in» |
| B invite delete | `roofing-site-manager.jsx` (`inviteDeleteAsk`, `dropInvite`, `openTeam`) | `[data-invite-delete]`, `[data-invite-delete-confirm]`, `[data-invite-delete-yes]`; `inviteDeleteConfirm` ×14 | render: «the first tap on an invite code's Löschen asks», «the second tap deletes» |
| C roster label | `roofing-site-manager.jsx` | `[data-roster-today]`; `rosterToday` ×14 | render: «the roster labels today's assignment «Heute:»»; logic: the key is translated everywhere |
| D Board Woche | `tabs/BoardTab.jsx` | `[data-woche]`, `[data-woche-today]`, `[data-woche-hint]`, `[data-woche-hint-touch]`; `plannerHintTouch` ×14 | render: «marks today's column and pins the name column», «swaps the drag hint for a touch hint» |
| E visible labels | `roofing-site-manager.jsx` (`Field`) | — | render: «the customer form shows a visible label above every field»; the label probe accepts implicit labels |

Suites after the last build: render 156/0, logic 308/0 (three new key
guards), first-paint JS 357 919 bytes = 349.5 KB of the 358 400 budget
(481 bytes left — the removed `aria-label`/placeholder pairs paid for the
`Field` helper and the confirm row).

## Open (product decisions → a spec, not code)

- Visible keyboard focus on text fields app-wide (finding 3): one CSS rule,
  one colour decision.
- Labels on the sign-in / onboarding fields (finding 7, second half).
- Crew's access to customer editing (finding 9).
- Pass 2 finding 26 (the Worker's bexio status text in English) stays with
  the Worker.
