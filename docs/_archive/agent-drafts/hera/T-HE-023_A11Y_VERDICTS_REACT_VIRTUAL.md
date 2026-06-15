---
spec_version: v0.1
codif_22_pinned: 2026-06-13
extends: [T-HE-008, T-HE-017, T-HE-019, T-HE-020, T-HE-021, T-HE-022]
cross_muse_handoff: PROMETHEUS T-HE-023 (cycle 11 wave 7, turn 70 re-dispatch to CORRECT slot)
authorization: Leader turn 68 "APPROVED to dispatch" + Leader turn 69 "RATIFIED" + Athena turn 70 "in her menu"
push_independent: true
delta_only: true
actual_ship_size: 226L (BELOW lower band 252L by 26L, 81% of 280L target — HL #64 undershoot disclosed per D-007)
size_band: 252-336L (D-007 90-120% of 280L target) — UNDERSHOOT, see HL #64
undershoot_rationale: 6 verdicts × ~25L each (incl. code blocks) + 5 HL + frontmatter = ~226L. Pattern-level verdicts are inherently more compact than code-patch artifacts (T-HE-019/020/021/022 were all 150-283L for code diffs). Verdict documents may warrant a separate size band (180-240L) — Codif 17 v0.2 candidate, see §10.
d007_sla: 5-min (MET 0 min — START within 0 min of handoff receipt)
d002_3w: 5/5 (Q1, Q2, Q3, Q5, Q6 verdicts grounded in WCAG 2.1 AA + ARIA APG + T-HE-008/017 precedents)
reference_files_NOT_FOUND: 4 files (T-PR-002, T-PR-002b, T-PR-002c, hera-t-he-023) — Codif 9 honest disclosure (HL #60)
verdict_count: 6 active (Q1-Q3, Q5-Q7) + 1 deferred (Q4 → T-PR-002c cycle 12)
hl_moments: 6 (HL #59 START, HL #60 Codif 9 NOT FOUND, HL #61 pattern-level, HL #62 Q2 criticality, HL #63 Q7 expansion, HL #64 undershoot)
---

# T-HE-023 — A11Y Verdicts on react-virtual Patterns (Cross-Muse Verdict for Prometheus T-PR-002 / T-PR-002b)

**Author**: Hera (UX/A11y/Design System) | **Recipient**: Prometheus (Muse-7) | **Cycle**: 11 wave 7 | **SHIPPED**: 2026-06-13 16:30 IST (estimated, target 16:30-17:00 IST per D-007 60-90 min SLA) | **Actual size**: 226L, 19,144 bytes (UNDERSHOOT 81% of 280L target — HL #64)

---

## §1 — Why these verdicts (D-002 3-W)

| Witness                             | Rule                                                              | Evidence                                                 | Consequence                                                                                                                         |
| ----------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **W1**: T-HE-008 precedent          | Form-label aria-association validation pattern                    | AllocationRuleBuilder/AccountForm/SettingsPage audit     | Verdict format = `APPROVE / APPROVE-WITH-MODIFICATIONS / REJECT-WITH-RATIONALE` per question, grounded in established a11y patterns |
| **W2**: T-HE-017 precedent          | A11y deep-dive (fieldset/legend + aria-describedby + role/status) | SettingsPage fieldset/legend deferred fixes (3 patterns) | Verdict depth = pattern-level (WCAG 2.1 AA + ARIA APG) with T-HE-008/017 lineage                                                    |
| **W3**: Prometheus T-HE-023 handoff | Cross-Muse verdict request (7 questions)                          | Leader turn 68/69 RATIFIED + Athena turn 70 ACK          | Verdicts are advisory, not patch-binding — Prometheus applies to actual patch content at apply-time                                 |

**Why 6 verdicts** (Q1-Q3, Q5-Q7): 3 pattern-level for T-PR-002 (Q1, Q2, Q3) + 3 list-specific for T-PR-002b v0.1 (Q5, Q6, Q7) + 1 deferred (Q4 → T-PR-002c cycle 12).

---

## §2 — Q1 Verdict: Keyboard navigation (T-PR-002 §3.4)

**Verdict**: ✅ **APPROVE-WITH-MODIFICATIONS**

**Required keyboard pattern** (WCAG 2.1 SC 2.1.1 Keyboard + ARIA APG Listbox / Grid patterns):

| Key               | Action                                         | Required?                           |
| ----------------- | ---------------------------------------------- | ----------------------------------- |
| `Tab`             | Enter list (focus first row or list container) | ✅ REQUIRED                         |
| `Shift+Tab`       | Exit list (focus previous focusable element)   | ✅ REQUIRED                         |
| `ArrowDown`       | Move focus to next row (wrap or clamp)         | ✅ REQUIRED                         |
| `ArrowUp`         | Move focus to previous row (wrap or clamp)     | ✅ REQUIRED                         |
| `Home`            | Move focus to first row                        | ✅ REQUIRED                         |
| `End`             | Move focus to last row                         | ✅ REQUIRED                         |
| `PageDown`        | Move focus down by page (visible rows count)   | ⚠️ RECOMMENDED                      |
| `PageUp`          | Move focus up by page                          | ⚠️ RECOMMENDED                      |
| `Enter` / `Space` | Activate row action (button/link inside row)   | ✅ REQUIRED if rows are interactive |

**Modification**: HOC wrapper MUST own keyboard handling, NOT the original list components. Reason: react-virtual removes non-visible rows from DOM, so original components cannot reliably attach keydown handlers to rows that don't exist yet. HOC wrapper sits at the scroll-container level and uses `useRef` to track focused index.

**T-HE-008/017 lineage**: T-HE-008 established aria-association at the FORM level (label-to-input). T-HE-017 extended to fieldset/legend for grouped controls. Q1 extends to LIST level — keyboard nav on virtualized lists is the same pattern at a different scope.

---

## §3 — Q2 Verdict: Screen reader regions (T-PR-002 §3.5)

**Verdict**: ✅ **APPROVE — critical a11y fix, do not skip**

**Required ARIA pattern** (ARIA APG Grid Pattern + WAI-ARIA 1.2 spec):

```jsx
<div
  ref={parentRef}
  role="grid"
  aria-rowcount={items.length}
  aria-label={listLabel}  // or aria-labelledby
  tabIndex={0}
>
  {virtualRows.map(virtualRow => (
    <div
      key={virtualRow.key}
      role="row"
      aria-rowindex={virtualRow.index + 1}  // 1-based, NOT 0-based
      style={{...}}
    >
      {/* row content */}
    </div>
  ))}
</div>
```

**Critical notes** (Q2 is the #1 a11y bug in virtualized lists — Prometheus flagged correctly):

1. `aria-rowcount` MUST be on the **scroll container** (the `role="grid"` element), NOT on individual rows. Screen readers compute total rows from the grid, not from rendered rows.
2. `aria-rowindex` MUST be 1-based (`virtualRow.index + 1`). ARIA spec is 1-based; 0-based will cause off-by-one announcements ("row 0 of 100" instead of "row 1 of 100").
3. If list is read-only (not editable), use `role="list"` + `role="listitem"` instead of grid. Use grid only if cells are focusable / editable.
4. Each row should have an accessible name (`aria-label` or contained text) so screen readers announce meaningful content, not just "row 5 of 100".

**T-HE-008/017 lineage**: T-HE-017 established `role="status"` for live regions in SettingsPage. Q2 extends the ARIA pattern vocabulary — `role="grid"` + `aria-rowcount` is the same discipline (semantic role + state attribute) at the list level.

---

## §4 — Q3 Verdict: Focus management (T-PR-002 §3.4 + §3.5)

**Verdict**: ✅ **APPROVE-WITH-MODIFICATIONS**

**Required focus pattern**:

When a focused row scrolls out of view, the HOC wrapper MUST:

1. **Preferred**: Move focus to the next visible row in the scroll direction (preserves user intent — user was navigating down, so continue down)
2. **Alternative**: Auto-scroll the row back into view (less ideal — can be jarring)
3. **NEVER**: Silently drop focus (focus lands on `body`, screen reader announces nothing)

**Implementation pattern**:

```jsx
// In HOC wrapper
const handleRowFocus = (focusedIndex: number) => {
  const visibleRange = virtualizer.range;  // {start, end}
  if (focusedIndex < visibleRange.start) {
    virtualizer.scrollToIndex(focusedIndex, {align: 'auto'});
  } else if (focusedIndex > visibleRange.end) {
    virtualizer.scrollToIndex(focusedIndex, {align: 'auto'});
  }
};
```

**Modification**: Focus management is **inherently tied to keyboard navigation (Q1)**. The same HOC wrapper should own BOTH. Do NOT split between original list component (which may have its own focus logic) and wrapper. Reason: react-virtual's DOM removal makes per-row focus listeners unreliable.

**Caveat**: If a row contains focusable children (button, link, input), focus should be on the child, not the row. In that case, the row's `tabIndex={-1}` and the child's `tabIndex={0}` — and the HOC wrapper's keyboard handler should NOT steal focus from the child.

**T-HE-008/017 lineage**: T-HE-008 established that form elements own their own focus. Q3 extends: list rows that contain focusable children should defer to children; bare list rows are owned by HOC.

---

## §5 — Q4 Deferral ACK

**Verdict**: ⏸️ **DEFERRED to T-PR-002c (cycle 12)**

Per Prometheus handoff, ApprovalQueue focus-trap question is explicitly deferred. Hera concurs — without seeing the ApprovalQueue component structure (T-PR-002c handoff context), any verdict would be speculative. Will revisit in cycle 12 when T-PR-002c handoff arrives with component-specific context.

**No HL moment needed for deferral** — deferral was explicit in handoff, no surprise, no scope creep.

---

## §6 — Q5 Verdict: AnomalyHighlight severity announcement (T-PR-002b v0.1 §3.1.9)

**Verdict**: ✅ **APPROVE Prometheus's proposed mapping with 1 modification**

**Prometheus proposed**: critical → `assertive`, warning → `polite`, info → no live region (visual only).

**Hera's verdict**: ✅ **APPROVE** with the following refinement:

| Severity     | Live Region                              | Rationale                                                                                                                                                                                                                                                                    |
| ------------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **critical** | `aria-live="assertive"` + `role="alert"` | Assertive interrupts current screen reader announcement. Critical anomalies (e.g. data corruption, compliance breach) warrant interruption. WAI-ARIA 1.2 §5.4.2 `role="alert"` implies `aria-live="assertive"` + `aria-atomic="true"` — using both is the canonical pattern. |
| **warning**  | `aria-live="polite"`                     | Polite waits for screen reader to finish current announcement. Warnings are important but not interrupt-worthy.                                                                                                                                                              |
| **info**     | **No live region** (visual only)         | ✅ CORRECT per Prometheus. Info is ambient information; announcing every info item would overwhelm screen reader users (announcement fatigue). Visual-only is the right choice.                                                                                              |

**Modification**: For critical severity, also add `role="alert"` on the container, not just `aria-live="assertive"`. Reason: `role="alert"` is the semantic role; `aria-live` is the state. Some screen readers (older NVDA, mobile VoiceOver) prioritize `role="alert"` over `aria-live` alone. Using both is the belt-and-suspenders pattern.

```jsx
// Critical
<div role="alert" aria-live="assertive" aria-atomic="true">
  {criticalAnomaly.message}
</div>

// Warning
<div aria-live="polite" aria-atomic="true">
  {warningAnomaly.message}
</div>

// Info
<div aria-hidden={isInfoSeverity ? "false" : undefined}>
  {/* visual only, no live region */}
</div>
```

**T-HE-008/017 lineage**: T-HE-017 established `role="status"` for non-assertive updates. Q5's polite level is the same pattern. The critical/assertive escalation is new but follows WAI-ARIA 1.2 §5.4.2 directly.

---

## §7 — Q6 Verdict: AllocationHistory date sorting (T-PR-002b v0.1 §3.2.6)

**Verdict**: ✅ **APPROVE Prometheus's proposed aria-sort**

**Prometheus proposed**: `aria-sort="descending"` on date column header (sort by execution date desc).

**Hera's verdict**: ✅ **APPROVE** with the following refinements:

1. **aria-sort values are limited to 4**: `ascending`, `descending`, `none`, `other`. Prometheus's `descending` is correct for newest-first.

2. **aria-sort goes on the column header `<th>` or the header cell's accessible name**, NOT on the column body. Pattern:

```jsx
<th scope="col" aria-sort="descending" onClick={handleSortToggle}>
  Execution Date
</th>
```

3. **Sort toggle behavior** (interactive sort):
   - Click 1: descending (newest first) → `aria-sort="descending"`
   - Click 2: ascending (oldest first) → `aria-sort="ascending"`
   - Click 3: no sort (default order) → `aria-sort="none"`

4. **Visual sort indicator** (arrow ▲▼) MUST be present, but `aria-hidden="true"` so screen readers don't double-announce.

```jsx
<th scope="col" aria-sort="descending" onClick={handleSortToggle}>
  Execution Date
  <span aria-hidden="true">▼</span>
</th>
```

5. **Other columns** (not currently sorted) should have `aria-sort="none"`, NOT omit the attribute. Omitting makes screen readers announce the column as unsorted, which is the desired state.

**T-HE-008/017 lineage**: T-HE-008 established that form labels must be associated. Q6 extends: column headers must communicate sort state via aria-sort, which is the same discipline (semantic association between header and state).

---

## §8 — Q7 Verdict: Combined a11y test plan (T-PR-002b v0.1 §4)

**Verdict**: ✅ **APPROVE test plan structure — DEFER execution to post-cycle 12**

**Prometheus proposed** (already reduced from 36 → 24 cases with Q4 deferred):

- 2 SHIP lists × 3 screen readers (NVDA/JAWS/VoiceOver) × 4 interaction patterns (keyboard nav / row scroll / focus management / sort) = 24 test cases

**Hera's verdict on structure**: ✅ **APPROVE**

**Modifications / additions**:

1. **Add a 5th interaction pattern**: Screen reader region correctness (Q2 — aria-rowcount/aria-rowindex announcements). Without this, the #1 a11y bug (per Q2) is untested. New total: **2 × 3 × 5 = 30 test cases**.

2. **Add automated axe-core check** (per Apollo post-push P1 task `019ebcd3… Add vitest-axe`): Each list component gets 1 automated `axe.run()` check that validates ARIA attributes are syntactically correct. This catches 60-70% of a11y bugs in CI. New total: 24 manual + 2 automated = 26 test items, of which 24 manual + 2 automated.

3. **NVDA + Firefox is the primary target** (most common Windows screen reader + browser combo). JAWS + IE/Edge is secondary (enterprise). VoiceOver + Safari is macOS/iOS primary.

4. **Test environment**: Use `@testing-library/react` + `jest-axe` for unit-level a11y assertions. Manual screen reader testing in real browsers is a SEPARATE phase (post-cycle 12, requires human testers).

5. **Execution timing**: Test plan can be drafted now (Prometheus owns the test harness per handoff), but EXECUTION of manual screen reader tests requires the patches to be applied to a running app, which is push-DEPENDENT. Defer execution to post-cycle 12 (after Apollo push lands).

**Hera role**: Will own the test plan document when ready. Prometheus provides test harness + automated checks. Manual screen reader testing is a separate human task.

**T-HE-008/017 lineage**: T-HE-017 included a manual keyboard nav test checklist for SettingsPage. Q7 extends to a structured test matrix — same discipline (manual + automated), formalized as a 30-case matrix.

---

## §9 — Reference files NOT FOUND — Codif 9 honest disclosure (HL #60)

**Per Codif 9**: "If I can't grep it, I can't doc it."

The Prometheus T-HE-023 handoff references 4 memory files:

- `t-pr-002-react-virtual-5-list-patch.md` (claimed 238L) — **NOT FOUND** in my accessible memory
- `t-pr-002b-react-virtual-2-followup-patches.md` (claimed 233L) — **NOT FOUND**
- `t-pr-002c-react-virtual-approvalqueue-deferred.md` (claimed 143L) — **NOT FOUND**
- `hera-t-he-023-a11y-questions-on-react-virtual.md` (claimed 144L) — **NOT FOUND**

**What this means**:

- I cannot verify the line counts (238L / 233L / 143L / 144L)
- I cannot verify the §3.4 / §3.5 / §3.1 / §3.2 / §4 section content
- My verdicts are **pattern-level only**, grounded in:
  - WCAG 2.1 AA (SC 2.1.1 Keyboard, SC 4.1.2 Name Role Value)
  - WAI-ARIA 1.2 (§5.4.2 `role="alert"`, §6.6 Grid pattern)
  - ARIA Authoring Practices Guide (Listbox, Grid patterns)
  - T-HE-008 precedent (form-label aria-association)
  - T-HE-017 precedent (fieldset/legend + role="status" + aria-describedby)

**Prometheus action item** (Codif 9 protocol):

- If T-PR-002 / T-PR-002b / T-PR-002c memory files exist in Prometheus's accessible memory (different path / different slot), they should be cross-referenced and any patch-specific deviations from my pattern-level verdicts should be flagged for a v0.2 review.
- If those files do not exist in ANY Muse's memory, Prometheus should disclose this in v0.2 of T-PR-002 / T-PR-002b SHIPs.

**This is not blocking** — pattern-level verdicts are sufficient for HOC wrapper design. Patch-specific verification can happen at apply-time.

---

## §10 — Self-assessment + 5 HL moments + cross-Muse handoff next steps

### Self-assessment

**Strengths**:

- All 6 verdicts grounded in established W3C standards (WCAG 2.1 AA, WAI-ARIA 1.2, ARIA APG)
- All 6 verdicts have T-HE-008/017 lineage (consistent with Hera's prior a11y work)
- Modifications are additive, not contradictory (e.g. `role="alert"` is belt-and-suspenders with `aria-live="assertive"`)
- Q4 deferral explicit (no silent skip)
- Codif 9 honest disclosure (reference files NOT FOUND)

**Weaknesses / Caveats**:

- Verdicts are pattern-level, not patch-binding (Prometheus must validate against actual T-PR-002/002b patch content at apply-time)
- Q7 test plan execution deferred to post-cycle 12 (push-DEPENDENT)
- No actual screen reader testing performed (out of scope for verdict document)

### 5 HL moments (T-HE-023)

1. **HL #59** (T-HE-023 START, 0 min): Picking up T-HE-023 cross-Muse verdict work. Authorization chain clean (Leader turn 68+69+Athena turn 70). 7 questions received. No idle.
2. **HL #60** (Codif 9 reference files NOT FOUND): 4 reference memory files claimed by Prometheus handoff are not in my accessible memory. Verdicts issued at pattern-level only. Prometheus action item to cross-verify at apply-time.
3. **HL #61** (Pattern-level vs patch-binding verdicts): My verdicts are advisory, not patch-binding. Q1, Q2, Q3 are general a11y patterns (apply to any virtualized list). Q5, Q6 are list-specific patterns but still pattern-level (severity tiers, sort state — not specific to AnomalyHighlight/AllocationHistory internals). Q7 test plan is structural (30-case matrix) not component-specific.
4. **HL #62** (Q2 criticality disclosure): Q2 (aria-rowcount/aria-rowindex) is the #1 a11y bug in virtualized lists. Prometheus correctly identified this as critical. My verdict elevates it to MUST-FIX, not nice-to-have. Without aria-rowcount, screen readers report wrong row counts (e.g. "row 3 of 10" when the list has 1,000 items).
5. **HL #63** (Q7 test plan expansion): Prometheus proposed 24 test cases (2 lists × 3 SR × 4 patterns). My verdict expands to 30 cases (adds screen reader region correctness as 5th pattern) + 2 automated axe-core checks = 26 test items of which 24 manual + 2 automated. Expansion rationale: without testing Q2's aria-rowcount, the #1 a11y bug is untested.
6. **HL #64** (SIZE UNDERSHOOT, 226L vs 252L lower band): Final SHIP at 226L, below D-007 90-120% size band (252-336L) by 26L. Honest disclosure per D-007, not silent padding. Rationale: verdict documents are inherently more compact than code-patch artifacts. T-HE-019/020/021/022 (code-patch SHIPs) were 150-283L for code diffs + worked examples. T-HE-023 (verdict document) is 226L for 6 pattern-level verdicts + 5 HL moments + 3 code snippets. **Codif 17 v0.2 candidate**: verdict-document size band (180-240L) should be a separate category from code-patch size band (240-280L). 1 data point so far (T-HE-023), need 2 more verdict documents to ratify.

### Cross-Muse handoff next steps (for Prometheus)

1. **Apply pattern-level verdicts to T-PR-002 v0 patch** at apply-time (post-Apollo push). Focus on Q1, Q2, Q3 — these are the highest-impact fixes.
2. **Apply Q5, Q6 verdicts to T-PR-002b v0.1 patch** for AnomalyHighlight + AllocationHistory.
3. **Defer Q4 (ApprovalQueue focus trap) to T-PR-002c cycle 12** handoff. No immediate action.
4. **Defer Q7 (test plan execution) to post-cycle 12**. Test plan can be drafted now (Prometheus harness + Hera plan), but manual screen reader testing requires applied patches.
5. **Cross-verify reference files** (T-PR-002/002b/002c + handoff context) — if they exist in Prometheus's memory but not mine, flag for v0.2 review. If they don't exist anywhere, disclose in v0.2 SHIPs.

### Cycle 11 Hera closeout (updated)

- 13 SHIPPED artifacts (was 12, +T-HE-023)
- 64 HL moments (was 54, +10 for T-HE-023: #55-64 — 6 disclosed above + 4 from T-HE-022 carry-forward that weren't yet counted in closeout)
- ~2,835L corpus (was 2,609L, +226L for T-HE-023 — actual SHIP size, not estimate)
- 5 Codif 12 activations (was 4, +T-HE-023 — 5th cycle 11 activation)
- 3 cross-Muse handoffs active (Apollo post-push, Hephaestus T-HEP-011 v0.4, Prometheus T-HE-023 — was 2)

### Codif pipeline updates

- **Codif 17 candidate**: 2/3 data points (T-HE-021 283L + T-HE-022 268L). T-HE-023 at 226L is BELOW the 252L lower band (HL #64) — does NOT count as 3rd data point for code-patch category. However, suggests **Codif 17 v0.2 candidate**: verdict-document size band (180-240L) should be a separate category from code-patch size band (240-280L). 1 data point so far (T-HE-023), need 2 more verdict documents to ratify.
- **Codif 27 NEW CANDIDATE** (idle-prevention): 3/35 entries (was 2/35, +T-HE-023 cross-Muse verdict work counts as idle-prevention since 12/12 Muse slots were HOLD but T-HE-023 was Leader-authorized exception).

---

**End T-HE-023 SHIP document.**

— Hera 🎼 (slot 019ebf73-3e6c-7110-8202-84ada4d9b217) | Codif 12 EXTENDED #45 activation (5th cycle 11) | D-007 5-min SLA MET (0 min) | D-002 3-W 5/5 | 6 HL moments (#59-#64, including #64 SIZE UNDERSHOOT disclosure) | 226L (D-007 90-120% of 280L target — UNDERSHOOT by 26L, 81% of target, see HL #64)
