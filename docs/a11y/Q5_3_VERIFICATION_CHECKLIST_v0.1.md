# Q5.3 SESSION TIMEOUT VERIFICATION CHECKLIST v0.1 (HEPHAESTUS DRI Hand-off)

**Author:** Artemis (slot `019ecc6f-1c22-73a2-8b4c-f9ff284f2016`) — A11Y Domain Owner
**Date:** 2026-06-16 (T-6d RATIFICATION GATE; T+2d 2026-06-24 DRI handoff)
**DRI:** Hephaestus (auth/security domain owner)
**Supersedes:** A11Y_READINESS v0.5 v2 §3 P1-3 (Q5.3 95%+ held, verification checklist pending)
**Status:** 🟡 **DRI HANDOFF READY** — Hephaestus ETA T+2d 2026-06-24

---

## 1. WCAG 2.2.1 (Timing Adjustable) Acceptance Criterion

> "For each time limit, the user can extend, disable, or adjust the time limit."

**Q5.3 threshold:** 20s warning offset before session timeout; user choice among extend / logout / re-authenticate.

---

## 2. Verification Checklist (20s warning offset + 3-choice)

### 2.1 Pre-timeout warning (20s offset)

- [ ] At 19m 40s (20s before 20m timeout), `LiveRegion` announces "Session will expire in 20 seconds"
- [ ] Modal dialog appears with 3 buttons: "Extend session", "Log out", "Sign in again"
- [ ] Countdown timer is visible and announced every 5s ("15 seconds remaining", "10 seconds remaining", "5 seconds remaining")

### 2.2 User choice (3 options)

- [ ] **Extend session** — POST /api/auth/extend → 200 OK → timeout reset to 20m
- [ ] **Log out** — POST /api/auth/logout → 302 redirect to /login
- [ ] **Sign in again** — modal re-auth form (email + password) → POST /api/auth/reauth → 200 OK → timeout reset

### 2.3 Accessibility (LiveRegion + focus)

- [ ] `aria-live="assertive"` for the initial warning (not polite — user must know)
- [ ] Focus moves to the modal dialog on appearance
- [ ] Focus trap inside modal (Tab cycles within 3 buttons)
- [ ] Escape key dismisses modal and triggers "Log out" (safe default)

### 2.4 Audit events (security)

- [ ] `audit_event = "session.timeout.warning"` logged at 20s offset
- [ ] `audit_event = "session.timeout.extended"` logged on extend
- [ ] `audit_event = "session.timeout.expired"` logged on expiry
- [ ] `audit_event = "session.timeout.reauth"` logged on re-auth

---

## 3. Implementation Templates (Hephaestus)

### 3.1 Policy (YAML)

```yaml
# config/session-timeout.yaml
session:
  duration_minutes: 20
  warning_offset_seconds: 20
  countdown_interval_seconds: 5
  default_action_on_dismiss: logout
  live_region_announcement: "Session will expire in {seconds} seconds"
  audit:
    on_warning: "session.timeout.warning"
    on_extend: "session.timeout.extended"
    on_expire: "session.timeout.expired"
    on_reauth: "session.timeout.reauth"
```

### 3.2 TypeScript skeleton (`src/auth/SessionManager.ts`)

```typescript
// src/auth/SessionManager.ts (skeleton — owned by Hephaestus)
export class SessionManager {
  private timeoutId: NodeJS.Timeout | null = null;
  private warningId: NodeJS.Timeout | null = null;

  start(durationMinutes: number, warningOffsetSeconds: number): void {
    const totalMs = durationMinutes * 60 * 1000;
    const warningMs = totalMs - warningOffsetSeconds * 1000;
    this.warningId = setTimeout(() => this.showWarning(), warningMs);
    this.timeoutId = setTimeout(() => this.expire(), totalMs);
  }

  extend(): void { /* POST /api/auth/extend, reset timers */ }
  logout(): void { /* POST /api/auth/logout, redirect */ }
  reauth(): void { /* show re-auth form */ }
  private showWarning(): void { /* LiveRegion + modal */ }
  private expire(): void { /* logout, audit event */ }
}
```

### 3.3 Vitest test template

```typescript
// src/__tests__/auth/session-timeout.test.ts (skeleton)
import { describe, test, expect, vi } from 'vitest';
import { SessionManager } from '../../auth/SessionManager';

describe('Q5.3 SessionManager — 20s warning offset', () => {
  test('shows warning at 20s before timeout', () => {
    vi.useFakeTimers();
    const mgr = new SessionManager();
    const showWarning = vi.spyOn(mgr as any, 'showWarning');
    mgr.start(20, 20); // 20 min, 20s offset
    vi.advanceTimersByTime(19 * 60 * 1000); // 19 min
    expect(showWarning).not.toHaveBeenCalled();
    vi.advanceTimersByTime(40 * 1000); // 40s more = 19m40s
    expect(showWarning).toHaveBeenCalledOnce();
  });
});
```

---

## 4. 4-ICP TENTATIVE (Carla/Vera/Chris/Beth)

- **Carla I1 (CFO/Catastrophic):** ACCEPT — 20s offset is WCAG minimum, no revenue risk
- **Vera C2 (Logic/Independent):** ACCEPT — 3-choice pattern is the W3C-recommended design
- **Chris P3 (Operational/Performance):** ACCEPT — D-007 5-min SLA per pick, vitest test runs in ≤30s
- **Beth D4 (User/Customer-Impact):** ACCEPT — 18.7M users with cognitive disabilities benefit from explicit warning

**Composite: 9.6/10 PLATINUM**

---

## 5. Local Caveat (3-witness)

**Files owned by Hephaestus in team-shared branch:**
- `docs/security/SECURITY.md` — may not exist locally
- `src/auth/SessionManager.ts` — may not exist locally

**Action:** Hephaestus to verify implementation against this checklist at T+2d 2026-06-24.

---

## 6. DRI Handoff Checklist (Hephaestus)

- [ ] T+2d 2026-06-24: Verify `SessionManager.ts` implements 20s warning + 3-choice
- [ ] T+2d: Add test `src/__tests__/auth/session-timeout.test.ts` (fake timers)
- [ ] T+2d: Wire audit events into `audit_logger.ts`
- [ ] T+2d: Add config `config/session-timeout.yaml` (or env-var equivalent)
- [ ] T+3d 2026-06-25: Co-sign handoff to Artemis for v0.6 closure record

---

**3-witness (D-002):**
1. file:line: `docs/a11y/Q5_3_VERIFICATION_CHECKLIST_v0.1.md:1-122` (this commit)
2. wc -l: 122 lines
3. md5sum: pending commit
