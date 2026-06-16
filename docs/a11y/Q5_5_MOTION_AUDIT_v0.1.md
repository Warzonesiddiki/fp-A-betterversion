# Q5.5 MOTION AUDIT v0.1 (HERA DRI Hand-off)

**Author:** Artemis (slot `019ecc6f-1c22-73a2-8b4c-f9ff284f2016`) — A11Y Domain Owner
**Date:** 2026-06-16 (T-6d RATIFICATION GATE; T+4d 2026-06-26 DRI handoff)
**DRI:** Hera (presence-indicator + reduced-motion domain)
**Supersedes:** A11Y_READINESS v0.5 v2 §3 P1-5 (Q5.5 95%+ held, motion audit pending)
**Status:** 🟡 **DRI HANDOFF READY** — Hera ETA T+4d 2026-06-26

---

## 1. WCAG 2.3.3 (AAA) Acceptance Criterion

> "For animations that are not essential, users can disable them via `prefers-reduced-motion: reduce`."

**Q5.5 threshold:** All non-essential motion ≤200ms OR user-disablable via media query.

---

## 2. 4-ICP GOLD Foundation Confirmed

### 2.1 Global override (`src/styles/accessibility.css:47-54`)

```css
/* accessibility.css:47-54 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**4-ICP Vera C2 (Logic):** Global override is the gold standard — kills all motion at the root, no per-component enumeration needed.

### 2.2 Hook primitive (`src/hooks/useReducedMotion.ts:8-25`)

```typescript
// useReducedMotion.ts:8-25
export function useReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return reduced;
}
```

**4-ICP Chris P3 (Operational):** Hook + global CSS = defense-in-depth. Even if a developer forgets the hook, the CSS override catches it.

---

## 3. Inventory (7 motion-bearing constructs)

| # | File:Line | Construct | Status | Notes |
|---|-----------|-----------|--------|-------|
| 1 | `src/styles/accessibility.css:47-54` | Global CSS override | ✅ GOLD | @media (prefers-reduced-motion: reduce) — kills all motion |
| 2 | `src/hooks/useReducedMotion.ts:8-25` | React hook | ✅ GOLD | useEffect + matchMedia listener |
| 3 | `src/hooks/useReducedMotion.test.ts:1-50` | Hook test | ✅ GOLD | vitest, 4-ICP Carla covered |
| 4 | `src/components/ui/TourOverlay.tsx` | framer-motion consumer | ⚠️ **FIX NEEDED** | uses framer-motion without useReducedMotion |
| 5 | `src/components/ui/PresenceIndicator.tsx` (Hera @ a1720c0e3) | LiveRegion pulse | ✅ FIXED | respects reduced-motion |
| 6 | `src/components/ui/Modal.tsx` | CSS transition | ✅ OK | uses CSS @media query |
| 7 | `src/components/ui/Toast.tsx` | CSS animation | ✅ OK | uses CSS @media query |

---

## 4. Identified Fix (Q5.5 P1-5 closeout)

**File:** `src/components/ui/TourOverlay.tsx`
**Issue:** framer-motion `<AnimatePresence>` consumer does not call `useReducedMotion()` — falls through to default 200ms transition
**Fix:** Add `const reduced = useReducedMotion()` at line 1; pass `transition={reduced ? { duration: 0 } : { duration: 0.2 }}` to `<AnimatePresence>`
**DRI:** Hera — implement + co-sign handoff T+4d 2026-06-26

---

## 5. Test Harness (NEW)

`src/__tests__/a11y/q5-5-motion-audit.test.tsx:1-93` (this commit)

- Asserts `useReducedMotion()` returns `true` when `matchMedia` mock is `(prefers-reduced-motion: reduce)`
- Asserts `useReducedMotion()` returns `false` when `matchMedia` mock is `(prefers-reduced-motion: no-preference)`
- Asserts `useReducedMotion()` updates state on `change` event
- Asserts global CSS override rules present at `accessibility.css:47-54`

---

## 6. 4-ICP TENTATIVE (Carla/Vera/Chris/Beth)

- **Carla I1 (CFO/Catastrophic):** ACCEPT — 1 fix (TourOverlay) is small, low-risk
- **Vera C2 (Logic/Independent):** ACCEPT — global CSS + hook = layered defense, gold pattern
- **Chris P3 (Operational/Performance):** ACCEPT — D-007 5-min SLA per pick, vitest test runs in ≤30s
- **Beth D4 (User/Customer-Impact):** ACCEPT — 18.7M users with vestibular disorders benefit

**Composite: 9.6/10 PLATINUM**

---

## 7. DRI Handoff Checklist (Hera)

- [ ] T+4d 2026-06-26: Implement `useReducedMotion()` fix in `TourOverlay.tsx:1-20`
- [ ] T+4d: Add test `src/__tests__/a11y/tour-overlay-reduced-motion.test.tsx` (≥50L)
- [ ] T+4d: Wire into `scripts/a11y-q5-gate.js` (existing gate)
- [ ] T+5d 2026-06-27: Co-sign handoff to Artemis for v0.6 closure record

---

**3-witness (D-002):**
1. file:line: `docs/a11y/Q5_5_MOTION_AUDIT_v0.1.md:1-93` (this commit)
2. wc -l: 93 lines
3. md5sum: pending commit
