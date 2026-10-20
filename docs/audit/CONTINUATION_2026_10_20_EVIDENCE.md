# Continuation evidence — 2026-10-20

Session branch: `arena/efe658d1-fp-a-betterversion`; starting commit `9f6d6a02`.
This is engineering evidence, not supported-scope or programme certification.
The [taskboard](../TASKBOARD.md) owns assignments; the
[handover](../HANDOVER_NEXT_SESSION.md) owns the next slice.

## Baseline before edits

Node: `v22.22.3`. `git status --short` was empty.
`npm ci --ignore-scripts` completed. `npm audit --omit=dev --json` reported zero
production advisories. A separate `npm audit --json` reports 5 affected
packages (2 moderate / 3 high): `@vitest/mocker`, `vitest`, `js-yaml`,
`source-map-js`, and `undici`; fixes are reported available. These
development-inclusive findings remain open, not risk-accepted or remediated.
The production-only audit is not a claim that the entire dependency tree is clean.

Commands run: `npm run tsc`, `lint`, `format:check`, `docs:verify`,
`engines:verify`, `money:ast`, `money:adoption`, `determinism:ratchet`,
`palette:ratchet`, `fabrication:audit`, `docs:links`, `repo:hygiene`.
All passed; the first lint tool call lost its exit status, so its success was
confirmed by the completed `npm run build`, which runs lint before Vite.

| Measurement         | Result                                                                      | Command                                             |
| ------------------- | --------------------------------------------------------------------------- | --------------------------------------------------- |
| Inventory           | 180 engines: 98 shipped / 82 orphan; 48 stores; 43 persisted                | `npm run docs:verify`                               |
| Money AST           | 978/978 money-handling modules safe; zero unsafe operations                 | `npm run money:ast`                                 |
| Adoption            | 305/1,017 (29.99%); zero raw sites                                          | `npm run money:adoption`                            |
| Determinism ratchet | 344 sites / 79 files; holds, not zero                                       | `npm run determinism:ratchet`                       |
| Palette ratchet     | 5,502 sites / 370 files; holds, not zero                                    | `npm run palette:ratchet`                           |
| Fabrication         | zero findings                                                               | `npm run fabrication:audit`                         |
| Links               | zero broken links/citations                                                 | `npm run docs:links`                                |
| Hygiene             | 3,610 tracked files; zero tracked ignored files at baseline                 | `npm run repo:hygiene`                              |
| Full suite          | 8/8 shards; 1,394 files; 16,097 passed + 1 skipped; 1,204 seconds           | `npm run test:sharded`                              |
| Bundle              | 6,812.51 KB raw / 2,059.69 KB gzip; unchanged 2,080 KB ceiling; one warning | `npm run build` then `node scripts/bundle-check.js` |

Baseline shard passed tallies: 1,901 / 1,558 / 2,067 / 2,307 / 2,033 / 2,054 /
2,231 / 1,946. The existing skipped test is not new. The adoption floor of
29.16% is distinct from measured adoption; no baseline JSON was edited.

O8: `gh pr view 78 --json number,state,mergedAt,mergeCommit` confirmed MERGED
at `b2cff437293a37366fbc6187ca4859c71194b6bd`.
`gh run list --branch main --limit 5` returned
`HTTP 403: Resource not accessible by integration`.
CI is **UNVERIFIABLE**, neither red nor green.

## Closed bounded slices

- `aa32e18e`: baseline reconciliation and owner packet reissue. Corrected stale
  engine/store/current-capability wording; preserved DEC-034/035 rather than
  re-asking accepted decisions. Exact full baseline is above.
- `6b9c74d6` / DEC-037: source-gap gate reads the supplemental scope contract,
  retains the legacy annex header, reports all source-owed sections and refuses
  silent closing statuses. Missing/invalid contract fails closed; source marked
  reviewed requires coverage rows. Failing-first checker tests: 7 failed /
  1 passed; final `vitest run src/__tests__/coverageAnnexClaims.test.ts`:
  **9/9 passed**. Current output: **107 mapped / 93 unassessed (108–200)**.
  No requirements titles were invented. Source recovery remains blocked.
- `0f750d50` / DEC-038: audit reversion records the authenticated per-call
  reviewer, not the historical author. Historical records/hashes are preserved;
  no namespace/schema migration or ledger rollback. Failing-first attribution
  suite: 2 failed / 4 passed. Final combined trust slice: **8 files / 204 tests**;
  exact command in the [audit map](../architecture/AUDIT_CHAIN_REACHABILITY.md).
  Signed-out, Viewer, withheld `audit:delete`, and stale-session denials preserve
  both entries and chain head. The census still pins \*\*409 actions = 302 guarded
  - 107 exceptions\*\*, not exhaustive negative evidence for all actions.

Each slice passed TypeScript, relevant ESLint, docs verification, strict links
and diff checks. Final full-check and pre-push outcomes are recorded separately
below; baseline green is not substituted for changed-tree evidence.

## Phase 0.5 — selected Wave-6 witnesses re-run

```bash
./node_modules/.bin/vitest run src/workers/batch-calc.worker.test.ts src/workers/safeExpression.test.ts src/plugins/PluginSandbox.test.ts src/plugins/PluginLoader.test.ts src/plugins/PluginMarketplace.test.ts src/utils/masterStorage.test.ts src/utils/tauriSqlStorage.test.ts src/utils/sqlJsStorage.test.ts src/utils/masterStorage.escrow.test.ts src/pages/dashboard/DashboardPage.sectorKpis.test.tsx src/components/ui/ConfirmDialog.test.tsx src/utils/parseImportDate.test.ts src/utils/parseFinancialAmount.test.ts src/store/budgetStore.test.ts src/components/reports/ReportGrid.test.tsx src/store/glStore.apiOrigin.test.ts src/store/dataStore.test.ts src/templates/cascadeFormulaContract.test.ts src/engines/templates/cascadeSentinel.test.ts src/utils/financial.test.ts src/engines/formula-functions/financial.oracle.test.ts
```

**21 files / 472 tests passed**, 15.00 seconds. These are bounded unit/component
witnesses, not a fresh all-domain forensic audit or native certification.

| Historical flaw                 | Witnesses / current boundary                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| W6-P0-01 silent-zero worker     | batch-calc worker and safe expression tests pass; no new native proof                                             |
| W6-P0-02/03 plugins             | sandbox/loader/marketplace unit tests pass; do not infer runtime isolation or supported marketplace scope         |
| W6-P0-04 storage errors         | masterStorage/raw-backend propagation tests pass; no native restart/durability claim                              |
| W6-P0-05 key custody            | escrow helper tests pass; O3 and real restore certification remain blocked                                        |
| W6-P0-06 sector KPI units       | dashboard sector-KPI tests pass; O5 certification remains blocked                                                 |
| W6-P0-07 native menu            | not re-verified on native hardware; O7                                                                            |
| W6-P0-08 confirmations          | ConfirmDialog component tests pass; no native keyboard journey proof                                              |
| W6-P0-09/10 date/amount parsing | strict parser tests pass                                                                                          |
| W6-P0-11 period bypass          | budget tests plus the 17-test GL period-close sweep in the trust slice pass; not every product mutation certified |
| W6-P0-12 sign colours           | ReportGrid tests pass                                                                                             |
| W6-P0-13 API origin             | instantiation-site test passes; not a live server caller or Q6 decision                                           |
| W6-P0-14 RBAC                   | dataStore tests and the AST/negative trust slice pass; N3 remains open                                            |
| W6-P0-15 cascade DSL            | template contract/sentinel tests pass                                                                             |
| W6-P0-16 IRR/XIRR               | financial functions and independent oracle tests pass                                                             |

No failure in this selected witness run required reopening a historical code
closure. Owner/native/live-evidence boundaries remain open, not silently closed.

## Final gates

`npm run check` **passed** on code commit `0f750d50` with the documentation
updates in this closing record. Suite component: **8/8 shards, 1,395 files,
16,110 passed + 1 existing skipped = 16,111 total, 1,066 seconds**.
Per-shard passed: 1,901 / 1,558 / 2,074 / 2,307 / 2,034 / 2,069 / 2,221 / 1,946.
The command includes tsc, full lint, source formatting, docs/engine verification,
money AST, determinism, palette, fabrication and all test shards.

Separate completed commands: `npm run build`, `node scripts/bundle-check.js`,
`npm run money:adoption`, `npm run docs:links`, `npm run repo:hygiene`, and
`npm run routemap:check`. Final production bundle: **6,812.58 KB raw /
2,059.60 KB gzip vs 2,080 KB**, one size warning; critical path 424.20 KB gzip.
This is not an N7 structural reduction claim; the budget was not raised.
Adoption remains **305/1,017 (29.99%) / zero raw sites**. No test was newly
skipped, no dependency or baseline changed, and no financial amount type migrated.

Pre-push remains independently enforced by the installed Husky hook on the
explicit session-branch push; the PR/push output is the distribution record,
not proof of Actions status. No native toolchain, browser E2E journey, real-owner
month-end, scale benchmark or recovery rehearsal was performed in this slice.
`gh run list --branch main --limit 5` was repeated after the full check and
still returned HTTP 403; main CI remains unverifiable.

## Remaining work and owner requests

- N2: audit authority remains bounded client evidence. Q6 server disposition,
  O4 SOX source, anchoring/keying/native restart proofs remain open.
- N3: not every guarded action has independently audited negative tests; O9
  grants/policy remain unknown. No entity authorization was inferred.
- Wave 0: exact 108–200 source not recovered in bounded repository, PR, Notion,
  Drive and Gmail searches. Issues read access is blocked. Search limitations
  and attributable locations are in the [blocker register](../discovery/OWNER_SCOPE_REGISTER_111_200.md).
- Dependency follow-up: review/remediate the development-inclusive audit
  findings above with a lockfile-focused slice, license check and full gates;
  do not blindly run `npm audit fix` in the middle of financial changes.
- N8: current adoption holds; 100% supported-module adoption not established.
  No money re-fix was needed in this checkout, and no ratchet was weakened.
- N7: baseline measured; no structural bundle reduction attempted while the
  earlier trust gates remain open.
- N4/N6/Q1: no new surface, certification or connector claim added.
- Owner packet was sent as one batched request in conversation; see
  [OWNER_DECISION_PACKET.md](../discovery/OWNER_DECISION_PACKET.md). Silence is
  not certification, a grant, custody authorization or real-data proof.

**Known-work complete: NO.** An exact remaining semantic-task denominator is
not established; claiming a completion fraction would invent one.
**Programme complete: NO.** Real owner month-end/two-month parallel run, native
and main-CI proof, supported-scope certification, signed limitations and
fresh-install/upgrade recovery evidence remain owed. Passing tests alone does
not close these obligations.

## Next bounded slice

N3: extend `rbacNegativeAuthorization.test.ts`'s denial table for
`budgetStore.updateBudget` using a populated budget fixture. Prove no-session,
Viewer, withheld `budget:update` and stale-session denial preserves the entire
state; remove the guard temporarily to demonstrate the new assertions fail,
then restore it and re-run the AST snapshot and period-lock impact set. Do not
infer O9 grants. Separately review the development-inclusive advisories before
any release; no broad dependency update was mixed into this audit fix.
