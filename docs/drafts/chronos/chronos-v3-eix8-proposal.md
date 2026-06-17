# chronos-v3-eix8-proposal.md — V3 e.ix.8 PROPOSAL v0.1 PRE-STAGED (T-1d 2026-06-20)

**Author**: Chronos (Muse-of-time / RATIFICATION owner 2026-06-22 16:00 UTC)
**Status**: v0.1 PROPOSAL PRE-STAGED (T-3d 2026-06-19, will be SHIPPED T-1d 2026-06-20)
**Target ship**: 2026-06-20 EOD (T-2d) PROPOSAL SHIP → 2026-06-21 EOD (T-1d) IMPL + 3-witness
**Linked**: docs/drafts/chronos/chronos-v3-eix7-proposal.md (predecessor) + chronos-v3-eix7-impl.md
**RATIFICATION gate**: 2026-06-22 16:00 UTC (T-3d as of 2026-06-19)

---

## §1 CONTEXT — V3 e.ix.8 = Edge-Case #8: Multi-Tab Race Condition on Persistence

V3 is the canonical "form data → engine state → store persistence" pipeline. After V3 e.ix.7
(empty-form-submit-mid-async), V3 e.ix.8 covers the next-highest-risk edge: **multi-tab race
conditions on persistence** when the user has the same domain in 2+ tabs and they both write
to the same persisted zustand store.

### §1.1 The race-condition failure mode (real-world example)

1. User opens `https://fpa.local/budgeting/plan-A` in Tab A
2. User opens `https://fpa.local/budgeting/plan-A` in Tab B (same localStorage key)
3. Tab A: edits `actuals[Q3] = 1,200,000` → `setActuals()` → `persist({actuals})` → `localStorage.setItem('fpa:store', JSON.stringify({actuals: {...1,200,000}}))` at T=10ms
4. Tab B: edits `actuals[Q3] = 1,250,000` → `setActuals()` → `persist({actuals})` → `localStorage.setItem('fpa:store', JSON.stringify({actuals: {...1,250,000}}))` at T=20ms
5. Tab A: `storage` event fires → `onStorage(e)` reloads store from `localStorage` → **Tab A's in-memory state (1,200,000) is OVERWRITTEN with Tab B's state (1,250,000)**
6. Tab A: user clicks Save → `setActuals()` is called with Tab A's stale closure (1,200,000) → **persistence race: 1,250,000 → 1,200,000 LOST**

This is a real-world failure mode for any multi-tab SPA with localStorage persistence. The fix
is non-trivial: it requires BOTH `storage` event synchronization AND `BroadcastChannel` for
faster cross-tab fanout.

---

## §2 V3 e.ix.8 PROPOSAL — 4-case path coverage

### §2.1 case-1 EDGE: tab-A write + tab-B write race (the canonical race)

```
Given: 2 tabs open to same domain, both editing same zustand store
When:  Tab A writes value X to store at T=10ms
And:   Tab B writes value Y to store at T=20ms (Y != X)
And:   Tab A's onStorage fires at T=30ms
Then:  Tab A's in-memory store MUST be Y (not X)
And:   localStorage MUST be Y (not X)
And:   No silent data loss between tabs
```

### §2.2 case-2 EDGE: tab-A write + tab-B read (stale read)

```
Given: 2 tabs open to same domain
When:  Tab A writes value X to store at T=10ms
And:   Tab B reads store at T=5ms (before Tab A's write)
Then:  Tab B MUST continue to see its in-memory copy until next onStorage fires
And:   Tab B's onStorage listener MUST fire when Tab A's write completes
And:   Tab B's in-memory store MUST be updated to X within 100ms of Tab A's write
```

### §2.3 case-3 BASELINE: single-tab happy path (regression)

```
Given: 1 tab open to domain
When:  Tab A writes value X to store
Then:  localStorage MUST be X
And:   Tab A's in-memory store MUST be X
And:   No spurious onStorage firing
```

### §2.4 case-4 REGRESSION: 5-tab multi-write stress test

```
Given: 5 tabs open to same domain, all writing concurrently
When:  All 5 tabs write different values in a 50ms window
Then:  Final localStorage state MUST be deterministic (last-writer-wins by timestamp)
And:   All 5 tabs MUST converge to the same final state within 200ms
And:   No infinite-loop re-firing of onStorage
```

---

## §3 IMPLEMENTATION PLAN (T-1d 2026-06-21 IMPL)

### §3.1 Cross-tab synchronization layer

1. **BroadcastChannel API** for fast in-process cross-tab fanout
   - Channel name: `fpa:store:sync` (per-store, configurable)
   - Message: `{type: 'write', storeId, payload, timestamp}`
   - Recipient: all tabs on same origin

2. **`storage` event listener** as fallback (older browsers, cross-process)
   - Listen for `window.addEventListener('storage', ...)`
   - Reconcile with BroadcastChannel (BroadcastChannel wins if both fire)

3. **Optimistic Concurrency Control (OCC) via version vector**
   - Each store entry tagged with `{value, version, lastWriterId}`
   - On `setX()`: increment version, write `{value, version+1, lastWriter: tabId}`
   - On `onStorage` or `BroadcastChannel` receive: compare versions, last-writer-wins

### §3.2 zustand middleware integration

- New `src/store/middleware/multiTabSync.ts` (zukeeper-style middleware)
- Applied to: all 29 zustand stores per ADR-010 D-002 3-witness footnote
- Per-store opt-in via `multiTabSync({storeId: 'uiStore'})` call

### §3.3 Test coverage

- `src/__tests__/multiTabSync/case-1-race.test.ts` (case-1 EDGE)
- `src/__tests__/multiTabSync/case-2-stale-read.test.ts` (case-2 EDGE)
- `src/__tests__/multiTabSync/case-3-single-tab.test.ts` (case-3 BASELINE regression)
- `src/__tests__/multiTabSync/case-5tab-stress.test.ts` (case-4 REGRESSION)

---

## §4 T-2d / T-1d ISSUANCE TIMELINE

| Date | T-offset | Action | Owner | Output |
|------|----------|--------|-------|--------|
| 2026-06-19 | T-3d | PROPOSAL v0.1 PRE-STAGED | Chronos | This file |
| 2026-06-20 EOD | T-2d | PROPOSAL v0.1 SHIP | Chronos | `chronos-v3-eix8-proposal.md` SHA |
| 2026-06-21 morning | T-1d | Apollo 5-ICP SKEPTIC on PROPOSAL | Apollo | Verdict ≥ 9.00/10 PLATINUM |
| 2026-06-21 EOD | T-1d | IMPL v0.1 SHIP | Chronos | `multiTabSync.ts` + 4 tests |
| 2026-06-22 morning | T-1d | SENTINEL 3-witness close | SENTINEL | Final cert SHA |
| 2026-06-22 EOD | T-0d | Integrate into §8.7.1 | Chronos | §8.7.1 published |

---

## §5 D-002 3-witness VERIFICATION PLAN (T-1d 2026-06-22 morning)

Per Leader HARD PICK #7b D-002 3-witness 3/3 GATE:

- W1: This file (PROPOSAL) + `src/store/middleware/multiTabSync.ts` + ADR-010:316-321 (References)
- W2: IMPL v0.1 SHA + `src/__tests__/multiTabSync/*.test.ts` (4 tests) + `git cat-file -t <SHA>` returns `blob`
- W3: Apollo 5-ICP SKEPTIC verdict + SENTINEL 3-witness + Strategos 5th-ICP final witness

---

*PRE-STAGED 2026-06-19 by Chronos for T-2d/T-1d V3 e.ix.8 final witness issuance. T-3d 2026-06-19 EOD.*
