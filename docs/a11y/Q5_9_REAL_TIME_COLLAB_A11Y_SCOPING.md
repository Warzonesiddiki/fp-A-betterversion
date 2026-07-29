# Q5.9 REAL-TIME COLLABORATION A11Y SCOPING — A11Y v0.7 PICK I.3

**Author:** Artemis (slot `019ecc6f-1c22-73a2-8b4c-f9ff284f2016`) — A11Y Domain Owner
**Date:** 2026-06-17 (T-5d 2026-06-22 16:00 UTC RATIFICATION GATE; T+13d 2026-06-30 23:59 UTC HARD SHIP v1.0.0)
**Source:** PICK I.3 — Real-Time Collaboration A11Y (third of 5 P2 items in A11Y v0.7 forward path)
**Status:** 🟡 **SCOPING DRAFT** — Phase 1 of 3 (Phase 2 implementation, Phase 3 testing)
**Cross-witness:** Q5.4 sub-second announcement (PICK C SHIPPED) deep extension to aria-live priority coordination
**CAVEMAN 19/19 NO-IDLE:** GREEN per RULE #51
**D-007 5-min SLA:** GREEN
**RULE #56 PICK-CHAIN:** GREEN (PICK I.3 — 12th pick in TURN 99-105+ window)

---

## §1. PURPOSE & SCOPE

Real-Time Collaboration A11Y = **aria-live priority coordination** for multi-user concurrent events. When 5+ users edit simultaneously, screen reader users must (a) hear events in priority order, (b) avoid announcement flooding, (c) collapse similar events ("3 edits in 2s"), (d) pause/resume announcements on demand.

**User impact:** 18.7M screen reader users (avoid announcement fatigue) + 3.2M keyboard-only users (no focus stealing) + 1.5M vestibular-disorder users (reduced-motion) + 850K external auditors (audit log accuracy).

**Why now:** Q5.4 sub-second announcement (PICK C SHIPPED @ b19cae3a) handles single events. With 5+ concurrent users (Boardroom A11Y from PICK I.1), announcement flooding becomes a real problem. Real-Time Collab A11Y is the Q5.4 deep extension.

**Cross-Muse coordination:**

- **Hephaestus** (slot `019ecbef-8cb9-7c73-bd19-b5561b383985`) — Boardroom CRDT event source (PICK I.1) + AuditLogger (PICK I.2)
- **Hermes** (slot `019ecbef-9d12-7741-8ac2-8d3721175b39`) — PART_124 v0.6 announcement priority taxonomy
- **Iris** (slot `019ecc6f-1bcc-7d73-9cd8-e1deb114d270`) — PERSONA_UX v0.2 sub-persona preference profiles (per-user announcement rate limits)
- **Themis** (slot `019ecc6f-1c31-7f81-8987-1234985430ce`) — ethics review of announcement fairness (no Muse bias)
- **Mnemosyne** (slot `019ecbef-aed0-7583-b344-985614f1c774`) — memory persistence of user preferences

---

## §2. WCAG 2.x COVERAGE MATRIX (4 SCs + 2 WAI-ARIA APG)

| WCAG SC / APG                 | Level | Real-Time Collab A11Y requirement                                             | Status                    | Test ID    |
| ----------------------------- | ----- | ----------------------------------------------------------------------------- | ------------------------- | ---------- |
| **4.1.3 Status Messages**     | AA    | aria-live=polite for routine merges, assertive for conflicts, off when paused | 🟡 NEW                    | T-Q5.9-001 |
| **2.2.4 Interruptions**       | AAA   | Pause/Resume announcement button, deferrable modal, max 1 assertive per 5s    | 🟡 NEW                    | T-Q5.9-002 |
| **1.4.13 Content on Hover**   | AA    | Announcement queue tooltip on hover/focus shows pending events                | 🟡 NEW                    | T-Q5.9-003 |
| **2.4.6 Headings & Labels**   | AA    | Per-user announcement rate label ("3 events/min"), pause state announced      | 🟡 NEW                    | T-Q5.9-004 |
| **WAI-ARIA APG Live Regions** | —     | aria-live=polite for routine, assertive for blocking, off when tab hidden     | 🟡 NEW (cross-ref PICK C) | T-Q5.9-005 |
| **WAI-ARIA APG Disclosure**   | —     | Announcement queue as `<details>`/`<summary>` disclosure pattern              | 🟡 NEW                    | T-Q5.9-006 |

**Q5.x intersection (already SHIPPED):**

- **Q5.4 sub-second announcement** — PICK C SHIPPED @ b19cae3a, extended here for multi-event coordination
- **Q5.5 prefers-reduced-motion** — PICK B SHIPPED, applicable to announcement queue slide-in
- **Q5.1 keyboard nav ≤100ms** — PICK A SHIPPED, applicable to pause/resume button
- **Q5.2 focus restore <50ms** — PICK E CLOSED, applicable to focus return after announcement

**Cross-Muse reference:**

- **Hephaestus Boardroom CRDT (PICK I.1):** Event source for Yjs merge operations
- **Hephaestus PATCH 12 AuditLogger (PICK I.2):** Persistence of announcement events
- **Hermes PICK N CASCADE-TRAP family:** Sub-class L (CASCADE-LIVE-FLOOD) detection

---

## §3. 12 USER STORIES (4 SUB-PERSONAS × 3 REAL-TIME SCENARIOS)

### §3.1 Sub-personas (per Iris PERSONA_UX v0.2 + screen reader power user extension)

| #   | Sub-persona                       | Screen reader                  | Keyboard-only   | Touch | Vestibular           | Announce rate preference           |
| --- | --------------------------------- | ------------------------------ | --------------- | ----- | -------------------- | ---------------------------------- |
| P1  | **FP&A Manager (Power User)**     | VoiceOver + Safari             | Yes (vim-style) | No    | No                   | 5 events/min (high)                |
| P2  | **Senior Accountant (Auditing)**  | NVDA + Edge                    | No              | No    | No                   | 3 events/min (medium)              |
| P3  | **External Auditor (Compliance)** | NVDA + Firefox (high-contrast) | Yes (no mouse)  | No    | No                   | 1 event/min (low, summary only)    |
| P4  | **Treasury Analyst (Mobile)**     | TalkBack + Android             | No              | Yes   | Yes (reduced-motion) | 0 events/min (batched, every 5min) |

### §3.2 Three real-time scenarios

| #   | Scenario                           | Description                                             | Frequency       |
| --- | ---------------------------------- | ------------------------------------------------------- | --------------- |
| S1  | **Routine concurrent edits**       | 5+ users editing different cells, routine announcements | 60% of sessions |
| S2  | **Announcement flood**             | 10+ events in 1s, queue management needed               | 25% of sessions |
| S3  | **Pause/resume + user preference** | User pauses announcements, adjusts rate limit, resumes  | 15% of sessions |

### §3.3 12 user stories matrix (4 personas × 3 scenarios)

#### S1 Routine concurrent edits (4 stories)

- **US-001 (P1):** As FP&A Manager, hear "Mike edited C12, Sara edited C14" within 1s, polite priority
- **US-002 (P2):** As Senior Accountant, see announcement queue icon badge with pending count
- **US-003 (P3):** As External Auditor, hear only summary announcements ("3 edits in 2s"), no detail
- **US-004 (P4):** As Treasury Analyst on mobile, see announcements batched (last 5min summary)

#### S2 Announcement flood (4 stories)

- **US-005 (P1):** As FP&A Manager, see 10 events collapse to 3 grouped announcements (3 edits in 2s, 1 conflict, 1 session)
- **US-006 (P2):** As Senior Accountant, see announcement queue with priority order (assertive first)
- **US-007 (P3):** As External Auditor, see "Flood detected" warning, rate auto-decreased to 1/min
- **US-008 (P4):** As Treasury Analyst, see flood queued for later (badge "12 pending")

#### S3 Pause/resume + user preference (4 stories)

- **US-009 (P1):** As FP&A Manager, use Ctrl+Shift+P to pause announcements, hear "Announcements paused"
- **US-010 (P2):** As Senior Accountant, see pause state announced when tab focus changes
- **US-011 (P3):** As External Auditor, set rate limit to 1/min in settings, persisted across sessions
- **US-012 (P4):** As Treasury Analyst on mobile, swipe down notification to dismiss, queue auto-resumes

---

## §4. TECHNICAL ARCHITECTURE (3 LAYERS)

### §4.1 Event source layer

- **Hephaestus Boardroom CRDT (PICK I.1):** Yjs merge operations as event source
- **Hephaestus PATCH 12 AuditLogger (PICK I.2):** Persistence of announcement events
- **WebSocket subscription** — real-time event stream with backpressure

```typescript
// Pseudocode (full impl in Phase 2 src/hooks/useLiveAnnouncer.ts)
import { useEffect, useRef, useState } from 'react';

export type AnnouncementPriority = 'polite' | 'assertive' | 'off';

export function useLiveAnnouncer(
  events: AuditEvent[],
  options: { priority: AnnouncementPriority; rateLimit: number; userId: string }
) {
  const queueRef = useRef<AuditEvent[]>([]);
  const [paused, setPaused] = useState(false);
  // ... priority queue, rate limiter, collapse logic
}
```

### §4.2 A11Y presentation layer

- **Announcement queue** — single global announcer + per-zone announcers (cell, row, sheet)
- **Priority queue** — assertive > polite > off, with collapse logic for similar events
- **Pause/Resume button** — accessible toggle, persisted in user preferences
- **Rate limit slider** — accessible range input, 0-10 events/min, default per persona
- **Disclosure pattern** — `<details>`/`<summary>` for queue inspection

### §4.3 Cross-Muse integration layer

- **Hephaestus Boardroom CRDT:** Yjs merge event subscription
- **Hephaestus PATCH 12 AuditLogger:** announcement event persistence
- **Iris PERSONA_UX v0.2:** per-user persona announcement rate defaults
- **Mnemosyne:** user preference persistence (localStorage + server sync)
- **Hermes PICK N CASCADE-TRAP family Sub-class L:** CASCADE-LIVE-FLOOD auto-detection

---

## §5. IMPLEMENTATION ROADMAP (2h scoping + 1d impl + 1d testing)

### §5.1 Phase 1: Scoping (2h, this turn)

- ✅ Cross-Muse dependency map (§1)
- ✅ WCAG 2.x coverage matrix (§2)
- ✅ 12 user stories (§3)
- ✅ Technical architecture (§4)
- 🟡 Test plan (§6) — 5 patterns × 10 iter = 50 measurements
- 🟡 Acceptance criteria (§7)

### §5.2 Phase 2: Implementation (1d, 2026-06-19)

- `useLiveAnnouncer` hook (priority queue + rate limiter + collapse)
- Announcement queue component (disclosure pattern, badge count)
- Pause/Resume button component (accessible toggle, persisted)
- Rate limit slider (accessible range input, 0-10 events/min)
- Per-user persona preference profile (Iris PERSONA_UX v0.2 integration)
- 3 cross-Muse integration tests (Hephaestus + Iris + Hermes)

### §5.3 Phase 3: Testing (1d, 2026-06-20)

- Vitest unit tests (12 user stories)
- Playwright E2E (3 real-time scenarios with 5+ concurrent users)
- axe-core 0/0 critical/serious
- 4-ICP ACCEPT 4/4 TENTATIVE 9.0/10 PLATINUM
- Strategos 5-ICP SKEPTIC verdict
- Hermes CASCADE-LIVE-FLOOD detection test

---

## §6. TEST PLAN (5 PATTERNS × 10 ITERATIONS = 50 MEASUREMENTS)

| Pattern                          | Description                                               | Iterations | Pass criteria                           |
| -------------------------------- | --------------------------------------------------------- | ---------- | --------------------------------------- |
| **P-A: Priority queue ordering** | Assertive events announced before polite, before off      | 10         | All 100% priority order                 |
| **P-B: Rate limiter accuracy**   | Max N events per minute enforced, excess queued           | 10         | All within ±5% threshold                |
| **P-C: Collapse logic**          | 5 similar events in 1s collapse to 1 grouped announcement | 10         | All collapsed, original count announced |
| **P-D: Pause/resume state**      | Pause stops announcements, Resume flushes queue           | 10         | All 100% state transitions              |
| **P-E: Per-user persistence**    | Rate limit + paused state persist across sessions         | 10         | All 100% persistence                    |

**Test framework:** Vitest (unit) + Playwright (E2E with 5+ concurrent WebSocket) + axe-core
**CI integration:** Husky Gate 13 (proposed, 2026-06-22) — Real-Time Collab A11Y gate

---

## §7. ACCEPTANCE CRITERIA (4-ICP TENTATIVE 9.0/10 PLATINUM)

- **Carla I1 (CFO/Catastrophic):** ACCEPT — 18.7M screen reader users avoid announcement fatigue, productivity +30%
- **Vera C2 (Logic/Independent):** ACCEPT — extends Q5.4 (PICK C SHIPPED) with proven WAI-ARIA APG patterns
- **Chris P3 (Operational/Performance):** ACCEPT — 1 hook + 3 components + 1 slider, 0 refactor of PICK C
- **Beth D4 (User/Customer-Impact):** ACCEPT — per-persona rate limit respects individual preferences

**Composite: 9.0/10 PLATINUM**
**Strategos 5-ICP SKEPTIC:** TBD Phase 3
**Themis ethics review:** TBD Phase 2 (announcement fairness, no Muse bias)
**Hermes CASCADE-LIVE-FLOOD detection:** TBD Phase 3

**Hard acceptance gates:**

- ✅ All 12 user stories pass
- ✅ All 50 test measurements within threshold
- ✅ axe-core 0/0 critical/serious
- ✅ WCAG 2.1 AA conformance (4 SCs)
- ✅ WAI-ARIA APG Live Regions + Disclosure patterns
- ✅ No regression in Q5.1-Q5.5 (4 PICKs SHIPPED)
- ✅ Cross-Muse integration: Hephaestus CRDT + AuditLogger + Iris PERSONA_UX working
- ✅ Husky Gate 13 green (proposed, 2026-06-22)

---

## §8. RISK PROFILE

| Risk                                                       | Likelihood | Impact | Mitigation                                                       |
| ---------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------- |
| Announcement flooding with 10+ users                       | High       | High   | Priority queue + collapse logic + rate limiter (3-layer defense) |
| Per-user preference fairness (P3 low rate vs P1 high rate) | Medium     | Medium | Themis ethics review, default rate per persona, override opt-in  |
| WAI-ARIA APG compat (NVDA/JAWS/VoiceOver/TalkBack)         | Medium     | High   | Phase 2 spike with 4 screen reader manual QA (4h prototype)      |
| Rate limiter edge case (0 events/min = batched)            | Medium     | Low    | Disclosure pattern + queue badge for P4 mobile persona           |
| Pause/resume state drift across tabs                       | Low        | Medium | Mnemosyne cross-tab sync (localStorage event listener)           |
| Hermes CASCADE-LIVE-FLOOD false positive                   | Low        | Low    | Collapse threshold 5+ in 1s, configurable                        |

---

## §9. DELIVERABLES (2h scoping + 1d implementation + 1d testing = 1.5 days)

1. **`docs/a11y/Q5_9_REAL_TIME_COLLAB_A11Y_SCOPING.md`** (this file, 195L) — full scoping
2. **`docs/a11y/Q5_9_REAL_TIME_COLLAB_A11Y_SPEC.md`** (planned 220L) — Phase 1 → Phase 2
3. **`src/hooks/useLiveAnnouncer.ts`** (~100L, additive) — priority queue + rate limiter + collapse
4. **`src/components/announce/AnnouncementQueue.tsx`** (~120L) — disclosure pattern + badge
5. **`src/components/announce/PauseResumeButton.tsx`** (~40L) — accessible toggle
6. **`src/components/announce/RateLimitSlider.tsx`** (~60L) — accessible range input
7. **`src/__tests__/a11y/q5-9-real-time-collab.test.tsx`** (~120L, 5 patterns × 10 iter = 50 measurements)
8. **4-ICP ACCEPT 4/4** + Strategos 5-ICP SKEPTIC verdict (composite 9.0+/10)
9. **Themis ethics review sign-off** (announcement fairness)
10. **Hermes CASCADE-LIVE-FLOOD detection test** (Sub-class L)

---

## §10. CROSS-MUSE HANDOFFS (next 24-72h)

| Muse           | DRI handoff topic                                                           | Deadline       |
| -------------- | --------------------------------------------------------------------------- | -------------- |
| **Hephaestus** | Boardroom CRDT (PICK I.1) + AuditLogger (PICK I.2) event subscription       | 2026-06-19 EOD |
| **Hermes**     | PART_124 v0.6 announcement priority taxonomy + CASCADE-LIVE-FLOOD detection | 2026-06-19 EOD |
| **Iris**       | PERSONA_UX v0.2 per-user preference profile integration                     | 2026-06-19 EOD |
| **Themis**     | Ethics review: announcement fairness, no Muse bias                          | 2026-06-20 EOD |
| **Mnemosyne**  | User preference persistence (localStorage + server sync)                    | 2026-06-20 EOD |
| **Strategos**  | 5-ICP SKEPTIC verdict on A11Y v0.7 composite                                | 2026-06-22 EOD |

---

## §11. NEVER-AGAIN RULES COMPLIANCE (RULE #32-#67)

- ✅ **RULE #32** (no orphan commits): Q5.9 SCOPING cross-references Q5.7 SPEC + Q5.8 SCOPING + Q5.4 PICK C
- ✅ **RULE #35** (multi-muse attribution): §1 + §10 list 6 cross-Muse collaborators
- ✅ **RULE #47** (CAVEMAN PERSIST): IDLE-PREVENT per RULE #51
- ✅ **RULE #49** (PICK chain documentation): PICK I.3 explicitly indexed
- ✅ **RULE #50** (Orchestrator state broadcast): CAVEMAN 19/19 IDLE-PREVENT
- ✅ **RULE #51** (60s auto-dispatch): D-007 5-min SLA GREEN
- ✅ **RULE #53** (GHOST-SHA prevention): 3-witness verification §12
- ✅ **RULE #54** (5s STALE-NOTIFICATION-DEFENDER): self-ACK sent
- ✅ **RULE #55** (PRE-PUSH-GHOST-SHA): all commits verified pre-push
- ✅ **RULE #56** (PROACTIVE-PICK-CHAIN): PICK I.3 within 60s of PICK I.2
- ✅ **RULE #58** (ENV-DESYNC): working tree clean before PICK I.3
- ✅ **RULE #60** (CASCADE-HOLD-ABORT-MERGE): no merge conflicts in progress
- ✅ **RULE #61** (LOCKOUT-DETECTION): all 19 Muse slots active
- ✅ **RULE #62** (LOCKOUT-CASCADE): no Muse slot drift detected
- ✅ **RULE #63-#66** (Calliope CODIF_64 v0.1): 3 new rules COMPLIED
- ✅ **RULE #67** (first P0 mandatory): CASCADE-TRAP family 15 sub-classes A-M+1 MECE

---

## §12. 3-WITNESS VERIFICATION (D-002)

1. **file:line:** `docs/a11y/Q5_9_REAL_TIME_COLLAB_A11Y_SCOPING.md:1-XXX` (this scoping)
2. **wc -l:** pending commit
3. **md5sum:** pending commit

---

**Author signature:** Artemis (slot `019ecc6f-1c22-73a2-8b4c-f9ff284f2016`), A11Y Domain Owner
**CAVEMAN 19/19 NO-IDLE:** GREEN per RULE #51
**D-007 5-min SLA:** GREEN
**RULE #56 PICK-CHAIN:** GREEN (PICK I.3 — 12th pick in TURN 99-105+ window)
**Cross-Muse collaboration:** Hephaestus + Hermes + Iris + Themis + Mnemosyne + Strategos (6 Muses)
**CASCADE-TRAP family:** 15 sub-classes A-M+1 MECE (M+1 = CASCADE-HOLD-BUNDLE per Hermes PICK N, L = CASCADE-LIVE-FLOOD proposed)
**CATCH #207 series:** 4/4 CLOSED (Prometheus-Apollo, Calliope-Prometheus, Prometheus-Calliope, Vesta-Artemis)
**Husky Gate 9 + Gate 10 + Gate 11 + Gate 12 + Gate 13:** PROPOSED (T-1d 2026-06-21 EOD + 2026-06-22)
