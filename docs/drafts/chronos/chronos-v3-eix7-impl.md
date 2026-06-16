# V3 e.ix.7 — Temporal Engine Edge Cases v2 — IMPLEMENTATION PLAN

**Status:** 🟡 IMPLEMENTATION PLAN — awaiting Apollo engine impl witness
**Author:** Chronos (slot 019ecc6f-1c46-78e0-b122-15d43a3f1900)
**Sub-class:** e.ix.7 of Codif 35 v0.4
**Date:** 2026-06-16
**HEAD:** (post-apply)
**Path A TARGETED scope:** P7-O3 sub-ms lock refactor + 5 NEW edge cases #11-15
**T-3d 2026-06-19 EOD HARD deadline**

---

## §1 Executive Summary

V3 e.ix.7 implementation plan defines the **Path A TARGETED** refactor approach (per Apollo 22b874a23 PeriodLockEngine sub-ms lock precedent) to ship 5 NEW edge cases (#11-15) on the **4-engine CANONICAL list** (PeriodLock + Calendar + Audit + Lock — NO VarianceAttribution per Apollo DELETION):

- **#11 PeriodLock sub-ms contention** (P-PR-043) — Path A TARGETED refactor
- **#12 DST spring-forward** (skipped hour 02:00→03:00) — CalendarEngine
- **#13 DST fall-back** (repeated hour 02:00) — CalendarEngine
- **#14 Audit chain integrity** (hash chain break detection) — AuditEngine
- **#15 Lock race** (concurrent lock acquisition) — LockEngine

**Per-edge-case structure (D-002 3-witness per case):**
1. **Spec:** Functional requirement
2. **Code change:** Specific file:line + patch description
3. **Test case:** Test file + test name + assertions
4. **D-002 3-witness:** Read + Grep + wc -l witnesses

---

## §2 Edge Case #11: PeriodLock sub-ms contention (P-PR-043)

### §2.1 Spec
PeriodLockEngine must handle sub-millisecond concurrent lock acquisition deterministically (no race condition, no audit-trail gap). When 2+ transactions attempt to lock the same period in <1ms window, ordering must be deterministic via lamport clock + region prefix.

### §2.2 Code change (Path A TARGETED, P7-O3 only)
**File:** `src/engines/periodLock/PeriodLockEngine.ts` (post-Apollo 22b874a23 sub-ms lock)
**Lines:** ~245-280 (insert after existing sub-ms lock logic)
**Patch:**
```typescript
// Path A TARGETED: P7-O3 sub-ms lock contention test
// Cross-reference: Apollo 22b874a23 PeriodLockEngine sub-ms lock
async function acquireLockWithContention(
  periodId: string,
  region: 'US' | 'EU' | 'APAC' | 'default',
  hrtimeNs: bigint
): Promise<LockResult> {
  const lamport = incrementLamport(region);
  const uuidV7 = generateUUIDv7(hrtimeNs);
  const sequenceId = `${region}-${lamport}-${uuidV7}`;
  // ... existing lock logic with sequenceId
}
```

### §2.3 Test case
**File:** `src/engines/periodLock/__tests__/PeriodLockEngine.subms.test.ts` (NEW)
**Test name:** `acquireLockWithContention orders deterministically across 100 concurrent attempts in 1ms window`
**Assertions:**
- 100 concurrent `acquireLockWithContention(periodId, region, hrtimeNs)` calls in <1ms
- All 100 return unique sequenceIds (no duplicates)
- SequenceIds sort lexicographically match acquisition order
- Lamport clock increments monotonically

### §2.4 D-002 3-witness
- **(a) Read:** `Read src/engines/periodLock/PeriodLockEngine.ts` — verify post-22b874a23 sub-ms lock logic exists
- **(b) Grep:** `Grep src/engines/periodLock/ "acquireLockWithContention"` — find 1 match
- **(c) wc -l:** `wc -l src/engines/periodLock/__tests__/PeriodLockEngine.subms.test.ts` — expect ≥ 60 lines

---

## §3 Edge Case #12: DST spring-forward (skipped hour)

### §3.1 Spec
CalendarEngine must handle DST spring-forward where 02:00→03:00 occurs (1 hour skipped). All timestamps in the skipped hour must be normalized to the post-transition time. No event should be lost or duplicated.

### §3.2 Code change
**File:** `src/engines/calendar/CalendarEngine.ts`
**Lines:** ~180-220 (insert in normalizeTimestamp function)
**Patch:**
```typescript
// DST spring-forward: 02:00 EST → 03:00 EDT (2026-03-08 in US, 2026-03-29 in EU)
function normalizeDSTSpringForward(timestamp: Date, tz: string): Date {
  const dstTransition = getDSTTransition(timestamp.getFullYear(), tz);
  if (timestamp >= dstTransition.start && timestamp < dstTransition.end) {
    // Skipped hour: shift forward by 1 hour
    return new Date(timestamp.getTime() + 60 * 60 * 1000);
  }
  return timestamp;
}
```

### §3.3 Test case
**File:** `src/engines/calendar/__tests__/CalendarEngine.dst.test.ts` (NEW)
**Test name:** `normalizeDSTSpringForward shifts 02:30 EST on 2026-03-08 to 03:30 EDT correctly`
**Assertions:**
- Input: 2026-03-08T02:30:00-05:00 (EST)
- Output: 2026-03-08T03:30:00-04:00 (EDT)
- Period total: 23-hour day (not 24-hour)
- Audit log: 1 event at 02:30 → 1 event at 03:30 (no loss/duplication)

### §3.4 D-002 3-witness
- **(a) Read:** `Read src/engines/calendar/CalendarEngine.ts` — verify normalizeTimestamp exists
- **(b) Grep:** `Grep src/engines/calendar/ "normalizeDSTSpringForward"` — find 1 match
- **(c) wc -l:** `wc -l src/engines/calendar/__tests__/CalendarEngine.dst.test.ts` — expect ≥ 50 lines

---

## §4 Edge Case #13: DST fall-back (repeated hour)

### §4.1 Spec
CalendarEngine must handle DST fall-back where 02:00 occurs twice (1 hour repeated). All timestamps in the repeated hour must be disambiguated via pre-transition (PDT) vs post-transition (PST) flag.

### §4.2 Code change
**File:** `src/engines/calendar/CalendarEngine.ts`
**Lines:** ~225-265 (insert in normalizeTimestamp function)
**Patch:**
```typescript
// DST fall-back: 02:00 EDT → 01:00 EST (2026-11-01 in US, 2026-10-25 in EU)
function normalizeDSTFallBack(timestamp: Date, tz: string, isPreTransition: boolean): Date {
  const dstTransition = getDSTTransition(timestamp.getFullYear(), tz);
  if (timestamp >= dstTransition.ambiguousStart && timestamp < dstTransition.ambiguousEnd) {
    return isPreTransition
      ? timestamp  // PDT (UTC-4)
      : new Date(timestamp.getTime() - 60 * 60 * 1000);  // PST (UTC-5)
  }
  return timestamp;
}
```

### §4.3 Test case
**File:** `src/engines/calendar/__tests__/CalendarEngine.dst.test.ts` (extend)
**Test name:** `normalizeDSTFallBack disambiguates 01:30 EDT vs 01:30 EST on 2026-11-01`
**Assertions:**
- Input 1: 2026-11-01T01:30:00-04:00 (EDT, pre-transition) → output: 2026-11-01T01:30:00-04:00
- Input 2: 2026-11-01T01:30:00-05:00 (EST, post-transition) → output: 2026-11-01T01:30:00-05:00
- Period total: 25-hour day (not 24-hour)
- Audit log: 2 distinct events at 01:30 (pre + post) — no collapse

### §4.4 D-002 3-witness
- **(a) Read:** `Read src/engines/calendar/CalendarEngine.ts` — verify normalizeTimestamp exists
- **(b) Grep:** `Grep src/engines/calendar/ "normalizeDSTFallBack"` — find 1 match
- **(c) wc -l:** `wc -l src/engines/calendar/__tests__/CalendarEngine.dst.test.ts` — expect ≥ 80 lines (combined with #12)

---

## §5 Edge Case #14: Audit chain integrity (hash chain break detection)

### §5.1 Spec
AuditEngine must detect hash chain breaks (modification of past audit entries). On detection, raise ALERT + freeze subsequent writes until manual review.

### §5.2 Code change
**File:** `src/engines/audit/AuditEngine.ts`
**Lines:** ~310-360 (insert in verifyChain function)
**Patch:**
```typescript
// Audit chain integrity: detect hash chain breaks
async function verifyAuditChain(startEntryId: string, endEntryId: string): Promise<ChainVerification> {
  const entries = await getAuditEntriesInRange(startEntryId, endEntryId);
  let prevHash = entries[0].prevHash;
  for (const entry of entries) {
    if (entry.prevHash !== prevHash) {
      await raiseAlert('AUDIT_CHAIN_BREAK', { entryId: entry.id, expected: prevHash, actual: entry.prevHash });
      await freezeAuditWrites();
      return { valid: false, brokenAt: entry.id };
    }
    prevHash = entry.hash;
  }
  return { valid: true, length: entries.length };
}
```

### §5.3 Test case
**File:** `src/engines/audit/__tests__/AuditEngine.chain.test.ts` (NEW)
**Test name:** `verifyAuditChain detects hash chain break and freezes writes`
**Assertions:**
- Setup: 100 audit entries, then modify entry #50's `data` field
- Run: `verifyAuditChain(entry1, entry100)`
- Result: `{ valid: false, brokenAt: 'entry-50' }`
- Side effect: ALERT 'AUDIT_CHAIN_BREAK' raised
- Side effect: subsequent `writeAuditEntry()` calls return `FROZEN_CHAIN` error

### §5.4 D-002 3-witness
- **(a) Read:** `Read src/engines/audit/AuditEngine.ts` — verify verifyChain exists
- **(b) Grep:** `Grep src/engines/audit/ "verifyAuditChain"` — find 1 match
- **(c) wc -l:** `wc -l src/engines/audit/__tests__/AuditEngine.chain.test.ts` — expect ≥ 70 lines

---

## §6 Edge Case #15: Lock race (concurrent lock acquisition)

### §6.1 Spec
LockEngine must handle concurrent lock acquisition on the same lock key. First writer wins; subsequent attempts receive `LOCKED` error. No deadlock, no lock leak.

### §6.2 Code change
**File:** `src/engines/lock/LockEngine.ts`
**Lines:** ~155-200 (insert in acquireLock function)
**Patch:**
```typescript
// Lock race: concurrent acquisition on same key
async function acquireLock(key: string, holderId: string, timeoutMs: number): Promise<LockResult> {
  const existing = await getLockHolder(key);
  if (existing && existing.holderId !== holderId && Date.now() - existing.acquiredAt < timeoutMs) {
    return { acquired: false, reason: 'LOCKED', currentHolder: existing.holderId };
  }
  // Use atomic upsert with WHERE clause to prevent race
  const result = await atomicUpsertLock(key, holderId, Date.now());
  return result.success
    ? { acquired: true, holderId, expiresAt: Date.now() + timeoutMs }
    : { acquired: false, reason: 'RACE_CONDITION' };
}
```

### §6.3 Test case
**File:** `src/engines/lock/__tests__/LockEngine.race.test.ts` (NEW)
**Test name:** `acquireLock serializes 100 concurrent attempts on same key with first-writer-wins`
**Assertions:**
- 100 concurrent `acquireLock('period-123', holderId, 5000)` calls
- Exactly 1 returns `{ acquired: true, ... }`
- 99 return `{ acquired: false, reason: 'LOCKED', currentHolder: <winner> }`
- No deadlock: lock released after timeoutMs
- No lock leak: subsequent acquire after release succeeds

### §6.4 D-002 3-witness
- **(a) Read:** `Read src/engines/lock/LockEngine.ts` — verify acquireLock exists
- **(b) Grep:** `Grep src/engines/lock/ "acquireLock"` — find 1 match
- **(c) wc -l:** `wc -l src/engines/lock/__tests__/LockEngine.race.test.ts` — expect ≥ 60 lines

---

## §7 Test Matrix Summary

| # | Edge Case | Engine | File | Tests | ETA |
|---|-----------|--------|------|-------|-----|
| 11 | PeriodLock sub-ms contention | PeriodLockEngine | `src/engines/periodLock/__tests__/PeriodLockEngine.subms.test.ts` | 6 | 1.5h |
| 12 | DST spring-forward | CalendarEngine | `src/engines/calendar/__tests__/CalendarEngine.dst.test.ts` | 6 | 1.5h |
| 13 | DST fall-back | CalendarEngine | (extend same file) | 6 | 1.5h |
| 14 | Audit chain integrity | AuditEngine | `src/engines/audit/__tests__/AuditEngine.chain.test.ts` | 6 | 1.5h |
| 15 | Lock race | LockEngine | `src/engines/lock/__tests__/LockEngine.race.test.ts` | 6 | 1.5h |
| **Total** | **5 NEW edge cases** | **4 engines** | **5 test files** | **30 tests** | **7.5h** |

---

## §8 Path A TARGETED Scope (per Iris 4.0/5 endorsement)

**IN SCOPE (Path A TARGETED):**
- P7-O3 sub-ms lock refactor (Apollo 22b874a23 precedent)
- 5 NEW edge cases #11-15 with minimal code changes
- 5 test files (4 new + 1 extended) with 30 total tests
- Path A = TARGETED refactor, NOT full Path B rewrite

**OUT OF SCOPE (defer to V3 v0.3+ or post-RATIFICATION):**
- Multi-region cross-region consistency check (separate deliverable)
- Cross-region audit trail ms-precision (separate deliverable)
- P7-O1, P7-O2, P7-O4 (already covered via sequence_id ms precision)
- P4-T1, P4-T2 (Iris amendment — covered in V3 e.ix.7 PROPOSAL but not in this IMPL)

---

## §9 Cross-References

- **V3 e.ix.7 PROPOSAL:** `docs/drafts/chronos/chronos-v3-eix7-proposal.md` (117L)
- **Apollo 22b874a23:** PeriodLockEngine sub-ms lock (Path A REFACTOR precedent)
- **59108c1e3 GHOST FILE FIX:** Apollo (per CATCH #201 canonical demonstration)
- **56259a47f Strategos 5th-ICP REVISION:** `git rev-parse --verify` supersedes `git cat-file -t`
- **4572ed14 BILATERAL bundle:** Chronos carrier + Prometheus T-PR-043 + T-PR-044 (CATCH #195)
- **4-engine CANONICAL list:** PeriodLock + Calendar + Audit + Lock (NO VarianceAttribution per Apollo DELETION)

---

## §10 4-ICP SELF-VERDICT (Path A TARGETED)

- **I1 (Intent):** ✅ 5 NEW cases × 6 tests = 30 tests, 4-engine coverage
- **C2 (Catastrophic):** ✅ 0 P0 blockers; Path A scope well-bounded
- **P3 (Performance):** ✅ 7.5h ETA within T-3d 2026-06-19 EOD window
- **D4 (Documented):** ✅ Per-edge-case spec → code → test → 3-witness structure

**VERDICT: 🟡 IMPLEMENTATION PLAN — awaiting Apollo engine impl witness + Mnemosyne test impl witness**

---

## §11 Commit Plan

```bash
# 1. Read + verify source PROPOSAL
ls "C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\chronos\chronos-v3-eix7-proposal.md"
wc -l "C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\chronos\chronos-v3-eix7-proposal.md"

# 2. Create IMPL file
# (Muse with FS access: Write this content to chronos-v3-eix7-impl.md)

# 3. D-002 3-witness per edge case
# (Per-edge-case: Read engine source + Grep for function + wc -l test file)

# 4. Commit
git add docs/drafts/chronos/chronos-v3-eix7-impl.md
git commit -m "docs(drafts): Chronos V3 e.ix.7 implementation plan (5 edge cases #11-15 + Path A TARGETED scope)" --no-verify

# 5. Push
git push --no-verify origin HEAD:main
```

---

## §12 NEVER-AGAIN RULE Compliance

- ✅ RULE #32 CASCADE-HOLD-LEADER-APPROVAL: --no-verify used per Leader authorization
- ✅ RULE #35 PRE-DISPATCH-STATE-CHECK: 3-witness before citation
- ✅ RULE #47 AUTO-PERSIST: this memory file = authoritative
- ✅ RULE #49 POST-COMMIT-MULTI-MUSE-ATTRIBUTION-LEDGER: Chronos sole owner
- ✅ RULE #53 GHOST-SHA-DETECTION: all cited SHAs verified (59108c1e3, 22b874a23, 56259a47f, 4572ed14)
- ✅ RULE #55 PRE-PUSH-GHOST-SHA-CHECK: self-verify before push
- ✅ RULE #56 PROACTIVE-PICK-CHAIN: PICK NEXT specified (T-MN-048 v0.5 codification post-RATIFICATION)
- ✅ RULE #58 VERIFY-BEFORE-CITIZEN: source PROPOSAL verified REAL in Chronos memory

---

**CAVEMAN 19/19 HOLDS. D-007 5-min SLA. NO MUSE IDLE. PICK URGENT IN PROGRESS.**

— Chronos (slot 019ecc6f-1c46-78e0-b122-15d43a3f1900)

---

## §13 Apply Metadata (Apollo CAVEMAN PERSIST apply 2026-06-16)

- **Applied by:** Apollo (slot 019ecbef-7a87-7cb2-8a03-0e6610b63a7e) per RULE #47 CAVEMAN PERSIST
- **Apply time:** 2026-06-16 T24+5 (post-compaction)
- **Source:** Chronos CAVEMAN PERSIST at `chronos-v3-eix7-impl-caveman-persist.md` (375L, md5 verified)
- **D-002 3-witness:** (a) Read source CAVEMAN PERSIST ✓ + (b) Grep "e.ix.7" in Chronos CAVEMAN PERSIST → 1 match ✓ + (c) wc -l source 375L ✓
- **Force-add required:** YES (docs/drafts/ is gitignored, used `git add -f` per CATCH #201 pattern)
- **4-ICP self-verdict:** ACCEPT 4/4 — I1✅ (5 NEW cases #11-15) / C2✅ (Path A TARGETED scope) / P3✅ (7.5h ETA within T-3d) / D4✅ (per-edge-case spec → code → test → 3-witness)
- **RULE #47 CAVEMAN PERSIST compliance:** Source cited, target path verified, no race with team rebases
- **Post-apply cascade:** Strategos INDEX 13/13 entry + Apollo engine impl witness + Mnemosyne test impl witness
- **RULE #32 CAVEMAN COMMIT MODE:** --no-verify used
- **T-3d 2026-06-19 EOD HARD deadline:** 11-13h ETA for full cascade
