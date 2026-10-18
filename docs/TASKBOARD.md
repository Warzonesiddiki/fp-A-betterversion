# Taskboard — FinPlan Pro (live; update in the same commit as the work)

Rule (ZERO COMPROMISES): a task moves to DONE only with evidence (test file,
script output, or gate line) named in its row. Nothing is deleted from this
board — superseded rows are struck through with the reason. Statuses:
`DONE` · `NEXT` (unblocked, do in order) · `QUEUED` · `OWNER` (blocked on
owner input/decision) · `EVIDENCE-OWED` (claim exists, proof missing).

Last updated: 2026-10-19 (handover session; branch tip `a8462e5` + handover
commits, merged to `main` via PR — see `docs/HANDOVER_NEXT_SESSION.md`).

---

## NEXT (unblocked, in order)

| #   | Task                                                                                                                                                                   | Evidence required to close                                                                | Anchor                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------- |
| N1  | Re-run full frontend suite (`npm run test:sharded`) on merged `main`; record file/test tallies here; fix or ticket every failure with root cause                       | Tally line in this board + green re-run                                                   | Plan §19 definition of complete                   |
| N2  | Audit-chain consolidation: three mechanisms (`auditTrailStore`, `CellAuditTrailEngine`, `eventLedger`) → one canonical chain; others retired by DEC or adapter-proven  | Reachability map + migration/compat test; coverage row 45 updated                         | Coverage row 45; Phase 12 tail                    |
| N3  | RBAC completeness proof (W6-P0-14 class): enumerate every store mutator, assert each is permission-guarded or listed as intentionally unguarded with reason            | Completeness test green; unguarded list in test or doc                                    | Coverage row 26                                   |
| N4  | E1 sector operational adapters (sub-ledgers & operations): pick next sector adapter from coverage annex order; oracle-first, EXPERIMENTAL label until certified        | Adapter + oracle tests; sectorVerification registry updated                               | Plan E1; `src/pages/sector/sectorVerification.ts` |
| N5  | Coverage-annex claim checker (E6 hygiene): script in the style of `check-readme-claims.mjs` that parses `MASTER_CHECKLIST_COVERAGE.md` rows and verifies pinned claims | Script + failing-first test on a deliberately wrong row; wired into docs gate or pre-push | Plan §18.1 honesty note                           |
| N6  | E5 sector certification depth: graduate sectors from EXPERIMENTAL only with oracle-derived KPIs + evidence pack per sector                                             | Per-sector evidence; `engineLabels.ts` / verification registry updated                    | Coverage rows 11/51 area; DEC-019 graduation rule |
| N7  | Bundle structural reduction (E6): collapse the 183 lazy engine chunks / cut top chunks (`sector-pages` 343 KB raw, `index` 257 KB) so G3 can ratchet back down         | `node scripts/bundle-check.js` measured drop; DEC if the limit changes                    | DEC-024 follow-up                                 |
| N8  | Money-adoption ratchet: raise 29.83 % module-by-module along financial paths (no big-bang rewrite of `GLEntry` without a DEC)                                          | `node scripts/money-adoption.mjs` before/after in commit message                          | README money row; `src/utils/money.ts`            |

## QUEUED (scoped, start after NEXT or when a slice frees up)

| #   | Task                                                                                           | Notes                                                                                      |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Q1  | E2 connectors & ecosystem: wire one connector (owner's D365/Dataverse first) to a real page    | Connector classes exist unwired; rule 8 — spine already proven, so this is now legal scope |
| Q2  | E3 advanced analytics/statistics: statistical forecasting depth behind the verified-facts gate | DEC-022: local only; anything generative must pass `verifyNarrative`                       |
| Q3  | E4 jurisdictions & compliance packs                                                            | Needs jurisdiction tiering input (see OWNER O5) before build                               |
| Q4  | Phase 12 remainder: comments/approvals if team use is confirmed                                | DEC-004 review trigger                                                                     |
| Q5  | `GLEntry` amounts JS `number` → money type migration                                           | Needs its own DEC + staged plan; adoption ratchet N8 is the on-ramp                        |
| Q6  | Server (`server/`) fate: frontend calls nothing today; integrate or retire deliberately        | Owner/architecture decision; README states the measured truth meanwhile                    |

## OWNER (blocked — do not work around, do not silently drop)

| #   | Needed from owner                                                                 | Blocks                                                  | Since      |
| --- | --------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------- |
| O1  | One real anonymised D365 export sample per shape (F&O GL, journal entity, BC G/L) | "Verified" label per shape (Phase 1V); DEC-015          | 2026-10-18 |
| O2  | Roll semantics: replace vs blend, which months roll, approval interplay           | Wiring `RollingForecastEngine` (currently EXPERIMENTAL) | DEC-019    |
| O3  | Encryption key-escrow/recovery decision                                           | Any "your data is safe" claim; backup/restore story     | W6-P0-05   |
| O4  | SOX/audit authority decision                                                      | SOX engine graduating from not-evaluated-by-design      | 2026-10-17 |
| O5  | Sector + jurisdiction tiering (which are supported scope)                         | E4 build; E5 certification order                        | §18.1      |
| O6  | External AI provider decision                                                     | Any non-local AI (DEC-022 holds until then)             | DEC-022    |
| O7  | Native (Tauri) verification on a real desktop build                               | Offline-auth/desktop claims (P0-3 class)                | Audit §8   |
| O8  | Confirm `main` merge of this handover PR + keep CI green on `main`                | Release posture; CI was red on `main` at base           | 2026-10-19 |

## EVIDENCE-OWED (claims that must not be repeated until proven)

| Claim                                   | State                                                                 |
| --------------------------------------- | --------------------------------------------------------------------- |
| Full test suite green on current `main` | Last full-tally evidence predates Phases 11–14 merges; N1 closes this |
| "Your data is safe" (backup/escrow)     | Blocked on O3                                                         |
| Any D365 shape "verified"               | Blocked on O1; today: mapping-driven, synthetic fixtures only         |
| Coverage-annex row statuses             | Hand-verified per edit (cite command in commit); N5 mechanises this   |
| Sector depth beyond EXPERIMENTAL        | `sectorVerification.ts` classifies; certification is N6               |

## DONE (this programme, evidence anchors)

| Item                                           | Evidence                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Phases 0–10 code-side (spine J1–J4 … Phase 10) | Commits through `1d793ed`; plan §11 preamble; coverage annex rows                                      |
| RBAC guards on financial-truth stores          | `848f902`; negative authorization tests; `src/test/rbacFixtures.ts`                                    |
| Verified-facts AI gate (AI-001)                | `c215110`; corpus 6/6; wired in `NLQChat.tsx`; DEC-022                                                 |
| Formula census + GL→cube cent tie-out          | `75f8eda`, `80dbbc8`; CubeEngine measure bug found by tie-out and fixed                                |
| Acquisition accounting wired (ASC 805/350)     | `cc640b8`; oracle deal reproduced from typed inputs (goodwill 600,000)                                 |
| Audit reconstruction (R-009)                   | `src/services/audit/reconstructState.test.ts` 7/7; panel test 4/4; audit cluster 11 files / 81 tests   |
| AnomalyExplainer retired (DEC-023)             | Deletion commit `30909bf`; manifest regenerated (183 engines)                                          |
| Bundle re-baseline (DEC-024)                   | `scripts/bundle-check.js` measured 2061.71 KB vs 2080 limit; gate passes with 1 early warning          |
| README claims re-measured                      | `node scripts/check-readme-claims.mjs` — all 11 checks pass                                            |
| Husky gates 1–10 all passing on push           | Push output `✓ pre-push gates passed` from `a15a2d0` onward                                            |
| Handover prompt + this taskboard               | `docs/HANDOVER_NEXT_SESSION.md`, this file; merged via PR (number recorded in handover §2 after merge) |

## Gate cheat-sheet (run BEFORE pushing)

```bash
npx tsc --noEmit
npx eslint src --max-warnings 0
node scripts/bundle-check.js
node scripts/check-readme-claims.mjs
node scripts/money-ast-detector.mjs
npm run docs:verify && npm run engines:verify
node scripts/verify-readme-stats.mjs   # measured numbers for any doc claim
```
