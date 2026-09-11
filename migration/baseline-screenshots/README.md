# Baseline screenshots — Angular 14.2.12 / Material 14.2.7 (tag `baseline-angular-14`)

Visual reference for the manual comparison required by `UPGRADE_PLAN.md` §6 after every phase.
Captured from `ng serve retail-banking` (4200) and `ng serve wealth-portal` (4300) with Chrome
137 at a 1440×1000 viewport, device scale 1, animations disabled. Re-capture with the same viewport
and compare side by side; **alignment** differences are regressions, **density** differences are
reported for judgement (§7).

| Surface (§6) | Files |
|---|---|
| `bofa-card` | `retail-02-bofa-card.png`, `wealth-02-bofa-card.png`, plus the full pages |
| `bofa-table` header | `retail-03-bofa-table-header.png`, `wealth-03-bofa-table-header.png` |
| `bofa-table` row hover (2nd row) | `retail-04-bofa-table-row-hover.png`, `wealth-04-bofa-table-row-hover.png` |
| `bofa-text-input` idle / focused / filled (incl. hint) | `retail-05-text-input-datepicker-idle.png`, `retail-06-text-input-focused.png`, `retail-08-form-filled.png` |
| `bofa-datepicker` closed / calendar open | `retail-05-…-idle.png`, `retail-07-datepicker-open.png`, `retail-08-form-filled.png` |
| `bofa-button` `primary` | `retail-09-bofa-button-primary.png` |
| `bofa-button` `secondary` | `wealth-05-bofa-button-secondary.png` |
| `bofa-button` `ghost` | `retail-12-bofa-button-ghost.png` (dialog Cancel) |
| `BofaConfirmDialogComponent` — retail "Send payment" | `retail-10-confirm-dialog-open.png`, `retail-11-confirm-dialog-container.png` |
| `BofaConfirmDialogComponent` — wealth "Request rebalance" | `wealth-06-confirm-dialog-open.png`, `wealth-07-confirm-dialog-container.png` |
| Whole page | `retail-01-full-page.png`, `wealth-01-full-page.png` |

Retail dialog was opened with Payee = `Acme Utilities`, Amount = `125.50`, date picked from the
calendar (the form's `Validators.required` must pass before `submitPayment()` opens the dialog).
