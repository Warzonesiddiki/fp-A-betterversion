# Team Comms Protocol — ox-alpha (Lead) ⇄ hermes-agent (Deputy Lead)

> **Established:** 2026-08-25 by Owner directive. Recorded in `_bmad/reasoning-ledger.md` Entry #48.
> **Chain of command:** Owner → ox-alpha (Lead) → hermes-agent (Deputy). Hermes executes under
> Lead guidance; scope changes and law changes go through the Lead, never around it.

## 1. Channels

| Channel                             | Path / tool                                                                                             | Use                                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Primary — file inbox**            | `agents/team-comms/inbox-hermes.md` / `inbox-ox-alpha.md`                                               | All dispatches, reports, questions, handoffs. Works across any agent platform.                                                                         |
| **Shared memory graph**             | MCP `memory` server → repo-local `MEMORY/mcp-memory.json`                                               | Durable cross-session state (roster pointer, current wave, verdict queue). Both agents load the same `.mcp.json`.                                      |
| **OmniRoute MCP**                   | `.mcp.json` → `omniroute` server (`http://localhost:20128/api/mcp/sse`, Bearer `{env:OMNIROUTE_TOKEN}`) | 37 OmniRoute management tools (a2a tasks, context handoffs, memories). Loopback-only by server policy. Requires opencode restart after env var change. |
| **Task board**                      | `KANBAN.json`                                                                                           | Mission cards with lifecycle `todo → in_progress → done`, each closed with an evidence summary.                                                        |
| **Supplementary — session-message** | `$AIONUI_HELPER_BIN session send-message`                                                               | Only when both agents run as opencode/AionUi conversations AND the user wires the conversation IDs. File inbox stays authoritative either way.         |
| **Permanent record**                | `_bmad/reasoning-ledger.md` (Lead appends), personal memory logs in `agents/ultimate-team/personas/`    | Decisions, never chat.                                                                                                                                 |

## 2. Message format (append to the BOTTOM of the target inbox; never reorder or delete)

```
---
## [MSG-###] 2026-08-25T12:00Z | from: <sender> | to: <recipient> | type: dispatch|report|query|ack|alert | status: UNREAD
<one-line subject>
<body: task, acceptance criteria, required evidence>
---
```

Rules:

1. **Append-only.** Never edit or delete another agent's message.
2. Recipient marks `status: READ` upon intake, then replies with a `type: ack` message referencing the MSG id.
3. One thread per MSG id (`RE:[MSG-###]` in the subject line).
4. Every empirical claim carries `file → line` witnesses (D-002/D-009). No unverified claims — honest labeling (D-007).
5. `type: alert` = blocked or ambiguous ⇒ stop work, escalate, wait. Never guess past ambiguity (charter A1).

## 3. Dispatch contract (Lead → Hermes)

Every dispatch states: mission ID, objective, allowed file paths, forbidden actions,
acceptance criteria, verification commands, and report format. Default posture:
**zero code changes unless explicitly authorized by the dispatch.**

## 4. Shared-memory entity conventions

- `FinPlan-Team-State` — current lead, deputy, active wave, next gated action (update at every wave boundary).
- `FinPlan-Hermes` — deputy role, current mission, last check-in timestamp (Hermes updates on every ack).
- Entity observations are one-liners with ISO dates. Stale info gets replaced, not accumulated.

## 6. Git law (ratified 2026-08-25 after incident 2d1846b9)

1. **Only the Lead commits.** Hermes and all squad members NEVER run `git add`/`git commit`/
   `git reset`. Working-tree changes stay unstaged; the Lead batches and commits them.
2. **No automation may commit** (progress trackers, watchers). If a tool auto-commits,
   it is disabled or scoped to files it alone owns.
3. Rationale: on a shared checkout, concurrent `git add -A` steals the other agent's
   staged index (incident: Lead's checkpoint was absorbed into tracker-labeled `2d1846b9`,
   328 files, meaningless message — content intact, attribution broken).
4. Exception path: urgent durability risk ⇒ post `type:alert`, wait for Lead ack.

## 7. Session start checklist (both agents)

1. Read own inbox; mark messages READ; ack pending dispatches.
2. Read `agents/team-comms/inbox-*.md` tail + latest ledger entry for drift.
3. Check `git status --short` before touching anything — the tree may carry intentional uncommitted work.
4. Confirm shared-memory `FinPlan-Team-State` matches reality; correct it if stale.
