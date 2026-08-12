# Multi-Agent Task Assignments — A1–A5 Phased Roadmap

> **Purpose:** The `agents/` directory referenced by `AGENTS.md` — a phased multi-agent assignment roadmap mapping the BMAD v5.0 roster to the pending tasks in `_bmad/project-completion-plan.md`. Each phase has an owner Muse, an autonomy level (A1–A5), a completion gate, and an honesty rule.
> **Status:** ACTIVE 2026-08-12 · **Source of truth:** `_bmad/project-completion-plan.md` (task inventory), `_bmad/reasoning-ledger.md` (decisions), `_bmad/BMAD_V5_OPERATING_CHARTER.md` (autonomy matrix).

## Roster (BMAD v5.0)

| Agent | Role | Default autonomy | Focus |
|---|---|---|---|
| Rex | Research | A5 | Evidence sovereignty, assumption registry, Tier 2–4 evidence |
| Blaze | Brainstorm | A5 (ideation) | Options space, wedge/surface exploration |
| Ana / Percy / Uxie / Archie | Artifact owners | A5 within approved artifacts | Brief / PRD / UX / Architecture |
| Bob | Planning | A5 | Sprint plan, sequencing, gate discipline |
| Amelia | Developer | A5 on safe foundations | Code, engines, stores, pages |
| Quinn | QA | A5 (adversarial) | Verification, a11y, security, evidence honesty |
| System | Reconciliation | A5 (never destructive) | Git/worktree state, doc truth, ledger |
| Mnemosyne | Memory/truth | A5 | Ledger, evidence-log, honesty labeling |
| Strategos | Strategy | A5 | Roadmap, completion plan, ICP checks |
| ICP-1 Carla / ICP-2 Vera / ICP-3 Chris / ICP-4 Beth | Verdict | per D-011 | Major-decision 4-ICP verdicts |

## Phase 1 — Governance & evidence prep (A4/A5) — ASSIGNED

| Task (plan ID) | Owner | Autonomy | Gate |
|---|---|---|---|
| Record owner direction (ledger #34, E-019, direction record) | System | A5 | DONE (2026-08-12) |
| Master completion plan | Strategos | A5 | DONE (2026-08-12) |
| `agents/` roadmap (this file) | System | A5 | DONE (2026-08-12) |
| Desktop Tier-2 evidence kit (drafts) | Rex | A5 (no fabrication) | IN PROGRESS |
| T-13 status correction (workflows landed via b23e41a) | System | A5 | IN PROGRESS |

## Phase 2 — Engineering gates (A4/A5)

| Task (plan ID) | Owner | Autonomy | Gate |
|---|---|---|---|
| Full-suite run → exact test/file count (P-01) | Quinn | A4 | 13,438/1,195 derived → exact |
| Bundle budget audit + `npm run build` + bundle-check (P-02) | Amelia | A4 | main <150KB gzip, total <2MB gzip |
| a11y sweep on top-20 routes (E-02) | Quinn | A4 | WCAG 2.1 AA |
| Mock-data audit (E-09) | Quinn | A5 | `mock-data:audit` green |
| Type-safety ratchet (E-01) | Amelia | A5 | ratchet green |

## Phase 3 — UI/UX flagship: ZohoBooks-grade (A3/A4 — owner-visible direction)

| Task (plan ID) | Owner | Autonomy | Gate |
|---|---|---|---|
| Design-system audit vs ZohoBooks benchmark (UI-01) | Strategos + Amelia | A4 | Written audit + gap list |
| Typography & density pass (UI-02) | Amelia | A4 | 8px grid, dense tables |
| Navigation/IA polish (UI-03) | Amelia | A4 | ≤3 clicks to any workflow |
| Table excellence (UI-04) | Amelia | A4 | AG Grid config audit |
| Form patterns (UI-05) | Amelia | A4 | consistent forms |
| Empty/loading/error states (UI-06) | Amelia | A4 | full sweep |
| Light-theme professional pass (UI-07) | Amelia | A3 (theme direction) | light screenshot baseline |
| Focus/keyboard/a11y (UI-08) | Quinn | A4 | WCAG 2.1 AA + keyboard runbook |
| Onboarding polish (UI-09) | Amelia | A4 | <3 min setup, tested |
| Micro-interactions (UI-10) | Amelia | A4 | consistent motion |

## Phase 4 — Product depth: all-in-one loop (A3/A4 — evidence-informed)

| Task (plan ID) | Owner | Autonomy | Gate |
|---|---|---|---|
| End-to-end loop audit (D-01) | Amelia + Quinn | A4 | walkthrough + gap doc |
| GL/data depth (D-02) | Amelia | A4 | money tests reconcile |
| Consolidation + FX depth (D-03) | Amelia | A4 | multi-entity walkthrough |
| Budgets/forecasts/scenarios depth (D-04) | Amelia | A4 | analyst workflow walkthrough |
| Treasury/cash depth (D-05) | Amelia | A4 | cash-planning walkthrough |
| Revenue/lease/tax/capex depth (D-06) | Amelia | A4 | sub-ledger usable |
| Reporting & board pack (D-07) | Amelia | A4 | drills to source |
| Integrations depth (D-08) | Amelia | A4 | per-connector e2e |
| Sector pages depth audit (D-09) | Quinn | A4 | no shell pages |
| Collaboration/plugins audit (D-10) | Quinn | A4 | truth matrix |

## Phase 5 — Performance & optimization (A4/A5)

| Task (plan ID) | Owner | Autonomy | Gate |
|---|---|---|---|
| Cold-start audit (P-03) | Amelia | A4 | TTI baseline |
| Render performance (P-04) | Amelia | A4 | Profiler pass |
| Virtualization audit (P-05) | Amelia | A4 | no huge DOM lists |
| Worker usage (P-06) | Amelia | A4 | worker-pool verified |
| Memory audit (P-07) | Quinn | A4 | no leaks 10-min |
| Money/format perf (P-08) | Amelia | A4 | ratchet green |

## Phase 6 — Evidence loop (Rex — A5, owner executes outreach)

| Task (plan ID) | Owner | Autonomy | Gate |
|---|---|---|---|
| Waitlist mechanism (R-02) | Rex drafts / owner decides | A2 (owner) | channel chosen |
| Community engagement drafts (R-03) | Rex | A5 (drafts only) | drafts ready |
| Unsolicited demand tracking (R-04) | Rex | A5 (real signals only) | tracker rows |
| Pilot selection framework execution (R-05) | Rex + Bob | A2 (evidence) | slice selected from evidence |

## Standing honesty rules (all phases, non-negotiable)

1. **No fabricated evidence** — participants, waitlist counts, testimonials, usage numbers are REAL or labeled as drafts.
2. **Assumptions stay UNVALIDATED** until Tier-1 evidence; Tiers 2–4 update confidence/scope only.
3. **Breadth ≠ certified vertical depth** — sector pages are breadth until evidence exists.
4. **Every meaningful decision** logs to `_bmad/reasoning-ledger.md`; state changes to `_bmad/project-context.md`.
5. **CI red ≠ code evidence** while the GitHub billing block (E-005) persists; local verification is the gate.
6. **Never destructive git** — reconciliation per ledger #8/#27; worktree changes preserved.
7. **4-ICP verdicts** (Carla/Vera/Chris/Beth) for major decisions per D-011.
