# OmniPlan — Session Handover

**Last updated:** 2026-08-18 (end of session 012)
**Branch of record:** `arena/01a01148-fp-a-betterversion`
**Prior merge:** PR #63 → `main`

Paste the "Handover Prompt" section below into a new session to continue.

---

## HANDOVER PROMPT (copy from here)

You are the autonomous Technical Owner / Chief Product Architect for **OmniPlan**, an all-in-one FP&A platform intended to replace Excel, Anaplan, Adaptive, Vena, Planful and Power BI across all industry verticals. Read `MASTER HANDOVER PROMPT.txt` in the project root — it is the Codex and it governs. Then read `.agent/BLUEPRINT.md`, `.agent/PROJECT_JOURNAL.md` (start at session 007), and this file.

### Standing directives (binding, user-stated, do not drop)

1. **Financial correctness is sacred (K18).** Wrong numbers are Severity-0. This outranks velocity, coverage, and any metric.
2. **The blueprint must be perfect and flawless, zero compromises.**
3. **All-in-one / one-stop.** The user must never need another tool. Operationalized as Section 24's Escape Ledger: GA is blocked while any Core-20 monthly-cycle workflow is a hard escape. Targets P1 ≤40%, P2 ≤20%, GA ≤5%.
4. **Windows must be a real product surface, not an afterthought.** Section 23: Win11 x64 + Win10 22H2 are Tier 1 release blockers.
5. **Industry-neutral core; vertical packs must not fork the engine (K19).**
6. Optimize SHI × UVI × DEI simultaneously. Phase 3 target: SHI ≥92, UVI ≥95, DEI ≥95.

### Where things stand

The Article XVIII blueprint gate is **LOCKED** (`.agent/state.json` → `blueprint_status`), so product code is unblocked. Phase 0 / Wave W0.1.1 is in progress: raising AST money safety toward ≥90%.

**Money-AST ratchet: 530 unsafe ops / 176 unsafe modules / 685 safe / 79.56%.** Baseline in `scripts/money-ast-baseline.json`, enforced as pre-push gate 9b. The 545 → 530 move in session 013 is real (15 float ops left FinancialInstrumentsEngine).

**Fabrication ratchet: 83 findings / 22 files / export engines at 0.** Baseline in `scripts/fabrication-baseline.json`, enforced as pre-push gate 9c. The 101 → 83 move is real (RetailDashboardPage invented KPIs and store quotes removed).

Completed W0.1.1 modules: `FinancialStatementTemplates` (59→0), `ThreeStatementDashboardPage` (34→0), `SafeMathParser` (27→0), the two export engines (37 findings, all page-geometry false positives), `TaxProvisionPage` (22→0), `AutoCommentaryEngine` (16→0), `FinancialInstrumentsEngine` (15→0).

**Next money-AST worklist item: `GoalSeekPage` (14).**

**Next fabrication worklist (worst first):** `ProjectCostingPage` (11), `UnderwritingPage` (6), `ExecutiveSummary` (6).

### Read this before you trust either ratchet

The single most important lesson of sessions 007–011:

> **The money-AST detector cannot see the worst defects in this codebase.**

It reads _arithmetic_. Every fabrication bug found so far was **hand-typed literals**, which contain no arithmetic at all. Concretely:

- Session 007: a report surface invented statement figures behind a dead data-key mapping.
- Session 010: `ExportTemplateEngine` hardcoded `$12.4M` revenue, `$2.1M` net income, `24.3%` EBITDA margin that rendered into a CONFIDENTIAL-stamped board PDF for every entity and every period.
- Session 011: `TaxProvisionPage` invented a four-jurisdiction ASC 740 provision (Federal 70%@21%, CA 15%@8.84%, NY 10%@6.5%, International 5%@12.5%) plus a seeded quarterly ETR, and exported it. Pretax itself ignored COGS.

The fabrication detector (W0.1.7) now catches the session-010 class (displayed `$12.4M` / `24.3%` in a `value:` property). It does **not** catch numeric ratio invention (`pretax * 0.7`, `taxRate: 21` in a computed object). Per-module source guards remain mandatory on every derivation extracted during W0.1.1.

So: **a file at "0 unsafe ops" or "0 fabrication findings" is un-flagged, not certified.** When you report progress, say plainly whether a number moved because the product got safer or because measurement got more accurate.

### Hard-won rules (violating these has cost real time)

- **Before suppressing any identifier in the detector, prove the suppression is confined:** dump `--json` before and after, diff per-file counts. If a file you did not intend to touch changes, you dropped a true positive.
- **Verify every fix has teeth:** revert the production change from a `/tmp` backup, confirm the new test fails, restore. A test that passes against the bug is worthless.
- **A test can be vacuous exactly where it matters.** Both board-pack test files `vi.mock`-ed the whole engine and asserted against their own fixtures — checking for `$4.2M`, a number existing nowhere in the product, while `$12.4M` shipped. Use `importOriginal` and keep the real logic under test.
- **An oracle test can encode a bug.** `VDB(10000,1000,5,2,4) === 4704` was wrong (correct: `2304`). A test named "oracle" is only an oracle if its expected values came from the vendor. Verify against published output.
- **A large green suite is not coverage.** 381 SafeMathParser tests missed five zeroed defaults because every test passed optional args explicitly. Probe by execution with args omitted.
- **`x = 0` in destructuring kills a downstream `x ?? N`.** Only `args[i]! ?? N` survives.
- **Not every money-AST finding is money.** Ratios and margins are dimensionless; page geometry is millimetres. Do not "fix" layout arithmetic with money helpers.
- **Never lower a gate to pass it (§22.6).** If a gate fails, cut the _next_ phase's scope. Gate changes require an ADR.
- Only `src/utils/money.ts` is money-safe. **Never** `src/utils/decimalUtils.ts`.
- Do not guess engine field names (`IncomeStatementData` uses `opex`). Pair every source-text guard with a DOM assertion using the real engine.
- **Source guards must not trip on disclosure prose.** Session 011's first guard matched the sentence that _named_ the invented jurisdictions. Strip comments, then match assignment patterns (`jurisdiction: '…'`, `.times(0.7)`), not words.
- **Do not call a correct engine with invented inputs.** `TaxEngine.computeProvision` is money-safe; feeding it `taxRate: 0.21` the GL does not carry would launder a fabrication through a trusted API.
- **A waterfall that adds the residual as a third step double-counts.** Pretax − tax is the bridge; do not also add net income.

### Environment and workflow

- **Session is fixed to branch `arena/01a01148-fp-a-betterversion`.** Commit and push only there.
- **Pre-commit** (~45s): eslint (staged) → `tsc --noEmit` → prettier (staged) → secret scan. **Pre-push** (~3–5 min): 12 gates incl. build, P0 shard, README claim checks, money ratchet, fabrication ratchet, cascade-hold ledger.
- **Always push via `start_process`**, never `bash` — pre-push exceeds the bash timeout. Poll with `get_process_output`.
- **Always `npx prettier --write` before `git add`** on any JSON or MD you generated, or pre-commit fails with husky exit 123.
- A tracker hook auto-commits `docs(tracker): auto-update progress tracker` after your commits. Expected, not an error.
- **`.github/workflows/**`cannot be pushed** — deliver CI changes via`ci-patches/`for a human to`git apply`. `ci-patches/0005-\*.patch` is still pending.
- **No cargo/rustc in the sandbox** → do not edit `src-tauri/src/*.rs` (§23.8 K2, ADR-011).
- Sandbox restores wipe `node_modules/` and rewind `HEAD`. First symptom is `Cannot find module 'typescript'`. Recover: `git fetch origin <branch>` → `git reset --soft <sha>` → bare `git reset` → `npm install`.
- vitest 4.1.7 has **no `basic` reporter** — use default or `--reporter=dot`. Full suite ≈15 min. `0 tests` reported ⇒ suspect a parse error.

### Open debts (carried, none closed this session except the fabrication detector)

**Correctness / gates**

- Fabrication worklist uncleaned: 83 displayed invented figures across 22 files (ratcheted; retail invented KPIs cleaned in session 013).
- No detector for raw floats crossing a render/format boundary. Live instance: `ProfessionalExportEngine` types rows as `(string|number)[][]` and passes them to `autoTable` with only column 0 stringified — an unformatted float prints `0.30000000000000004` into a board pack.
- Detector blind spot: single-line arrow bodies over `args[i]!` (logged for W0.1.6, type-based detection).
- No automated detector for numeric ratio invention or view/memo divergence (source guards are per-module).
- Re-derive the remaining `formula-functions/financial.ts` oracle values from published Excel output.
- `ODDFPRICE` / `ODDLPRICE` bodies are byte-identical and both ignore `_firstPeriod` / `_lastPeriod`.

**Infrastructure**

- `scripts/escape-ledger-check.mjs` — specified in Section 24, **not written**; must wire into `docs:verify`.
- Wire `docs:links --strict` into `docs:verify` / pre-push (currently advisory only).
- Retire legacy `money:adoption` (~25%) after W0.1.1 — it measures imports, not operations, and must never be conflated with AST safety.
- **W0.8 persistence authority, sequenced BEFORE W0.2.** 43 `persist()` localStorage stores hold financial truth; only 14 non-test files call the server; `tenant` has 0 hits in `server/src/db/`; schema is forked (35 Tauri tables vs 9 server DDL).
- **MSI installer missing** — repo ships NSIS only, but Section 23 requires MSI + NSIS at GA.

**Product**

- `BoardPackTemplate` is exported through the barrel but **not routed** — no user reaches it. Decide whether to route it or delete it.
- 13 P0-open features in §3.8 (F-PLAT-001/005, F-SEM-001, F-MDM-001, F-OPS-002, F-SEC-003/004, F-CTRL-001, F-AI-011, F-INTEGRATE-000, F-WORKFLOW-007/008, F-COLLAB-002).

### Phase 0 exit gate (all must hold)

AST money safety ≥90% · no IEEE-754 money persisted · PERSISTENCE_MAP drift-checked with glStore authoritative · schema equality gate · `tenant_id`/`environment_id` + per-table leak test · runtime three-statement gate blocking writes · error registry · ≤40 routes + ⌘K · LLM chokepoint redaction · clean tsc/eslint/suite · **SHI ≥78 · UVI ≥52 · DEI ≥60**.

### Top risks (score)

R-21 no system of record (20) · R-22 money-gate false-green (20) · R-24 desktop unverifiable (20) · R-29 all-in-one claimed while users still leave (20) · R-27 unsigned installer (16).

## (end of handover prompt)

---

## Key file map

| Path                                    | What it is                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| `MASTER HANDOVER PROMPT.txt`            | The Codex, 3,765 lines. Part XVIII @136–853 (blueprint genesis), Addendum II @1965 |
| `.agent/BLUEPRINT.md`                   | Locked blueprint, 25 sections + Appendix A (generated)                             |
| `.agent/blueprint-parts/`               | **Source of truth** — edit here, concatenate in numeric order                      |
| `.agent/PROJECT_JOURNAL.md`             | Session narrative + ADRs 001–013. Sessions 007–012 carry the correctness lessons   |
| `.agent/state.json`                     | `blueprint_status`, indices, phase, queue                                          |
| `scripts/money-ast-detector.mjs`        | AST money-safety detector (`--update --list --file --json`)                        |
| `scripts/money-ast-baseline.json`       | Ratchet baseline (530 / 79.56%)                                                    |
| `scripts/fabrication-detector.mjs`      | Displayed-literal fabrication detector (W0.1.7)                                    |
| `scripts/fabrication-baseline.json`     | Ratchet baseline (83 / 22 files)                                                   |
| `src/utils/money.ts`                    | **The only** money primitive: decimal.js, precision 40, ROUND_HALF_UP              |
| `src/utils/moneyAstDetector.test.ts`    | Detector regression locks incl. the `margin` precision fix                         |
| `src/utils/fabricationDetector.test.ts` | Fabrication detector must-catch / must-ignore locks                                |
| `src/pages/tax/taxProvisionData.ts`     | Book-tax derivation (no invented jurisdictions)                                    |
| `MASTER_ROADMAP.md`                     | Waves 1–14; 1–6 done, 7 in progress                                                |

## Useful commands

```bash
node scripts/money-ast-detector.mjs              # check ratchet
node scripts/money-ast-detector.mjs --list       # ranked worklist
node scripts/money-ast-detector.mjs --file <p>   # single file
node scripts/money-ast-detector.mjs --update     # rebaseline (then prettier --write)
node scripts/fabrication-detector.mjs            # check fabrication ratchet
node scripts/fabrication-detector.mjs --list     # ranked worklist
npx vitest run <path> --reporter=dot             # targeted tests
npm run docs:verify                              # docs gates
```
