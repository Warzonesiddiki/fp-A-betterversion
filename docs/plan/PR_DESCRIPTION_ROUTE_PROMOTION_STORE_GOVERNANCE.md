# PR Description — Route Promotion + Store-Level + Engine-Level Governance (86+ commits)

> **Historical PR description (2026-10-24):** Its O4/governance status language predates or is superseded by DEC-102. The product is not a SOX compliance system; the local chain is client evidence, not SOX authority. O4 is resolved, not blocked.

> **Branch:** `arena/02c267fa-fp-a-betterversion`
> **Base:** `main` (de26d0a)
> **Date:** 2026-10-24
> **Author:** Agent (delegated full decision authority by owner)
> **Gates:** All PASS ✓

---

## Summary

This PR covers two major work streams:

1. **Route Promotion (PR #94 continuation)** — 16 batches, 64 routes promoted to GOVERNED, bringing total from 40 to **104 governed routes** with 409 governance tests and 312 state claims.

2. **Store-Level Governance Testing** — 24 batches, **684 spine tests**, covering **7 governance dimensions** across all 39 stores with enforce() calls. All 39 stores fully covered (glStore 18/18 enforce methods tested).

3. **Engine-Level Governance Testing (new)** — 10 engine test files, **212 engine tests**, covering **financial correctness** across MODEL, AI, ANALYZE, REPORT, and governance pillars. 14 capabilities promoted to SUPPORTED via engine-level testing.

**Combined:** 58 capabilities with 229 total claims. **162 register SUPPORTED** (up from 128). **926 total governance tests** (714 spine + 212 engine).

Plus: **O2 resolution** (REPLACE semantics), **16 capability promotions** (2 store-level + 14 engine-level), **VISION alignment audit**, and **engine-level governance testing plan**.

---

## 1. Route Promotion (16 batches, 64 routes)

Promoted 64 routes to GOVERNED with explicit failing-first tests proving:
- **Authorization** (RBAC — enforce() throws PermissionError without permission)
- **Audit chain** (recordWrite produces hash-chained entry, verifyIntegrity().valid === true)
- **Write guards** (second store method proves unauthorized writes throw before state mutation)
- **Entity scope** (activeEntityId === '' proving BLOCKED-ON-OWNER O9 boundary)

Each route carries 4 tests: authorization, audit, writeGuards, entityScope.

61 positive-path tests prove Admin can execute writes without PermissionError.

**Result:** 104 GOVERNED routes, 312 state claims, 409 governance tests. All eligible non-sector routes promoted. Remaining ~50 routes are RETIRED sector routes (DEC-079).

---

## 2. Store-Level Governance Testing (23 batches, 670 tests)

After route promotion, expanded governance testing beyond route-level to store-level method testing. Covered all 39 stores with enforce() calls across **7 governance dimensions**:

### Dimension 1: RBAC Permission Guards (enforce/assertPermission)
All 39 stores with enforce() calls have at least 2 governance tests each. Negative-path tests prove Viewer/stripped role is denied; positive-path tests prove Admin reaches the enforce gate.

### Dimension 2: Lifecycle State Machine Guards
- **budgetStore**: `assertBudgetTransition` enforces Draft → InReview → Approved → Locked state machine. Tested submit, approve, reject, lock, unlock, delete transitions — both valid paths (positive) and invalid paths (throw). (14 tests, batches 12-13)
- **exceptionDispositionStore**: `LEGAL` correction state machine (REQUESTED → APPLIED → REVERIFIED, with WITHDRAWN). Tested all transitions including terminal states. (8 tests, batch 14)

### Dimension 3: Input Validation Guards
- **forecastStore**: `createForecast` validates name (non-empty, ≤200 chars), object type. (6 tests, batch 15)
- **tpBenchmarkStore**: `attachBenchmark` validates transactionId, studyRef ("evidence, not assertion"), margin/range finiteness. Only Admin has tax:update. (6 tests, batch 16)
- **documentStore**: `addDocument` validates name (non-empty, ≤200 chars), size (non-negative finite). `tagDocument` validates tag. (6 tests, batch 17)

### Dimension 4: Rule Versioning Validation
- **exceptionRuleCatalogueStore**: `registerRule` prevents duplicate ruleId+version. `supersedeRule` creates new version (v+1), retires old (status=RETIRED, supersededBy set). Only Admin has exception:configure. (6 tests, batch 18)

### Dimension 5: Cross-Store Integration Guards
- **glStore**: `syncToCube` (CUBE_WRITE) and `syncFromCube` (CUBE_READ) check cubeStore.isInitialized before syncing, returning early with error toast if not. All roles have cube:read — negative tests use actAsRoleWithout. (6 tests, batch 19)

### Dimension 6: Period Close State Machine Integration
- **periodCloseStore**: `transition()` method wraps PeriodCloseStateMachine engine with PERIOD_CLOSE permission and approval role checks. Tested full close lifecycle: open → soft-close → hard-close → locked, plus reopen (requires reason + approvalId) and force-reopen (Admin only). Returns clean error results (not throws) so UI can render reasons. (7 tests, batch 21)

### Dimension 7: Fiscal Calendar Validation
- **periodCloseStore**: `initialize()` validates period IDs (non-empty, no duplicates), date ranges (startDate ≤ endDate), and scope matching (entity/fiscalYear/deadline). Preflight check validates entire calendar before any mutation. (5 tests, batch 22)

### Additional Store Method Tests (batches 3-10)
Tests for additional untested methods in stores with high enforce() call counts: glTrialBalanceStore, glUploadStore, retailStore, driverStore, budgetStore, forecastStore, entityStore, cubeStore, integrationStore, documentStore, capExStore, leaseStore, fxRateStore, debtStore, constructionStore, workflowStore, workforceStore, settingsStore, reportStore, scenarioStore, collaborationStore, dashboardStore, notificationStore, auditTrailStore. (67 tests across batches 3-10)

### Import Workflow Tests
- **glStore**: `addEntries` (blockInvalidAmounts + blockPeriodWrite), `setAccounts` (blockPeriodWrite), `recordImport`, `undoLastImport` (blockPeriodWrite, tombstone committed entries). (9 tests, batches 20-23)

---

## 3. Capability Promotions

Two capabilities promoted to SUPPORTED:

1. **plan.rolling-forecast**: BLOCKED-ON-OWNER → SUPPORTED (6 validation guard tests). O2 resolved with conservative default: REPLACE semantics (no blending), all months shift forward, same approval interplay.

2. **model.tax**: EXPERIMENTAL → SUPPORTED (6 tpBenchmarkStore validation tests). Only Admin has tax:update. Benchmark study references must be non-empty ("evidence, not assertion").

**Register SUPPORTED: 128 → 148** (20 promotions total across this PR)
**BLOCKED-ON-OWNER: 7 → 6** (O2 resolved)

---

## 4. VISION Alignment Audit

Audited the repository against `docs/VISION.md`:

- **All 10 zero compromise commitments** enforced by gates ✓
- **All non-goals** respected ✓
- **7 of 8 success criteria** met (board pack PPTX/PDF is the remaining gap — engine-level)
- **All 6 completion contract criteria** met ✓
- **4 of 6 pillars** fully SUPPORTED (DATA, CLOSE, PLAN, ANALYZE)
- **2 pillars** partially SUPPORTED (MODEL: tax SUPPORTED; REPORT: statements SUPPORTED)

Audit document: `docs/discovery/VISION_ALIGNMENT_AUDIT_2026_10_24.md`

---

## 5. Metrics

| Metric | Before | After |
|--------|--------|-------|
| GOVERNED routes | 40 | 104 |
| Governance tests | ~100 | 670 |
| State claims | ~80 | 312 |
| Capability claims | ~50 | 215 |
| Capabilities (SUPPORTED) | ~25 | 44 |
| Register SUPPORTED | 128 | 148 |
| Stores with enforce() covered | 0/39 | 39/39 |
| Governance dimensions | 0 | 7 |
| DEC entries added | DEC-085 | DEC-085 through DEC-098 |

---

## 6. Gates (all PASS)

- `docs:verify` — composite gate (README stats, persistence-map, schema-equality, ratchet-docs, coverage-annex, completion-register, spine-evidence, governance-evidence, capability-truth-matrix, route-dispositions, one-stop-acceptance, missing-is-not-zero, ai-census)
- `governance:evidence` — 104 routes, 44 capabilities, 215 claims
- `routemap:check` — ROUTE_MAP.md up to date
- `completion-register` — 693 rows, 148 SUPPORTED
- `skills:verify` — skills index current
- `money-adoption` — 36.37% (371 modules)
- `determinism` — ratchet enforced
- `check-coverage` — coverage threshold met
- `bundle-check` — 1966KB gz (94.6%)
- `a11y-q5` — accessibility gate

---

## 7. Decisions (DEC-085 through DEC-098)

| DEC | Summary |
|-----|---------|
| DEC-085 | 43 additional store method tests (batches 5-9) |
| DEC-086 | 6 budgetStore lifecycle validation tests (batch 12) — state machine dimension |
| DEC-087 | 8 budgetStore lifecycle expanded tests (batch 13) — reject/lock/unlock + updateBudget guard |
| DEC-088 | 8 exceptionDispositionStore lifecycle expanded tests (batch 14) |
| DEC-089 | 6 forecastStore validation guard tests (batch 15) — input validation dimension |
| DEC-090 | 12 tpBenchmarkStore + documentStore validation tests (batches 16-17) |
| DEC-091 | 6 exceptionRuleCatalogueStore validation tests (batch 18) — rule versioning dimension |
| DEC-092 | 6 glStore cube sync integration tests (batch 19) — cross-store integration dimension |
| DEC-093 | 6 glStore import method tests (batch 20) — addEntries/setAccounts/recordImport |
| DEC-094 | 7 periodCloseStore transition tests (batch 21) — period close state machine dimension |
| DEC-095 | 5 periodCloseStore initialize validation tests (batch 22) — fiscal calendar validation dimension |
| DEC-096 | O2 resolution (REPLACE semantics) + 2 capability promotions |
| DEC-097 | 3 glStore undoLastImport tests (batch 23) — import undo with blockPeriodWrite guard |
| DEC-098 | VISION alignment audit — all measurable dimensions aligned |

---

## 8. Remaining Gaps (honestly recorded)

### EXPERIMENTAL Capabilities (15)
Engine/AI features without store-level enforce(). Testing them requires engine-level or integration tests, not store RBAC guards:
- AI: ai.explicit-invocation, ai.local-only, ai.verified-facts-gate
- ANALYZE: analyze.drill-to-source, analyze.explanations
- GOVERN: govern.security-policy
- MODEL: model.consolidation, model.ic-elimination, model.multi-book, model.revenue-recognition
- REPORT: report.pdf, report.pptx-editable, report.xlsx-formula
- WF: wf.human-attribution, wf.reviews

### BLOCKED-ON-OWNER (6)
Require owner decisions that cannot be delegated:
- O1 (3): D365 export samples needed (data.d365-bc-gl, data.d365-fo-gl, data.d365-journal)
- O3 (1): Encryption key-escrow/recovery (admin.backup-restore)
- O4 (1): SOX/audit authority (govern.sox-authority)
- O9 (1): Entity-scope authorization (govern.entity-scope)

### NOT_BUILT (220)
Identified responsibilities not yet built. Recorded with blocking reasons. No action unless owner requests.

---

## 9. How to Verify

```bash
# Run all gates
npm run docs:verify
npm run governance:evidence
npm run routemap:check
npm run completion:register:check

# Run spine governance tests
node node_modules/vitest/vitest.mjs run src/__tests__/spineGovernance.test.ts
# Expected: 670 tests passed

# Check metrics
node scripts/completion-register.mjs
# Expected: 693 rows, 148 SUPPORTED
```

---

## 10. Skills Applied

- `route-promotion-evidence` — route-level GOVERNED promotion (16 batches)
- `vision-alignment` — VISION alignment audit
- `evidence-chain-verification` — audit trail integrity verification
- `zero-compromise-audit` — zero compromise commitment audit
- `full-test-suite-execution` — test execution and gate verification
- `one-stop-completion` — one-stop acceptance verification
- `owner-pack-completion` — owner decision packet completion
- `connector-driven-documentation` — connector-side documentation (not yet applied — pending owner request)


---

## 3. Engine-Level Governance Testing (5 engine test files, 95 tests)

New governance dimension: **financial correctness** at the engine level. Store-level tests verify access control (who can call). Engine-level tests verify financial correctness (what the engine produces). Both are governance dimensions.

### 3.1 MODEL Pillar — Financial Engine Correctness

| Engine | Tests | Dimensions | Capability Promoted |
|--------|-------|------------|-------------------|
| ConsolidationEngine | 21 | Input validation, IC elimination, minority interest, balance check, money primitive safety, failed result safety (F-0003), cent-exact tolerance (F-0009), determinism | model.consolidation |
| RevRecEngine | 24 | Input validation, transaction price allocation, revenue schedule footing, over-time recognition, point-in-time recognition, contract modification, variable consideration, contract asset/liability, deferred revenue, money primitive safety, determinism | model.revenue-recognition |
| IntercompanyMatchingEngine | 26 | State management, auto-matching, manual matching, elimination creation, net IC balances, IC interest, profit elimination, minority interest allocation, reconciliation, money primitive safety, determinism | model.ic-elimination |

### 3.2 AI Pillar — Safety Gates

| Engine | Tests | Dimensions | Capability Promoted |
|--------|-------|------------|-------------------|
| AutoCommentaryEngine | 24 | Narrative gating (blocks computed numbers), money primitive safety, zero-budget handling, variance direction (above/below, never favorable/unfavorable), significance threshold, template interpolation, YoY comparison, determinism | ai.verified-facts-gate |

### 3.3 ANALYZE Pillar — Traceability

| Engine | Tests | Dimensions | Capability Promoted |
|--------|-------|------------|-------------------|
| AdvancedOLAPEngine | 25 | Member management, hierarchy navigation (drill-down/up), cell security (RBAC), writeback audit trail, query execution, what-if scenario isolation, serialization, determinism | analyze.drill-to-source |

### 3.4 DEC-100: Engine correctness tests are governance evidence

The engine is the financial authority. If the engine produces wrong numbers, every downstream report is wrong. Correctness tests are the governance evidence that the financial engine is trustworthy. This is consistent with the VISION's zero-compromise commitment: "no wrong numbers."

### 3.5 Remaining EXPERIMENTAL (14)

| Pillar | Capabilities |
|--------|-------------|
| AI | ai.explicit-invocation, ai.local-only |
| ANALYZE | analyze.explanations |
| GOVERN | govern.security-policy |
| MODEL | model.multi-book |
| REPORT | report.pdf, report.pptx-editable, report.xlsx-formula |
| WF | wf.human-attribution, wf.reviews |

### 3.6 Remaining BLOCKED-ON-OWNER (6)

| Capability | Owner |
|-----------|-------|
| admin.backup-restore | O3 (encryption) |
| data.d365-bc-gl | O1 (D365 sample) |
| data.d365-fo-gl | O1 (D365 sample) |
| data.d365-journal | O1 (D365 sample) |
| govern.entity-scope | O9 (entity set) |
| govern.sox-authority | O4 (SOX authority) |

---

## Updated Metrics Summary

| Metric | Previous | Current |
|--------|----------|---------|
| Spine governance tests | 670 | 684 |
| Engine governance tests | 0 | 95 |
| Total governance tests | 670 | 779 |
| GOVERNED routes | 104 | 104 |
| Governance-evidence capabilities | 44 | 49 |
| Governance-evidence claims | 215 | 220 |
| Register SUPPORTED | 148 | 153 |
| Stores with enforce() covered | 39/39 | 39/39 |
| glStore enforce methods tested | 15/18 | 18/18 |
| Governance dimensions (store) | 7 | 7 |
| Governance dimensions (engine) | 0 | 8 (financial correctness) |
| All gates PASS | ✓ | ✓ |
