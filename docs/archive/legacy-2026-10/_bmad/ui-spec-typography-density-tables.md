# UI-SPEC-A · Typography / Density / Table Implementation Spec (UI-02 · UI-04)

> **Status:** HYPOTHESIS / PROPOSAL — pending Phase 3 authorization. This document is a map,
> not an approved redesign. No code changes have been made for this spec (read-only task).
>
> **Author:** Atlas (UI builder, team fpa) · **Date:** 2026-08-23
> **Sources:** `_bmad/project-completion-plan.md` §1 (UI-02, UI-04) · `_bmad/ui01-design-system-audit.md`
> (Uxie, 96% conf.) · fresh re-measurement of every cited line on 2026-08-23.
> **Honesty notes:** All numbers below were re-witnessed today (Read + PowerShell Select-String;
> the Grep MCP tool returned false negatives twice during this session and was NOT trusted for any claim).
> Line numbers marked _(fresh)_ differ from Uxie's audit because Amelia's P-02-I work moved code since the audit.
> Effort labels (S/M/L) are ESTIMATES.

---

## 0. Ground truth (all witnessed 2026-08-23)

### 0.1 The scale exists — but Tailwind can't see it

| What                                                                                       | Where                                                              | Witness        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | -------------- |
| Type-scale custom properties 11/12/13/15/18/22/28 px                                       | `src/index.css` :1389–1395 (`--font-size-2xs` … `--font-size-2xl`) | Read _(fresh)_ |
| Leading + bounded weight set (no 900)                                                      | `src/index.css` :1398–1408                                         | Read _(fresh)_ |
| Body base: Inter 13px / lh 1.5                                                             | `src/index.css` :362–374                                           | Read _(fresh)_ |
| `@theme inline` maps **colors only** (`--color-*`); zero `--text-*`, zero spacing mappings | `src/index.css` :329–349                                           | Read _(fresh)_ |

Consequence: every Tailwind size utility (`text-xs`, `text-sm`, …) still resolves to **Tailwind's
default scale**, not our tokens. The two scales disagree at four steps:

| Utility                                   | Tailwind default | Our token           | Δ           | Measured usage (non-test `.tsx`) |
| ----------------------------------------- | ---------------- | ------------------- | ----------- | -------------------------------- |
| `text-2xs`                                | —                | 11px                | new utility | n/a                              |
| `text-xs`                                 | 12px             | 12px                | aligned     | 1,520 occ.                       |
| `text-sm`                                 | **14px**         | **13px**            | −1px        | **1,323 occ. / 352 files**       |
| `text-base`                               | **16px**         | **15px** (`md`)     | −1px        | 39 occ.                          |
| `text-lg`                                 | 18px             | 18px                | aligned     | 139 occ.                         |
| `text-xl`                                 | **20px**         | **22px**            | +2px        | 208 occ.                         |
| `text-2xl`                                | **24px**         | **28px**            | +4px        | 81 occ.                          |
| `text-[10px]` (arbitrary, bypasses scale) | 10px             | violates 11px floor | −1px        | **304 occ. / 108 files**         |
| `text-[11px]` (arbitrary)                 | 11px             | equals floor        | ok          | 19 occ.                          |

### 0.2 Density contract exists — grids consume it, HTML tables mostly don't

| What                                                                                                                                                                                                                       | Where                                                                                                                                       | Witness              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Contract source-of-truth: compact 28px rows / 32px header / 12px type / `2px 6px` pad · standard 36/40/13px/`4px 8px` · comfortable 48/48/14px/`8px 12px`                                                                  | `src/config/designTokens.ts` :26–47; rationale comment :18–23 ("AG Grid needs numeric rowHeight… CSS custom properties cannot supply that") | Read _(fresh)_       |
| CSS mirror re-pointed by `[data-density]` on `<html>`                                                                                                                                                                      | `src/index.css` :1410–1442                                                                                                                  | Read _(fresh)_       |
| Hook: `useDensity` (read, :31–33) · `useApplyDensity` (write to `documentElement.dataset.density`, :41–50) · `densityMetrics` (numeric, :58–60) · `denserMetrics` spreadsheet offset (:70–74) · DEFAULT `'standard'` (:11) | `src/hooks/useDensity.ts`                                                                                                                   | Read _(fresh)_       |
| DataGrid consumes metrics: import :25, hook call :87–88, `rowHeight/headerHeight` props :295–296, `.data-grid` skin class :340                                                                                             | `src/components/ui/DataGrid.tsx` _(fresh — audit said :283/:328; P-02-I moved lines)_                                                       | Select-String + Read |
| FinPlanGrid consumes metrics: :446–447; drag-fill hit-test reuses them :496–497                                                                                                                                            | `src/components/ui/FinPlanGrid.tsx` _(fresh)_                                                                                               | Select-String        |
| SpreadsheetGrid uses `denserMetrics()` :100 → `rowHeight` :436                                                                                                                                                             | `src/components/ui/SpreadsheetGrid.tsx` _(fresh)_                                                                                           | Select-String        |
| AG Grid CSS reads the same `--density-*` vars                                                                                                                                                                              | `src/index.css` :1510–1515                                                                                                                  | Read _(fresh)_       |
| **DataTable ignores density**: hard-coded `const ROW_HEIGHT = 40` :41, single consumer `estimateSize: () => ROW_HEIGHT` :135                                                                                               | `src/components/ui/DataTable.tsx`                                                                                                           | Read _(fresh)_       |

### 0.3 Table adoption reality

Fresh Select-String over `src/pages/**` (203 non-test page files):

| Metric                                                                        | Count  |
| ----------------------------------------------------------------------------- | ------ |
| Pages importing `ui/DataTable`                                                | **63** |
| Pages with raw `<table>` markup                                               | **62** |
| Pages using `.fp-table`                                                       | **1**  |
| Pages using `.fp-numeric` / tabular-figure utilities (`index.css` :1452–1460) | **1**  |

`.fp-table` shared styles: `src/index.css` :1469–1507. Primitive `Table*` components exist but ship
their own `text-sm` root styling, not the `.fp-table` system: `src/components/ui/Table.tsx` :8–10.
Button size ladder (default `h-10` :34, sm `h-9` :35, icon `h-10` :37): `src/components/ui/Button.tsx`.
Input control `h-10 … text-sm` :25, label `text-sm` :17, error text **`text-[10px]`** :35: `src/components/ui/Input.tsx`.

---

## 1. Token bridge plan (UI-02)

### T1 · Extend `@theme inline` with font-size mappings — _effort M, risk M_

**Change:** add to the `@theme inline` block at `src/index.css` :329–349:

```css
/* Typography bridge — makes Tailwind size utilities resolve to OUR scale.
   Values reference the :root scale (:1389–1395) so there stays ONE source of truth. */
--text-2xs: var(--font-size-2xs);
--text-2xs--line-height: calc(var(--font-size-2xs) * var(--leading-snug));
--text-xs: var(--font-size-xs);
--text-xs--line-height: calc(var(--font-size-xs) * var(--leading-normal));
--text-sm: var(--font-size-sm);
--text-sm--line-height: calc(var(--font-size-sm) * var(--leading-normal));
--text-base: var(--font-size-md);
--text-base--line-height: calc(var(--font-size-md) * var(--leading-normal));
--text-lg: var(--font-size-lg);
--text-lg--line-height: calc(var(--font-size-lg) * var(--leading-snug));
--text-xl: var(--font-size-xl);
--text-xl--line-height: calc(var(--font-size-xl) * var(--leading-snug));
--text-2xl: var(--font-size-2xl);
--text-2xl--line-height: calc(var(--font-size-2xl) * var(--leading-snug));
```

(Exact leading pairing is a DESIGN DECISION to confirm at implementation; shown as shape.)

**Phasing (mandatory — this is the highest-blast-radius change in this spec):**

- **Phase A — additive only (EST. S):** land `--text-2xs` first. Zero existing site changes;
  it only creates the floor-compliant replacement target used by T2/T3.
- **Phase B — remap `sm/base/xl/2xl` (EST. L, separately gated):** flips rendering at
  1,323 (`sm`) + 39 (`base`) + 208 (`xl`) + 81 (`2xl`) = **1,751 call sites across ~352+ files**
  without touching a single component file — that is the point (systemic truth) AND the risk
  (global visual shift). Requires: full visual QA sweep of the E-02 top-20 routes +
  **Lead sign-off before regenerating any pixel baselines** (standing rule).
  Honest labeling: per-site rendering deltas are ESTIMATES until Phase B runs; `text-lg`/`text-xs`
  are provably no-op (defaults equal tokens).

### T2 · Fix the Input mismatch — _effort S_

- `Input.tsx` :25 — after T1-B, `text-sm` resolves to 13px automatically; no edit strictly needed.
  Optional explicit form-control sizing can wait for the forms spec (out of scope here).
- `Input.tsx` :35 — error text `text-[10px]` → **`text-[11px]`→`text-2xs`** once T1-A lands.
  This is the canonical example of the floor violation; fix the primitive first so every consumer
  inherits compliance.

### T3 · ≥11px floor enforcement — _effort L (codemod) + S (gate script)_

Measured problem: **304 `text-[10px]` occurrences in 108 files** (+19 `text-[11px]` which are compliant).

Plan:

1. **Gate first (infrastructure, mirrors the `scripts/mock-data-audit.mjs` precedent):** add
   `scripts/check-font-floor.mjs` scanning `src/**` for `text-\[(?:[0-9]|10)px\]` (any px value < 11),
   wired into package.json (`lint:font-floor`) and CI order after lint. Gate ends red until the
   codemod completes — same "gate must end green WITH scope" discipline as E-09-F item 1.
2. **Codemod waves:** `text-[10px]` → `text-2xs`. Wave 1 `src/components/ui/` (~40 files),
   Wave 2 `src/components/` domain dirs, Wave 3 `src/pages/`. Each wave: tsc + targeted suites + axe
   (E-02 infra exists under `src/__tests__/a11y/`).
3. **Disposition registry for suspected by-design exceptions:** spreadsheet chrome
   (`FormulaBar.tsx`, `CellEditor.tsx`, column-header mimicry) may deliberately imitate Excel-type
   micro-type. Default is CONVERT; any exception needs a listed entry + Lead approval — never a
   silent skip. (Pattern borrowed from E-09's wired/disclosed/deleted dispositions.)

---

## 2. AG Grid density defaults spec (UI-04) — _effort S (verify + unify), mostly already built_

Key correction to the plan-of-record: the wrappers **already consume the density contract**
(`DataGrid.tsx` :87–88/:295–296, `FinPlanGrid.tsx` :446–447, `SpreadsheetGrid.tsx` :100/:436 —
witnesses in §0.2). The remaining UI-04 grid work is verification + unification, not construction:

1. **ZohoBooks-benchmark targets** (= current contract, keep): standard rows 36px, header 40px,
   cell type 13px, cell padding 4px/8px (`designTokens.ts` :38–41); compact mode 28/32/12px/2px 6px
   available for power-user list views. ZohoBooks posture is "high information density, predictable
   tables, fast scanning" — standard 36px with 13px type sits inside that envelope while keeping
   finance-row readability; do NOT chase sub-30px defaults globally (fat-finger risk on numeric
   editing grids). HYPOTHESIS pending Phase 3.
2. **Header treatment unification:** one documented recipe across all three wrappers (same header
   height source, same background/border tokens, same sort/filter affordance sizing). Today they
   agree numerically via metrics; the spec asks for a shared header-class contract so future
   wrappers cannot drift. Additive CSS only.
3. **Verification battery:** render each wrapper at all three densities × light/dark themes;
   assert rendered row height == metric (DOM measurement test), assert `.data-grid` CSS var
   consumption (`index.css` :1510–1515) matches `[data-density]` blocks (:1412–1442).
4. **Guardrail:** any new grid wrapper MUST take `densityMetrics(density)` — add to the
   P-02-I-era modular-registration notes so the rule survives.

---

## 3. DataTable retrofit + `.fp-table` adoption path (UI-02 · UI-04)

### D1 · Wire DataTable to the density contract — _effort S–M_

- Replace `const ROW_HEIGHT = 40` (`DataTable.tsx` :41) with `densityMetrics(density).rowHeight`,
  fed by `useDensity()` (same pattern as `DataGrid.tsx` :87–88); keep an optional `density` prop
  override. Single internal consumer to update: `estimateSize` (:135). Accept an initial visual
  delta 40px → 36px at standard density — that IS the UI-02 densification goal; label it in the PR.
- Numeric cells in consumers get the tabular-figure utility (`index.css` :1452–1460) so digit
  columns stop jittering — pairs with D2 Tier 1.
- Snapshot risk: 63 importer pages re-render slightly tighter → treat as behavior+visual change;
  Lead sign-off required for any baseline regen (standing rule).

### D2 · `.fp-table` adoption path — _Tiered, total effort L (rolling)_

Today: 62 raw-`<table>` pages, 1 `.fp-table` adopter, 63 DataTable pages (§0.3). The styles already
exist (`index.css` :1469–1507); adoption is the gap.

- **Tier 1 (EST. M):** top-20 E-02 routes first — mechanical `className="fp-table"` addition to raw
  `<table>` elements + `.fp-numeric` on numeric `<td>`s. Instant consistency, zero structure change.
- **Tier 2 (EST. M, per-domain):** migrate simple presentational tables to the existing
  `ui/Table.tsx` primitives, restyled to compose `.fp-table` tokens (its root currently ships its
  own look, :8–10) — keeps one visual system.
- **Tier 3 (rolling):** interactive/heavy tables graduate to DataTable (density-aware after D1) or
  DataGrid. No big-bang rewrite; each migration rides its domain's next touch.
- Sticky headers on raw tables are an audit-noted gap; propose a `.fp-table--sticky` modifier as a
  HYPOTHESIS for design review — not part of the current :1469–1507 block, do not assume.

---

## 4. Sequencing & gates (each step independently revertable)

| #   | Step                                    | Depends on      | Verification                                                                                                          |
| --- | --------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | T1-A additive `text-2xs` + T2 Input fix | —               | tsc, axe on Input consumers, targeted suites                                                                          |
| 2   | Font-floor gate script (red→documented) | 1               | script run, CI wiring                                                                                                 |
| 3   | T3 Wave 1 (`components/ui/` codemod)    | 1–2             | tsc, suites, axe                                                                                                      |
| 4   | D1 DataTable density wiring             | — (independent) | targeted suites incl. regression test for ordering (UI-HF precedent), tsc                                             |
| 5   | §2 grid verify + header unification     | —               | DOM measurement tests, both themes                                                                                    |
| 6   | T3 Waves 2–3                            | 3               | per-wave suites + axe                                                                                                 |
| 7   | **GATED:** T1-B remap                   | 1–6 settled     | visual QA sweep top-20, **Lead sign-off for baseline regen**, bundle-check (CSS delta expected negligible — ESTIMATE) |
| 8   | D2 Tier 1 → 2 → 3                       | 4               | per-tier suites; snapshots per standing rules                                                                         |

Standing rules carried into implementation: no commits/pushes without instruction; no `_bmad/*.md`
edits except each task's own deliverable; every working-tree edit listed; estimates labeled.

## 5. Top 5 changes by user-visible impact (ranked)

| #   | Change                                                 | Impact                                                                 | Blast radius               | Effort (EST.) |
| --- | ------------------------------------------------------ | ---------------------------------------------------------------------- | -------------------------- | ------------- |
| 1   | T1-B `@theme` remap — app-wide 13px body/sm truth      | Every screen reads on-system; kills the 14-vs-13 split at the root     | 1,751 sites flip centrally | L (gated)     |
| 2   | T3 `text-[10px]` → `text-2xs` floor codemod            | Readability/a11y floor in 108 files, incl. form errors                 | 304 sites                  | L             |
| 3   | D1 DataTable density wiring                            | 63 pages become density-aware + tighter rows (40→36)                   | 63 pages                   | S–M           |
| 4   | D2 Tier-1 `.fp-table` + `.fp-numeric` on top-20 routes | Scanability, tabular figures, consistent tables where users live daily | 20 routes                  | M             |
| 5   | §2 grid header-unification + density verification      | Locks in the (already-built) contract; prevents wrapper drift          | 3 wrappers                 | S             |

_Confidence: HIGH on all witnesses (re-measured today, three-witness method); MEDIUM on effort
estimates and Phase-B rendering deltas (labeled ESTIMATE throughout)._
