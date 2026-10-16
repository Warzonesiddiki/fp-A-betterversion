# Fake-finance findings (sess_031)

## Ratchet (measured)

| Detector | Result |
| --- | --- |
| `npm run fabrication:audit` | **0 findings / 0 files** (export engines fail-closed at 0) |
| `npm run money:ast` | **25 unsafe ops / 3 modules / 99.66% safe** — all remaining in `src/services/mockData/*` (fixture factories; skipped per session 028) |

## What 0 fabrication does **not** mean

Sessions 007–030 proved the detectors cannot see:

- Numeric ratio invention (`pretax * 0.7`, `taxRate: 21`)
- View/memo divergence (correct totals, wrong JSX)
- Demo fallbacks when a store is empty
- Persist seeds that re-inject quotes after a page rewrite
- KPI deltas / sparkline arrays / trend words

A file at 0 findings is **un-flagged, not certified**. Per-module source guards remain mandatory.

## Open semantics (not fabrication-scanner)

- `src/pages/sector/InsuranceDashboardPage.tsx` CoA prefixes were fixed in session 030; keep the prefix rule (41xx/43xx/51xx/52xx).
- Engine mocks still armed in some vertical engines (RealEstate occupancy placeholders, Construction 1.5× backlog) — callers were rewritten to not use them; the engines remain loaded guns (H-003).
