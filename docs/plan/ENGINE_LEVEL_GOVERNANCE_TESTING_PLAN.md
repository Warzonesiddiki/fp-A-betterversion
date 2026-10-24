# Engine-Level Governance Testing Plan — 2026-10-24

> **Status:** Planning document. Store-level governance testing is COMPLETE (39/39 stores, 684 tests, 7 dimensions). This plan addresses the 15 EXPERIMENTAL capabilities that require engine-level or integration tests.
>
> **Owner may correct anything here.** All agent decisions are provisional under delegated authority (see DEC-058).

---

## 1. Context — What's Complete, What's Not

### Complete: Store-Level Governance Testing

All 39 stores with `enforce()` calls are tested across 7 governance dimensions:

| Dimension | Stores Tested | Method |
|-----------|--------------|--------|
| RBAC permission guards | 39/39 | `actAsRoleWithout` + `expectPermissionDenied` |
| Lifecycle state machine | 12+ | `assertBudgetTransition`, `assertCorrectionStateMachine` |
| Input validation | 6 | `throw new Error` guard tests |
| Rule versioning | 1 | `exceptionRuleCatalogueStore` |
| Cross-store integration | 1 | `glStore` cube sync |
| Period close integration | 1 | `periodCloseStore` transition/initialize |
| Fiscal calendar validation | 1 | `periodCloseStore` initialize |

**Total:** 684 tests, 249 enforce() calls covered.

### Remaining: 15 EXPERIMENTAL Capabilities

These are engine/AI features without store-level `enforce()` calls. They require a different testing approach.

| Pillar | Capability | Engine/Module | Path to SUPPORTED |
|--------|-----------|---------------|-------------------|
| AI | ai.explicit-invocation | AIEngine | Test explicit invocation gate (no auto-generation) |
| AI | ai.local-only | AIEngine / AICopilotEngine | Test no external egress (network isolation) |
| AI | ai.verified-facts-gate | AIEngine | Test that AI narrative cannot contain unverified financial numbers |
| ANALYZE | analyze.drill-to-source | AdvancedOLAPEngine | Test drill-through to source transaction |
| ANALYZE | analyze.explanations | AutoCommentaryEngine | Test explanation attribution to data |
| GOVERN | govern.security-policy | settingsStore / authStore | Test security policy enforcement (rate limiting, input sanitization) |
| MODEL | model.consolidation | ConsolidationEngine | Test ASC 810 compliance (eliminations, VIE, equity method) |
| MODEL | model.ic-elimination | IntercompanyMatchingEngine | Test intercompany matching and elimination |
| MODEL | model.multi-book | Multi-book engine | Test parallel book maintenance |
| MODEL | model.revenue-recognition | RevRecEngine | Test ASC 606 compliance (performance obligations, allocation) |
| REPORT | report.pdf | AdvancedPDFEngine | Test PDF generation with money primitive safety |
| REPORT | report.pptx-editable | PPTX engine | Test PowerPoint generation (board pack) |
| REPORT | report.xlsx-formula | AdvancedExcelEngine / ArrayFormulaEngine | Test formula-based Excel export |
| WF | wf.human-attribution | auditTrailStore | Test attribution in audit trail |
| WF | wf.reviews | workflowStore / review system | Test review workflow enforcement |

### Remaining BLOCKED-ON-OWNER (6)

These cannot be resolved without owner decisions. No agent action can promote them.

| Capability | Owner | Blocking Question |
|-----------|-------|-------------------|
| admin.backup-restore | O3 | Encryption key-escrow/recovery |
| data.d365-bc-gl | O1 | D365 export sample (BC G/L shape) |
| data.d365-fo-gl | O1 | D365 export sample (F&O GL shape) |
| data.d365-journal | O1 | D365 export sample (journal entity shape) |
| govern.entity-scope | O9 | Authoritative authorized-entity set |
| govern.sox-authority | O4 | SOX/audit authority decision |

---

## 2. Testing Approach — Three Tiers

### Tier 1: Engine Correctness Tests (High Priority)

Tests that verify the engine produces correct financial results. These are pure function tests — no RBAC, no stores, just engine logic.

**What makes them governance evidence:** The engine is the financial authority. If the engine produces wrong results, every downstream report is wrong. Correctness tests are the governance evidence that the financial engine is trustworthy.

**Test pattern:**
```typescript
describe("ConsolidationEngine — ASC 810 compliance", () => {
  it("eliminates intercompany transactions", () => {
    const result = ConsolidationEngine.consolidate([entityA, entityB]);
    expect(result.eliminations).toHaveLength(2); // 1 AB, 1 BA
    expect(result.balanceCheck).toBe(true); // books balance after elimination
  });

  it("applies equity method for partial ownership", () => {
    const result = ConsolidationEngine.consolidate([entityA, entityB], {
      method: 'equity',
      ownershipPercent: 0.4,
    });
    expect(result.minorityInterest).toEqual(expectedMI);
  });
});
```

**Effort estimate:** 3-5 tests per engine, 6-8 hours per capability.

**Prioritized capabilities:**
1. `model.consolidation` — ConsolidationEngine (ASC 810)
2. `model.revenue-recognition` — RevRecEngine (ASC 606)
3. `model.ic-elimination` — IntercompanyMatchingEngine

### Tier 2: Integration Tests (Medium Priority)

Tests that verify the engine integrates correctly with stores (data in, audit trail out).

**What makes them governance evidence:** The engine must consume store data correctly and produce audit trail entries. If the integration is broken, the engine works in isolation but fails in production.

**Test pattern:**
```typescript
describe("ConsolidationEngine integration with glStore", () => {
  it("reads entity data from glStore and writes consolidation results", () => {
    // Set up glStore with entity data
    useGLStore.getState().setEntries(entityA.entries);
    
    // Run consolidation
    const result = ConsolidationEngine.consolidate(entities);
    
    // Verify results are persisted
    expect(useGLStore.getState().consolidationResults).toEqual(result);
    
    // Verify audit trail
    const trail = useAuditTrailStore.getState().entries;
    expect(trail.some(e => e.action === 'CONSOLIDATION_RUN')).toBe(true);
  });
});
```

**Effort estimate:** 2-3 tests per integration, 4-6 hours per capability.

**Prioritized capabilities:**
1. `analyze.drill-to-source` — AdvancedOLAPEngine + glStore
2. `report.pdf` — AdvancedPDFEngine + reportStore
3. `report.xlsx-formula` — AdvancedExcelEngine + reportStore

### Tier 3: Safety Gate Tests (Low Priority, High Value)

Tests that verify safety constraints — AI gates, money primitive safety, network isolation.

**What makes them governance evidence:** Safety gates prevent catastrophic failures (AI hallucination, floating-point money errors, data exfiltration). These are the most important tests for "zero compromises."

**Test pattern:**
```typescript
describe("AIEngine — verified facts gate", () => {
  it("rejects narrative containing unverified financial numbers", () => {
    const narrative = "Revenue grew 15% in Q3 2026";
    const result = AIEngine.generateNarrative(narrative, { verifiedFacts: [] });
    expect(result.gated).toBe(true);
    expect(result.warning).toContain("unverified");
  });

  it("allows narrative with verified facts only", () => {
    const narrative = "Revenue grew 15% in Q3 2026";
    const result = AIEngine.generateNarrative(narrative, { verifiedFacts: ['revenue-q3-2026: 15%'] });
    expect(result.gated).toBe(false);
  });
});
```

**Effort estimate:** 2-3 tests per gate, 3-5 hours per capability.

**Prioritized capabilities:**
1. `ai.verified-facts-gate` — AIEngine
2. `ai.local-only` — AIEngine (network isolation)
3. `ai.explicit-invocation` — AIEngine (invocation gate)

---

## 3. Execution Order — 6 Phases

### Phase 1: MODEL Pillar — Financial Engine Correctness (Highest Priority)

| # | Capability | Engine | Tests | Effort |
|---|-----------|-------|-------|--------|
| 1 | model.consolidation | ConsolidationEngine | 4 | 6h |
| 2 | model.revenue-recognition | RevRecEngine | 4 | 6h |
| 3 | model.ic-elimination | IntercompanyMatchingEngine | 3 | 4h |

**Rationale:** The MODEL pillar is the financial authority. If the engines produce wrong results, every downstream report, analysis, and decision is wrong. Correctness here is the foundation of "zero compromises."

### Phase 2: REPORT Pillar — Output Safety

| # | Capability | Engine | Tests | Effort |
|---|-----------|-------|-------|--------|
| 4 | report.pdf | AdvancedPDFEngine | 3 | 5h |
| 5 | report.xlsx-formula | AdvancedExcelEngine | 3 | 5h |
| 6 | report.pptx-editable | PPTX engine | 3 | 5h |

**Rationale:** Reports are what finance professionals present to decision-makers. If the output is wrong, the decision is wrong. Money primitive safety in exports is critical.

### Phase 3: AI Safety Gates

| # | Capability | Engine | Tests | Effort |
|---|-----------|-------|-------|--------|
| 7 | ai.verified-facts-gate | AIEngine | 3 | 4h |
| 8 | ai.local-only | AIEngine | 2 | 3h |
| 9 | ai.explicit-invocation | AIEngine | 2 | 3h |

**Rationale:** AI is the highest-risk surface. An AI hallucination or data exfiltration is a zero-compromise violation. These gates must be tested before any AI capability can be SUPPORTED.

### Phase 4: ANALYZE Pillar

| # | Capability | Engine | Tests | Effort |
|---|-----------|-------|-------|--------|
| 10 | analyze.drill-to-source | AdvancedOLAPEngine | 2 | 4h |
| 11 | analyze.explanations | AutoCommentaryEngine | 2 | 4h |

**Rationale:** Analysis is only useful if it traces to source. Drill-to-source tests verify that every number can be traced back to its source transaction.

### Phase 5: GOVERN & WF Pillars

| # | Capability | Engine | Tests | Effort |
|---|-----------|-------|-------|--------|
| 12 | govern.security-policy | settingsStore + authStore | 3 | 5h |
| 13 | wf.human-attribution | auditTrailStore | 2 | 3h |
| 14 | wf.reviews | workflowStore | 2 | 3h |

**Rationale:** Governance and workflow are the audit trail of the system. These tests verify that actions are attributed to humans and reviews are properly enforced.

### Phase 6: model.multi-book (Lowest Priority)

| # | Capability | Engine | Tests | Effort |
|---|-----------|-------|-------|--------|
| 15 | model.multi-book | Multi-book engine | 3 | 5h |

**Rationale:** Multi-book is a specialized capability. It's important but less universally needed than consolidation or rev-rec.

---

## 4. Decision Rules

### DEC-100: Engine correctness tests are governance evidence.

**Question:** Are engine correctness tests valid governance evidence?

**Decision:** Yes. The engine is the financial authority. If the engine produces wrong results, every downstream report is wrong. Correctness tests are the governance evidence that the financial engine is trustworthy. This is consistent with the VISION's zero-compromise commitment: "no wrong numbers."

**Rationale:** Store-level tests verify access control (who can call). Engine-level tests verify financial correctness (what the engine produces). Both are governance dimensions. The completion register already accepts engine tests as evidence — the SUPPORTED requirement is "≥1 test file, real npm gate, existing doc."

**Reversibility:** If the owner disagrees, engine tests can be reclassified as "engine verification" rather than "governance evidence." But the capability would remain EXPERIMENTAL without them.

### DEC-101: AI safety gates are the highest-priority engine tests.

**Question:** Should AI safety gates be tested before financial engine correctness?

**Decision:** No — financial engine correctness first, AI safety gates second.

**Rationale:** Financial engines are the foundation. If the consolidation engine produces wrong numbers, the AI is analyzing wrong numbers. Wrong numbers in, wrong narrative out. Financial correctness is the prerequisite for AI safety.

**Reversibility:** If the owner disagrees, AI gates can be tested first. But the logic holds: garbage in, garbage out.

### DEC-102: BLOCKED-ON-OWNER capabilities remain blocked.

**Question:** Can any agent action promote the 6 BLOCKED-ON-OWNER capabilities?

**Decision:** No. Each requires an owner decision:
- O1 (D365 samples): Needs real anonymized export samples — agent cannot fabricate
- O3 (encryption): Needs key-escrow/recovery decision — agent cannot decide on behalf of owner
- O4 (SOX): Needs SOX authority decision — agent cannot claim SOX compliance
- O9 (entity scope): Needs authoritative entity set — agent cannot infer grants from active entity

**Rationale:** The zero-compromise commitment forbids unverified claims. The agent cannot fabricate D365 samples, claim "your data is safe," claim SOX compliance, or infer entity grants.

**Reversibility:** If the owner provides D365 samples, decides on encryption, decides on SOX authority, or provides an entity set, the corresponding capabilities can be promoted immediately.

---

## 5. Expected Outcomes

### After Phase 1 (MODEL): 3 capabilities promoted
- model.consolidation: EXPERIMENTAL → SUPPORTED
- model.revenue-recognition: EXPERIMENTAL → SUPPORTED
- model.ic-elimination: EXPERIMENTAL → SUPPORTED
- Register: 151 SUPPORTED (was 148)

### After Phase 2 (REPORT): 3 capabilities promoted
- report.pdf: EXPERIMENTAL → SUPPORTED
- report.xlsx-formula: EXPERIMENTAL → SUPPORTED
- report.pptx-editable: EXPERIMENTAL → SUPPORTED
- Register: 154 SUPPORTED

### After Phase 3 (AI): 3 capabilities promoted
- ai.verified-facts-gate: EXPERIMENTAL → SUPPORTED
- ai.local-only: EXPERIMENTAL → SUPPORTED
- ai.explicit-invocation: EXPERIMENTAL → SUPPORTED
- Register: 157 SUPPORTED

### After Phase 4 (ANALYZE): 2 capabilities promoted
- analyze.drill-to-source: EXPERIMENTAL → SUPPORTED
- analyze.explanations: EXPERIMENTAL → SUPPORTED
- Register: 159 SUPPORTED

### After Phase 5 (GOVERN & WF): 3 capabilities promoted
- govern.security-policy: EXPERIMENTAL → SUPPORTED
- wf.human-attribution: EXPERIMENTAL → SUPPORTED
- wf.reviews: EXPERIMENTAL → SUPPORTED
- Register: 162 SUPPORTED

### After Phase 6 (multi-book): 1 capability promoted
- model.multi-book: EXPERIMENTAL → SUPPORTED
- Register: 163 SUPPORTED

### Final State
- 163 SUPPORTED (was 148)
- 6 BLOCKED-ON-OWNER (unchanged — require owner decisions)
- 0 EXPERIMENTAL (all promoted or blocked)
- VISION pillars: MODEL fully SUPPORTED, REPORT fully SUPPORTED, AI fully SUPPORTED

---

## 6. Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Engine tests expose bugs | Fix bugs, record DEC, update register |
| Engine tests require complex fixtures | Use existing engine test files as templates |
| AI tests require WASM/GPU | Use mock pipeline for deterministic tests |
| PDF/PPTX tests require jsPDF/PPTX libs | Use jsdom or mock canvas factory |
| Time constraints | Prioritize Phase 1 (MODEL) — highest value |
| Owner decisions never arrive | Record BLOCKED-ON-OWNER honestly; no fake claims |

---

## 7. Verification

After each phase:
1. Run `npm run test:sharded` — all tests green
2. Run `npm run docs:verify` — gates pass
3. Run `node scripts/completion-register.mjs` — register updated
4. Run `node scripts/verify-governance-evidence.mjs` — evidence valid
5. Update capability claims in `docs/plan/governance-evidence.json`
6. Update register rows in `docs/plan/completion-register.json`
7. Record DEC in `docs/discovery/decision-log.md`
8. Update session planning doc
9. Commit and push
