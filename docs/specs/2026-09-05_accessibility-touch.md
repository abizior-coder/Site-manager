# Accessibility and touch: dialogs, names, targets, type, icons

**Status: implemented 2026-09-05** (accepted the same day; engineering audit H6 and M3; owner:
"1 potem 2 potem 3").

## Goal

A crew member with a screen reader, a keyboard, big fingers, gloves or
sun on the screen can use every control:

1. **Dialogs behave like dialogs.** `Modal` and the other full-screen
   overlays (menu drawer, «+» sheet, job view, file and photo viewers,
   photo editor, error panel, safety screen) carry `role="dialog"`,
   `aria-modal="true"`, a label (the title or an explicit name), close on
   Escape, take focus when they open, keep Tab inside, and give focus back
   to the control that opened them.
2. **Every control has a name.** Icon-only buttons get `aria-label`
   (translated) and `title`; inputs without a visible label get
   `aria-label` from their placeholder; SVG-only content is labelled or
   hidden from assistive tech.
3. **Touch targets are at least 44 px** on every button and link,
   without changing the layout where a control is drawn smaller: a `tap`
   utility extends the hit area to 44 × 44 around the control.
4. **Type is never under 12 px.** `text-[9px]`, `text-[10px]` and
   `text-[11px]` become `text-xs` (12 px); a logic test refuses smaller
   arbitrary sizes in the source.
5. **Focus is visible** (`:focus-visible` outline in the accent colour),
   and `prefers-reduced-motion` stops spinners and transitions.
6. **Icons for the home screen.** PNG 180 (Apple touch icon), 192 and
   512 (Android, maskable 512) generated from the SVGs; the manifest lists
   them first; the tablet is no longer locked to portrait.

## Design

- `ui/dialog.js`: `useDialog({ onClose, ref })` — Escape, focus trap,
  initial and returned focus; pure helpers `focusable(root)` and
  `trapTab(event, root)` with logic tests.
- `Modal` uses it and gets `role`, `aria-modal`, `aria-labelledby`, a
  named close button. Overlays get the same attributes and hook.
- `tailwind.src.css`: `.tap` (44 px hit area via `::before`),
  `:focus-visible`, reduced motion.
- A script pass adds `aria-label`/`title` to the icon-only buttons listed
  by the audit and `aria-label={placeholder}` to inputs and textareas that
  have none; a second pass replaces the tiny sizes.
- `icon-180.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`
  rasterised from the SVGs; `manifest.webmanifest` and `index.html` point
  at them; `orientation` removed.

## Definition of done

- Render tests: a modal has `role="dialog"` and closes on Escape; no
  rendered button is without an accessible name; no rendered input is
  without a label or `aria-label`.
- Logic tests: `focusable`/`trapTab` cycle correctly; the source has no
  `text-[N px]` under 12; every icon file the manifest names exists.
- Emulator: Tab stays inside an open modal, Escape closes it, focus returns
  to the opener; the page has no horizontal overflow at 360 px with the
  larger type.
- Contrast is unchanged in this patch (accent-on-card 3.2:1 is a palette
  decision for a design pass; noted in the audit).
- Found on the way: the first-steps «Wochenstunden» button set the modal
  flag without a draft and so did nothing; fixed.

## Out of scope

- Visible `<label>` elements everywhere (layout change; `aria-label` meets
  the bar for now).
- Palette changes for contrast.
