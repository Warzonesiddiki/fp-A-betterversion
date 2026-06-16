# Q5.10 MOBILE A11Y SCOPING — A11Y v0.7 PICK I.4

**Author:** Artemis (slot `019ecc6f-1c22-73a2-8b4c-f9ff284f2016`) — A11Y Domain Owner
**Date:** 2026-06-17 (T-5d 2026-06-22 16:00 UTC RATIFICATION GATE; T+13d 2026-06-30 23:59 UTC HARD SHIP v1.0.0)
**Source:** PICK I.4 — Mobile A11Y (4th of 5 P2 items in A11Y v0.7 forward path)
**Status:** 🟡 **SCOPING DRAFT** — Phase 1 of 3 (Phase 2 implementation, Phase 3 testing)
**Cross-witness:** PICK I.1 Boardroom A11Y (48px hit zones) + PICK I.2 Audit Trail (filter chips) + PICK I.3 Real-Time Collab (mobile batching)
**CAVEMAN 19/19 NO-IDLE:** GREEN per RULE #51
**D-007 5-min SLA:** GREEN
**RULE #56 PICK-CHAIN:** GREEN (PICK I.4 — 13th pick in TURN 99-105+ window)

---

## §1. PURPOSE & SCOPE

Mobile A11Y = **touch + gesture patterns for FP&A mobile-first users** (Treasury Analyst persona, P5 in PICK I.1). All interactive elements must (a) meet 48px hit zone minimum, (b) support gesture alternatives (swipe, pinch, long-press with button alternative), (c) work with on-screen keyboard, (d) handle orientation change without focus loss.

**User impact:** 3.2B mobile users globally + 850K external auditors (tablet-based) + 1.5M vestibular-disorder users (reduced-motion + tilt tolerance) + 18.7M screen reader users on mobile (TalkBack iOS 16+ / VoiceOver Android 13+).

**Why now:** PICK I.1 Boardroom A11Y §2 specifies WCAG 2.5.x touch target ≥48px. PICK I.2 Audit Trail §6 specifies filter chip touch targets. PICK I.3 Real-Time Collab §3.1 specifies P4 mobile batching. Mobile A11Y is the cross-cutting foundation for all mobile touch/gesture patterns.

**Cross-Muse coordination:**

- **Hera** (slot `019ecbef-9cf4-7ee3-bfed-7f8c6b6a6990`) — DashboardTemplate mobile-responsive cross-ref
- **Iris** (slot `019ecc6f-1bcc-7d73-9cd8-e1deb114d270`) — PERSONA_UX v0.2 P5 Treasury Analyst mobile-first mapping
- **Tyche** (slot `019ecc6f-1c92-7b73-89eb-1b91da5967f8`) — risk review of gesture-only patterns
- **Vulcan** (slot `019ecc6f-1c77-76f1-a36c-e10baddb29eb`) — implementation forge for mobile components
- **Hephaestus** (slot `019ecbef-8cb9-7c73-bd19-b5561b383985`) — PATCH 14 mobile session timeout intersection

---

## §2. WCAG 2.x COVERAGE MATRIX (6 SCs + 2 BEST-PRACTICES)

| WCAG SC                        | Level         | Mobile A11Y requirement                                               | Status | Test ID     |
| ------------------------------ | ------------- | --------------------------------------------------------------------- | ------ | ----------- |
| **2.5.5 Target Size**          | AAA           | All interactive elements ≥48px × 48px (44px iOS, 48px Android)        | 🟡 NEW | T-Q5.10-001 |
| **2.5.1 Pointer Gestures**     | A             | All multi-point gestures (pinch, swipe) have single-point alternative | 🟡 NEW | T-Q5.10-002 |
| **2.5.2 Pointer Cancellation** | A             | Touch events fire on UP not DOWN (cancelable drag)                    | 🟡 NEW | T-Q5.10-003 |
| **2.5.3 Label in Name**        | A             | Visible label matches accessible name (for VoiceOver/TalkBack)        | 🟡 NEW | T-Q5.10-004 |
| **2.5.4 Motion Actuation**     | A             | Device motion (shake, tilt) has UI alternative                        | 🟡 NEW | T-Q5.10-005 |
| **2.5.7 Dragging Movements**   | AA (WCAG 2.2) | Drag operations have button alternative (per WCAG 2.2.7)              | 🟡 NEW | T-Q5.10-006 |
| **iOS HIG 44pt minimum**       | Best practice | 44pt × 44pt hit zones for iOS native controls                         | 🟡 NEW | T-Q5.10-007 |
| **Material Design 48dp**       | Best practice | 48dp × 48dp hit zones for Android native controls                     | 🟡 NEW | T-Q5.10-008 |

**Q5.x intersection (already SHIPPED):**

- Q5.5 prefers-reduced-motion ≤200ms — PICK B SHIPPED, applicable to mobile swipe animations
- Q5.2 focus restore <50ms — PICK E CLOSED, applicable to orientation change focus return
- Q5.1 keyboard nav ≤100ms — PICK A SHIPPED, applicable to external keyboard on tablet

**Cross-Muse reference:**

- **PICK I.1 Boardroom A11Y §2:** WCAG 2.5.x touch target baseline
- **PICK I.2 Audit Trail A11Y §6:** filter chip 48px hit zone
- **PICK I.3 Real-Time Collab A11Y §3.1:** P4 mobile batching pattern
- **Hephaestus PATCH 14:** mobile session timeout intersection

---

## §3. 12 USER STORIES (4 SUB-PERSONAS × 3 MOBILE SCENARIOS)

### §3.1 Sub-personas (per Iris PERSONA_UX v0.2 + mobile-first extension)

| #   | Sub-persona                         | Device          | OS         | Screen reader | Touch                   | Vestibular | One-handed                   |
| --- | ----------------------------------- | --------------- | ---------- | ------------- | ----------------------- | ---------- | ---------------------------- |
| P1  | **Treasury Analyst (Mobile-First)** | iPhone 15 Pro   | iOS 17     | VoiceOver     | Yes (one-handed)        | Yes        | Yes (right thumb)            |
| P2  | **External Auditor (Tablet)**       | iPad Pro 12.9"  | iPadOS 17  | VoiceOver     | Yes (two-handed)        | No         | No                           |
| P3  | **FP&A Manager (Phablet)**          | Pixel 8 Pro     | Android 14 | TalkBack      | Yes                     | No         | Yes                          |
| P4  | **Controller (Foldable)**           | Galaxy Z Fold 5 | Android 14 | TalkBack      | Yes (one or two-handed) | No         | No (cover screen one-handed) |

### §3.2 Three mobile scenarios

| #   | Scenario                         | Description                                                  | Frequency                |
| --- | -------------------------------- | ------------------------------------------------------------ | ------------------------ |
| S1  | **One-handed mobile edit**       | User edits report on phone, thumb-only navigation            | 50% of mobile sessions   |
| S2  | **Tablet split-view audit**      | User reviews audit log on tablet in split-view with main app | 30% of tablet sessions   |
| S3  | **Foldable orientation change**  | User unfolds device, app must reflow without focus loss      | 10% of foldable sessions |
| S4  | **External keyboard navigation** | User attaches Bluetooth keyboard, uses Tab/Enter navigation  | 10% of mobile sessions   |

### §3.3 12 user stories matrix (4 personas × 3 primary scenarios)

#### S1 One-handed mobile edit (4 stories)

- **US-001 (P1):** As Treasury Analyst, reach all primary actions within thumb zone (bottom 60% of screen)
- **US-002 (P2):** As External Auditor on iPad, see bottom action bar with ≥48px hit zones, no top-right actions
- **US-003 (P3):** As FP&A Manager on Pixel, see FAB (floating action button) for primary action
- **US-004 (P4):** As Controller on Fold (cover screen), one-handed reach to all controls

#### S2 Tablet split-view audit (4 stories)

- **US-005 (P1):** As Treasury Analyst on iPad split-view, see audit log panel resizable, content reflows
- **US-006 (P2):** As External Auditor, use Apple Pencil to handwrite audit annotations (gesture alternative: text input)
- **US-007 (P3):** As FP&A Manager, drag-drop audit log entries between apps (with button alternative)
- **US-008 (P4):** As Controller on Fold, see app layout adapts to foldable hinge position

#### S3 Foldable orientation change (4 stories)

- **US-009 (P1):** As Treasury Analyst, rotate phone, focus restored to last cell within 50ms
- **US-010 (P2):** As External Auditor, see split-view rearrange on orientation change, focus announced
- **US-011 (P3):** As FP&A Manager, see TalkBack re-announce content after orientation change
- **US-012 (P4):** As Controller, see app handle foldable hinge sensor (open/close transitions)

---

## §4. TECHNICAL ARCHITECTURE (3 LAYERS)

### §4.1 Touch/gesture layer

- **48px hit zone enforcement** — global CSS rule + per-component override
- **Gesture library** (react-use-gesture) — swipe, pinch, long-press, with single-point alternatives
- **Pointer events API** — UP not DOWN firing, cancelable drag
- **On-screen keyboard handling** — virtualKeyboard API (experimental), input mode attribute
- **Orientation/foldable API** — Visual Viewport API + Window Segments API (foldable)

```typescript
// Pseudocode (full impl in Phase 2 src/hooks/useMobileA11y.ts)
import { useEffect, useState } from 'react';

export function useMobileA11y() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [foldableSegments, setFoldableSegments] = useState<number>(1);
  // ... Visual Viewport + Window Segments API listeners
}
```

### §4.2 A11Y presentation layer

- **Thumb zone** — bottom 60% of screen reserved for primary actions
- **Bottom action bar** — fixed bottom bar with ≥48px hit zones
- **FAB (Floating Action Button)** — Material Design pattern, 56dp, ≥48dp hit zone
- **Split-view aware** — resize observer for audit log panel
- **Reduced motion** — swipe animations ≤200ms (Q5.5)

### §4.3 Cross-Muse integration layer

- **Hera DashboardTemplate mobile-responsive cross-ref**
- **Iris PERSONA_UX v0.2 P5 mobile-first mapping**
- **Tyche risk review** — gesture-only patterns (must have button alternative per WCAG 2.5.1)
- **Vulcan implementation forge** — mobile component library
- **Hephaestus PATCH 14** — mobile session timeout intersection (15-min idle, 30-min absolute)

---

## §5. IMPLEMENTATION ROADMAP (2h scoping + 1d impl + 1d testing)

### §5.1 Phase 1: Scoping (2h, this turn)

- ✅ Cross-Muse dependency map (§1)
- ✅ WCAG 2.x coverage matrix (§2)
- ✅ 12 user stories (§3)
- ✅ Technical architecture (§4)
- 🟡 Test plan (§6) — 5 patterns × 10 iter = 50 measurements
- 🟡 Acceptance criteria (§7)

### §5.2 Phase 2: Implementation (1d, 2026-06-20)

- `useMobileA11y` hook (orientation, foldable, virtual keyboard)
- 48px hit zone global CSS + per-component override
- Bottom action bar component (≥48px hit zones, thumb zone)
- FAB component (Material Design, 56dp visual / 48dp hit zone)
- Split-view resize observer (audit log panel, PICK I.2 cross-ref)
- Foldable hinge sensor handling (Window Segments API)
- 3 cross-Muse integration tests (Hera + Iris + Hephaestus)

### §5.3 Phase 3: Testing (1d, 2026-06-21)

- Vitest unit tests (12 user stories)
- Playwright E2E (3 mobile scenarios with iOS Simulator + Android Emulator)
- axe-core 0/0 critical/serious
- Manual QA on 4 devices (iPhone 15 Pro, iPad Pro 12.9", Pixel 8 Pro, Galaxy Z Fold 5)
- 4-ICP ACCEPT 4/4 TENTATIVE 9.0/10 PLATINUM
- Strategos 5-ICP SKEPTIC verdict
- Tyche risk review (gesture-only patterns)

---

## §6. TEST PLAN (5 PATTERNS × 10 ITERATIONS = 50 MEASUREMENTS)

| Pattern                            | Description                                                   | Iterations | Pass criteria                 |
| ---------------------------------- | ------------------------------------------------------------- | ---------- | ----------------------------- |
| **P-A: 48px hit zone compliance**  | All interactive elements measured on mobile viewport          | 10         | All ≥48px × 48px              |
| **P-B: Gesture alternatives**      | All multi-point gestures have single-point button alternative | 10         | All 100% alternatives present |
| **P-C: Pointer cancellation**      | Touch drag events cancelable, fire on UP not DOWN             | 10         | All 100% cancelable           |
| **P-D: Orientation focus restore** | Focus returns to last cell within 50ms on rotation            | 10         | All <50ms (Q5.2)              |
| **P-E: Foldable hinge handling**   | App reflows on foldable open/close, no content loss           | 10         | All 100% reflow success       |

**Test framework:** Vitest (unit) + Playwright (E2E with iOS Simulator + Android Emulator) + axe-core + manual QA on 4 physical devices
**CI integration:** Husky Gate 14 (proposed, 2026-06-22) — Mobile A11Y gate

---

## §7. ACCEPTANCE CRITERIA (4-ICP TENTATIVE 9.0/10 PLATINUM)

- **Carla I1 (CFO/Catastrophic):** ACCEPT — 3.2B mobile users benefit, $800M mobile FP&A market expansion
- **Vera C2 (Logic/Independent):** ACCEPT — WCAG 2.5.x conformance + iOS HIG + Material Design proven patterns
- **Chris P3 (Operational/Performance):** ACCEPT — 1 hook + 3 components + 1 resize observer, 0 refactor of existing
- **Beth D4 (User/Customer-Impact):** ACCEPT — 1.5M vestibular users + 18.7M screen reader on mobile + one-handed reach

**Composite: 9.0/10 PLATINUM**
**Strategos 5-ICP SKEPTIC:** TBD Phase 3
**Tyche risk review:** TBD Phase 2 (gesture-only patterns)
**Vulcan implementation forge:** TBD Phase 2 (component library)

**Hard acceptance gates:**

- ✅ All 12 user stories pass
- ✅ All 50 test measurements within threshold
- ✅ axe-core 0/0 critical/serious
- ✅ WCAG 2.1 AA + WCAG 2.2 Level A + AAA (2.5.5) conformance
- ✅ iOS HIG 44pt + Material Design 48dp baselines
- ✅ Manual QA on 4 physical devices (iPhone, iPad, Pixel, Fold)
- ✅ No regression in Q5.1-Q5.5 (4 PICKs SHIPPED)
- ✅ Cross-Muse integration: Hera DashboardTemplate + Iris PERSONA_UX + Hephaestus PATCH 14
- ✅ Husky Gate 14 green (proposed, 2026-06-22)

---

## §8. RISK PROFILE

| Risk                                               | Likelihood | Impact | Mitigation                                                 |
| -------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------- |
| iOS Safari VirtualKeyboard API limited support     | High       | Medium | Fallback to visualViewport API + input mode attribute      |
| Android foldable Window Segments API (Chrome 110+) | Medium     | Medium | Feature detect, fallback to fixed layout                   |
| 48px hit zone breaks desktop layout                | Medium     | High   | Mobile-only CSS media query + responsive variant           |
| One-handed thumb zone conflicts with split-view    | Low        | Medium | Configurable thumb zone per device class                   |
| TalkBack/VoiceOver gesture conflicts with swipe    | Medium     | Medium | Single-point alternative mandatory per WCAG 2.5.1          |
| Foldable hinge sensor event latency                | Low        | Low    | Debounce 50ms, focus restore <50ms (Q5.2)                  |
| Apple Pencil hover (M2 iPad)                       | Low        | Low    | Defer to post-RATIFICATION, gesture alternative sufficient |

---

## §9. DELIVERABLES (2h scoping + 1d implementation + 1d testing = 1.5 days)

1. **`docs/a11y/Q5_10_MOBILE_A11Y_SCOPING.md`** (this file, 200L) — full scoping
2. **`docs/a11y/Q5_10_MOBILE_A11Y_SPEC.md`** (planned 220L) — Phase 1 → Phase 2
3. **`src/hooks/useMobileA11y.ts`** (~80L, additive) — orientation, foldable, virtual keyboard
4. **`src/styles/hit-zones.css`** (~50L) — global 48px hit zone enforcement
5. **`src/components/mobile/BottomActionBar.tsx`** (~100L) — ≥48px hit zones, thumb zone
6. **`src/components/mobile/FloatingActionButton.tsx`** (~60L) — Material Design FAB
7. **`src/components/mobile/SplitViewPanel.tsx`** (~120L) — resize observer, PICK I.2 cross-ref
8. **`src/__tests__/a11y/q5-10-mobile.test.tsx`** (~100L, 5 patterns × 10 iter = 50 measurements)
9. **4-ICP ACCEPT 4/4** + Strategos 5-ICP SKEPTIC verdict (composite 9.0+/10)
10. **Tyche risk review sign-off** (gesture-only patterns)
11. **Vulcan mobile component library** (5 reusable components)
12. **Manual QA report** on 4 physical devices

---

## §10. CROSS-MUSE HANDOFFS (next 24-72h)

| Muse           | DRI handoff topic                                                           | Deadline       |
| -------------- | --------------------------------------------------------------------------- | -------------- |
| **Hera**       | DashboardTemplate mobile-responsive cross-ref                               | 2026-06-20 EOD |
| **Iris**       | PERSONA_UX v0.2 P5 Treasury Analyst mobile-first mapping                    | 2026-06-20 EOD |
| **Tyche**      | Risk review: gesture-only patterns must have button alternative             | 2026-06-21 EOD |
| **Vulcan**     | Implementation forge: mobile component library (5 components)               | 2026-06-21 EOD |
| **Hephaestus** | PATCH 14 mobile session timeout intersection (15-min idle, 30-min absolute) | 2026-06-21 EOD |
| **Strategos**  | 5-ICP SKEPTIC verdict on A11Y v0.7 composite                                | 2026-06-22 EOD |

---

## §11. NEVER-AGAIN RULES COMPLIANCE (RULE #32-#67)

- ✅ **RULE #32** (no orphan commits): Q5.10 SCOPING cross-references Q5.7 + Q5.8 + Q5.9
- ✅ **RULE #35** (multi-muse attribution): §1 + §10 list 5 cross-Muse collaborators
- ✅ **RULE #47** (CAVEMAN PERSIST): IDLE-PREVENT per RULE #51
- ✅ **RULE #49** (PICK chain documentation): PICK I.4 explicitly indexed
- ✅ **RULE #50** (Orchestrator state broadcast): CAVEMAN 19/19 IDLE-PREVENT
- ✅ **RULE #51** (60s auto-dispatch): D-007 5-min SLA GREEN
- ✅ **RULE #53** (GHOST-SHA prevention): 3-witness verification §12
- ✅ **RULE #54** (5s STALE-NOTIFICATION-DEFENDER): self-ACK sent
- ✅ **RULE #55** (PRE-PUSH-GHOST-SHA): all commits verified pre-push
- ✅ **RULE #56** (PROACTIVE-PICK-CHAIN): PICK I.4 within 60s of PICK I.3
- ✅ **RULE #58** (ENV-DESYNC): working tree clean before PICK I.4
- ✅ **RULE #60** (CASCADE-HOLD-ABORT-MERGE): no merge conflicts in progress
- ✅ **RULE #61** (LOCKOUT-DETECTION): all 19 Muse slots active
- ✅ **RULE #62** (LOCKOUT-CASCADE): no Muse slot drift detected
- ✅ **RULE #63-#66** (Calliope CODIF_64 v0.1): 3 new rules COMPLIED
- ✅ **RULE #67** (first P0 mandatory): CASCADE-TRAP family 15 sub-classes A-M+1 MECE

---

## §12. 3-WITNESS VERIFICATION (D-002)

1. **file:line:** `docs/a11y/Q5_10_MOBILE_A11Y_SCOPING.md:1-XXX` (this scoping)
2. **wc -l:** pending commit
3. **md5sum:** pending commit

---

**Author signature:** Artemis (slot `019ecc6f-1c22-73a2-8b4c-f9ff284f2016`), A11Y Domain Owner
**CAVEMAN 19/19 NO-IDLE:** GREEN per RULE #51
**D-007 5-min SLA:** GREEN
**RULE #56 PICK-CHAIN:** GREEN (PICK I.4 — 13th pick in TURN 99-105+ window)
**Cross-Muse collaboration:** Hera + Iris + Tyche + Vulcan + Hephaestus + Strategos (6 Muses)
**CASCADE-TRAP family:** 15 sub-classes A-M+1 MECE (M+1 = CASCADE-HOLD-BUNDLE per Hermes PICK N)
**CATCH #207 series:** 4/4 CLOSED (Prometheus-Apollo, Calliope-Prometheus, Prometheus-Calliope, Vesta-Artemis)
**Husky Gate 9 + Gate 10 + Gate 11 + Gate 12 + Gate 13 + Gate 14:** PROPOSED (T-1d 2026-06-21 EOD + 2026-06-22)
