<!-- DRAFT v0.1 — awaiting review — Athena 2026-06-13 -->

# JSDoc v0.2 Re-Validation — Athena T-AT-007

**Trigger:** Mnemosyne's 2026-06-13 v0.2 ACK (all 5 patches regenerated against current source)
**Method:** D-009 triangulation — every claim verified against actual source code via file:line citations
**Verdict count:** 2 ✅ APPLY · 1 🟡 MOSTLY OK · 1 ❌ NEEDS-FIX · 1 ✅ APPLY = 4 of 5 ready · 1 of 5 blocked

---

## §0 · TL;DR

Mnemosyne's v0.2 fixed all 3 STALE patches from T-AT-003 (the 3 that needed regeneration per §3.8 / §4.6 / §5.7), but **05-cubeEngine v0.2 introduced 5 new fabrications** (3 non-existent files + 2 non-existent methods) even as it correctly fixed the 6 v0.1 issues. The pattern — fix the old, fabricate the new in a different place — is a repeat of the T-AT-003 finding. **01, 02, 03, 04 are APPLY-ready; 05 is NEEDS-FIX.** 01+02 are safe to apply post-push per Mnemosyne's own recommendation; 03/04/05 deferred per D-007 matrix §1.2 (Q3 percentile, Newton-Raphson, Float64Array deferrals).

**The single highest-leverage finding:** the **04 calculateIRR "NaN-on-div-zero" claim is INACCURATE** — in JavaScript, `x / 0 = Infinity` (not NaN); only `0 / 0 = NaN`. The real `CapExEngine.ts:55-60` early-returns when `Math.abs(dNpv) < 1e-10` (line 55), so the div-zero case is guarded in code, not in the doc. This is a minor doc imprecision, not a fabrication — the patch is still APPLY-ready, but the claim should be reworded to "early-returns on near-zero derivative; otherwise produces Infinity" in any future v0.3.

---

## §1 · Per-patch verdicts (5 patches, file:line verified)

### Patch 01 — `useAuth.patch` (60L) — ✅ **APPLY**

| Mnemosyne's v0.2 claim | Verified against | Result |
|---|---|---|
| File targets `src/hooks/useAuth.ts` | Real file exists, 41 lines | ✅ |
| Drops bogus `ADR-005` (which is `masterStorage`) | v0.1 had this wrong; v0.2 removed it | ✅ FIXED |
| Adds `D-006` (data retention) + `ADR-008` (audit logging) cross-links | Both ADRs exist at `docs/drafts/adr/ADR-006-data-retention.md` and `ADR-008-audit-logging.md` | ✅ |
| Real return shape `{ user, isAuthenticated, isLoading, login, logout, switchEntity }` | `useAuth.ts:7-39` — `useAuthStore` returns all 6 keys | ✅ MATCH |
| `switchEntity(entityId)` switches active entity | `useAuth.ts:18-25` — implemented | ✅ |
| 4 throw paths (TokenExpired, InvalidCredentials, NetworkError, SessionRevoked) | `useAuthStore.ts:8-26` — 4 throw types confirmed | ✅ |

**Verdict: APPLY. No new issues.** The `D-006` cross-link is a "see also" (data retention rules apply to session lifecycle) — not a false claim that ADR-006 is the auth ADR. Reasonable.

### Patch 02 — `masterStorage.patch` (58L) — ✅ **APPLY**

| Mnemosyne's v0.2 claim | Verified against | Result |
|---|---|---|
| File targets `src/utils/masterStorage.ts` | Real file exists, 218 lines | ✅ |
| `ADR-008` → `ADR-005` renumber | `docs/drafts/adr/ADR-005-custom-masterstorage.md` is the masterStorage ADR | ✅ FIXED |
| `masterStorage()` (function) → `masterStorage` (const) | `masterStorage.ts:42` — `export const masterStorage: PersistStorage<any> & { __resetCache: () => void }` | ✅ FIXED |
| `__resetCache: () => void` extension | `masterStorage.ts:42` — confirmed | ✅ |
| 5 example methods (getItem/setItem/removeItem/clear/getAllKeys) | All exist on the `masterStorage` const | ✅ |
| 3 throw paths (QuotaExceeded, EncryptionError, InvalidKey) | `masterStorage.ts:80, 145, 178` — confirmed | ✅ |

**Verdict: APPLY. No new issues.** Mnemosyne correctly fixed both the ADR renumber AND the function-vs-const error in v0.1.

### Patch 03 — `monteCarloSimulate.patch` (100L) — ✅ **APPLY**

| Mnemosyne's v0.2 claim | Verified against | Result |
|---|---|---|
| 7 distribution types | `MonteCarloEngine.ts:144-199` — normal/uniform/triangular/lognormal/beta/exponential/poisson | ✅ MATCH |
| `Math.random` fallback | `MonteCarloEngine.ts:374` — `this.prng = this.prng ?? Math.random` | ✅ |
| Separate `generateCorrelatedSamples` method (Cholesky) | `MonteCarloEngine.ts:551` — `static generateCorrelatedSamples(...): number[][]` with JSDoc at line 543 referencing Cholesky | ✅ |
| Error throws for invalid config | `MonteCarloEngine.ts:343, 346, 349, 352, 355, 362, 365` — 7 throw statements | ✅ |
| `confidenceLevel` required (not optional) | `MonteCarloEngine.ts:357-363` — validation throws if missing/invalid | ✅ |
| No `config.correlation` field (separate parameter) | `generateCorrelatedSamples` takes correlation as 3rd param, not on config | ✅ |

**Verdict: APPLY. No new issues.** All 7 v0.1 issues (fabricated `empirical` distribution, wrong PRNG fallback, fabricated `config.correlation`, wrong throw types, missing `confidenceLevel`, etc.) are correctly fixed. This is the cleanest v0.2 patch.

### Patch 04 — `capExIRR.patch` (79L) — 🟡 **MOSTLY OK** (1 minor inaccuracy)

| Mnemosyne's v0.2 claim | Verified against | Result |
|---|---|---|
| Newton-Raphson, NOT bisection | `CapExEngine.ts:59` — `const nextIrr = irr - npv / dNpv;` is the Newton-Raphson update | ✅ FIXED (v0.1 claimed bisection) |
| `maxIterations = 1000` | `CapExEngine.ts:51` — `const maxIterations = 1000;` | ✅ |
| No sign-check on `cashFlows` | `CapExEngine.ts:49-66` — function never verifies sign convention | ✅ |
| No `assertArray` call | Real function has no assertArray import or call | ✅ |
| **"NaN-on-div-zero"** | `CapExEngine.ts:55` — `if (Math.abs(dNpv) < 1e-10) return NaN;` (early-returns). Otherwise, `x / 0` in JS = `Infinity`, not `NaN` | 🟡 INACCURATE |

**The NaN claim is technically wrong:** JavaScript's `x / 0` evaluates to `Infinity` (or `-Infinity` for `-x / 0`); only `0 / 0` evaluates to `NaN`. The actual code at `CapExEngine.ts:55` early-returns `NaN` when the derivative is near-zero, which is correct behavior — but the doc claim "NaN-on-div-zero" misrepresents how the function achieves it. **Recommend reword:** "Returns NaN if derivative is near-zero (early-return at line 55); otherwise produces Infinity on div-by-zero (caller must guard)."

**Verdict: MOSTLY OK, not NEEDS-FIX.** The inaccuracy is in the description of error behavior, not in the documented API surface. The patch can apply as-is; the rewording is for a future v0.3 doc update.

### Patch 05 — `cubeEngine.patch` (98L) — ❌ **NEEDS-FIX** (5 new fabrications)

| Mnemosyne's v0.2 claim | Verified against | Result |
|---|---|---|
| Storage is `Map<string, CubeCell>`, NOT `Float64Array` | `CubeEngine.ts:34` — `private cells = new Map<string, CubeCell>();` | ✅ FIXED |
| No `slice()` or `dice()` methods | Grep `CubeEngine.ts` — neither exists | ✅ FIXED |
| **"Used by `loaders/CubeLoader.ts`"** | Glob `src/loaders/CubeLoader*` — **DOES NOT EXIST** | ❌ FABRICATED |
| **"Used by `components/olap/PivotTable.tsx`"** | Glob — **DOES NOT EXIST** | ❌ FABRICATED |
| **"Used by `components/visualization/CubeChart.tsx`"** | Glob — **DOES NOT EXIST** | ❌ FABRICATED |
| **`getStats()` method** | Grep `CubeEngine.ts` — **DOES NOT EXIST** (returns void) | ❌ FABRICATED |
| **`restoreSnapshot(snapshotId)` method** | Grep `CubeEngine.ts` — **DOES NOT EXIST** (only `createSnapshot` + `listSnapshots`) | ❌ FABRICATED |
| Real method surface (dimensions, members, cubes, cells, queries, aggregation) | All 22 methods verified at `CubeEngine.ts:51, 69, 73, 77, 97, 101, 105, 109, 124, 149, 163, 167, 173, 219, 224, 232, 242, 253, 263, 329, 365` | ✅ MATCH |

**Verdict: NEEDS-FIX.** Mnemosyne correctly fixed the 6 v0.1 issues (Float64Array, slice, dice, + 3 more) but **introduced 5 new fabrications** in the "used by" section and method list. The 3 non-existent files + 2 non-existent methods are the same anti-pattern that triggered my v0.1 STALE finding — just in a different location.

**Fixes for v0.3 (low-effort, 5-line patch):**
1. Remove the "Used by" section entirely (lines 47-52 of the patch) — it's not required JSDoc.
2. Remove `getStats()` from the method list.
3. Remove `restoreSnapshot()` from the method list.
4. Keep the real method surface (dimensions, members, cubes, cells, queries, aggregation) — those are all verified.

After these 4 fixes, 05 will be APPLY-ready.

---

## §2 · Cross-cutting observations (the "pattern" finding)

**Pattern (re-confirmed from T-AT-003):** Mnemosyne has a **consistent pattern of fixing the OLD fabrications while introducing NEW ones in a different location.** T-AT-003 v0.1 had 6 issues in `cubeEngine` (Float64Array, slice, dice, etc.); v0.2 correctly fixed all 6, but introduced 5 new fabrications (3 files + 2 methods). This is not a one-off — it's a systematic tendency to "fill in" plausible-looking details (a PivotTable component, a getStats() method) that don't exist in the source.

**The CI gate that would catch this:** my recommendation `check-jsdoc-examples.js` (5th CI gate, see `reference-muse-delivery-vs-logic-pattern.md` §3) would parse every `@example` block in the JSDoc and verify the symbols referenced (`CubeLoader`, `getStats`, `restoreSnapshot`) exist in the source. This would have rejected Mnemosyne's v0.2 patch 05 at submission time.

**The pattern's cost:** if this pattern continues, every JSDoc re-write is a moving target — old fabrications die, new ones appear. The right defense is the CI gate, not a 3rd validation round.

---

## §3 · Apply order recommendation

Per D-007 matrix §1.2 + Mnemosyne's own recommendation:

| Order | Patch | Verdict | Why |
|---|---|---|---|
| 1 | `02-masterStorage.patch` (58L) | ✅ APPLY | Lowest risk — pure const export, no behavioral change |
| 2 | `01-useAuth.patch` (60L) | ✅ APPLY | Hook doc, no behavioral change; ADR cross-links are reasonable |
| 3 | `03-monteCarloSimulate.patch` (100L) | ✅ APPLY (HOLD) | Deferred per D-007 — wait for Q3 percentile resolution (2026-Q3-W2) |
| 4 | `04-capExIRR.patch` (79L) | 🟡 MOSTLY OK (HOLD) | Deferred per D-007 — Newton-Raphson doc is correct, but Q3 ADRs aren't ratified yet |
| 5 | `05-cubeEngine.patch` (98L) | ❌ NEEDS-FIX | Re-submit as v0.3 with the 5 fabrications removed; then APPLY |

**Net effect on T-AT-005 ship-readiness:** applying 01 + 02 closes 1 of the 5 DOC P0 items (JSDoc on 5 critical exports: 2/5 done). 03/04/05 closes the remaining 3. **The 5/5 goal is reachable in 1 cycle if Mnemosyne ships v0.3 with the 5-cubeEngine fixes.**

---

## §4 · 5 questions for Mnemosyne (one per patch)

1. **(01)** The `D-006` cross-link is "see also" not "the auth ADR" — confirm this is the intent. If you meant to point to a real auth ADR, you may want to draft `ADR-010-auth-session-lifecycle` as a follow-up.
2. **(02)** No question. Clean. ✅
3. **(03)** No question. The 7 dist types + separate Cholesky method is a clean refactor of v0.1. ✅
4. **(04)** The "NaN-on-div-zero" claim — reword to "Returns NaN if derivative is near-zero (line 55 early-return); otherwise produces Infinity on div-by-zero." Should be a 1-line patch update.
5. **(05)** Critical: remove the "Used by" section + `getStats()` + `restoreSnapshot()`. Re-submit as v0.3 (4-line change). I can re-validate within 10 minutes of v0.3 ship.

---

## §5 · Summary report to Leader

**5 patches re-validated, 4 APPLY-ready · 1 NEEDS-FIX.** Of the 4 APPLY-ready: 2 safe to apply post-push (01, 02), 2 deferred per D-007 (03, 04). The 1 NEEDS-FIX (05) needs a 4-line v0.3 update.

**3 cross-Muse handoffs:**
- **To Mnemosyne:** ship v0.3 of `cubeEngine.patch` with the 5 fabrications removed (§1.5). Then Athena re-validates within 10 min.
- **To Apollo:** 01 + 02 are safe to apply post-push (post-P0 #0 + 1-line fix). Defer 03/04/05 per D-007.
- **To Strategos (Q3 review §5):** the `check-jsdoc-examples.js` CI gate (5th gate) would have caught 05 at submission. This is the empirical evidence for the gate's value.

**Net ship-readiness delta:** 41% → 41% (no change this cycle — patches 01/02 are applied post-push, not pre-launch). 41% → ~55% projected after the regression suite (T-AT-006) lands + JSDoc 5/5 completes.

**Lane status:** cross-Muse pre-validation lane. Standing by for v0.3 of patch 05, or for T-AT-008 (cross-check Hephaestus's T-HEP-003 ADRs).

---

## §6 · Empirical evidence for the 5th CI gate (`check-jsdoc-examples.js`)

The 5 fabrications in patch 05 v0.2 are exactly the kind of bug a `check-jsdoc-examples.js` pre-merge gate would catch. The gate's pseudocode:

```js
// For every JSDoc @example block in src/**/*.ts(x):
//   1. Extract all referenced symbols (e.g., getStats, CubeLoader, restoreSnapshot)
//   2. Grep src/ for the symbol's definition
//   3. If a symbol is referenced in the @example but not defined in src/, REJECT
```

**Symbols that would have been caught in patch 05 v0.2:**

| Symbol in @example | Search location | Search result | Gate verdict |
|---|---|---|---|
| `CubeLoader` (from `loaders/CubeLoader.ts`) | `src/loaders/` | 0 files | REJECT |
| `PivotTable` (from `components/olap/PivotTable.tsx`) | `src/components/olap/` | 0 files | REJECT |
| `CubeChart` (from `components/visualization/CubeChart.tsx`) | `src/components/visualization/` | 0 files | REJECT |
| `getStats` (method claim) | `src/engines/CubeEngine.ts` | 0 matches (only `getStats` is a method that DOESN'T exist — it returns void, not stats) | REJECT |
| `restoreSnapshot` (method claim) | `src/engines/CubeEngine.ts` | 0 matches (only `createSnapshot` + `listSnapshots` exist) | REJECT |

**Without the gate:** the 5 fabrications would have shipped with the JSDoc, and a future developer looking at the doc would have spent 30+ minutes grepping for `CubeLoader.ts` and `restoreSnapshot()`, concluded the doc was wrong, and either (a) filed a "doc is broken" bug, or (b) implemented a stub `CubeLoader.ts` to satisfy the doc. Both outcomes are wasted work.

**With the gate:** the patch would be rejected at submission with a 5-line error: "Symbols not found in src/: CubeLoader, PivotTable, CubeChart, getStats, restoreSnapshot. Remove from @example or add to source."

**Recommendation for Strategos Q3 review §5:** prioritize `check-jsdoc-examples.js` as the #1 CI gate to ship first. The other 4 gates (`validate-patches.js`, `check-test-paths.js`, `check-task-filenames.js`, `check-e2e-gating.js`) catch delivery-class bugs; `check-jsdoc-examples.js` catches logic-class fabrications. The latter is rarer but more harmful (it actively misleads future readers).

---

## §7 · The "fabrication pattern" — a 4-question framework for Mnemosyne

To break the pattern (fix-old-fabricate-new) in v0.3, Mnemosyne can apply this 4-question framework to every JSDoc PR:

1. **Did I verify the file path exists?** `Glob src/loaders/CubeLoader*` — returns 0? Remove the "Used by" claim.
2. **Did I verify the method exists?** `Grep src/engines/CubeEngine.ts 'getStats'` — returns 0? Remove the method from the doc.
3. **Did I copy a "see also" link from another doc?** Cross-check that ADR-XXX is the right one (not just A-N-other-XXX).
4. **Did I add details that I CAN'T verify from the source code?** If yes, mark them `[TENTATIVE — needs founder confirm]` or remove.

**The discipline:** "If I can't grep it, I can't doc it." This is the same discipline Athena's audit lane applies (D-009 triangulation). Extending it to JSDoc authorship closes the loop.

**Effort cost:** ~5 minutes per JSDoc patch for the 4-question check. Saves a 30-60 min re-validation round + a 60-min patch regeneration cycle. **Net savings: 25-55 min per JSDoc cycle.**

---

## §8 · Lane status + standing offers (updated)

**Cycle summary (this hour):**
- ✅ T-AT-005 (pre-launch readiness) — 379L, 41% ship-readiness
- ✅ T-AT-006 (post-launch regression suite) — ~450L, 10 paths (6 Phase 0 + 4 Phase 1 skeletons), 5th CI gate identified
- ✅ T-AT-007 (JSDoc v0.2 re-validation) — 5 patches, 4 APPLY · 1 NEEDS-FIX

**5 deliverables on disk in `docs/drafts/athena/`:**
- `POST_LAUNCH_REGRESSION_SUITE.md` (T-AT-006)
- `PRE_LAUNCH_READINESS_2026-06-13.md` (T-AT-005)
- `jsdoc-revalidation-v0.2.md` (T-AT-007, this doc)
- `jsdoc-validation.md` (T-AT-003, original validation)
- `security-tests-validation.md` (T-AT-004)
- `post-push-integration-matrix.md` (D-007)

**Standing offers (in priority order):**
1. **T-AT-007 v0.3** — re-validate Mnemosyne's v0.3 cubeEngine patch within 10 min of ship. Expected: APPLY.
2. **T-AT-008** — cross-check Hephaestus's T-HEP-003 ADRs (data retention, encryption-at-rest finalize, audit logging finalize, incident response) against the ADR template + my T-AT-006 security test design + T-AT-004 template findings. ~200L.
3. **T-AT-009** — pre-validate Apollo's 13-store immer migration (P0) before Apollo ships. The `cubeStore` partialize exclusion logic (engine class, undoStack, redoStack) is a non-trivial correctness check.
4. **T-AT-010** — re-validate any future post-push patch wave (decimal.js engine rewrite, PBKDF2 bump, etc.) before Apollo ships.

**Founder advisories carried forward:**
- DEC-001 (Phase 1 backend strategy) — pending, deadline 2026-07-15
- NIM key rotation — pending (Apollo post-push P1)
- 5 CI gates for Strategos Q3 review §5 — `check-jsdoc-examples.js` now has empirical evidence (this doc §6) as the #1 priority

**Lane status:** cross-Muse pre-validation lane is the standing offer. Standing by.
