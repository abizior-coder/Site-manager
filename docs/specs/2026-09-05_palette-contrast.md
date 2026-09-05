# Palette: text colours that pass AA on the dark surfaces

**Status: implemented 2026-09-05** (accepted the same day; engineering audit H6, contrast; owner:
"wykonaj wszystkie krok po kroku").

## Goal

Every colour used for small text reaches 4.5:1 on the surfaces it sits on
(shell, card, cardAlt). The Swiss red stays the brand for buttons, bars and
icons; text in red uses a lighter red made for text.

## Design

- `ui/theme.js`: `accentText` and `dangerText`, the darkest reds that pass
  4.5:1 on all three surfaces; a comment says why two reds exist.
- Text usages `color: COLORS.accent` and `color: COLORS.danger` (style
  objects on text elements) become the text tokens; backgrounds, borders
  and icon colours keep the brand red.
- A logic test computes the contrast of every text token (`text`, `muted`,
  `accentText`, `dangerText`, `success`, `amber`) on the three surfaces and
  refuses anything under 4.5:1.

## Out of scope

- A light theme.
