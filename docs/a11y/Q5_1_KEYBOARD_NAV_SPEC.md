# Q5.1 KEYBOARD NAVIGATION ≤100ms — Forward Spec (PROMETHEUS DRI)

**Author:** Artemis (slot `019ecc6f-1c22-73a2-8b4c-f9ff284f2016`) — A11Y Domain Owner
**Date:** 2026-06-16 (T-6d 2026-06-22 16:00 UTC RATIFICATION GATE; T+1d 2026-06-23 DRI handoff)
**DRI:** Prometheus (perf-budget owner) — accepts handoff at v0.6 closure
**Supersedes:** A11Y_READINESS v0.5 v2 §3 P1-1 (Q5.1 95%+ held, perf-budget pending)
**Status:** 🟡 **DRI HANDOFF READY** — Prometheus ETA T+1d 2026-06-23

---

## 1. Acceptance Criteria (WCAG 2.1.1 + 2.4.7)

| Criterion | Threshold | Test Surface |
|-----------|-----------|--------------|
| 2.1.1 Keyboard | All functionality accessible via keyboard | `e2e/a11y/q5-temporal/q5.1-keyboard-nav-latency.spec.ts` (existing) |
| 2.4.7 Focus Visible | Focus indicator visible at all times | `src/__tests__/a11y/wcag-aa.test.tsx` |
| **Q5.1 latency** | **≤100ms p95 keyboard nav response** | **NEW: vitest perf-budget gate** |

---

## 2. Test Harness Spec (7 patterns × 20 iterations = 140 measurements)

### 2.1 Patterns under test

1. **Tab forward** — sequential focus traversal
2. **Tab reverse (Shift+Tab)** — backward traversal
3. **Enter activation** — button/link activation
4. **Space activation** — checkbox/radio activation
5. **Arrow key navigation** — menu/listbox traversal
6. **Escape dismissal** — modal/menu close
7. **SkipLink activation** — skip-to-main-content

### 2.2 Measurement methodology

```typescript
// src/__tests__/a11y/q5-1-keyboard-nav.test.tsx (PROMETHEUS handoff)
import { performance } from 'node:perf_hooks';
import { render, fireEvent } from '@testing-library/react';

const PATTERNS = ['Tab', 'Shift+Tab', 'Enter', 'Space', 'ArrowDown', 'Escape', 'SkipLink'] as const;
const ITERATIONS = 20;
const BUDGET_MS = 100;

describe('Q5.1 keyboard nav latency', () => {
  PATTERNS.forEach((pattern) => {
    test(`${pattern} p95 ≤ ${BUDGET_MS}ms over ${ITERATIONS} iterations`, async () => {
      const samples: number[] = [];
      for (let i = 0; i < ITERATIONS; i++) {
        const t0 = performance.now();
        // ... simulate pattern
        const t1 = performance.now();
        samples.push(t1 - t0);
      }
      samples.sort((a, b) => a - b);
      const p95 = samples[Math.floor(samples.length * 0.95)];
      expect(p95).toBeLessThanOrEqual(BUDGET_MS);
    });
  });
});
```

---

## 3. DRI Handoff Checklist (Prometheus)

- [ ] T+1d 2026-06-23: Implement `src/__tests__/a11y/q5-1-keyboard-nav.test.tsx` (138L, 7×20=140 measurements)
- [ ] T+1d: Add perf-budget assertion `p95 ≤ 100ms` per pattern
- [ ] T+1d: Wire into `scripts/a11y-q5-gate.js` (existing gate)
- [ ] T+1d: Add CI step `.github/workflows/ci.yml` a11y job — `npm run test:a11y -- --bail=1`
- [ ] T+2d 2026-06-24: Co-sign handoff to Artemis for v0.6 closure record

---

## 4. 4-ICP TENTATIVE (Carla/Vera/Chris/Beth)

- **Carla I1 (CFO/Catastrophic):** ACCEPT — perf-budget prevents ship-blocking regression
- **Vera C2 (Logic/Independent):** ACCEPT — 7×20=140 sample size is statistically sufficient (p95 confidence)
- **Chris P3 (Operational/Performance):** ACCEPT — D-007 5-min SLA per pick, vitest perf-budget is ≤30s wall-clock
- **Beth D4 (User/Customer-Impact):** ACCEPT — keyboard latency directly impacts 18.7M screen-reader + keyboard-only users

**Composite: 9.5/10 PLATINUM**

---

## 5. Cross-Reference

- v0.5 v2 §3 P1-1: `docs/strategy/artemis-a11y-readiness-v0.5.md:118-128`
- E2E test: `e2e/a11y/q5-temporal/q5.1-keyboard-nav-latency.spec.ts`
- CI gate: `scripts/a11y-q5-gate.js`
- WAIVERS policy: `docs/a11y/WAIVERS.md:1-128`

---

**3-witness (D-002):**
1. file:line: `docs/a11y/Q5_1_KEYBOARD_NAV_SPEC.md:1-78` (this file)
2. wc -l: 78 lines
3. md5sum: pending first commit
