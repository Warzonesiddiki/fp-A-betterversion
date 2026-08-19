---
id: MEMORY/TASKS/NOW.md
status: active
last_verified: 2026-08-19
verified_by: arena-agent/session-024
confidence: high
---

# TASKS/NOW — the single current critical path

**T-026 · PR #66 in flight; next wave pair after it merges.**

State: session-024 commits pushed and **PR #66 opened**
(`arena/01a0178d-fp-a-betterversion` → `main`); session-025 wave pair pushed onto the same
PR: money-AST 404 → **397** (RevRecEngine 7→0) and fabrication 19 → **16** (EnergyRiskPage
3→0), per-file diffs confined, teeth verified (10 assertions fail on revert). GitHub auth
restored mid-session (the 403 was only the missing `user` scope).

Do this in order:

1. Watch PR #66: `gh pr checks 66` — merge ONLY when `test-unit` passes. Never merge red.
2. `node scripts/money-ast-detector.mjs --list` — take the next ranked module.
   **Skip `src/services/mockData/*` — fixture factories.** BalanceSheetPage (7) is K18-core.
   The grouping idiom `existing.debit += e.debit` recurs across ≥6 pages; a class-wide fix
   moves several files.
3. Fabrication worklist (worst first): `src/pages/insurance/InsuranceDashboardPage.tsx` (3),
   `src/pages/reports/BoardPackPage.tsx` (3), then the twos (Emissions/EnergyDashboards,
   ClaimsAnalytics, FacilityManagement) and the ones. Check BOTH `src/pages/sector/` and
   `src/pages/sectors/` twins first, grep each page for its store, and read the store's
   persist seeds before rewriting.
4. Push onto the same branch (PR #66 until it merges; then a fresh PR per wave); run the FULL
   suite before pushing (standing rule from s023).

Ratchets: money **397** / 159 modules / 81.97%; fabrication **16** / 8 files. Both baselines
updated in session 025. CHB-008 acknowledges gate 10's fresh-branch squash flags.

**Standing rules (do not drop):** run the FULL suite before opening a PR; after any page
rewrite also run `src/pages/smoke*.test.tsx`, `src/pages/__tests__/**` for that area, and
`src/theme/buttonContrast.contract.test.ts`. Run the detector on every file you WRITE. Verify
teeth via /tmp revert. `npx prettier --write` before `git add` on generated JSON/MD. Push via
`start_process` (pre-push exceeds the bash timeout).
