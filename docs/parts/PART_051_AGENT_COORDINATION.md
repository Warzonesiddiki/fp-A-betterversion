<!-- CANONICAL: true (Part 51 canonical; expected topic: Agent Coordination Protocol) -->

# Part 51 — Agent Coordination & Multi-Agent Build Protocol

**Status:** DRAFT v0.1
**Owner:** Persona 3 (Calculation Engine Specialist)
**Cross-refs:** Part 52 (Code Patterns), AGENTS.md, `.claude/rules/agents.md`

---

## Section 1 — Agent Roster

The FinPlan Pro build is staffed by 8 named agents, each owning a directory slice and reporting to the Lead (Persona 0).

| Agent                            | Persona | Owns directory                                               | Backup     | Message channel |
| -------------------------------- | ------- | ------------------------------------------------------------ | ---------- | --------------- |
| Athena                           | 1       | `docs/strategy/`, `docs/research/`                           | Hera       | `#athena`       |
| Apollo                           | 2       | `src/pages/`, `src/components/`, `src/hooks/`                | Stratos    | `#apollo`       |
| **Prometheus (this persona, 3)** | **3**   | `src/engines/`, `docs/parts/PART_04*`–`PART_06*`             | —          | `#prometheus`   |
| Hera                             | 4       | `src/store/`, `src/test/`                                    | Athena     | `#hera`         |
| Hephaestus                       | 5       | `src-tauri/`, `src/services/`, `server/`                     | Stratos    | `#hephaestus`   |
| Artemis                          | 6       | `src/components/ui/`, `src/config/`, `src/styles/`           | Apollo     | `#artemis`      |
| Stratos                          | 7       | `src/workers/`, `scripts/`, `vite.config.ts`                 | Hephaestus | `#stratos`      |
| Mnemosyne                        | 8       | `memory/`, `.openclaude/projects/`, `docs/parts/00-INDEX.md` | Hera       | `#mnemosyne`    |

---

## Section 2 — File Ownership Rules

| Directory                       | Exclusive owner            | Read-only for | Writable with approval |
| ------------------------------- | -------------------------- | ------------- | ---------------------- |
| `src/engines/`                  | Prometheus (3)             | All           | Hera, Apollo           |
| `src/store/`                    | Hera (4)                   | All           | Prometheus, Apollo     |
| `src/pages/`, `src/components/` | Apollo (2)                 | All           | Hera, Artemis          |
| `src/components/ui/`            | Artemis (6)                | All           | Apollo                 |
| `src/workers/`                  | Stratos (7)                | All           | Hephaestus             |
| `src-tauri/`                    | Hephaestus (5)             | All           | Stratos                |
| `docs/parts/`                   | Mnemosyne + per-part owner | All           | —                      |
| `src/test/`                     | Hera (4)                   | All           | All                    |
| `memory/`                       | Mnemosyne (8)              | All           | —                      |

### 2.1 Conflict protocol

When two agents need the same file:

1. Lower-numbered persona wins (Persona 3 > Persona 4 > ...).
2. If same persona, lower per-part index wins.
3. Escalate to Lead if neither rule resolves.

---

## Section 3 — Communication Protocol

### 3.1 Message envelope

```yaml
to: agent-name
from: agent-name
type: task|status|question|escalate|done
taskId: T-AP-017
partRef: PART_041
body: ...
attachments: [path1, path2]
```

### 3.2 Status codes

| Code               | Meaning                     | Required reply   |
| ------------------ | --------------------------- | ---------------- |
| `task:open`        | New work assigned           | `ack` within 1h  |
| `task:in-progress` | Working on it               | every 4h         |
| `task:blocked`     | Cannot proceed              | Lead resolves    |
| `task:done`        | Completed with deliverable  | Lead verifies    |
| `escalate`         | Conflict or decision needed | Lead within 2h   |
| `question`         | Clarification               | Source within 2h |

### 3.3 Worked example: 3-message chain

**Worked Example 3.1** — Prometheus creates an engine; needs a store, needs a UI:

```
# Step 1: Lead → Prometheus
to: prometheus
type: task
partRef: PART_058
body: Build Monte Carlo engine
deliverable: src/engines/MonteCarloEngine.ts + .test.ts

# Step 2: Prometheus → Hera
to: hera
type: question
body: Does scenarioStore expose getCorrelations(scenarioId)? Need for Cholesky.

# Step 3: Hera → Prometheus
to: prometheus
type: status
body: Added `getCorrelations(scenarioId)` to scenarioStore. Returns Matrix.

# Step 4: Prometheus → Apollo
to: apollo
type: task
body: Engine ready. Add a "Run Monte Carlo" button on ScenarioPage. See engine signature.

# Step 5: Apollo → Lead
to: lead
type: done
body: PART_058 implementation complete. Engine, store accessor, UI button. Tests pass.
```

---

## Section 4 — Conflict Resolution

### 4.1 Same file, same time

- File lock: agents acquire an exclusive lease (`<file>.lock` in `.claude/locks/`) before any `Write` or `Edit`.
- Lease TTL: 30 minutes. Renew with `lock.renew` to extend.
- Conflict detection: if file is locked by another agent, the `Edit` tool errors with `LEASE_HELD_BY <agent>`. The other agent must finish or release.

### 4.2 Cross-cutting change

When a change touches files owned by 2+ agents, the originator opens a thread:

```
# Cross-cutting example
to: prometheus, hera
type: task
partRef: PART_055
body: New intercompany module needs (a) IC matching engine [Prometheus],
      (b) icStore with [entity, counterparty, amount, period] [Hera],
      (c) IC reconciliation panel [Apollo].
deliverable: 3 PRs sequenced: engines → store → ui
```

Each agent commits only their slice. Lead merges in sequence after each passes CI.

### 4.3 Worked example: dependency-ordered commits

**Worked Example 4.1** — PART_055 intercompany:

```
# Commit 1: Hera adds icStore
[hera] feat(store): icStore with IC lines indexed by (entity, counterparty, period)

# Commit 2: Prometheus adds matching engine
[prometheus] feat(engines): intercompanyMatcher with deterministic match key

# Commit 3: Apollo adds UI
[apollo] feat(ui): ICReconciliation panel wired to icStore + matcher

# Each commit passes the 4-gate pre-push: tsc, lint, test, build.
```

---

## Section 5 — Task Handoff Specification

When an agent finishes, they emit a `done` message with:

- `deliverable`: list of file paths
- `tests`: list of test files (if any)
- `verification`: how to run (npm script name)
- `knownGaps`: optional list
- `nextOwner`: who should pick up next

Lead verifies deliverable exists, tests pass, and only then marks the task closed.

---

## Section 6 — Progress Reporting Format

### 6.1 Per-task status report (every 4h during active work)

```yaml
taskId: T-AP-058
status: in-progress
percentComplete: 65
lastCommit: 3aff6809
blockers: []
nextMilestone: Add correlation matrix handler
estimatedDone: 2026-06-15 17:00
```

### 6.2 Per-persona weekly roll-up

| Persona          | Tasks open | Tasks done this week | Test coverage | Notes                                 |
| ---------------- | ---------: | -------------------: | ------------: | ------------------------------------- |
| 1 Athena         |          2 |                    3 |           n/a | 3 strategy docs merged                |
| 2 Apollo         |          5 |                    4 |           78% | UI library v2 in review               |
| **3 Prometheus** |      **4** |                **2** |       **92%** | **All engines passing 80%+ coverage** |
| ...              |        ... |                  ... |           ... | ...                                   |

### 6.3 Worked example: end-of-day report

**Worked Example 6.1** — End of 2026-06-15 from Prometheus:

```
T-AP-058 Monte Carlo: 65% — engine + test done, Cholesky pending
T-AP-057 Forecasting: 40% — Holt-Winters complete, ARIMA in progress
T-AP-059 Sensitivity: 80% — engine + tests done, tornado chart done, awaiting UI
T-AP-054 Statement: 100% — closed
```

---

## Section 7 — Verification Protocol

### 7.1 Self-verify before `done`

Every agent must run the four pre-push gates before claiming done:

1. `npx tsc --noEmit` (type check)
2. `npm run lint` (eslint, max-warnings 0)
3. `npm run test -- <my-changed-files>` (focused tests)
4. `npm run build` (production build, no errors)

If any gate fails, fix and re-run. Never report `done` with a broken gate.

### 7.2 Peer-verify

For CRITICAL and HIGH severity parts (any engine that touches financial math), a second agent must read and approve:

- Reviewer reads the engine code.
- Reviewer runs the test suite independently.
- Reviewer signs off with `verified: <name> <date>` in a comment on the deliverable.

### 7.3 Lead verification

Lead verifies:

- All 4 gates green.
- Coverage ≥ 80% (90% for stores, 95% for utils per testing.md).
- Documentation part is written/updated.
- Cross-references in INDEX.md updated.

---

## Section 8 — Escalation Protocol

### 8.1 When to escalate

- Ambiguous spec: cannot determine the requirement.
- Conflicting requirements: two parts disagree.
- Unowned work: file/feature that fits no agent.
- Blocked > 24h: nothing has moved in a day.
- Test failure not solved in 3 attempts.

### 8.2 How to escalate

```yaml
to: lead
type: escalate
taskId: T-AP-058
summary: Cannot determine Cholesky input format
context: Engine spec says "correlation matrix" but spec example uses "covariance matrix" — these differ by sign on off-diagonals.
optionsConsidered: [A: assume correlations, B: assume covariances, C: accept both]
recommendation: A — matches the simulation literature
```

Lead replies with `decision: A` within 2h.

### 8.3 Worked example: Lead decision

**Worked Example 8.1** — Prometheus escalates about Monte Carlo input format:

```
Lead: decision — accept both; default to correlation if positive-semi-definite, else covariance. Add validation in engine entry.
Prometheus: acknowledged, implementing.
```

---

## Section 9 — Orchestration State Machine

The full project progresses through 5 phases. Each phase has a gate.

```
INIT → RESEARCH → DESIGN → BUILD → SHIP
                            ↑       ↓
                            └── FIX ←┘
```

| Phase    | Owner                | Gate criteria                                         |
| -------- | -------------------- | ----------------------------------------------------- |
| INIT     | Lead (Mnemosyne)     | Repo cloned, agents assigned, memory loaded           |
| RESEARCH | Athena + Persona 3   | All part specs written; INDEX.md complete             |
| DESIGN   | Apollo + Artemis     | Component contracts agreed, design tokens locked      |
| BUILD    | All                  | All 179 engines + 47 pages + 35 stores; 80%+ coverage |
| SHIP     | Hephaestus + Stratos | Tauri build green, bundle < 2MB gzip, PWA works       |

### 9.1 Worked example: phase progression

**Worked Example 9.1** — Project state on 2026-06-15:

```
RESEARCH: 100% (parts 1-200 drafted)
DESIGN:   75% (component contracts in progress)
BUILD:    40% (engines 71/179 done, pages 64/159 done, stores 18/35 done)
SHIP:      0% (not started)
```

---

## Section 10 — Audit Trail

Every state transition emits a record:

```typescript
type AgentEvent = {
  id: string;
  ts: Date;
  agent: string;
  eventType: 'task' | 'commit' | 'escalate' | 'verify' | 'block' | 'done';
  taskId: string;
  payload: object;
};
```

Persisted in `agentEvents` object store; queryable by taskId, agent, or time window.

---

## Section 11 — Engine and Component Signatures

```typescript
// src/services/orchestration/agentBus.ts
export type AgentMessage = {
  to: string;
  from: string;
  type: 'task' | 'status' | 'question' | 'escalate' | 'done';
  taskId: string;
  body: string;
};

export function send(msg: AgentMessage): void;
export function subscribe(agent: string, handler: (msg: AgentMessage) => void): void;
export function escalate(taskId: string, summary: string): void;
```

---

## Section 12 — Cross-References

- **AGENTS.md**: canonical agent assignments and commands.
- **Part 52** (Code Patterns): the engine and store signatures that all agents follow.
- **Part 53** (IndexedDB): object store ownership maps to agent ownership.
