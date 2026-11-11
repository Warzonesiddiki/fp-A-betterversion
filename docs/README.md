# FinPlan Pro — Documentation Map

> **This is the entry point to the live documentation.** If a document is not
> reachable from this page (or from `AGENTS.md`), it is not authoritative.
> Retired documents live in [`docs/archive/`](archive/) and are provenance, not
> instructions.

Last updated: **2026-11-10** (product/connector plan aligned to the owner's reaffirmed direction; DEC-011's 2026-10-16 archive boundary retained). Every number quoted in these docs is
produced by a command named next to it. Do not update a number by hand.

---

## 1. What to read, and in what order

### If you are an agent (vibe coding)

```text
AGENTS.md                       rules, session protocol, commands (read first)
  → docs/README.md              this page: the doc map
  → docs/agent/WORKING_AGREEMENT.md  the owner's goal as stated + the queue I work in
  → docs/VISION.md              product goal and all-in-one module map
  → docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md detailed proposed strategy and owner review
  → docs/agent/00_INDEX.md      engineering handbook index + source-of-truth matrix
  → docs/agent/09_KNOWN_GAPS.md current implementation gaps and evidence
  → docs/03_CURRENT_STATUS_AND_AUDIT.md Stage 1 code-vs-document audit, matrices and defect register
  → docs/discovery/VISION_ALIGNMENT_RECHECK_2026_11_02.md dated code/connector recheck
  → docs/discovery/roadmap.md   high-level gate summary
```

Squad member sessions (the 11-seat Gemini team, the Freebuff partner seat, the lead) start from
`docs/agent-squad/AGENT_JOIN_GUIDE.md` and coordinate through `docs/agent-squad/agents-comms/`;
acceptance work still lands under the rules above.

Then, before touching code that persists, computes money, imports data or
touches periods:

```text
docs/agent/02_ARCHITECTURE.md   layers, dependency direction, runtime gates
docs/agent/03_DOMAIN_RULES.md   accounting/FP&A invariants the code must enforce
docs/agent/08_DATA_MODEL.md     types, persistence truth, schema homes
```

### If you are a human evaluating the product

```text
docs/VISION.md                                  product goal and all-in-one promise
docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md owner-approved phased sequence, detailed work packages, connector strategy and open questions
docs/03_CURRENT_STATUS_AND_AUDIT.md             Stage 1 source-vs-doc evidence, matrices, defects
docs/discovery/requirements-register.md         what was asked, and its evidence status
docs/discovery/roadmap.md                       high-level gated sequence
docs/discovery/decision-log.md                 accepted decisions and open owner inputs
docs/discovery/risk-register.md                what can go wrong, and its mitigation
docs/CAPABILITY_TRUTH_MATRIX.md                 per-route/per-module maturity (generated)
```

---

## 2. The live documentation tree

### Product and plan — `docs/` + `docs/discovery/`

| File                                      | Owns                                                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `docs/README.md`                          | This map; the definition of "authoritative".                                                                                      |
| `docs/03_CURRENT_STATUS_AND_AUDIT.md`      | Stage 1 repository/doc reality audit, 18-module and 12-industry matrices, and defect register.                                      |
| `docs/VISION.md`                          | Product goal, the all-in-one module map, scope, non-goals, success.                                                               |
| `docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md` | Owner-approved phased sequence; detailed architecture, work packages, dependencies, evidence and open owner questions. |
| `docs/discovery/requirements-register.md` | FR/NFR/UX requirements with acceptance criteria and evidence status.                                                              |
| `docs/discovery/roadmap.md`               | High-level delivery gates; points to the master plan for the detailed sequence.                                                   |
| `docs/discovery/decision-log.md`          | DEC-001… every decision, owner, rationale, review trigger.                                                                        |
| `docs/discovery/risk-register.md`         | Risks with likelihood/impact/mitigation.                                                                                          |
| `docs/discovery/current-workflow.md`      | The owner's real monthly workflow and its open questions.                                                                         |
| `docs/discovery/d365-export-contract.md`  | Cited D365 GL export contract (expected shape; not verified support).                                                             |
| `docs/discovery/VISION_ALIGNMENT_RECHECK_2026_11_02.md` | Current code-level vision and connector audit; supersedes the 2026-10-24 recheck conclusions, not its historical record. |
| `docs/AGENT_CONTINUATION_PROMPT.md`       | Historical 2026-10-20 prompt snapshot; do not paste as current instructions. Current direction is in the master plan and working agreement. |

### Engineering handbook — `docs/agent/`

The handbook is the instruction set for agent sessions. It is deliberately short
per file and long on precision. See `docs/agent/00_INDEX.md` for the full table.

| File                                            | Owns                                                                                                           |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md` (repo root)                         | Entry point, non-negotiable rules, session protocol.                                                           |
| `docs/agent/00_INDEX.md`                        | Precedence, source-of-truth matrix, archive boundary.                                                          |
| `docs/agent/01_PROJECT_BRIEF.md`                | Product truth, current state, open decisions.                                                                  |
| `docs/agent/02_ARCHITECTURE.md`                 | Stack, entry points, layers, runtime gates, config.                                                            |
| `docs/agent/03_DOMAIN_RULES.md`                 | Money, double-entry, import, period and exception rules.                                                       |
| `docs/agent/04_ENGINEERING_RULES.md`            | Coding rules with the reason and the gate behind each.                                                         |
| `docs/agent/05_COMMANDS_AND_GATES.md`           | Every script, what it measures, CI constraints.                                                                |
| `docs/agent/06_TESTING.md`                      | Test conventions, global mocks, clock pinning, evidence.                                                       |
| `docs/agent/07_WORKFLOW_AND_DOD.md`             | Definition of done, commit format, handover.                                                                   |
| `docs/agent/08_DATA_MODEL.md`                   | Core types, persistence truth, schema homes.                                                                   |
| `docs/agent/09_KNOWN_GAPS.md`                   | What works / is unwired / is false / is decided.                                                               |
| `docs/agent/10_GLOSSARY.md`                     | Domain and repository vocabulary.                                                                              |
| `docs/agent/11_ANTI_FABRICATION_AND_QUALITY.md` | Metric-integrity and work-quality rules; the 2026-10-24 fake-marker incident, the self-check, and the doc map. |
| `docs/agent/WORKING_AGREEMENT.md`               | The owner's stated goal, the done bar, the live queue.                                                         |
| `docs/agent/HANDOVER_TEMPLATE.md`               | End-of-session report format.                                                                                  |

### Squad coordination — `docs/agent-squad/`

This folder preserves the historical multi-agent squad setup and communication
records. If a squad is explicitly active, the entry point is
`docs/agent-squad/AGENT_JOIN_GUIDE.md`; otherwise the archived prompts/rosters
are provenance only. Root `AGENTS.md` and the active Arena branch constraints
always take precedence.

| File                                                                                                          | Owns                                                   |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `docs/agent-squad/AGENT_JOIN_GUIDE.md`                                                                        | Entry point for every squad session.                   |
| `docs/agent-squad/agents-comms/README.md`                                                                     | The communication protocol (read first, write always). |
| `docs/agent-squad/agents-comms/ROSTER.md`                                                                     | Seat registry and remits.                              |
| `docs/agent-squad/agents-comms/STATUS_BOARD.md`                                                               | Who is working on what, now.                           |
| `docs/agent-squad/agents-comms/COMMS_LOG.md`                                                                  | Append-only inter-agent messages.                      |
| `docs/agent-squad/agents-comms/BLOCKERS.md`                                                                   | Open blockers and the decision each needs.             |
| `docs/agent-squad/agents-comms/CLAIMS.md`                                                                     | One-writer-per-file claims.                            |
| [SQUAD_STATE.md](agent-squad/SQUAD_STATE.md), [SQUAD_BACKLOG.md](agent-squad/SQUAD_BACKLOG.md), [SQUAD_AGREEMENT.md](agent-squad/SQUAD_AGREEMENT.md) | Current snapshot plus historical queue/coordination records; not higher authority than AGENTS.md or the master plan. |
| `docs/agent-squad/agent-patches/`                                                                             | CI/dependency patches for a human to apply.            |

### Reference (governed by scripts)

| File                                                                                                                    | Owns                                       | Enforced by            |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------- |
| `docs/CAPABILITY_TRUTH_MATRIX.md`                                                                                       | Per-route/module maturity (generated).     | `capability:inventory` |
| `docs/product/ROUTE_MAP.md`                                                                                             | Route inventory (generated).               | `routemap:check`       |
| `docs/architecture/PERSISTENCE_MAP.md`                                                                                  | Persisted store keys + classification.     | `persistence:map`      |
| `docs/audit/`                                                                                                           | The measured audit of this codebase.       | —                      |
| `docs/adr/`                                                                                                             | Architecture decision records.             | —                      |
| `docs/architecture/connectors.md`                                                                                       | Connector reality, shared import contract, provider evidence and rollout gates. | — |
| `docs/architecture/`                                                                                                    | Money, period-close, RBAC, data integrity. | —                      |
| `docs/security/`, `SECURITY.md`                                                                                         | Security policy and threat model.          | —                      |
| `docs/a11y/`, `docs/compliance/`, `docs/testing/`, `docs/design/`, `docs/engines/`, `docs/onboarding/`, `docs/release/` | Domain reference.                          | —                      |

### Archived — `docs/archive/`

| Path                           | What                                                                    |
| ------------------------------ | ----------------------------------------------------------------------- |
| `docs/archive/legacy-2026-10/` | Retired plans, handovers, audits and prior-iteration corpora (DEC-011). |

Archived documents are **records, not instructions**. The docs-link gate exempts
them by policy, exactly as it exempts `reports/`. Never cite an archived file as
the source of a rule.

---

## 3. Precedence when documents conflict

1. A script's measured output.
2. `AGENTS.md` and `docs/agent/`.
3. `docs/VISION.md`, `docs/discovery/` and `docs/audit/`.
4. ADRs in `docs/adr/`.
5. Everything else — informational only.
6. `docs/archive/` — provenance only; never an instruction.

If two live documents disagree, the one higher in this list wins and the other
is a bug: fix it in the same commit.

---

## 4. How documentation stays true

| Rule                                          | Gate                                          |
| --------------------------------------------- | --------------------------------------------- |
| Headline numbers match the tree               | `npm run docs:verify` (`verify-readme-stats`) |
| Persisted stores match the authority registry | `npm run persistence:map`                     |
| Route map matches `src/App.tsx`               | `npm run routemap:check`                      |
| Engine manifest is current                    | `npm run engines:verify`                      |
| Every live doc link resolves                  | `node scripts/docs-link-check.mjs`            |
| No unsupported/unsourced claims in docs       | `npm run fabrication:audit`                   |
| No fake markers / void signals in `src`       | `npm run placeholder:audit`                   |

A document that claims something no script can back is a defect. Add the script
or delete the claim.
