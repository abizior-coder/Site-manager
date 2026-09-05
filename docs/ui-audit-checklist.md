# UI audit checklist (the interface engineer's brief)

Run before a commit that touches anything a person sees. The app is
phone-first: a roofer in gloves, in sun, on a 375 px screen, often with a
weak connection. The office uses it at 1280 px.

## Setup

- Emulator + seed: `npm run emulators`, `npm run seed`; static server on
  5566; open `http://localhost:5566/index.html?emulator=1`.
- Accounts: chef@test.local (owner), polier@test.local (supervisor),
  crew1@test.local (crew), password test1234.
- Viewports: 375×812 (phone), 768×1024 (tablet), 1280×800 (desk).

## Walk

Every tab and every modal, as owner and as crew: Heute, Baustellen (job
hub: Übersicht, Zeiten, Material, Fotos, Pläne, Rapporte, Chat), Material
(Shop, Werkzeug, Transport, Bibliothek; supplier sheet), Rapport (Tag,
Woche, Monat), Kalender, Kunden (list, detail), Board, Übersicht
(Cockpit), Team, Transport, Sicherheit, Mein Profil, the «+» sheet, the
error panel, the update bar, sign-in and onboarding.

## Check, in this order

1. **Nothing overflows or clips**: `document.documentElement.scrollWidth`
   equals the viewport width on every screen; long names, long addresses,
   14-language labels (try `sq`, `hu`, `bg`) fit or truncate with an
   ellipsis; numbers never wrap mid-value.
2. **Loading states**: every lazy tab and modal shows something while it
   loads (never a blank area); a spinner or skeleton within 100 ms; a
   failed load says so with a retry.
3. **Empty states**: every list says what it would show and how to add the
   first item; no bare "0" or empty card.
4. **The day**: Heute shows the date, the site, the running clock, breaks
   and today's entries in one glance; the first action (start the day) is
   the biggest control on the screen.
5. **Reports**: Tagesrapport, Woche and Monat are readable on the phone
   (tables scroll inside their container, totals stay visible), print
   cleanly (`window.print`), and the signed Rapport looks the same as
   when it was sent.
6. **Touch and focus**: 44 px targets, visible focus, no control hidden
   under the tab bar or the dock, the keyboard does not cover the field
   being typed in.
7. **Contrast and type**: nothing under 12 px, text colours pass 4.5:1,
   the accent red is never body text.
8. **Consistency**: one card style, one button hierarchy (primary,
   secondary, quiet), one icon size per context, spacing on the 4 px grid,
   the same wording for the same action everywhere.
9. **Feedback**: every save shows a toast or a visible change within
   300 ms; destructive actions ask; errors show the code panel.
10. **Dialogs**: Escape closes, focus returns, the sheet does not scroll
    the page behind it, the close control is reachable with a thumb.
11. **Offline**: turn the network off (DevTools or a patched `fetch`):
    the app stays usable, queued items are marked, nothing loops.
12. **Dark surfaces in sun**: the most important text is the brightest;
    muted text only for secondary information.

## Report

`docs/ui-audit-<date>.md`: a table of findings (screen, viewport, role,
what is wrong, severity H/M/L, the standard it breaks, the fix), then what
was fixed in this pass with the render/e2e test that pins it. Findings
that need a product decision go to a spec in `docs/specs/`, not into the
code.
