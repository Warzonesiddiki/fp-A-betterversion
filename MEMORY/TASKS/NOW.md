---
id: MEMORY/TASKS/NOW.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-023
confidence: high
---

# TASKS/NOW — the single current critical path

**T-024 · Land PR #65. BLOCKED on GitHub authentication.**

State: PR #65 (`arena/01a01215-fp-a-betterversion` → `main`) is open and NOT merged.
A commit repairing six full-suite failures is **committed locally and not pushed** — the token
expired mid-session (`gh auth status` → "The github.com token in GH_TOKEN is no longer valid").

Do this in order once GitHub is reconnected:

1. `git push origin arena/01a01215-fp-a-betterversion` (via a background process; pre-push takes
   3–5 min).
2. Wait for `test-unit` to re-run on PR #65. It has been red on `main` since PR #64 — the repair
   commit is what makes it green. Confirm with `gh pr checks 65`.
3. Merge #65 only when `test-unit` passes. Do NOT merge red.
4. Then resume the wave: **T-023** — money-AST `src/pages/analytics/BenchmarkingPage.tsx` (8),
   then `src/engines/DriverCascadeEngine.ts` (7); fabrication
   `src/pages/sectors/TelecomDashboardPage.tsx` (4), then the construction pages (3 each).

Ratchets: money 421 / 163 modules / 81.44%; fabrication 32 / 13 files. Both hold locally.

**New standing rule (session 023):** run the FULL suite before opening a PR. Pre-push runs an
839-test P0 shard; it did not cover the smoke and contract files, and five sessions of empty-state
work landed with the suite red. After any page rewrite also run `src/pages/smoke*.test.tsx`,
`src/pages/__tests__/**` for that area, and `src/theme/buttonContrast.contract.test.ts`.
