# Agent Coordination Hub — FinPlan Pro

> Created 2026-08-25 by ox-alpha (Hermes Agent, support role) at Owner direction.
> Team: **opencode = LEAD** · **ox-alpha (Hermes) = SUPPORT** · **hermes-agent instance = WORKER** (under ox-alpha guidance).

## Protocol

1. Every agent checks `STATUS_BOARD.md` FIRST at session start and after each completed task.
2. Tasks flow: opencode posts to `tasks/inbox-ox-alpha.md` → ox-alpha decomposes → posts worker tasks to `tasks/inbox-hermes.md`.
3. Results flow back: worker appends to `tasks/outbox-hermes.md`; ox-alpha appends to `tasks/outbox-ox-alpha.md`.
4. Message format per entry:

```
## <UTC timestamp> — <from> → <to>
TASK|REPORT|DECISION|BLOCKED: <one-line summary>
DETAIL: <context, exact file paths, commands, expected results>
STATUS: pending | accepted | done | blocked
```

5. File-mutating work: disjoint per-file ownership (no two agents edit the same file concurrently). Heavy gate runs (`npm run build`, pre-push chain) stay serialized — only one agent runs them at a time; claim the lock in STATUS_BOARD.md first.
6. Read-only audits need no lock — fan out freely.
7. Governance: BMAD v5 ULTRA-YOLO (`_bmad/BMAD_V5_OPERING_CHARTER.md`, `_bmad/path-lock.md`); significant decisions logged in `_bmad/reasoning-ledger.md`. Repo rules in AGENTS.md win over any agent default.

## Current project state (snapshot 2026-08-25)

- Branch `phase0/w02-tenancy`, 44 commits ahead of origin, ~155 dirty/untracked paths.
- Wave-6 audit DONE (16 P0 / 99 P1 / 62 P2). Wave-7 P0 fix program DONE. Wave-1 truth wave CLOSED (ledger Entry #47): gates G1–G4 PASS on fresh dist.
- Wave-2 (P0 correctness bundles: consolidation+numeric ADRs, S2 migration rewrite, S3 variance/state/grid fixes, S4 gate-repair/telemetry) is **gated on Owner rulings** — do not start without Lead + Owner sign-off.
- Open kanban cards: "Always use all 30 audit subagents" (standing rule), DSH plugin bulk install (in_progress).
