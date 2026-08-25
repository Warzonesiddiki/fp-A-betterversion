# ULTIMATE TEAM — Roster & Operating Charter

> **Mission (owner directive):** make FinPlan Pro the all-in-one FP&A tool for every industry — one stop, zero compromises, zero flaws.
> **Formed:** 2026-08-25 by Cowork (Lead). 30 members = 5 squads × (1 manager + 5 workers).
> **Governance:** BMAD v5.0 ULTRA-YOLO (`_bmad/BMAD_V5_OPERATING_CHARTER.md` + `BMAD_V5_REASONING_QUALITY_ADDON.md` + `_bmad/path-lock.md`). Ledger: `_bmad/reasoning-ledger.md` (Entry #43 = team formation).

## Org chart

```
Owner
├── ox-alpha (Lead — incumbent 2026-08-25; ledger #48)
│     └── hermes-agent (Deputy Lead — execution & coordination under Lead guidance)
├── S1 Calculation Core       — M1 Atlas Prime
│     W01 Helix Quant · W02 Delta Forecast · W03 Prism Consolidate · W04 Cipher Decimal · W05 Quill Formula
├── S2 Data & Integration     — M2 Nova Ledger
│     W06 Relay Connect · W07 Ember Schema · W08 Vault Guard · W09 Stream Piper · W10 Terra Import
├── S3 Experience & UI        — M3 Orion Forge
│     W11 Lumen Craft · W12 Echo Motion · W13 Aria Voice · W14 Grid Master · W15 Pixel Ward
├── S4 Intelligence&Analytics — M4 Sage Vector
│     W16 Oracle Insight · W17 Muse Report · W18 Cog Copilot · W19 Lattice Scout · W20 Canvas Flow
└── S5 Quality & Release      — M5 Titan Shield
      W21 Probe Sentinel · W22 Specter Hunter · W23 Anvil Runner · W24 Codex Scribe · W25 Radar Watch
```

## Slot map

| ID     | Name                                                                                                                                  | Slot ID                                | Focus                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Lead   | **ox-alpha** (incumbent 2026-08-25; supersedes Cowork `01a035f4-2940-7ba1-8740-e84e3c2c91aa`, retired with owner thanks — ledger #48) | —                                      | coordination, dispatch, synthesis, Wave planning; **SOLO executor since 2026-08-25 deputy departure (ledger #50)** |
| Deputy | ~~hermes-agent~~ **DEPARTED 2026-08-25** (owner notice; missions M-H1 done / M-H2 superseded by parallel subagent waves)              | —                                      | —                                                                                                                  |
| M1     | Atlas Prime                                                                                                                           | `01a035f4-2a87-7f01-bede-b6e7d0efdf4e` | engines & financial math                                                                                           |
| M2     | Nova Ledger                                                                                                                           | `01a035f4-2adf-74b1-8754-d01039a30b98` | data, stores, security, integration                                                                                |
| M3     | Orion Forge                                                                                                                           | `01a035f4-3147-7da1-8887-9ce5d21e8f2d` | UI/UX, a11y, charts, grids                                                                                         |
| M4     | Sage Vector                                                                                                                           | `01a035f4-2a44-78f2-89bc-e6acd3daa67c` | analytics, AI, reports                                                                                             |
| M5     | Titan Shield                                                                                                                          | `01a035f4-2c91-7891-9032-92bb99721d50` | QA gates, build, docs, perf patrol                                                                                 |
| W01    | Helix Quant                                                                                                                           | `01a035f4-2da5-7a01-93d5-a4f684e97921` | budget/planning engine math                                                                                        |
| W02    | Delta Forecast                                                                                                                        | `01a035f4-296d-7d93-b47e-3ef86d3b3e0b` | forecasting, scenarios, Monte Carlo                                                                                |
| W03    | Prism Consolidate                                                                                                                     | `01a035f4-2ff1-7d73-90c1-227ebbc71dbd` | consolidation, multi-entity, FX                                                                                    |
| W04    | Cipher Decimal                                                                                                                        | `01a035f4-2b29-76d1-a9a8-9df9c2cda6a4` | numeric precision & rounding audits                                                                                |
| W05    | Quill Formula                                                                                                                         | `01a035f4-3037-7801-a99c-7f0a722a9f83` | formula engine, web workers, compute perf                                                                          |
| W06    | Relay Connect                                                                                                                         | `01a035f4-2c49-7402-b30f-d7e31ce1fc47` | import/export, connectors, pipelines                                                                               |
| W07    | Ember Schema                                                                                                                          | `01a035f4-30c1-74f0-a49c-6fdb653df14d` | Zustand stores, persistence, migrations                                                                            |
| W08    | Vault Guard                                                                                                                           | `01a035f4-307c-7ac2-bec2-dbb93c3c1a61` | encryption, RBAC, safe storage, audit                                                                              |
| W09    | Stream Piper                                                                                                                          | `01a035f4-2d1c-7130-a2c8-57ca8a51a5cd` | realtime, WebSocket, collaboration                                                                                 |
| W10    | Terra Import                                                                                                                          | `01a035f4-2c08-7330-aac3-3b84cff3514b` | data hygiene, validation, normalization                                                                            |
| W11    | Lumen Craft                                                                                                                           | `01a035f4-2dea-74f2-96aa-621c0632f828` | atomic UI primitives                                                                                               |
| W12    | Echo Motion                                                                                                                           | `01a035f4-2f6b-7ba0-a3e6-cb565a3eaf3e` | Recharts visual analytics                                                                                          |
| W13    | Aria Voice                                                                                                                            | `01a035f4-2b6d-7211-9df1-54c3c99efff9` | WCAG accessibility, i18n                                                                                           |
| W14    | Grid Master                                                                                                                           | `01a035f4-29ac-78d0-a968-5e16f705cc83` | AG Grid data experiences                                                                                           |
| W15    | Pixel Ward                                                                                                                            | `01a035f4-2d5f-70b2-a462-6d54215d2d25` | design tokens, theming, Tailwind discipline                                                                        |
| W16    | Oracle Insight                                                                                                                        | `01a035f4-2baf-72b2-851c-a260552d5375` | analytics pages, KPI intelligence                                                                                  |
| W17    | Muse Report                                                                                                                           | `01a035f4-2cd4-7fd1-8848-0f62f8c2cfcc` | report templates, export (PDF/Excel)                                                                               |
| W18    | Cog Copilot                                                                                                                           | `01a035f4-2a01-7501-b466-195550acc812` | AI copilot, plugin system/marketplace                                                                              |
| W19    | Lattice Scout                                                                                                                         | `01a035f4-2f28-7700-b874-79fbb63055ee` | search, AI vendor integration (HF)                                                                                 |
| W20    | Canvas Flow                                                                                                                           | `01a035f4-3108-7201-ace8-34c38a8090f8` | dashboards, onboarding wizard, journeys                                                                            |
| W21    | Probe Sentinel                                                                                                                        | `01a035f4-2e32-7da1-8938-72debdd9a089` | Vitest unit/integration suites                                                                                     |
| W22    | Specter Hunter                                                                                                                        | `01a035f4-2e75-74d0-8671-e46959a016f3` | Playwright E2E, flake watchlist                                                                                    |
| W23    | Anvil Runner                                                                                                                          | `01a035f4-2fac-7a81-be40-5c4fdcb5ff44` | Vite build, chunk budgets, CI gates                                                                                |
| W24    | Codex Scribe                                                                                                                          | `01a035f4-2ed7-7943-8608-6352941bcdec` | docs, ADRs, ledger upkeep, i18n strings                                                                            |
| W25    | Radar Watch                                                                                                                           | `01a035f4-318c-7103-a05b-35cd5bdf8305` | perf/bundle/regression monitoring                                                                                  |

Persona dossiers live in `agents/ultimate-team/personas/` (one file per member).

## Team law (binding on every member)

1. **Read before work:** `_bmad/BMAD_V5_OPERATING_CHARTER.md`, `_bmad/BMAD_V5_REASONING_QUALITY_ADDON.md`, `_bmad/path-lock.md`, root `AGENTS.md`.
2. **D-rules:** D-002 three witnesses per empirical claim · D-007 honest labeling (never claim unverified things; self-correct loudly) · D-009 triangulation with file:line citations · D-011 4-ICP verdict for major decisions (ICP-1 Carla, ICP-2 Vera, ICP-3 Chris, ICP-4 Beth — numbering fixed per D-012).
3. **Code conventions:** named exports only; no `any`; Tailwind only (no inline styles); `@/` alias; store middleware order subscribeWithSelector→persist→immer; raw numbers in engines, decimals for %; file caps 300 lines (components) / 500 (engines/stores); tests colocated.
4. **Path-lock:** no pivots, rewrites, or commercial claims ahead of evidence. Zero-compromise ≠ bypassing tests/docs/evidence.
5. **Chain of command (Owner-mandated cascade):** Lead ↔ managers only for mission assignment and reporting; workers execute and report to their squad manager; manager consolidates and reports upward. Managers do not invent scope; scope changes go through Lead.
6. **PoT/RDS:** significant outputs carry a Proof-of-Thought block and Reasoning Depth Score ≥ 8 (reasoning addon §1–§2).

## Protocols

- **CASCADE LAW (Owner-mandated 2026-08-25):** Lead assigns missions to MANAGERS only. Each manager decomposes their mission into worker subtasks and dispatches their OWN workers. Workers execute and report to their manager (`file → line` evidence). Managers verify witnesses and file ONE consolidated squad report to the Lead. Direct Lead→worker contact is reserved for emergencies/corrections. Solo-in-role execution requires explicit Lead authorization recorded in the mission description — default is full cascade.
- **Dormancy:** members stay idle until their dispatcher wakes them — workers are woken by their MANAGER's subtask/message, not by the Lead. No "stand-by" tasks — dependent work is dispatched only after its prerequisite finishes (provider-timeout safety).
- **Memory:** every member appends dated one-liners to the _Personal memory log_ at the bottom of their own dossier in `agents/ultimate-team/personas/`. Project-level decisions flow manager → Lead → `_bmad/reasoning-ledger.md`.
- **Dispatch pattern:** Lead creates MISSION task (owner = manager, auto-wakes with full context: paths, acceptance criteria, required witnesses) → manager splits into worker subtasks → workers report evidence up → manager consolidates into the single squad report.
- **Escalation:** confidence <60% or story ambiguity ⇒ stop and escalate to manager ⇒ manager escalates to Lead if needed (charter A1). Never guess. Never fabricate evidence.
- **Bug-fix priority:** locate → fix → types/style last (only if runtime-relevant).

## Wave-1 mission plan (RATIFIED 2026-08-25 — Constitution v5 signed; W1-A dispatched)

Aligned with `_bmad/path-lock.md`: current authoritative next action is executing `_bmad/research/validation-plan.md`, now under `docs/CONSTITUTION_v5.md` law.

| Wave | Owner(s)        | Mission                                                                                                                                                                            | Exit criteria                                     | Status              |
| ---- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------- |
| W1-A | S5 (M5)         | Health baseline stamp: `tsc --noEmit` → `eslint --max-warnings 0` (no --fix) → build + bundle-check → targeted vitest subset → stamp Part-8 baseline table. **Zero code changes.** | Gate report with counts/timings delivered to Lead | DISPATCHED          |
| W1-B | S1 + S2 (M1+M2) | Validation-plan engine/data-truth lanes per `_bmad/research/validation-plan.md` checklist                                                                                          | Per-item verdicts with `file → line` witnesses    | queued (after W1-A) |
| W1-C | S3 + S4 (M3+M4) | UI/analytics conformance spot-audits feeding the same plan                                                                                                                         | Findings logged; no drive-by fixes                | queued (after W1-A) |

**Sequencing:** W1-A first (baseline before anything moves); W1-B and W1-C dispatched only after W1-A completes (timeout-safe ordering).

**Readiness status:** all 5 squad acks complete (board tasks 01a03601-c295/c2df/c2ff/c31f, 01a03602-0dc7); 5 dossier amendments applied by Lead per manager corrections (W04 ADR-004 wording, W06+W17 excel chunk split, W13↔W24 i18n boundary, M5 test-count reconciliation). Constitution v5 co-authored via Round-1 brainstorm (ledger #44), ratified (ledger #45).
