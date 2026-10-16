---
id: MEMORY/README.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: high
---

# MEMORY — the secondary brain

## What this is

A verified, committed, cross-agent memory for `Warzonesiddiki/fp-A-betterversion` (OmniPlan /
`finplan-pro`). Any AI (any model, any session, no chat history) should become useful after one
`INDEX.md` read plus two shard reads.

## What this is NOT

- Not a second README of wishes. Product intent lives in `PRODUCT/INTENT.md`; only shipped,
  file-proven reality lives in `TRUTH.md`.
- Not a code dump. Pointers to paths and symbols only.
- Not a replacement for `.agent/BLUEPRINT.md` (the locked engineering contract),
  `.agent/PROJECT_JOURNAL.md` (session narrative + ADRs) or git history. MEMORY indexes them.
- Not a place for secrets. Env **names** only.

## Precedence

```
filesystem / tests  >  MEMORY  >  any model's recollection
```

If MEMORY disagrees with disk, disk wins and you repair MEMORY in the same turn.

## Layout

| Path           | Purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| `INDEX.md`     | Always-first read: boot ritual, pointers, danger list           |
| `PROTOCOL.md`  | Binding operating rules for every agent                         |
| `STATE.json`   | Machine-readable resume snapshot                                |
| `TRUTH.md`     | Verified facts only (`[FACT] [POINTER] [MEASURE] [DECISION]`)   |
| `ASSUMPTIONS.md` / `HYPOTHESES.md` / `ANTI.md` | Belief ledger + hallucination vaccine |
| `INVARIANTS.md`| Must-hold properties, mostly financial                          |
| `MAP/`         | Verified tree, modules, owners, dependencies                    |
| `SCHEMA/`      | Data model, API, types, env names — as they EXIST               |
| `PRODUCT/`     | Intent, users, roadmap, gaps                                    |
| `QUALITY/`     | Commands, what tests actually prove, measured numbers           |
| `TASKS/`       | NOW / QUEUE / BLOCKED / DONE                                    |
| `SESSIONS/`    | Per-session append-only notes                                   |
| `DECISIONS/`   | ADR template + MEMORY-scoped ADRs                               |
| `PACKS/`       | Industry vertical packs                                         |
| `_system/`     | Integrity checklist + `check.mjs`                               |
