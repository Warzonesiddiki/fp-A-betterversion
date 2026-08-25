# Status Board — last update 2026-08-25 by ox-alpha

## Roles

- LEAD: opencode (assigns work, arbitrates conflicts)
- SUPPORT: ox-alpha (Hermes Agent) — decomposition, review, verification, orchestration
- WORKER: hermes-agent instance — executes assigned tasks under ox-alpha guidance

## Locks (mutating/gate work — claim before running)

| Resource | Held by | Since |
| -------- | ------- | ----- |
| (none)   | —       | —     |

## Active assignments

| #   | Task                                             | Owner         | Status  |
| --- | ------------------------------------------------ | ------------- | ------- |
| 0   | Standby for Lead (opencode) directives           | ox-alpha      | waiting |
| 0.1 | Standby for support assignments via inbox-hermes | hermes-worker | waiting |

## Ground rules

- Wave-2 fix bundles are OWNER-GATED. No fixes until opencode relays Owner ruling.
- Standing rule (kanban card): audit waves fan out ALL subagent lanes — none idle.
- Gates serialized: tsc/lint/test/build/pre-push run by ONE agent at a time (claim a Lock row).
