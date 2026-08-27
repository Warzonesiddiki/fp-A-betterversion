# UI-01 · Design-System Audit vs ZohoBooks Benchmark

|                      |                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Task**             | UI-01 · Design-system audit vs ZohoBooks benchmark (read-only prep, Track UI)                                                          |
| **Author**           | Uxie (UX spec owner)                                                                                                                   |
| **Date**             | 2026-08-23 · repo HEAD `fbe0c00b`                                                                                                      |
| **Status**           | **READ-ONLY PREP — every recommendation below is HYPOTHESIS, pending Phase 3 formal authorization. Breadth here ≠ approved redesign.** |
| **Deliverable type** | Audit + prioritized gap list. No code was modified. No existing `_bmad/*.md` doc was edited.                                           |

---

## 0. Method & honesty notes (D-002 / D-007 / D-009)

- All counts re-measured fresh on HEAD `fbe0c00b` on 2026-08-23 (not copied from older ledger entries). Measurement method per claim in Appendix A.
- Every empirical claim carries a `file:line` witness (D-009). Headline counts carry ≥2 independent witnesses where feasible (Read + Select-String count).
- **Tooling deviation disclosed:** the workspace Grep tool returned false negatives during this session (e.g., no match for `card` inside `src/index.css`, which demonstrably contains `.card {` at line 591). All searches were therefore executed via PowerShell `Select-String` and re-verified against direct Reads. Flagging per D-007 so downstream agents don't trust silent Grep output this session.
- **Two self-caught corrections during the audit** (D-007 patrol, did not escape into the gap list):
  1. Initially suspected missing route-level error boundaries — **wrong**: domain-scoped `RouteGroupErrorBoundary` wiring exists (`src/App.tsx:6-10`, `src/App.tsx:279-285`). Not a gap.
  2. Initially reported "no typography scale tokens" — **wrong**: the UI-04 type scale lives at the _bottom_ of `src/index.css:1386-1408`, far from the main token blocks at lines 54/228. The real gap is adoption/bridging (Gap #4), not absence.
- Concurrent sessions active (Quinn a11y wave-5). One dirty file observed (`src/pages/banking/NIMDashboardPage.tsx`) — untouched by this audit. Numbers may shift after Quinn's merge; re-count before acting.

## 1. Benchmark definition (from plan)

> "ZohoBooks benchmark = clean hierarchy, high information density, predictable forms/tables, fast scanning, no visual noise. Current system is Bloomberg-dark-first — direction is a polish pass on both themes with a light-professional-first posture."
> — `_bmad/project-completion-plan.md:29`

Audit lens: score current state against those five attributes; rank residual gaps by **user-visible impact**, not engineering elegance.

## 2. Current-state audit by scope area

### 2.1 Design tokens & theming

Architecture post-UI-foundation-arc (merged `d48f769`, see `_bmad/HANDOVER.md`):

- Single source of truth = CSS custom properties in `src/index.css`: dark `:root` block at `index.css:54`, `.light` overrides at `index.css:228`.
- `src/config/designTokens.ts` deliberately reduced to the density contract only (~49-line file) — consistent with plan step "collapse two styling systems", partially recorded in `_bmad/pending-tasks-to-completion.md` §2.
- Tailwind↔token bridge exists and is color-only: `@theme inline` maps background/foreground/card/muted/destructive/border/ring to vars (`index.css:329-349`). The `inline` form correctly keeps utilities theme-reactive (`index.css:321-325` comment).
- **Type scale tokens EXIST**: `--font-size-2xs…--font-size-2xl` (11/12/13/15/18/22/28px) + bounded weights (no 900) + line-heights, `index.css:1386-1408`. But they are **not bridged into Tailwind font-size utilities** (the `@theme inline` block has zero `--text-*` mappings) — see Gap #4.
- Body base: Inter, 13px, lh 1.5 (`index.css:362-374`).

### 2.2 Primitive inventory (`src/components/ui/`)

Count reconciliation (three witnesses):

1. Recursive file listing: 279 files total, 265 `.tsx` (incl. subdirs `formula/`, `PivotTable/`, `RuleEditor/`, `__snapshots__/`).
2. Non-test-like **source** files (excluding `.test.` / `.visual-contract.` / `.a11y.` / `.stories.` / `.contract.`): **141**.
3. The "~263 primitives" figure in AGENTS.md / HANDOVER matches the **file-level** count incl. tests (265 today). Source-only = 141. Future docs should quote 141 as the primitive inventory.

Structural findings:

- **Four coexisting table implementations** for one logical control:
  | File | Lines | Tech | Density-aware? | Page adopters |
  |---|---|---|---|---|
  | `ui/Table.tsx` | 78 | shadcn-style semantic HTML | no | (style-level use) |
  | `ui/DataTable.tsx` | 445 | hand-rolled HTML table + own sort/filter/pager/virtualization | **no** — hardcoded `ROW_HEIGHT = 40` (`DataTable.tsx:41`) | **63 page files** |
  | `ui/DataGrid.tsx` | 553 | AG Grid wrapper, applies terminal `.data-grid` skin (`DataGrid.tsx:328`), rowHeight from metrics (`DataGrid.tsx:283`) | yes | 3 page files |
  | `ui/FinPlanGrid.tsx` | 649 | AG Grid wrapper, density metrics (`FinPlanGrid.tsx:425`) | yes | 1 page file |
- `Button.tsx` sizes are fixed px, not density-linked: `h-10` default / `h-9` sm / `h-11` lg / icon `h-10 w-10` (`Button.tsx:34-37`).
- `Input.tsx`: good a11y bones — `label?`/`error?` props, `aria-invalid`, `role="alert"` error id linkage (`Input.tsx:5-6,13`); but fixed `h-10` (`Input.tsx:25`), label uses Tailwind `text-sm` (14px — off-scale, see Gap #4), error text is `text-[10px]` (`Input.tsx:35`) which sits **below** the system's own 11px floor token.
- `Select.tsx` (135 lines) supports label+error but has only **10 page adopters**.
- No `FormField`, `Textarea`, `Checkbox`, `Radio` primitives exist anywhere in `ui/` — forms are assembled ad hoc (see §2.4).
- `PageHeader` adoption is strong: **176 of 203 non-test page files (87%)** — the UI-05 adoption playbook works when run.

### 2.3 Grids & density

The UI-04 density/type infrastructure shipped and is well-designed:

- Density contract CSS: `--density-row-height/header-height/padding/font-size` re-pointed by `[data-density='compact'|'standard'|'comfortable']` (`index.css:1412-1442`), asserted equal to the TS constants by test (comment `index.css:1419-1421`; `useDensity` hook drives `<html data-density>`).
- `.fp-table` — canonical density-aware HTML table class reading the same vars, with uppercase muted headers, hover, right-aligned `.fp-numeric`, footer row (`index.css:1469-1507`). AG Grid `.data-grid` reads the same variables (`index.css:1510-1515`). Tabular figures enforced for `.fp-numeric`, `.fp-table td/th`, `.data-grid` cells (`index.css:1452-1460`).

**But adoption is ~zero:**

- Pages using `fp-table`: **1**. Pages rendering raw `<table>` without it: **62**.
- Pages using `fp-numeric`: **1**.
- `DataTable.tsx` — the most-adopted grid primitive (63 pages) — contains **zero** references to `fp-table`/density and hardcodes its own 40px rows (`DataTable.tsx:41`).
- Net effect: the Settings density toggle visibly changes rows only on the ~4 AG Grid pages; the 63 DataTable pages and ~62 raw-table pages ignore it. This is the single largest "high information density / predictable tables" miss, and it's an adoption problem, not a build problem.

**Correctness rider found while auditing sort behavior:** `DataTable.tsx:76-93` sorts via `String(a[sortConfig.key] ?? '').localeCompare(...)` (lines 80-81). Numeric columns therefore sort lexically — 100 sorts before 20, before 3. For a finance product whose benchmark attribute is "predictable tables," this is a data-trust defect independent of styling. (Fix candidate: numeric detection or column-typed comparators.)

### 2.4 Form patterns (sampled flows + repo-wide metrics)

Sampled create/edit flows: BudgetCreatePage, FXRatesPage add-rate modal, UserManagementPage, plus repo-wide pattern counts.

- **Primitive adoption is minority:** 20 page files import `ui/Input`; **52 page files** hand-roll raw `<input>`; 10 import `ui/Select` vs **36 hand-roll raw `<select>`**; 33 pages hand-roll `<label>`. There is no FormField layer to standardize label placement/help/error slots.
- Label-above-field is the de-facto correct pattern (matches ZohoBooks; enforced inside `Input.tsx:16-19`) — but hand-rolled forms duplicate it inconsistently (e.g., `BudgetCreatePage.tsx:186-199` builds label/input/error markup manually instead of using `Input`'s built-ins).
- Validation display bypasses tokens: `text-red-400` error text + `border-red-500` input border (`BudgetCreatePage.tsx:197-199`) instead of `var(--negative)`/focus-ring discipline. Repo-wide: **~150 `text-red-4xx/5xx` occurrences** across non-test src.
- Hardcoded dark-palette surfaces inside flows (breaks light theme — see Gap #1): segmented choice buttons `bg-blue-900/30 border-blue-600 text-blue-300` / `bg-slate-800 border-slate-700` (`BudgetCreatePage.tsx:242-258`), textarea `bg-slate-800 … text-slate-200` (`BudgetCreatePage.tsx:274`); FXRates table shell `border-slate-800 divide-slate-800 hover:bg-slate-900/50` (`FXRatesPage.tsx:175-201`).
- **Save-state feedback is nearly absent**: only **2** page files show any saving indicator (`Saving…`/isSaving), only **7** disable the submit button while submitting. Everything else allows double-submit and gives no system feedback — contrary to ZohoBooks' always-disabled synchronous save affordance.

### 2.5 Empty / loading / error states

- A good `EmptyState` primitive exists (variants incl. `error` with retry slot). Exemplar four-states page exists: `FXRatesPage.tsx` wires `PageHeader` + purpose line + `variant="no-data"` empty + error-with-retry around its table.
- Coverage is thin: `EmptyState` imported by **16/203** non-test page files (8%); `Skeleton` by **27/203** (13%); ad-hoc `isLoading ? …` inline loading in ~21 more. Most pages simply render blank regions while loading.
- Small defect witness: `EmptyState.tsx:18` uses `text-red-300 dark:fin-negative` — `dark:fin-negative` is not a defined Tailwind utility (no such custom variant registered), so it silently does nothing; the intent was presumably the `fin-negative` token class used bare elsewhere (`Input.tsx:35`).
- Route-level error containment is covered (do NOT re-fix): domain `RouteGroupErrorBoundary` per lazy island (`App.tsx:6-10`, applied per group at `App.tsx:279-285`).

### 2.6 Navigation IA

- Manifest-driven: `NAV_SECTIONS` at `src/types/navigation.ts:61-665` — 10 sections (Home, Planning, Analysis, Reporting, Accounting, Treasury, Consolidation, Industries, Collaboration, Admin); **188 NavItem entries, 49 hidden legacy aliases ⇒ ~139 visible** sidebar destinations; contract test enforces manifest↔route bidirectional coverage.
- Sidebar: single-open accordion keeps the rail scannable (`Sidebar.tsx:92-100`); Ctrl+K command palette fed from manifest + global search engine (`Sidebar.tsx:141-156`).
- Friction points vs ZohoBooks' ~10-module flat model:
  - **Industries section alone spans 20 sector groups** — it dominates rail scroll order ahead of core FP&A work.
  - **Analysis section is a flat, ungrouped 12-item list** (`navigation.ts:169-203`) — inconsistent scan pattern next to grouped siblings.
  - No favorites/pins/recents mechanism anywhere; at 139 visible targets, ZohoBooks-equivalent "two clicks to anything" depends entirely on remembering which pillar hides a page.

### 2.7 Theme posture (dark Bloomberg vs light-first)

- Light-first is genuinely default: `ThemeContext` resolves `system→light` fallback (`ThemeContext.tsx:35`), toggles `.light`/`.dark` on `documentElement` (`ThemeContext.tsx:41-42`), persisted via localStorage with pre-paint bootstrap.
- Token level: both themes coherent (contrast work from UI-02/a11y waves visible in `.light` block `index.css:228-306`).
- **Component level: light theme leaks.** Repo-wide, non-test src still carries:
  - **4,849 raw palette utility occurrences** (`bg|text|border|ring|divide-(slate|gray|blue|red|green|amber)-NNN`),
  - `dark:` variants in **136 files**,
  - **656 inline `style={{ }}` occurrences**,
  - specifically **300 `bg-slate-8xx/9xx` surface fills across 80 page files** — these do NOT flip under `.light` (no override rules exist; verified by searching `index.css` for light-scoped palette overrides — none), so they render as dark boxes on the near-white canvas wherever they appear (forms §2.4, tables §2.3, cards).

## 3. Top 10 gaps — ranked by user-visible impact

Every item: HYPOTHESIS pending Phase 3 authorization. Effort values are **estimates** (S ≤ half day · M ≤ 2 days · L > 2 days, single-session heuristics, not commitments).

| #   | Gap                                                                                                                                                                  | Why it matters to the user                                                                                                                                                            | Witness(s)                                                                                                                           | Effort (est.)                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Light-theme visual breakage: 300 hardcoded dark surface fills in 80 page files**                                                                                   | On the now-default light theme these render as dark boxes/blobs mid-flow — directly violates "clean professional light-first"; users see a broken app, not a styled one               | `BudgetCreatePage.tsx:242-258,274`; `FXRatesPage.tsx:175-201`; count method App. A                                                   | M — AST codemod mapping slate-8xx/9xx → surface tokens, replaying UI-05 playbook                                                                        |
| 2   | **DataTable lexical sort bug — numbers sort as strings** (100 < 20 < 3)                                                                                              | Sorting a money/date column gives wrong-looking order → "can't trust the tool"; violates "predictable tables" at the data level, not just style                                       | `DataTable.tsx:76-93` (comparator `:80-81`)                                                                                          | **S** — typed comparator / numeric detection                                                                                                            |
| 3   | **Density + `.fp-table` contract shipped but ~0% adopted** — dominant grid (DataTable, 63 pages) hardcodes 40px rows; 62 pages raw `<table>`; `fp-numeric` on 1 page | Settings density toggle does almost nothing users can see; row heights/padding vary per page — the exact "predictable, dense tables" attribute ZohoBooks wins on                      | `DataTable.tsx:41` (+ zero density refs in file); `index.css:1469-1507` unused; adoption counts App. A                               | M for DataTable retrofit; L for full raw-`<table>` sweep (mechanical, codemod-friendly)                                                                 |
| 4   | **Type scale not bridged into utilities; primitives drift off-scale** (`text-sm`=14px vs `--font-size-sm`=13px; error micro-text 10px < 11px floor)                  | Sub-pixel-inconsistent hierarchy everywhere; 10px error text hurts scanability/readability — ZohoBooks keeps 12/13/16 discipline                                                      | `index.css:329-349` (color-only bridge); `Input.tsx:25` (`text-sm`), `Input.tsx:35` (`text-[10px]`); scale def `index.css:1386-1395` | M — extend `@theme inline` with `--text-*` → var mappings, then fix offenders surfaced by lint rule (HYPOTHESIS: add ESLint ban on raw `text-\[.*px\]`) |
| 5   | **Status-color discipline broken: ~150 `text-red-*` sites bypass `--negative`**                                                                                      | Inconsistent success/error semantics; light-theme contrast regressions; variance coloring (favorable/unfavorable) loses meaning if reds/greens are arbitrary                          | `BudgetCreatePage.tsx:199`; `EmptyState.tsx:18` (incl. dead `dark:fin-negative` class); count App. A                                 | M — codemod to `fin-negative`/`fin-positive` token classes (same shape as Gap #1 sweep)                                                                 |
| 6   | **Form-control layer missing/minority: no FormField·Textarea·Checkbox·Radio; Input on 20 pages vs 52 raw `<input>`; Select 10 vs 36 raw `<select>`**                 | Labels, help text, validation and save states differ per page — "predictable forms" fails structurally; a11y fixes must be re-done per hand-rolled field                              | §2.4 counts; `BudgetCreatePage.tsx:186-199` hand-rolled markup; `Select.tsx` low adoption                                            | L — define FormField family, then migrate in route-group waves (budgets/data/reports first)                                                             |
| 7   | **No save-state feedback / double-submit protection (2/203 pages show saving; 7 guard submit)**                                                                      | Users double-click save → duplicate entities or silent failures; ZohoBooks always disables+synchronizes                                                                               | counts App. A (`Saving…`=2, `disabled={saving\|loading\|submit}`=7)                                                                  | S–M — shared `useSubmitState` hook + Button `loading` prop; enforce in code review checklist                                                            |
| 8   | **Empty/loading coverage inconsistent (EmptyState 8%, Skeleton 13%) despite good primitives + exemplar**                                                             | Blank flashes read as crashes; inconsistent states are visual noise; exemplar proves the target is cheap                                                                              | counts App. A; exemplar `FXRatesPage.tsx` four-states wiring                                                                         | M–L — per-route-group sweep, prioritize Accounting/Treasury list pages                                                                                  |
| 9   | **IA wayfinding absent at 139-item depth (no favorites/pins/recents); Industries pillar (20 groups) crowds the rail; Analysis section ungrouped**                    | Click-depth feel exceeds ZohoBooks' flat module model; daily users re-navigate the same 5 pages through the long tail                                                                 | `navigation.ts:61-665` (counts), `navigation.ts:169-203` (flat Analysis), `Sidebar.tsx` (no pin UI)                                  | M — favorites store + pinned section atop rail; regroup Analysis. **IA change ⇒ needs explicit Phase 3 decision, do not treat as cosmetic**             |
| 10  | **Residual visual noise: emoji theme toggle; dual grid aesthetics (terminal `.data-grid` mono/uppercase vs clean sans tables); dead utility class**                  | Small but constant off-register details erode the "clean professional" feel; the mono-terminal grid look contradicts the ZohoBooks register on the very pages meant to showcase grids | `Sidebar.tsx:194` (`☀️/🌙`); `index.css:559-588` (`.data-grid` JetBrains Mono, 10px uppercase headers); `EmptyState.tsx:18`          | S each — lucide Sun/Moon icons; decide one grid header treatment; delete dead class                                                                     |

**Suggested sequencing if authorized (HYPOTHESIS):** #2 (S correctness hotfix) and #1+#5 (one combined codemod wave) first — highest visible payoff per effort; then #3/#4 (contracts → adoption, mechanical); #6/#7/#8 as pattern-rollout waves; #9 behind an explicit IA decision gate; #10 opportunistically.

## 4. Protect list — already aligned with benchmark (do not regress)

- Token architecture: single-source CSS vars + reactive `@theme inline` bridge (`index.css:54,228,329-349`).
- Light-first default with persistence + pre-paint bootstrap (`ThemeContext.tsx:35,41-42`).
- PageHeader discipline at 87% page adoption (176/203).
- Contract-tested navigation manifest, bidirectional manifest↔routes guarantee.
- Density contract single-source with TS↔CSS drift assertion (`useDensity.test.ts` per `index.css:1419-1421` comment).
- Tabular-figures infrastructure for numerics (`index.css:1452-1460`).
- Domain route-group error boundaries (`App.tsx:6-10,279-285`).
- Four-states exemplar page (`FXRatesPage.tsx`) — the pattern to clone, not reinvent.

## Appendix A — measurement methods (reproducible)

All commands run 2026-08-23 against HEAD `fbe0c00b`; paths relative to repo root. `GSS` = `Get-ChildItem -Recurse -Filter *.tsx | Where Name -NotMatch '\.test\.'`.

| Claim                                                                                                                                                                                               | Command sketch                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------- | ----------- | -------------- |
| ui/ file counts                                                                                                                                                                                     | `(gci src\components\ui -Recurse -File).Count` / filter `-NotMatch '\.test\.                                                             | \.visual-contract\. | \.a11y\. | \.stories\. | \.contract\.'` |
| Page-file counts (203)                                                                                                                                                                              | `(gci src\pages -Recurse -Filter *.tsx \| ? Name -NotMatch '\.test\.').Count`                                                            |
| bg-slate-8xx/9xx = 300 occ / 80 files                                                                                                                                                               | `GSS \| sls 'bg-slate-[89]00'` (-List vs -AllMatches)                                                                                    |
| Raw palette utils = 4,849 occ                                                                                                                                                                       | all `*.ts*` non-test `\| sls '(bg\|text\|border\|ring\|divide)-(slate\|gray\|blue\|red\|green\|amber)-\d{2,3}' -AllMatches`, sum matches |
| `dark:` = 136 files                                                                                                                                                                                 | non-test `*.ts*` `\| sls 'dark:' -List`                                                                                                  |
| inline styles = 656                                                                                                                                                                                 | `\| sls 'style=\{\{' -AllMatches` summed                                                                                                 |
| >300-line files = 121                                                                                                                                                                               | non-test `*.tsx` measured via `Get-Content \| Measure-Object -Line`                                                                      |
| Adoption counts (DataTable 63, PageHeader 176, EmptyState 16, Skeleton 27, Input 20, Select 10, fp-table 1, fp-numeric 1, raw `<table>` 62, raw `<input>` 52, raw `<select>` 36, hand `<label>` 33) | per-pattern `sls -List` over `GSS`                                                                                                       |
| Save-state (Saving=2, disabled-guards=7)                                                                                                                                                            | `sls 'isSaving\|Saving\.\.\.\|saving' -List` ; `sls 'disabled=\{.*(saving\|loading\|submit)' -List`                                      |
| Nav items 188 / hidden 49                                                                                                                                                                           | regex counts over `src/types/navigation.ts`: `\{ path:` and `hidden: true`                                                               |

_End of audit. No repository file other than this deliverable was created or modified._
