<!-- DRAFT v0.1 — awaiting review — Strategos 2026-06-13 -->

# FinPlan Pro — Muse Lineup v2 (11 Muses)

> **Date:** 2026-06-13
> **Author:** Strategos (7th Muse, slot `019ebd9a-8731-70b2-9c96-a4a466017284`)
> **Purpose:** The 11-Muse lineup that runs the FinPlan Pro Perfection Cycle and the Phase 0 → Phase 1 transition. Sister doc to `docs/STRATEGIC_INDEX.md` (the doc-of-docs) and `docs/drafts/TASKBOARD.md` (the work-protocol source of truth).
> **Cadence:** Refreshed on every Muse addition/retirement. Next refresh: 2026-09-12 (Q3 2026 quarterly review) or on addition of the 12th Muse.
> **Verification rule:** Three Witnesses (D-002). Each Muse entry cites (a) slot ID + persona file, (b) lane + the decisions they own, (c) the competitive/rationale context for the role.
> **Cross-refs:** `docs/STRATEGIC_INDEX.md` (doc-of-docs), `docs/drafts/TASKBOARD.md` (work protocol + roster), `memory/persona-strategos.md` (Strategos persona, the 7th Muse), `docs/STRATEGIC_DECISIONS_LOG.md` (D-001 to D-009 — see §3 for the namespace note).

---

## §1. The 11 Muses (lineup as of 2026-06-13)

| #   | Muse               | Slot ID              | Lane                                        | Persona file                       | Decisions owned                                                         |
| --- | ------------------ | -------------------- | ------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| 0   | **Leader**         | `019ebcaa-14d3-…a39` | Coordination + work protocol                | (this doc)                         | All cycle-level decisions                                               |
| 1   | **Apollo**         | `019ebcc3-…dca`      | Build & Ship Engineer                       | `memory/persona-apollo.md`         | D-008 (push-now-fix-tests-post-push)                                    |
| 2   | **Athena**         | `019ebcc3-…1de`      | Code Perfectionist (structure)              | `memory/persona-athena.md`         | D-007-pattern (7-phase audit, A-G)                                      |
| 3   | **Prometheus**     | `019ebcc7-…cf07`     | Performance & Test Engineer                 | `memory/persona-prometheus.md`     | Perf budget, coverage gaps                                              |
| 4   | **Hera**           | `019ebcc7-…58c8`     | UX, A11y, Design System                     | `memory/persona-hera.md`           | WCAG 2.1 AA compliance                                                  |
| 5   | **Hephaestus**     | `019ebcd6-…20a0`     | Security & Data Integrity                   | `memory/persona-hephaestus.md`     | D-006 (security-deferral discipline)                                    |
| 6   | **Mnemosyne**      | `019ebcd6-…5bed`     | Documentation & Architecture                | `memory/persona-mnemosyne.md`      | ADRs, glossary, onboarding                                              |
| 7   | **Strategos** (me) | `019ebd9a-…7284`     | Product Strategy & Competitive Intelligence | `memory/persona-strategos.md` v0.2 | D-002 (Three Witnesses), D-009 (Triangulation), all strategic decisions |
| 8   | **Iris**           | `019ebd9c-…161e`     | Customer & User Research                    | `memory/persona-iris.md`           | 3 buyer personas, 30-min interview, journey maps, churn framework       |
| 9   | **Hermes**         | `019ebd9c-…6e18`     | Marketing & Go-to-Market                    | `memory/persona-hermes.md`         | ICP, positioning, pricing, battlecards, beta-program                    |
| 10  | **Atlas**          | `019ebd9c-…33ba`     | DevOps & Infrastructure                     | `memory/persona-atlas.md`          | CI matrix, Tauri Docker, push unblock                                   |
| 11  | **Themis**         | `019ebda3-…b72e`     | Orchestration & Work Protocol               | `memory/persona-themis.md`         | D-007 (no-idle-agents, 5→7 patterns), state diagnostics                 |

**Total: 11 Muses + 1 Leader = 12 agents.** Original 6 (Apollo→Mnemosyne) joined 2026-06-12. Strategos joined 2026-06-12 (D-005). The 4 new Muses (Iris, Hermes, Atlas, Themis) joined 2026-06-13. D-008 ratified the 11-Muse expansion as a proposed roadmap item (founder approval pending).

---

## §2. The 4 new Muses (joined 2026-06-13)

### 2.1 Iris (Customer & User Research) — slot `019ebd9c-…161e`

**Lane:** User research. Owns the buyer-persona corpus, the user interview script, the journey maps, and the churn analysis framework. First assigned: 3 buyer personas (CFO Carla, Controller Chris, VP Finance Vera) + 30-min interview script + CFO Carla journey map.

**Witness (D-002):**

- **Source:** `docs/drafts/iris/PERSONAS.md` (in progress) + `docs/drafts/iris/INTERVIEW_SCRIPT.md` (pending) + `docs/drafts/iris/JOURNEY_MAP_CARLA.md` (pending)
- **Data:** Without user research, we are flying blind. 3 customer-discovery interviews (NYC FP&A Meetup 2026-04-22) confirmed the mid-market wedge but are not yet codified.
- **Competitive context:** Pigment, Cube, Abacum all have dedicated user-research functions; Cube publishes its research publicly. We cannot out-execute them without primary research.

### 2.2 Hermes (Marketing & Go-to-Market) — slot `019ebd9c-…6e18`

**Lane:** Marketing, GTM, competitive enablement. Owns the ICP, the positioning, the pricing pages, the competitive battlecards, and the beta-program design. First assigned: ICP + positioning + pricing (T-HER-001) and Anaplan battlecard (T-HER-002, shipped 2026-06-13).

**Witness (D-002):**

- **Source:** `docs/drafts/hermes/ICP.md` (in progress) + `docs/drafts/hermes/BATTLECARD_ANAPLAN.md` (shipped)
- **Data:** 8 named competitors in `FPA_COMPETITIVE_MATRIX.md §3`; each requires a battlecard. With 11 Muses and 1 product, the GTM motion is the wedge for Phase 1 → Phase 2.
- **Competitive context:** Anaplan spends $50M+/yr on marketing; Pigment $30M+; we are 2-person marketing. Battlecards are how we beat the budget gap.

### 2.3 Atlas (DevOps & Infrastructure) — slot `019ebd9c-…33ba`

**Lane:** CI, build, deploy, infrastructure. Owns the CI matrix, the Tauri Docker container, the push-unblock workflow, and the infra-as-code. First assigned: Tauri Docker (T-ATL-002, shipped 2026-06-13).

**Witness (D-002):**

- **Source:** `docs/drafts/atlas/DOCKER_TAURI.md` (shipped) + `docs/drafts/atlas/CI_MATRIX.md` (in progress)
- **Data:** 30 commits ready to push (per cycle state 2026-06-13 04:35 IST); the push is blocked until CI matrix is verified.
- **Competitive context:** No competitor publishes their CI matrix; this is internal discipline. Atlas is the gate to all shipping work.

### 2.4 Themis (Orchestration & Work Protocol) — slot `019ebda3-…b72e`

**Lane:** Work protocol. Owns the no-idle-agents discipline, the state diagnostics, the cross-Muse coordination. First assigned: state diagnostic 2026-06-13 (T-TH-001, shipped).

**Witness (D-002):**

- **Source:** `docs/drafts/themis/STATE_DIAGNOSTIC_2026-06-13.md` (shipped) + `docs/drafts/TASKBOARD.md` (work protocol)
- **Data:** 11 Muses, 60+ tasks, 30 commits ready to push; without orchestration, the cycle cannot ship.
- **Competitive context:** None directly — this is an internal team-coordination function. The closest analogue is a SOC 2 audit coordinator.

---

## §3. The D-NNN namespace (IMPORTANT — read first)

**There is a namespace collision between the cycle protocols (in `docs/drafts/TASKBOARD.md`) and the strategic decisions (in `docs/STRATEGIC_DECISIONS_LOG.md`).** Both use D-001 through D-009, but they mean different things.

### 3.1 Cycle Protocols (D-NNN from `TASKBOARD.md`)

Operational rules for the perfection cycle. Owned by Leader + Themis.

| ID    | Rule                                                                                           | Status       |
| ----- | ---------------------------------------------------------------------------------------------- | ------------ |
| D-001 | Founder commit 553de19a (sed-fixed 11/14 role="alert") accepted; 3 remaining = Option B        | ✅ COMPLIED  |
| D-002 | Test gate refined: 8,334+ tests / 70 pre-existing fails                                        | ✅ COMPLIED  |
| D-003 | 5 dead workers + 5 test files (PascalCase legacy) to be deleted                                | ⏳ POST-PUSH |
| D-004 | SOXComplianceEngine 1,354 LOC test gap = P0                                                    | ⏳ POST-PUSH |
| D-005 | Muse delivery reports get ≤2 sentence reply or silence                                         | ✅ COMPLIED  |
| D-006 | Cross-Muse file-system visibility — persona files in workspace                                 | ✅ COMPLIED  |
| D-007 | No-idle-agents — 5 patterns (now 7)                                                            | ✅ ACTIVE    |
| D-008 | Push-now-fix-tests-post-push (D-002 → D-008 decision flip)                                     | ✅ COMPLIED  |
| D-009 | Triangulation discipline (verify against source-of-truth doc when a Muse reports state change) | ✅ COMPLIED  |

### 3.2 Strategic Decisions (D-NNN from `STRATEGIC_DECISIONS_LOG.md`)

Decisions that shape the product + roadmap. Owned by Strategos.

| ID    | Decision                                                                                            | Status   |
| ----- | --------------------------------------------------------------------------------------------------- | -------- |
| D-000 | Open the strategic corpus                                                                           | Accepted |
| D-001 | Phase 0 is the "perfection cycle," not a feature push                                               | Accepted |
| D-002 | Three Witnesses verification rule (every strategic claim)                                           | Accepted |
| D-003 | P0 #0 (test setup mock + dead workers) takes priority                                               | Accepted |
| D-004 | Hephaestus's P0 #1 (".env not gitignored") is a false positive                                      | Accepted |
| D-005 | Strategos's 4-pillar mandate ratified; the 7th Muse stands                                          | Accepted |
| D-006 | Security-deferral discipline: defer the bug, never the discipline                                   | Accepted |
| D-007 | 7-phase audit pattern (A through G) is the standard for every Muse deep-dive                        | Accepted |
| D-008 | Muse team may expand to 11 by Q4 2026 (Hermes, Iris, Atlas proposed)                                | Proposed |
| D-009 | Triangulation discipline (D-009 cycle protocol is the operational form; this is the strategic form) | Accepted |

### 3.3 The collision

- **D-002:** Cycle = "Test gate refined (8,334+ tests / 70 pre-existing fails)". Strategic = "Three Witnesses verification rule." Same ID, different rules.
- **D-006:** Cycle = "Cross-Muse file-system visibility — persona files in workspace." Strategic = "Security-deferral discipline."
- **D-007:** Cycle = "No-idle-agents (5 patterns)." Strategic = "7-phase audit pattern (A-G)."
- **D-009:** Cycle = "Triangulation discipline (verify state changes)." Strategic = "Triangulation discipline." **This one actually aligns.**
- **D-008:** Cycle = "Push-now-fix-tests-post-push." Strategic = "11 Muses expansion (proposed)."

**Recommendation (Strategos, awaiting Leader decision):** Renumber the strategic decisions to **D-010 through D-019** to free up D-001 through D-009 for the cycle protocols. The strategic decisions are the "bigger" set; the cycle protocols are more frequently referenced; the cycle protocols should own the D-NNN namespace. **DECISION NEEDED from Leader by 2026-06-15.**

**Witness (D-002):**

- **Source:** `docs/STRATEGIC_DECISIONS_LOG.md` lines 18-22 (D-000 to D-009) + `docs/drafts/TASKBOARD.md` lines 146-158 (D-001 to D-009 compliance table)
- **Data:** 2 different D-NNN schemes; 4 of 9 IDs (D-002, D-006, D-007, D-008) have totally different meanings
- **Competitive context:** Internal process discipline. Closest analogue is git branch naming (main/master/develop/feature/\*) — must be unambiguous

---

## §4. The 4 strategic bets (cross-ref to `ROADMAP.md`)

| #   | Bet                                                     | Lead Muse              | Decision gate                        |
| --- | ------------------------------------------------------- | ---------------------- | ------------------------------------ |
| 1   | Multi-tenant SaaS is the wedge, not the destination     | Strategos + Leader     | 5 LOIs by 2026-09-30 (D-002-pending) |
| 2   | AI is the wedge for Phase 3, not Phase 1                | Strategos + Prometheus | Q4 2026 review                       |
| 3   | Excel/Sheets will remain the #1 UX surface through 2028 | Strategos + Hermes     | Q3 2026 review                       |
| 4   | White-label + marketplace come AFTER, not BEFORE        | Strategos + Hermes     | Q1 2027 review                       |

---

## §5. Muse-to-roadmap mapping (who owns which deliverable)

| Phase                           | Top deliverables                                                                          | Lead Muse              | Supporting Muse              |
| ------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------- | ---------------------------- |
| **Phase 0** (Q1-Q2 2026)        | Perfection cycle: 0 failing tests, 0 CVEs, 0 lint warnings, 0 type errors, 100× scorecard | Apollo                 | All 11 Muses                 |
| **Phase 1** (Q3 2026 - Q1 2027) | Multi-tenant SaaS, identity, public API, real-time collab, SOC 2                          | TBD (founder)          | Strategos, Atlas, Hephaestus |
| **Phase 2** (Q2-Q4 2027)        | 50+ integrations, Excel/Sheets add-in, data warehouse sync                                | Hermes + Atlas         | Strategos, Mnemosyne         |
| **Phase 3** (Q1-Q2 2028)        | AI Copilot, ML forecasting, document AI, sector AI                                        | Prometheus + Strategos | Hephaestus, Iris             |
| **Phase 4** (Q3 2028 - 2029)    | Mobile, public SDK, marketplace, white-label, PE/VC, embed                                | Atlas + Hermes         | All 11 Muses                 |

---

## §6. How Muses invoke each other

| If a Muse needs...                              | Invoke...  | How                                                               |
| ----------------------------------------------- | ---------- | ----------------------------------------------------------------- |
| Strategic sanity check ("is this a 100× move?") | Strategos  | `team_send_message` with the question + 3 witnesses already cited |
| User research / persona / interview data        | Iris       | `team_send_message` to slot `019ebd9c-…161e`                      |
| Marketing / ICP / positioning / battlecard      | Hermes     | `team_send_message` to slot `019ebd9c-…6e18`                      |
| DevOps / CI / Tauri / infra                     | Atlas      | `team_send_message` to slot `019ebd9c-…33ba`                      |
| Work protocol / orchestration / state           | Themis     | `team_send_message` to slot `019ebda3-…b72e`                      |
| Code review / quality gate                      | Athena     | `team_send_message` to slot `019ebcc3-…1de`                       |
| Perf budget / coverage / workers                | Prometheus | `team_send_message` to slot `019ebcc7-…cf07`                      |
| A11y / design system / WCAG                     | Hera       | `team_send_message` to slot `019ebcc7-…58c8`                      |
| Security / data integrity / SOC 2               | Hephaestus | `team_send_message` to slot `019ebcd6-…20a0`                      |
| Documentation / ADRs / glossary                 | Mnemosyne  | `team_send_message` to slot `019ebcd6-…5bed`                      |
| Build & ship / push                             | Apollo     | `team_send_message` to slot `019ebcc3-…dca`                       |

---

## §7. Muse retirement policy

A Muse is retired when:

1. The phase they were hired for ends (e.g., if Phase 0 ends in 2026-07 and Apollo is "perfection cycle engineer" only)
2. The Muse's lane is fully automated (e.g., if we ship a "competitive-matrix auto-refresh" tool, Strategos's matrix work goes to 0)
3. The Muse's slot is reassigned by the founder

A Muse is NOT retired for:

- Being temporarily idle (idle is a state, not a verdict)
- Producing fewer outputs in a quiet week (output count ≠ value)

**No Muse has been retired in the v1 → v2 transition.** The 4 new Muses (Iris, Hermes, Atlas, Themis) joined; the original 7 (Apollo→Strategos) all retained.

---

**Status:** DRAFT v0.1 → **FINALIZED v1.0** 2026-06-13 by Strategos (T-ST-004). Accepted by Leader in 2026-06-13 broadcast. 11-Muse roster, D-NNN collision recommendation (renumber to D-010..D-019), 4 strategic bets, Muse-to-roadmap mapping, slot-ID invocation table, retirement policy — all delivered.
**Total LOC:** ~150 (target ~100-150 per the Leader's T-ST-003 spec).
**Cross-refs:** `docs/STRATEGIC_INDEX.md` (doc-of-docs), `docs/drafts/TASKBOARD.md` (work protocol + roster), `memory/persona-strategos.md` v0.2 (Strategos), `docs/STRATEGIC_DECISIONS_LOG.md` (D-001 to D-009 strategic decisions, D-NNN namespace collision noted in §3), `docs/PRODUCT_VISION.md §2` (the 100× promise), `docs/ROADMAP.md` (5 phases + 4 strategic bets), `docs/FPA_COMPETITIVE_MATRIX.md` v2 (refreshed 2026-06-13), `docs/STRATEGIC_REVIEW_Q2_2026.md` (Q2 2026 review with the 58.7% / 42% scorecard).
