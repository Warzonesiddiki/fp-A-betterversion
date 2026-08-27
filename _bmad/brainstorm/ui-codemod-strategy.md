# UI Codemod Strategy Brainstorm — Light Theme + Color Discipline Waves

> **Type:** BMAD IDEATE artifact (proposal only — no direction change; owner decides)
> **Task:** `01a02fa7-6f3c-7b30-80ea-53fbc05cc400` · **Author:** Blaze (Ideation, team fpa)
> **Date:** 2026-08-23
> **Inputs:** `_bmad/ui01-design-system-audit.md` gaps #1 and #5
> **Compliance:** ideation-only. No tooling installed, no code edited outside this file. All measurements below were taken read-only.

---

## 0. Current-state witnesses (re-measured 2026-08-23)

The audit numbers were re-verified against HEAD rather than trusted blindly (D-002/D-009):

| Claim                          | Audit said          | Measured today                                                                 | Method                                                                           |
| ------------------------------ | ------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Gap #1 hardcoded dark surfaces | ~300 occ / 80 files | **297 occ / 80 files** (non-test `src/pages/**/*.tsx`; 203 page files scanned) | Grep tool + PowerShell `Select-String` (two independent witnesses, counts agree) |
| Gap #5 raw `text-red-*`        | ~150 sites          | **251 occ / 120 files** (`src/**/*.{ts,tsx}` non-test)                         | Same dual method                                                                 |

⚠️ The text-red population is ~67% larger than the audit estimate — wave sizing must **re-baseline immediately before each wave kickoff**, not from this document.

**Destination vocabulary already exists** (`src/index.css:329–349`, `@theme inline` bridge — keeps values live via `var()` so light/dark toggling works):

| Utility                                      | Resolves to                                    |
| -------------------------------------------- | ---------------------------------------------- |
| `bg-background` / `text-foreground`          | `--bg-root` / `--text-primary`                 |
| `bg-card`                                    | `--bg-surface`                                 |
| `bg-popover`, `bg-secondary`, `bg-muted`     | `--bg-elevated`                                |
| `text-muted-foreground`                      | `--text-muted`                                 |
| `bg-accent`                                  | `--bg-hover` ← note: this is the _hover_ token |
| `bg-destructive`                             | `--negative`                                   |
| `border-border`, `border-input`, `ring-ring` | border/focus tokens                            |

**Critical structural fact:** `.fin-positive / .fin-negative / .fin-neutral` (`index.css:943–951`) are **plain CSS classes, not registered Tailwind utilities**. Tailwind therefore cannot generate variants for them — `dark:fin-negative` (audit-confirmed dead, `EmptyState.tsx:18`) and `hover:fin-negative` (`TemplateDesigner.tsx:173`, `SheetTabs.tsx:140,189`) emit **nothing**. Any codemod that emits variant-prefixed `fin-*` forms manufactures new dead classes.

**Tooling reality:** `jscodeshift`/`ts-morph` are **not installed**. But three repo scripts already parse TS via the bundled `typescript` devDependency: `scripts/fabrication-detector.mjs:54`, `scripts/money-ast-detector.mjs:73`, `scripts/prefix-unused-params.mjs:23`. An AST option does **not** require new dependencies.

**Class-string shape census** (from page-source sampling — these shapes drive every risk below):

- Static strings: `className="… bg-slate-800 border border-slate-700 …"` (majority)
- Inline ternaries: `` `${cond ? 'text-green-400' : 'text-red-400'}` `` (pervasive in GL/report pages)
- Lookup maps with fallbacks: `${statusColors[p.status] || 'bg-slate-600'}` (`CapExDashboard.tsx:183`, `CapexTracker.tsx:135`, `UserManagementPage.tsx:94`)
- Variables / function returns holding classes: `${deviceColor}` (`AIIntelligencePage.tsx:210`), `${badge.className}` (`PeriodClosePage.tsx:412,441`), `${varianceClass}` (`ScenarioComparisonPage.tsx:201`)
- Runtime string surgery: `${selectedNode.color.split(' ')[0]}` (`DataLineagePage.tsx:258`)
- Opacity modifiers: `bg-slate-800/40`, `/50`, `/60`; `hover:bg-slate-900/50`
- **Already-dual-themed intentional pairs**: `bg-slate-50 dark:bg-slate-900` (`BenchmarksPage.tsx:87`; also FacilityManagement, RealEstate dashboard pages) — these are _correct today_ and must not be "fixed"
- Non-JSX class carriers: AG Grid `cellClassRules` **object keys** `'fin-negative font-medium': (params) => …` (`columnDefs.ts:44`, `DataGrid.tsx:170`, `FinPlanGrid.tsx:184`, `SpreadsheetGrid.tsx:146`)
- Dynamic utility interpolation: `col-span-${Math.min(widget.position.w, 12)}` (`DashboardBuilderPage.tsx:326`) — safelist-dependent, unrelated to our gaps, do not touch
- Mixed raw-palette + token in one string: `text-[var(--text-muted)] hover:text-white`

---

## 1. Option space (steelmanned)

Effort figures below are **estimates**, not measurements (honest labeling).

### Option A — AST transform script via the TypeScript compiler API (zero new deps)

**What it is.** A `scripts/*.mjs` in the exact mold of `money-ast-detector.mjs`: pass 1 read-only inventory (every class-bearing string literal site, tagged by kind: JSX attribute / template quasi / conditional arm / object key / variable definition); pass 2 applies mapping rules per tagged site and emits a **per-file manifest** (`{file, line, before, after, rule, skippedReason}`); re-run must produce an empty diff (idempotence gate).

**Correctness risk on Tailwind class strings: LOW-MEDIUM.**

- Parsing risk ≈ eliminated: the AST knows exact string-literal boundaries inside `className={…}`, template quasis, ternary arms, and object keys. It cannot corrupt adjacent classes or mangle multi-class strings the way sed can.
- Residual risk lives in _semantics_, not syntax: choosing `bg-card` where elevation intent wanted `bg-popover` is a design decision no parser makes. Mitigated by an explicit, owner-approved mapping table (see §5 Q2) and skip-with-reason outputs.
- Identifier-carried classes (`${deviceColor}`) require scope tracking; simplest honest behavior is "resolve within module, else emit to manual queue."

**Verification strategy:** manifests become the review artifact (diff JSON, not JSX); unmapped-site report must hit zero before wave close; computed-style fingerprint sampling + atlas specimen expansion (§3).

**Effort shape:** ~2–3 days upfront (inventory + transform + manifest + tests), then **minutes per batch** and near-zero marginal cost per new pattern (one rule function + rule test). Break-even vs manual is around 15–20 files; we face 80 + 120. Best fit: large populations, small vocabularies, repeatable rules — exactly gaps #1/#5.

### Option B — Framework codemod (jscodeshift or ts-morph)

**Steelman.** Battle-tested runner ergonomics: dry-run flags, parser config, per-file output conventions, established recast-style printing; `ts-morph` offers a far friendlier API than the raw compiler. If this repo expects _many_ future codemods (money migration continues, i18n sweeps, plugin API renames), the runner investment amortizes.

**Correctness risk on Tailwind class strings: identical to Option A.** Both operate on the same underlying AST; all Tailwind-domain safety still comes from _our_ mapping rules. The framework buys developer comfort, not correctness.

**Verification strategy:** same as A.

**Effort shape:** everything in A **plus** new devDependencies (violates lean-deps culture for a one-shot need), plus learning curve. jscodeshift itself is lightly maintained (Flow-era). **Strictly dominated by A for this task** unless the owner wants a standing codemod platform (worth a separate decision, not smuggled into this one).

### Option C — Structured regex + review waves (NOT blind sed)

**Steelman.** Lowest setup cost (hours) using skills already proven in this session's own measurements: script generates hit manifests (`file:line` + before/after preview) per narrow pattern; humans approve small batches; script applies only approved hunks; re-scan asserts zero residue. For a _tiny, unambiguous_ vocabulary — e.g. exactly `text-red-500`/`text-red-400` as standalone tokens — word-boundary replacement with manifest review is genuinely safe and fast.

**Correctness risk on Tailwind class strings: MEDIUM-HIGH.**

- Regex cannot see string boundaries or context: it can't tell a variance cell `text-red-400` from an error-banner accent, can't respect `dark:` pairing logic, and chokes on multi-line template literals (`DataLineagePage.tsx:228` opens the class string on its own line).
- Word-boundary `\b` tricks misfire on opacity variants (`bg-slate-900/50` shares the stem) and object-key carriers look identical to attributes.
- The real hazard is procedural: review fatigue across ~450 total sites breeds rubber-stamping, and rubber-stamped wrongness is invisible until someone opens light theme.

**Verification strategy:** the manifest review _is_ the primary verification; add fingerprint sampling on a subset. Cheaper per wave to start, but verification burden grows linearly with hits.

**Effort shape:** hours upfront; heavy, non-compounding review cost per batch. Viable as the wave-1 vehicle _only if_ Option A slips; dominated by A overall.

### Option D — Manual page-by-page (UI-05 playbook replay)

**Steelman.** Highest judgment fidelity. Whether a slate panel becomes `bg-card` or `bg-popover` is readable only from layout context (is it a peer surface or an overlay?), and humans catch composition issues — nested hover layers, chart palettes fighting card tokens — that no transform can. Zero tooling risk; this is how UI-05 actually ran.

**Correctness risk on Tailwind class strings: LOWEST syntactically, HIGHEST procedurally.** Humans type valid classes but miss sites: fatigue at page #60 of 200, inconsistency drift between sessions, silent skips of lookup-map definitions far from the JSX that renders them.

**Verification strategy:** benefits most from §3 hooks (no manifest exists to review); needs a per-page checklist + both-theme eyeball pass.

**Effort shape:** worst. 80 files × 20–40 min ≈ 27–53 h for gap #1 alone, ×~1.5 more for the 120-file color sweep, and the cost **does not compound** — every future page repeats it. Reserve for a short exception list, not the fleet.

---

## 2. Recommendation (for owner ratification)

**Hybrid, A-led:** TypeScript-compiler-API codemod with manifest-gated review waves (absorbing C's best idea — manifest review — into A's pipeline), with **D reserved for an exception list** of high-complexity dashboards whose classes live in lookup maps and helper functions (`GovernmentDashboardPage`, `EducationDashboardPage`, `CapExDashboard`, `LeaseDashboard`, `PeriodClosePage`) plus whatever the unmapped-site report routes to manual queue.

**Wave order (cheapest-first de-risking):**

1. **Wave 0 — groundwork:** owner decisions Q1/Q2 (§5); build inventory script (read-only; pure win even if codemods never run); spike Q3 (alpha modifiers over `var()` colors).
2. **Wave 1 — color discipline:** `text-red-4xx/5xx` → `fin-negative` (bare form per Q1 outcome). Small vocabulary, largest population, mechanical semantics → best codemod ROI, proves the pipeline on the easier gap.
3. **Wave 2 — dark surfaces:** `bg-slate-8xx/9xx` → surface tokens per the approved mapping table. Harder semantics (elevation intent, hover, opacity), so it rides infrastructure proven in wave 1.

**Why (compressed):** the dominant risks are _semantic mapping_ and _verification scale_, not string rewriting — so spend tooling effort on manifests + sampling (where risk lives), use the AST only to make rewriting trustworthy, keep zero new dependencies, and let the existing atlas harness carry pixel-level cover instead of building per-page screenshot baselines nobody maintains.

---

## 3. Verification hooks — proving "no visual regression" cheaply across 80+ files

No per-page pixel baselines exist or should be created. Layered instead:

1. **Class-diff manifests (primary review artifact).** Every transformation emits `{file, line, before, after, rule}` JSON. Reviewers diff manifests, not JSX. Gate: re-running the codemod yields an empty diff (idempotence), and the **unmapped-site report must reach zero** — every raw occurrence is either transformed or carries an explicit `skippedReason`.
2. **Computed-style fingerprint sampling (the scale trick).** Playwright script (reuses atlas-harness fixtures, Tauri shim, viewport/theme plumbing from `tests/e2e/atlas-visual.spec.ts`) visits ~12 representative pages × 2 themes × K sampled elements and records `getComputedStyle` `{backgroundColor, color, borderColor}`. Run on base branch and wave branch; the diff must contain **only** property changes traceable to manifest entries. This catches regressions on pages with _no_ screenshots, deterministically, in seconds per page.
3. **Atlas specimen expansion (targeted pixels).** Add two specimens to `/visual/atlas` — a "slate-surface card stack" and a "variance cell trio (pos/neg/neutral)". Six existing snapshot pairs grow by ~2, giving real pixel baselines exactly where the waves bite. Cheap because the route, fixtures, and snapshot workflow already exist.
4. **Free unit-test net.** Existing assertions already pin the target vocabulary (`financialFormatting.test.ts:92`, `financial.test.ts:92` expect `fin-negative`; `FinPlanGrid.deep.test.tsx:403` pins the cellClassRule key) — wave-1 renames that break semantics fail loudly.
5. **Escalating CI guard (tide control).** A script gate (repo's established `scripts/*.mjs` culture) fails on **new** raw `bg-slate-[89]xx` / `text-red-[45]00` occurrences outside an allowlist that shrinks each wave. Prevents the problem regrowing during a multi-week effort.
6. **Human spot protocol.** Per wave: open 5 randomly chosen touched files behind the dev-server theme toggle with a fixed checklist (surface layering correct? variance polarity correct — favorable green/unfavorable red per project convention? hover states still visible?). Ten minutes, catches what fingerprints can't: _intent_.

---

## 4. Risk register

| #   | Risk                                                                                                                                              | Witnesses                                                                                                                                                                       | Mitigation                                                                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Corrupting already-dual-themed pairs** — naive `bg-slate-9xx → token` rewrites code that is already light-correct                               | `BenchmarksPage.tsx:87` (`bg-slate-50 dark:bg-slate-900`); FacilityManagement / RealEstate pages                                                                                | Skip-rule: if site carries a paired `dark:bg-slate-*` sibling, tag `already-dual`, leave untouched, report for design review                                                                                                                                                          |
| R2  | **Erasing `dark:` intent overrides** — `dark:bg-slate-800/50` is deliberate dark-mode tuning atop tokens                                          | pervasive `dark:` usage (audit: 136 files)                                                                                                                                      | Never transform `dark:`-prefixed palette classes in wave 2; inventory them as a separate design-reviewed backlog                                                                                                                                                                      |
| R3  | **Dynamic class construction defeats attribute-scoped rewriting** — maps, fallbacks, variables, fn returns, runtime `.split(' ')`                 | `CapExDashboard.tsx:183`, `MultiBookPage.tsx:145`, `AIIntelligencePage.tsx:210`, `PeriodClosePage.tsx:412,441`, `ScenarioComparisonPage.tsx:201`, `DataLineagePage.tsx:258,294` | AST resolves literals at definition sites within the module; anything computed/cross-module auto-routes to the manual queue via the unmapped report. Never guess.                                                                                                                     |
| R4  | **Codemod emits _new_ dead classes** — `dark:fin-negative` / `hover:fin-negative` generate nothing while `fin-*` are plain CSS                    | `EmptyState.tsx:18`, `TemplateDesigner.tsx:173`, `SheetTabs.tsx:140,189`; definitions `index.css:943–951`                                                                       | Resolve Q1 _before_ wave 1: either register `fin-*` via Tailwind 4 `@utility` (legalizes variants repo-wide) or emit bare `fin-*` + explicit `dark:text-red-400` companions where needed (precedent: `EngineErrorBoundary.tsx:58`). Also sweep the existing dead instances in wave 1. |
| R5  | **Opacity modifiers lose translucency** — `bg-slate-800/40…60` renamed flat                                                                       | widespread `/NN` variants in page census                                                                                                                                        | Spike Q3 first (do alpha modifiers work over `var()`-backed theme colors in this Tailwind 4 build?). If yes → token + `/alpha`; if no → those sites go manual.                                                                                                                        |
| R6  | **Hover invisibility after mapping** — `hover:bg-slate-900/50` row hovers mapped to the resting token vanish                                      | table-row hovers across GL/DataImport/reports pages; `--bg-hover` already bridged as `bg-accent` (`index.css:342`)                                                              | Dedicated hover rule → `hover:bg-accent`; never reuse the resting-surface mapping                                                                                                                                                                                                     |
| R7  | **Non-JSX class carriers missed or double-handled** — AG Grid `cellClassRules` keys are object keys, not attributes                               | `columnDefs.ts:44`, `DataGrid.tsx:170`, `FinPlanGrid.tsx:184`, `SpreadsheetGrid.tsx:146`                                                                                        | Inventory pass tags them as first-class sites; they're string literals, so once identified they're _safe_ to rewrite — the failure mode is omission, not corruption                                                                                                                   |
| R8  | **Dead-class accumulation post-wave** — orphaned palette classes linger in comments/snapshots/safelist; audit's dead `dark:fin-negative` persists | audit finding; EmptyState witness above                                                                                                                                         | Final cleanup wave: delete residue; guard test asserts zero matches for migrated patterns outside the shrinking allowlist                                                                                                                                                             |
| R9  | **Stale sizing** — audit's "~150 text-red" vs measured 251 occ/120 files today                                                                    | §0 table                                                                                                                                                                        | Re-baseline via inventory script at each wave kickoff; never size from this document                                                                                                                                                                                                  |
| R10 | **Test-string coupling** — tests assert exact class names                                                                                         | `financialFormatting.test.ts:92`, `financial.test.ts:92`, `FinPlanGrid.deep.test.tsx:403`                                                                                       | Ride assertion updates in the same commit; suite fails loudly otherwise (LOW)                                                                                                                                                                                                         |
| R11 | **Verification blindness without baselines** — nothing compares before/after per page today                                                       | —                                                                                                                                                                               | Hooks #2+#3 together: fingerprints cover breadth (all sampled pages), atlas pixels cover depth (hot patterns)                                                                                                                                                                         |

---

## 5. Open questions for the owner

- **Q1 — Register `fin-*` as `@utility`?** Unblocks legal variant forms and simplifies the codemod's emission grammar. One-line CSS change with repo-wide effect; touches the audit's dead-class finding directly.
- **Q2 — Approve the surface mapping table** (`bg-slate-900 → bg-card`? elevated overlays → `bg-popover`?). Design-owner call; this document proposes defaults only.
- **Q3 — Alpha-modifier spike:** do `/NN` opacities compose with `var()`-backed theme colors in this Tailwind 4 build? Gates R5 handling.
- **Q4 — Scope:** pages only (per audit gaps), or include `components/ui` raw usages in the same waves?
