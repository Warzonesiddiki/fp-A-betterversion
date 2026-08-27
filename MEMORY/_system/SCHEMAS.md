---
id: MEMORY/_system/SCHEMAS.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-017
confidence: high
---

# _system/SCHEMAS — field dictionary for STATE.json

| Field | Type | Meaning |
| --- | --- | --- |
| `memory_version` | string | Semver of this brain's format |
| `project` | string | Repo/product name |
| `updated_at` | ISO date | Last write-through |
| `genesis_phase` | string\|null | Host project phase (e.g. `Phase 0 / W0.1.1`) |
| `now` | `{task_id, summary}` | Must match `MEMORY/TASKS/NOW.md` |
| `health` | `{shi, uvi, dei, notes}` | `null` unless actually measured |
| `capabilities` | object | Tooling probed this session |
| `stack` | object | languages / pkg manager / test / dev / db |
| `modules` | object | module → `shipped\|partial\|flagged\|planned` |
| `invariants_green` / `invariants_red` | string[] | INV ids with/without enforcement |
| `blocked` | array | mirrors `MEMORY/TASKS/BLOCKED.md` |
| `last_session` | string | id of the most recent `SESSIONS/*` file |
| `integrity` | `{last_run, ok, errors[]}` | result of `_system/check.mjs` |

Markdown shard front-matter: `id`, `status` (`active|stale|stub`), `last_verified` (YYYY-MM-DD),
`verified_by`, `confidence` (`high|medium|low`).
