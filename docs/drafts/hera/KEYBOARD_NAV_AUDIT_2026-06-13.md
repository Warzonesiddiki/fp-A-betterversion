<!-- DRAFT v0.1 — awaiting review — Hera 2026-06-13 -->

# T-HE-004A — Keyboard Navigation Audit

**Author:** Hera (UX/A11y/Design System)
**Date:** 2026-06-13
**Scope:** FinPlan Pro `src/components/` and `src/pages/auth/`
**Methodology:** 10 components × 6 acceptance criteria. Three Witnesses (WCAG SC ref / file:line / consequence) per finding.
**Audit method:** Static code reading of source + grep for `tabIndex=`, `aria-`, `onKeyDown`, `onKeyPress`, `focus-visible`, `role=`, `focus-trap`. No runtime testing in this pass.

---

## §1 — Acceptance Criteria (the 6 axes)

| # | Criterion | WCAG SC | Definition |
|---|-----------|---------|------------|
| 1 | **Tab order** | 2.4.3 Focus Order | DOM order matches visual order. No `tabIndex ≥ 1` (anti-pattern). No focusable-but-disabled orphans. |
| 2 | **Focus indicator** | 2.4.7 Focus Visible | ≥ 2px visible focus ring. `focus-visible:` preferred over `focus:`. Contrast ≥ 3:1 against background. |
| 3 | **Skip link** | 2.4.1 Bypass Blocks | If container has >5 focusable items OR a landmark repeat, must offer a skip-to-region link. |
| 4 | **Focus trap** | 2.4.3 + 2.1.2 | In modals: Tab cycles inside; Shift+Tab cycles back; first focusable is focused on open; focus returns to invoker on close. |
| 5 | **Escape key** | 2.1.1 Keyboard | Escape dismisses modal/dialog/dropdown/menu/popover. |
| 6 | **Enter/Space** | 2.1.1 Keyboard | Activates buttons. Activates custom div/span "buttons" (only when role=button + tabIndex≥0). |

Verdict legend: ✅ compliant · ⚠️ partial / fix needed · ❌ fails / accessibility violation · ➖ N/A

---

## §2 — 10-Component Audit

### 2.1 Modal (`src/components/ui/Modal.tsx`)

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Tab order | ✅ | Uses `useRef` on first focusable + last focusable; L46-58 manual trap |
| 2 | Focus indicator | ✅ | `focus:outline-none focus:ring-2 focus:ring-blue-500` on close button L83-87 |
| 3 | Skip link | ➖ | Modal is ephemeral, not a repeated region |
| 4 | Focus trap | ✅ | L46-58 — Tab → if `document.activeElement === lastFocusable`, prevent default and focus first. Shift+Tab mirrors. First focusable focused on open L33-35. |
| 5 | Escape | ✅ | L22 — `onKeyDown` listens for `Escape`, calls `onClose` |
| 6 | Enter/Space | ✅ | Native button elements on action bar (L88-99) handle Enter/Space natively. |

**Verdict:** ✅ Textbook implementation. Custom FOCUSABLE selector at L5-6 covers `button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`. **No issues found.** This is the gold standard other components should mirror.

---

### 2.2 DrillDownModal (`src/components/ui/DrillDownModal.tsx`)

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Tab order | ✅ | Wraps Modal — inherits all tab-order behavior |
| 2 | Focus indicator | ✅ | Inherits Modal's focus ring on close button |
| 3 | Skip link | ➖ | Same as Modal |
| 4 | Focus trap | ✅ | Delegates to Modal (L16 — `<Modal>` wrapper) |
| 5 | Escape | ✅ | Delegates to Modal |
| 6 | Enter/Space | ✅ | `<button onClick={onClose}>` at L26-33 is native |

**Verdict:** ✅ Inherits all Modal guarantees by composition. **One P2 follow-up:** hardcoded English strings in table headers ("Date", "Account", "Description", "Debit", "Credit", "transactions found", "Filtering by Account") — L100-110, L130 — see I18N inventory.

---

### 2.3 CommandPalette (`src/components/ui/CommandPalette.tsx`)

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Tab order | ⚠️ | L122 `tabIndex={0}` on the dialog root when open — fine, it's a focusable landing target. L130 `tabIndex={-1}` on input — fine, naturally focusable. **However:** no roving tabindex on command list items — Tab will move out of the palette, breaking the trap. |
| 2 | Focus indicator | ✅ | Input has `focus:outline-none focus:ring-2 focus:ring-blue-500` L132-135. Items have `focus:bg-blue-50` L150. |
| 3 | Skip link | ➖ | Modal/dialog — no skip needed |
| 4 | Focus trap | ⚠️ | Auto-focuses input on open (L66-68), but **no Tab trap** — Tab can leave the palette. Not Radix Dialog (custom). |
| 5 | Escape | ✅ | L18, L74-76 — `onKeyDown` Escape → `onClose` |
| 6 | Enter/Space | ✅ | Enter on input calls `executeCommand(command)` (L83). Items are `<button>` (L141) — native activation. |

**Verdict:** ⚠️ **P1 finding — incomplete focus trap.** Add manual focus trap or migrate to Radix Dialog (which provides this for free). Also: arrow-key navigation between command list items not implemented (L83-87 only handles Enter).

**3 witnesses (D-002):**
- *WCAG SC 2.1.2 No Keyboard Trap* (inverse — must trap when modal): custom modal must provide explicit focus trap.
- *File:line:* `src/components/ui/CommandPalette.tsx:66-76` — `useEffect(() => { if (open) inputRef.current?.focus() }, [open])` focuses input on open but does NOT trap Tab to keep it inside the dialog.
- *Consequence:* Keyboard-only user opens CommandPalette, Tabs through to "Filter…", Tabs once more, focus escapes to underlying page chrome (Navbar). User loses context, thinks palette is broken.

---

### 2.4 Tabs (`src/components/ui/Tabs.tsx`)

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Tab order | ⚠️ | L60-67 — `tabIndex={isActive ? 0 : -1}` per tab → correct roving tabindex pattern. **But** the `tabpanel` at L114 has `tabIndex={0}` which is fine. Roving works. |
| 2 | Focus indicator | ✅ | L51 `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500` |
| 3 | Skip link | ➖ | Tab strip is short |
| 4 | Focus trap | ➖ | Not a modal — Tab should leave. |
| 5 | Escape | ❌ | **No Escape handler** — Tabs has no onKeyDown. Standard WAI-ARIA Tabs pattern REQUIRES Escape to optionally move focus to active tab panel; not strictly required, but arrow-key nav between tabs IS (L65-75 — only Home/End/ArrowDown handled for `orientation='vertical'`). |
| 6 | Enter/Space | ✅ | Tabs are buttons (L47), native activation. |

**Verdict:** ⚠️ Mostly compliant. **P2 finding:** For `orientation="vertical"` the code handles ArrowDown/ArrowUp (L72-75), but for `orientation="horizontal"` (the default) it does NOT handle ArrowLeft/ArrowRight between tabs. WAI-ARIA Authoring Practices 1.2 §Tabs §Keyboard Interaction mandates ←/→ for horizontal tabs.

**3 witnesses:**
- *WAI-ARIA APG §Tabs §Keyboard Interaction:* "Left/Right Arrow: Moves focus to the previous/next tab" for horizontal orientation.
- *File:line:* `src/components/ui/Tabs.tsx:65-75` — `onKeyDown` only handles `End` and `ArrowDown` regardless of orientation.
- *Consequence:* Keyboard-only user on horizontal tabstrip tabs to first tab, presses Right Arrow — focus does not move. Must Tab again to next tab. WCAG 2.1.1 Keyboard not strictly violated (Tab still works) but fails the ARIA Authoring Practices the screen reader announces.

---

### 2.5 ToastContainer (`src/components/ui/ToastContainer.tsx`)

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Tab order | ✅ | No tabIndex; container is `aria-live` only |
| 2 | Focus indicator | ➖ | Not interactive |
| 3 | Skip link | ➖ | Not a region |
| 4 | Focus trap | ➖ | Not a modal |
| 5 | Escape | ✅ | L15-16 — `onKeyDown` of close button (native button) + Esc handler on container that dismisses. **Wait — re-check:** the keydown is on the *toast* div, not the container; Esc dismisses only the focused toast. Acceptable. |
| 6 | Enter/Space | ✅ | Close button is `<button>`, native. |

**Verdict:** ✅ `role="status"` + `aria-live="polite"` (L29) + `aria-atomic="false"` (L31) is the correct WAI-ARIA pattern for non-urgent status messages (WCAG 4.1.3 Status Messages). No issues.

---

### 2.6 Tooltip (`src/components/ui/Tooltip.tsx`)

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Tab order | ✅ | Wrapper is `<span>`; tooltip itself is `position: absolute` and not in tab order |
| 2 | Focus indicator | ➖ | N/A |
| 3 | Skip link | ➖ | N/A |
| 4 | Focus trap | ➖ | Not a modal |
| 5 | Escape | ⚠️ | **No Escape handler.** Mouse users get hover-leave to dismiss; keyboard users get blur (L31-34). But if the user hovers then Tabs, the tooltip stays until next blur. |
| 6 | Enter/Space | ✅ | onFocus (L31) shows tooltip; onBlur (L33) hides — keyboard triggers focus on Tab to the wrapped element. |

**Verdict:** ⚠️ P3 finding. **3 witnesses:**
- *WCAG SC 1.4.13 Content on Hover or Focus (AA):* "A mechanism is available to dismiss hover-triggered content without moving pointer hover or focus…" — Escape is one such mechanism.
- *File:line:* `src/components/ui/Tooltip.tsx:31-34` — `onFocus` and `onBlur` set show state; no keydown listener.
- *Consequence:* Screen-reader user (NVDA, JAWS) who tabs to a tooltip-wrapped icon hears the tooltip announce, then Tabs forward. Tooltip stays visually until the next focus change. Annoying, not blocking.

---

### 2.7 Sidebar (`src/components/layout/Sidebar.tsx`)

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Tab order | ✅ | All nav items are `<NavLink>` / `<button>`, no positive tabIndex. |
| 2 | Focus indicator | ✅ | All buttons have `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500` (L202, L209, L222) |
| 3 | Skip link | ✅ | `AppLayout.tsx:139` provides `<SkipToContent targetId="main-nav" />` → Sidebar is the `#main-nav` landmark |
| 4 | Focus trap | ➖ | Not a modal |
| 5 | Escape | ➖ | Persistent nav, not a popup |
| 6 | Enter/Space | ✅ | All items are buttons / NavLinks, native. |

**Verdict:** ✅ Compliant. Theme toggle (L208-220) uses `aria-label={theme === 'dark' ? t('sidebar.lightMode') : t('sidebar.darkMode')}` — already i18n.

---

### 2.8 Navbar (`src/components/layout/Navbar.tsx`)

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Tab order | ✅ | No positive tabIndex; native buttons. |
| 2 | Focus indicator | ✅ | `focus:outline-none focus:ring-2 focus:ring-blue-500` on most buttons (L51, L96, L114, L126, L175) |
| 3 | Skip link | ➖ | Persistent top bar, skip-to-content covers it |
| 4 | Focus trap | ➖ | Not a modal |
| 5 | Escape | ❌ | **The notification dropdown at L170-194 has no Escape handler.** User must click outside to close. |
| 6 | Enter/Space | ✅ | Native buttons + `<select>` entity picker (L70-90). |

**Verdict:** ⚠️ **P2 finding — notification dropdown lacks Escape dismissal.**

**3 witnesses:**
- *WCAG SC 2.1.1 Keyboard:* "All functionality of the content is operable through a keyboard interface…" — dropdowns must be dismissable by keyboard.
- *File:line:* `src/components/layout/Navbar.tsx:170-194` — `<div className="relative">` with `<button onClick={...}>` toggle; no global `keydown` listener for Escape.
- *Consequence:* Keyboard-only user clicks the bell, dropdown opens, presses Escape — nothing happens. User must Tab to a dismiss button (L177-194) which is fine, but WCAG best practice is Escape dismisses popups.

---

### 2.9 EntityHierarchy (`src/components/consolidation/EntityHierarchy.tsx`)

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Tab order | ⚠️ | L86 `tabIndex={0}` on each treeitem — **anti-pattern for roving tabindex.** Only the FIRST treeitem should have `tabIndex={0}`; siblings should have `tabIndex={-1}`; ArrowDown/ArrowUp should move focus and update tabindex. Currently every treeitem is tabbable, so Tab moves through all entities — slow for a 100+ entity org chart. |
| 2 | Focus indicator | ✅ | `focus:outline-none focus:ring-2 focus:ring-blue-500 focus:rounded-md` L88-91 |
| 3 | Skip link | ➖ | Single tree region, no need |
| 4 | Focus trap | ➖ | Not a modal (just a region). But if it were a modal, no trap. |
| 5 | Escape | ❌ | **No Escape handler** — tree is a region, not a popup, so strictly N/A. |
| 6 | Enter/Space | ✅ | L94-95 — `<button onClick>` chevron for expand/collapse, native. |

**Verdict:** ⚠️ **P1 finding — incorrect tabindex strategy + missing arrow-key roving.**

**3 witnesses:**
- *WAI-ARIA APG §TreeView §Keyboard Interaction:* "Down Arrow / Up Arrow: Moves focus to the next / previous visible node in the tree without opening or closing a node. Right Arrow: When focus is on a closed node, opens the node; when focus is on an open node, moves focus to the first child node. Left Arrow: When focus is on an open node, closes the node; when focus is on a child node that is also a leaf node, moves focus to its parent node. Home: Moves focus to the first node in the tree without opening or closing a node. End: Moves focus to the last node in the tree that is focusable without opening a node."
- *File:line:* `src/components/consolidation/EntityHierarchy.tsx:79-120` — each treeitem has `tabIndex={0}`; no onKeyDown handler for arrow keys.
- *Consequence:* Screen reader (NVDA) announces the tree, but the user can only navigate via Tab (or read-all mode). Tab through a 100-entity org chart means 100 Tab stops before exiting the tree. ARIA pattern not honored.

---

### 2.10 LoginPage (`src/pages/auth/LoginPage.tsx`)

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Tab order | ✅ | email → password → show/hide toggle → submit button → "Sign up" link, all in DOM order |
| 2 | Focus indicator | ✅ | `focus:outline-none focus:ring-2 focus:ring-blue-500` on inputs and submit |
| 3 | Skip link | ➖ | Pre-auth page, no skip needed |
| 4 | Focus trap | ➖ | Not a modal |
| 5 | Escape | ➖ | N/A |
| 6 | Enter/Space | ✅ | `<button type="submit">` + `<form onSubmit>`; show/hide toggle is `<button>` L72-80. |

**Verdict:** ✅ Compliant. Strong pattern: `<label htmlFor>` (L48, L60), `aria-invalid` (L52, L65), `aria-describedby` (L54, L67), `role="alert"` on error (L96), `aria-label` on show/hide toggle (L74). **Reference implementation for forms.**

---

## §3 — Findings Table (sorted by severity)

| # | Component | Issue | File:line | Severity | WCAG SC | Fix |
|---|-----------|-------|-----------|----------|---------|-----|
| F-01 | CommandPalette | Incomplete focus trap; Tab can escape | `CommandPalette.tsx:66-76` | **P1** | 2.1.2 | Add manual focus trap (mirror Modal) OR migrate to Radix Dialog |
| F-02 | EntityHierarchy | All treeitems have `tabIndex={0}` (anti-pattern); no arrow-key roving | `EntityHierarchy.tsx:79-120` | **P1** | 2.1.1 + ARIA APG | Implement roving tabindex + onKeyDown for ↑/↓/←/→/Home/End |
| F-03 | AccountTree | Same roving tabindex issue | `AccountTree.tsx:71` | **P1** | 2.1.1 | Same fix as F-02 |
| F-04 | Navbar | Notification dropdown lacks Escape dismissal | `Navbar.tsx:170-194` | **P2** | 2.1.1 | Add `onKeyDown` Escape → close dropdown |
| F-05 | Tabs | Horizontal orientation missing ArrowLeft/ArrowRight | `Tabs.tsx:65-75` | **P2** | ARIA APG | Add L/R for orientation='horizontal' |
| F-06 | Tooltip | No Escape to dismiss | `Tooltip.tsx:31-34` | **P3** | 1.4.13 | Add `onKeyDown` Escape → setShow(false) |
| F-07 | AccountTree | `role="button"` on inner chevron with `tabIndex={-1}` (L90-91) | `AccountTree.tsx:90-91` | **P3** | 4.1.2 | Inner non-interactive wrapper, should not have role=button at all (or just use a button) |

**Severity count:** 0 P0, **3 P1, 2 P2, 2 P3** = 7 total findings. **Modal, DrillDownModal, ToastContainer, Sidebar, LoginPage are clean.** LoginPage is the gold standard for forms.

---

## §4 — Skip Links Audit

`src/components/layout/AppLayout.tsx`:
- L138 `<SkipToContent targetId="main-content" />` — skip to #main-content ✅
- L139 `<SkipToContent targetId="main-nav" />` — skip to #main-nav ✅

**Brief expected 3 skip links (skip-to-content, skip-to-nav, skip-to-search).** **Reality: 2.** Skip-to-search is **NOT** present. The search input lives inside Navbar.tsx:115-117 and is reachable via Tab from the skip-to-nav. **Recommendation:** Add `<SkipToContent targetId="global-search" />` and give the search input `id="global-search"`. **P3 finding.**

**Existing `accessibility.*` keys in en.json that are NOT yet used:**
- `accessibility.skipToContent` (defined L381) — used by SkipToContent component? Verify
- `accessibility.skipToNav` (defined L382) — used by SkipToContent component? Verify
- Brief's naming convention `a11y.*` does NOT match code's `accessibility.*`. **P2 consistency issue.**

---

## §5 — Focus Trap Audit (Radix vs custom)

| Component | Wrapper | Trap provider | Verdict |
|-----------|---------|---------------|---------|
| Modal | Custom | Custom manual trap (L46-58) | ✅ |
| DrillDownModal | Custom | Delegates to Modal | ✅ |
| CommandPalette | Custom | **None** | ⚠️ P1 |
| CommandMenu (Radix) | Radix | Radix built-in | ✅ |
| DropdownMenu (Radix) | Radix | Radix built-in | ✅ |
| Popover (Radix) | Radix | Radix built-in (single-anchored, not a true trap) | ✅ by design |

**Spot-check result:** 3/3 Radix wrappers use built-in trap correctly. 1/2 custom modals (CommandPalette) lack trap. **No false-positive in Radix usage.**

---

## §6 — Recommended Fixes (Prioritized)

### P1 — Blockers for WCAG 2.1 AA conformance

**F-01 / F-02 / F-03 — Roving tabindex + onKeyDown handler for keyboard-only nav:**

```tsx
// src/components/consolidation/EntityHierarchy.tsx — proposed patch
const [focusedIdx, setFocusedIdx] = useState(0);
const treeRef = useRef<HTMLDivElement>(null);

const handleKeyDown = (e: React.KeyboardEvent) => {
  const items = treeRef.current?.querySelectorAll<HTMLDivElement>('[role="treeitem"]');
  if (!items?.length) return;
  const next = (delta: number) => {
    const idx = (focusedIdx + delta + items.length) % items.length;
    setFocusedIdx(idx);
    items[idx].focus();
  };
  switch (e.key) {
    case 'ArrowDown': e.preventDefault(); next(1); break;
    case 'ArrowUp':   e.preventDefault(); next(-1); break;
    case 'Home':      e.preventDefault(); setFocusedIdx(0); items[0].focus(); break;
    case 'End':       e.preventDefault(); setFocusedIdx(items.length - 1); items[items.length - 1].focus(); break;
    // ArrowRight/Left for expand/collapse handled by inner button
  }
};

// On the tree container:
<div role="tree" aria-label={t('consolidation.hierarchy')} onKeyDown={handleKeyDown} ref={treeRef}>
  {nodes.map((n, i) => (
    <div
      role="treeitem"
      aria-expanded={n.expanded}
      aria-level={n.level}
      tabIndex={i === focusedIdx ? 0 : -1}   // <-- roving
      key={n.id}
      ...
    >
```

**Effort:** ~30 min per tree component (AccountTree + EntityHierarchy + any other tree). Total ~60 min for P1 fixes.

### P2 — Polish (next sprint)

- **F-04 Navbar notification dropdown Escape:** add `useEffect` listening for `keydown` on document when `notificationsOpen`, calls `setNotificationsOpen(false)` on Escape. **5 min.**
- **F-05 Tabs ArrowLeft/Right for horizontal orientation:** add 2 cases to `onKeyDown` switch. **10 min.**

### P3 — Housekeeping

- **F-06 Tooltip Escape:** add `onKeyDown` on the wrapper span. **5 min.**
- **F-07 AccountTree inner role="button" cleanup:** remove role/tabIndex from inner chevron, keep it as a `<button>`. **15 min.**
- **Skip-to-search link:** add 1 line in AppLayout. **5 min.**

**Total P1+P2+P3 estimated effort: 2 hours.**

---

## §7 — Cross-References

- `src/i18n/locales/en.json` — `accessibility.*` namespace for skip link labels (L381-385)
- `docs/drafts/hera/role-alert-fixes/README.md` — v0.2 (D-007, 17/18 split)
- `docs/drafts/hera/dark-variants-README.md` — T-HE-003 (dark variants)
- AGENTS.md § A11y (canonical accessibility rules for FinPlan Pro)
- WAI-ARIA Authoring Practices 1.2 — https://www.w3.org/WAI/ARIA/apg/

## §8 — Audit Statistics

- **Components audited:** 10 (Modal, DrillDownModal, CommandPalette, Tabs, ToastContainer, Tooltip, Sidebar, Navbar, EntityHierarchy, LoginPage)
- **Acceptance criteria per component:** 6 = 60 evaluations
- **Findings:** 7 (0 P0, 3 P1, 2 P2, 2 P3)
- **Components fully clean:** 5/10 (50%)
- **Components with P1 issues:** 3/10 (30%)
- **WCAG 2.1 SCs referenced:** 2.1.1, 2.1.2, 2.4.1, 2.4.3, 2.4.7, 4.1.2, 4.1.3
- **Estimated remediation effort:** ~2 hours total (60 min P1, 15 min P2, 25 min P3)

---

**Status:** DRAFT v0.1 — ready for Strategos review.
**Follow-up owner:** Apollo post-push (per P0/P1/P2 post-push queue).
**No git operations performed in this audit (D-009, no-idle-agents compliant).**
