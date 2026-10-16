---
id: MEMORY/TASKS/NOW.md
status: active
last_verified: 2026-08-20
verified_by: arena-agent/session-031
confidence: high
---

# TASKS/NOW — the single current critical path

**T-031 · W0.8.1–0.8.5 landed. Next is W0.2 tenancy.**

Money-AST 99.66% (25 ops, mockData only). Fabrication 0. Persistence map 41 stores,
money-safe `$d:` serialization, schema equality gate, DurabilityBanner.

Do this in order:

1. **W0.2 tenancy.** Add `tenant_id` + `environment_id` to governed tables
   (M001/M002). Per-table cross-tenant leak test. Do not skip this for W0.8.6.
2. **W0.8.6** glStore server-authoritative spike (after tenancy).
3. **W0.3** runtime three-statement gate on server writes.
4. Push this branch and open the PR against `main`. Merge ONLY when `test-unit` passes.

**Standing rules (do not drop):** run the FULL suite before opening a PR; after any page
rewrite also run smoke + contrast contracts. Run both detectors on every file you WRITE.
`npx prettier --write` before `git add` on generated JSON/MD. Push via `start_process`.
