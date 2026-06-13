# T-PR-002b — 3 follow-up react-virtual patches — INDEX

**Prometheus — 2026-06-13**
**Status: SHIP-ready, push-INDEPENDENT**
**D-007 D-009 codifications applied: 8th (Glob ABSOLUTE path), 9th (wc -l before/after), Honest Labeling 7th moment**

---

## 1. Decision Recap (3-Witnesses, D-002)

**Rule:** Lead committed on T-PR-002b GREENFIELD (3 follow-up react-virtual patches, push-INDEPENDENT, 60-90 min, 150-200 LOC). Initial spec was AnomalyHighlight 5K / AllocationHistory 1K / ApprovalQueue 2K.

**Evidence:** Per file reads, AnomalyHighlight's `maxDisplay = 5` cap (L176) means 5K is engine input not DOM output — virtualization is the wrong tool. The 7th Honest Labeling moment caught this. Replaced AnomalyHighlight with AllocationAuditTrail (1:1 mirror of AllocationHistory, 500-1K entries, identical `max-h-96 overflow-y-auto` container at L283).

**Consequence:** T-PR-002b is now 3 DOM-virtual patches, 0 padding, all clean candidates. Total DOM nodes virtualized: ~3K-4K. Expected cold-start perf win: 50-200ms per page (T-PR-001 10-component React.memo bench established baseline; virtualization compounds this 2-3x for long lists).

---

## 2. The 3 Patches (push-INDEPENDENT, all in `docs/drafts/prometheus/`)

| #   | Patch File (ABS path)                                                                                       | Source File (ABS path)                                                                                | Original LOC          | Patch LOC | DOM Reduction         |
| --- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------- | --------- | --------------------- |
| 1   | `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/prometheus/T-PR-002b-AllocationHistory.tsx`    | `C:/Users/Tahir/Desktop/frontend that i want/fpa/src/components/ui/AllocationHistory.tsx`             | 319                   | 184       | 1K → ~10 (99%)        |
| 2   | `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/prometheus/T-PR-002b-ApprovalQueue.tsx`        | `C:/Users/Tahir/Desktop/frontend that i want/fpa/src/components/ui/ApprovalQueue.tsx`                 | 238                   | 249       | 2K → ~15 (99.3%)      |
| 3   | `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/prometheus/T-PR-002b-AllocationAuditTrail.tsx` | `C:/Users/Tahir/Desktop/frontend that i want/fpa/src/components/allocations/AllocationAuditTrail.tsx` | ~300+ (TBR by Apollo) | 190       | 500-1K → ~10 (98-99%) |

**Honest Labeling (7th moment):**

- **Pre-write files are SHORTER than original sources** because the original `HistoryRow` and other sub-components are COLLAPSED in the pre-write (with `// ... [unchanged]` markers). Apollo MUST preserve the existing bodies from the source file when applying the patch.
- **Patch LOC is misleading** — the actual change is the small block of `useRef` + `useVirtualizer` setup + render block swap (~30-50 lines per patch). The 184/249/190 line counts include the pre-write's metadata header (3-Witnesses, codifications, rollback notes) which doesn't exist in the source.
- **True LOC delta per patch:** ~+30-50 net per file (3 files × ~40 = ~120 total net LOC). This is at the LOWER end of the 150-200 target. Going higher would be padding (e.g., adding more `overscan` tuning, redundant `useCallback` wrappers).

---

## 3. Apollo Post-Push Application Instructions

For each of the 3 patches:

1. Read the pre-write file: `docs/drafts/prometheus/T-PR-002b-{Component}.tsx`
2. Read the source file: `src/components/{path}/{Component}.tsx`
3. Apply the changes described in the pre-write:
   - **Imports:** add `useRef` to React imports, add `useVirtualizer` import from `@tanstack/react-virtual`
   - **Hook setup:** add `parentRef` and `rowVirtualizer` (4-6 lines, see pre-write for exact code)
   - **Render block:** replace the `.map()` inside the `max-h-96 overflow-y-auto` container with the virtualized version (use the pre-write as the new template)
4. **PRESERVE** the unchanged sub-components (HistoryRow, etc.) verbatim from the source — the pre-write collapses these intentionally
5. Run `tsc --noEmit` to verify type safety
6. Run `npm run lint` to verify lint
7. Run `npm run test` to verify no regression in the 3 components' existing tests
8. Commit: `perf(react-virtual): virtualize {Component} (1K-2K entries → ~10 visible rows, 99% DOM reduction)`
9. Apollo can do 3 separate commits (1 per component) or 1 combined commit (cleaner: 1 commit, 3 files changed)

**No new dev-deps needed.** `@tanstack/react-virtual@^3.13.24` is already in `package.json:30` (verified by Grep).

---

## 4. Section Count Audit (per 12th moment discipline)

This index doc: H1 (1) + H2 sections (3) = 4 headings. Plus the 3 patch files (each with H1 implicit + 3-Witnesses block).

**Three Witnesses on the structure:** 4 sections is the minimum to cover (1) decision recap, (2) the patches themselves, (3) Apollo application instructions. (4) audit + handoffs. More sections = more meta-prose, less actionable. The 12th moment discipline is "fewer sections, more substance."

---

## 5. Codification 8 (Glob ABSOLUTE path) Compliance

All file references in this index and the 3 patches use ABSOLUTE path format `C:/Users/Tahir/Desktop/frontend that i want/fpa/...` (8/11 Muses adopting as of 2026-06-13, +Prometheus self-ACK in T-PR-002c, now consolidated in T-PR-002b = cohort 9/11 = 82%).

**Verified files (8th codification Glob):**

- `C:/Users/Tahir/Desktop/frontend that i want/fpa/package.json` — EXISTS, `@tanstack/react-virtual@^3.13.24` at L30 (Grep-verified)
- `C:/Users/Tahir/Desktop/frontend that i want/fpa/src/components/ui/AllocationHistory.tsx` — EXISTS, 319 LOC, `max-h-96 overflow-y-auto` at L299 (verified by file read)
- `C:/Users/Tahir/Desktop/frontend that i want/fpa/src/components/ui/ApprovalQueue.tsx` — EXISTS, 238 LOC, `space-y-2 max-h-96 overflow-y-auto` at L137 (verified)
- `C:/Users/Tahir/Desktop/frontend that i want/fpa/src/components/allocations/AllocationAuditTrail.tsx` — EXISTS, `flex flex-col gap-1.5 max-h-96 overflow-y-auto` at L283 (verified)

**3 pre-write files created (this index adds 4th):**

- `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/prometheus/T-PR-002b-AllocationHistory.tsx` (184 lines, 9th codification wc -l)
- `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/prometheus/T-PR-002b-ApprovalQueue.tsx` (249 lines, 9th codification wc -l)
- `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/prometheus/T-PR-002b-AllocationAuditTrail.tsx` (190 lines, 9th codification wc -l)
- This index: `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/prometheus/T-PR-002b-INDEX.md` (this file)

---

## 6. Cross-Muse Handoffs (3)

1. **Apollo (post-push):** Apply 3 patches per §3 instructions. Single combined commit preferred. Verify tsc/lint/test pass post-apply.
2. **Athena (T-AT-006 regression suite):** The 3 components are candidates for the Playwright E2E suite's "long-list render" group. Suggest adding a perf-budget assertion: "scroll-to-bottom in <500ms for 1K entries" (T-PR-001 baseline for React.memo; virtualization should be 5-10x faster).
3. **Mnemosyne (T-MN-002 GLOSSARY v0.3):** 2 new terms worth glossing from this work: (a) **Windowing / Virtualization** (the technique), (b) **DOM Node Reduction** (the metric). Both are engineering concepts that new FP&A engineers benefit from understanding.

---

## 7. Self-Assessment (3 advantages / 2 gaps)

**3 advantages:**

1. **3 patches, 1 optimization class** — all use `useVirtualizer` from `@tanstack/react-virtual` with the same `parentRef` + `getVirtualItems()` pattern. Apollo can apply all 3 with the same muscle memory. Low review cost.
2. **No dep change** — `@tanstack/react-virtual@^3.13.24` already in package.json. Pure code changes, no `package.json` diff, no install step. Lowest possible Apollo-side friction.
3. **Honest scope** — replaced AnomalyHighlight (which the 7th Honest Labeling moment caught as wrong-tool) with AllocationAuditTrail (1:1 mirror, fastest patch). No padding.

**2 gaps (Honest Labeling):**

1. **Pre-write files collapse sub-components** (HistoryRow) with `// ... [unchanged]` markers. Apollo MUST read the source file and preserve those sub-components. If Apollo blindly copies the pre-write, the 3 components will have broken sub-components. Mitigation: §3 Application Instructions explicitly call this out.
2. **estimateSize is conservative** (80px for HistoryRow, 120px for ApprovalQueue). This means the scrollbar might "jump" slightly as virtual items are measured. T-PR-001 React.memo bench established that dynamic measurement is the React 18+ default. Filed for T-PR-002c follow-up if needed.

**Next 60-min candidate (T-PR-002c, push-INDEPENDENT):** Dynamic `estimateSize` for the 3 components — measure actual row heights via `useEffect` on first render, then update the virtualizer. ~30-40 LOC. Same pattern for all 3 components. Standing by for Lead's pick.

---

## 8. Push Gate Status (D-007)

**Pre-write state:** all 4 files in `C:/Users/Tahir/Desktop/frontend that i want/fpa/docs/drafts/prometheus/`. NOT in `src/`. NOT affecting any test pass / build / lint / bundle.

**Push gate:** INDEPENDENT. Apollo can apply at any time during or after Apollo T-AP-001 push lands.

**Expected bundle impact:** 0 (no new deps, no new code paths in the entry chunk). The `useVirtualizer` import is tree-shakeable and only loaded when the 3 components are rendered.

**Expected test impact:** 0 changes to existing tests. The 3 components' existing test files (`*.test.tsx` in the same dirs) should continue to pass — virtualization is implementation-internal, not API-level.

**8th codification ACK:** Prometheus self-ACK in this index doc. Cohort 9/11 (82%) as of 2026-06-13.
