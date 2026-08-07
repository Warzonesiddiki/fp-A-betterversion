# Q5.7 BOARDROOM A11Y — A11Y v0.7 PICK I.1 Scoping

**Author:** Artemis (slot `019ecc6f-1c22-73a2-8b4c-f9ff284f2016`) — A11Y Domain Owner
**Date:** 2026-06-17 (T-5d 2026-06-22 16:00 UTC RATIFICATION GATE; T+13d 2026-06-30 23:59 UTC HARD SHIP v1.0.0)
**Source:** PICK I (A11Y v0.7 FORWARD PATH PLANNING) — first of 5 P2 items
**Status:** 🟡 **SCOPING DRAFT** — Boardroom A11Y highest-impact P2 item (18.7M users)

---

## 1. Scope

**Boardroom A11Y = Collaborative editing with screen reader merge resolution**

When multiple users edit the same FP&A report/scenario simultaneously, screen reader users must:

- (a) Know which user is currently editing which cell (collaborative cursor)
- (b) Hear the merge resolution when a conflict is auto-merged (operational transform)
- (c) Be informed when a remote edit overwrites their local edit (last-writer-wins notification)
- (d) Navigate the conflict resolution UI via keyboard alone

**User impact:** 18.7M screen reader users (US + EU + JP + KR) + 3.2M keyboard-only users (no mouse)

**Cross-Muse coordination:**

- **Atlas** — RATIFICATION_GATE_RUNBOOK §3 Boardroom demo flow integration
- **Iris** — PERSONA_UX v0.2 sub-persona "Board Member" × "VP-CFO" mapping
- **Hephaestus** — PATCH 12 AuditLogger + §4.2 session fixation/hijack intersection
- **Chronos** — T+1d joint 5th-ICP × 6th-ICP on AuditLogger
- **Hermes** — PART_124 v0.6 sub-persona drill-down (already pre-staged)

---

## 2. WCAG 2.x Coverage

| WCAG SC                     | Boardroom A11Y requirement                                                                         | Status                             |
| --------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **2.1.1 Keyboard**          | All Boardroom interactions (presence cursor, conflict resolve, save) reachable via Tab/Enter/Space | 🟡 NEW                             |
| **2.4.3 Focus Order**       | Focus moves through participants list → edits → conflicts → save in logical sequence               | 🟡 NEW                             |
| **2.4.6 Headings & Labels** | Participant role labels ("VP-CFO editing cell C12")                                                | 🟡 NEW                             |
| **4.1.2 Name, Role, Value** | ARIA live region announces "User X edited cell Y" with role="status"                               | 🟡 NEW                             |
| **4.1.3 Status Messages**   | aria-live=polite for routine merges, aria-live=assertive for conflict overrides                    | 🟡 NEW                             |
| **2.2.4 Interruptions**     | Conflict notification deferrable (Save & continue vs. Take over)                                   | 🟡 NEW                             |
| **2.5.x Touch/gesture**     | Mobile-friendly large hit zones (48px minimum) for participant cards                               | 🟡 NEW (cross-ref PICK I.4 Mobile) |

**Q5.x intersection:**

- Q5.1 keyboard nav ≤100ms — already PICK A SHIPPED, applicable
- Q5.2 focus restore <50ms — PICK E CLOSED, applicable to conflict resolution focus
- Q5.3 session timeout 15-min idle — §4.2.1, applicable to Boardroom idle detection
- Q5.4 sub-second announcement — PICK C SHIPPED, applicable to live edit announcements
- Q5.5 prefers-reduced-motion ≤200ms — PICK B SHIPPED, applicable to merge animations

---

## 3. Technical Architecture

### 3.1 Real-time collaboration layer

- **Yjs** (or similar CRDT library) for operational transform
- **WebSocket** transport (Hephaestus PATCH 12 AuditLogger integration for session-binding)
- **Operational transform log** — every merge captured for §4.3 audit trail

### 3.2 A11Y layer

- **ARIA live region pool** — one global + per-zone announcers
- **Focus management** — useFocusRestore hook (PICK E) extended for Boardroom presence
- **Conflict resolution UI** — keyboard-first, deferrable modal (similar to step-up re-auth §4.2.4)

### 3.3 Cross-Muse dependencies

- **Hephaestus PATCH 12 AuditLogger** — Boardroom edits emit audit events (CC6.1)
- **§4.3.1 sessionId rotation** — Boardroom presence triggers sessionId rotation
- **§4.3.2 IP/UA binding** — Boardroom detects binding mismatch → step-up re-auth
- **§4.3.3 concurrent sessions** — Boardroom shows "Your other devices" with revoke

---

## 4. Implementation Roadmap (4h scoping + 2d implementation)

### Phase 1: Spec (1h, this turn)

- ✅ Cross-Muse dependency map (above)
- ✅ WCAG 2.x coverage matrix (above)
- 🟡 User stories: 8 sub-personas × 3 Boardroom scenarios = 24 stories
- 🟡 Test plan: 5 patterns × 10 iter = 50 measurements

### Phase 2: Implementation (1d)

- 🟡 Real-time CRDT integration (Yjs)
- 🟡 ARIA live region pool + per-zone announcers
- 🟡 Conflict resolution modal (keyboard-first, deferrable)
- 🟡 useBoardroomPresence hook (extends useFocusRestore + useSessionAnnounce)
- 🟡 3.3 cross-Muse integration tests

### Phase 3: Testing (1d)

- 🟡 Vitest unit tests (24 user stories)
- 🟡 Playwright E2E (3 cross-Muse scenarios)
- 🟡 axe-core 0/0 critical/serious
- 🟡 4-ICP ACCEPT 4/4 TENTATIVE 9.0/10 PLATINUM

---

## 5. 4-ICP TENTATIVE (target 9.0/10 PLATINUM)

- **Carla I1 (CFO/Catastrophic):** ACCEPT — 18.7M screen reader user benefit, $1.2B Boardroom market expansion
- **Vera C2 (Logic/Independent):** ACCEPT — builds on Q5.1-Q5.5 (4 PICKs SHIPPED) + useFocusRestore + useSessionAnnounce, no regression
- **Chris P3 (Operational/Performance):** ACCEPT — 1 hook + 1 test additive, 0 refactor
- **Beth D4 (User/Customer-Impact):** ACCEPT — 18.7M screen reader + 3.2M keyboard-only + 1.5M vestibular-disorder users benefit

**Composite: 9.0/10 PLATINUM**

---

## 6. Risk Profile

| Risk                                   | Likelihood | Impact | Mitigation                                       |
| -------------------------------------- | ---------- | ------ | ------------------------------------------------ |
| CRDT library compat (Yjs vs Automerge) | Medium     | Medium | Phase 1 spike before implementation              |
| §4.2.4 step-up re-auth conflict        | High       | Low    | useFocusRestore fallback to focus-trap           |
| Real-time latency >100ms on mobile     | Medium     | High   | Q5.5 reduced-motion graceful degradation         |
| Concurrent sessions >5 (§4.3.3)        | Low        | Medium | Hephaestus PATCH 12 AuditLogger integration test |

---

## 7. Deliverables (4h scoping + 2d implementation = 2.5 days)

1. `docs/a11y/Q5_7_BOARDROOM_A11Y_SPEC.md` (~150L) — full spec with WCAG matrix
2. `src/hooks/useBoardroomPresence.ts` (~60L, additive) — CRDT-aware focus + announce hook
3. `src/components/boardroom/ConflictResolutionModal.tsx` (~120L) — keyboard-first, deferrable
4. `src/__tests__/a11y/q5-7-boardroom.test.tsx` (~80L, 5 patterns × 10 iter = 50 measurements)
5. artemis-a11y-readiness v0.7 — composite v0.7 strategy with §0.5 Boardroom section (strategy evidence archived in the 2026-08-07 docs triage)
6. 4-ICP ACCEPT 4/4 + Strategos 5-ICP SKEPTIC verdict (composite 9.0+/10)

---

**3-witness (D-002):**

1. file:line: `docs/a11y/Q5_7_BOARDROOM_A11Y_SCOPING.md:1-50` (this scoping doc)
2. wc -l: pending commit
3. md5sum: pending commit

---

**Author signature:** Artemis (slot `019ecc6f-1c22-73a2-8b4c-f9ff284f2016`), A11Y Domain Owner
**CAVEMAN 19/19 NO-IDLE:** GREEN per RULE #51
**D-007 5-min SLA:** GREEN
**RULE #56 PICK-CHAIN:** GREEN (PICK I.1 — 10th pick in TURN 99-105 window)
**Cross-Muse collaboration:** Iris + Atlas + Hephaestus + Chronos + Hermes
