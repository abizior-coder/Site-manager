# Money in Rappen

**Status: implemented 2026-09-05** (accepted the same day; engineering audit M1; owner: "wykonaj
wszystkie krok po kroku").

## Goal

Invoice and quote sums are computed in integer Rappen, so that a list of
line items never drifts by a floating-point crumb and the printed total,
the QR-bill amount, the on-screen state and the accounting export agree to
the Rappen. Displayed values stay CHF with two decimals; nothing changes
for the person.

## Design

- `documents.js`: `toRappen(x)`, `fromRappen(rp)`; `documentTotals` sums
  `round(unitPriceRp × qty)` per line, VAT as `round(netRp × rate / 100)`,
  gross rounded to 5 Rappen (Swiss cash rounding), and returns both CHF
  numbers (`net, vat, gross`) and Rappen (`netRp, vatRp, grossRp`);
  `documentState` compares paid and outstanding in Rappen.
- Tests: 3 × 33.33, 0.10 × 3, 7.5 h × 85.50, the existing invoice fixtures
  unchanged, VAT 8.1 on 99.99, rounding to 0.05 both ways.

## Out of scope

- Costing in the job view (materials × prices, hours × rate) stays float
  for display; it is never invoiced from directly.
