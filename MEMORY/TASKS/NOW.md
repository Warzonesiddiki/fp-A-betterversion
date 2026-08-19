---
id: MEMORY/TASKS/NOW.md
status: active
last_verified: 2026-08-19
verified_by: arena-agent/session-024
confidence: high
---

# TASKS/NOW — the single current critical path

**T-025 · Next wave pair: one money-AST module + one fabrication file, same session.**

State: PR #65 is MERGED (2026-08-19 01:03 UTC; `main` fully green — test-unit included).
Session 024 landed, on branch `arena/01a0178d-fp-a-betterversion` (forked from the merged
`082e70c`): money-AST 421 → **404** and fabrication 32 → **19**, per-file diff confined,
teeth verified (37 assertions fail on revert).

**FIRST — BLOCKED on GitHub auth (token expired mid-session 024, same as s023):** five local
commits on `arena/01a0178d-fp-a-betterversion` are committed and UNPUSHED (fix + docs + readme
adoption 85→87). Once GitHub is reconnected in Arena:
`git push origin arena/01a0178d-fp-a-betterversion` (via start_process; pre-push 3–5 min), then
open the PR from that branch and merge only when `test-unit` passes. Full suite was green
before commit: 1252 files / 14,301 passed / 1 skipped / 0 failed.

Then T-025, in order:

1. `node scripts/money-ast-detector.mjs --list` — take the next ranked module.
   **Skip `src/services/mockData/index.ts` (13) — fixture factory.** The grouping idiom
   `existing.debit += e.debit` recurs across ≥6 pages; a class-wide fix moves several files.
2. Fabrication worklist (worst first): `src/pages/energy/EnergyRiskPage.tsx` (3),
   `src/pages/insurance/InsuranceDashboardPage.tsx` (3), `src/pages/reports/BoardPackPage.tsx`
   (3), then the twos (Emissions/EnergyDashboards, ClaimsAnalytics, FacilityManagement) and the
   ones. Check BOTH `src/pages/sector/` and `src/pages/sectors/` twins first, and grep each page
   for its store before rewriting.
3. Open the PR from `arena/01a0178d-fp-a-betterversion`; run the FULL suite before pushing
   (standing rule from s023).

Ratchets: money **404** / 160 modules / 81.86%; fabrication **19** / 9 files. Both baselines
updated in session 024. CHB-008 acknowledges gate 10's fresh-branch squash flags.

**Standing rules (do not drop):** run the FULL suite before opening a PR; after any page
rewrite also run `src/pages/smoke*.test.tsx`, `src/pages/__tests__/**` for that area, and
`src/theme/buttonContrast.contract.test.ts`. Run the detector on every file you WRITE. Verify
teeth via /tmp revert. `npx prettier --write` before `git add` on generated JSON/MD. Push via
`start_process` (pre-push exceeds the bash timeout).
