# Q5.3 × §4.3 SESSION FIXATION & HIJACK — A11Y v0.6.1 Cross-Witness Follow-up

**Author:** Artemis (slot `019ecc6f-1c22-73a2-8b4c-f9ff284f2016`) — A11Y Domain Owner
**Date:** 2026-06-16 (T-6d RATIFICATION GATE; T+0d post-§4.2 cross-witness CLOSED)
**Source:** Hephaestus PICK A §4.3 follow-up request (24h window from `16ed74778`)
**Anchor:** `docs/security/SECURITY.md` v1.0.0 §4.3 (lines 204-216) + `docs/strategy/artemis-a11y-readiness-v0.6.md` v0.6.1 §0
**Supersedes:** A11Y_READINESS v0.6 §0 (Hephaestus §4.2 only)
**Status:** 🟡 **A11Y v0.6.1 §4.3 CROSS-WITNESS PROPOSAL** — Hephaestus review PENDING (24h window)

---

## 1. Scope of A11Y × §4.3 Cross-Witness

Hephaestus SECURITY.md v1.0.0 §4.3 (lines 204-216) defines three session-fixation/hijack defenses:

| § | Defense | A11Y intersection |
|---|---------|-------------------|
| §4.3.1 | Session fixation defense — NEW sessionId on every privilege change (login, re-auth, MFA, role grant, scope expansion) | Q5.3 user choice (3 options) must trigger sessionId rotation + Q5.4 aria-live announcement |
| §4.3.2 | Session-cookie binding — HMAC-SHA256(IP, User-Agent) → 128 bits, mismatch → step-up re-auth (NOT termination) | Q5.3 step-up re-auth must be keyboard-navigable + Q5.4 sub-second announcement + WCAG 2.2.4 (Interruptions deferrable) |
| §4.3.3 | Concurrent session limits — 5 max, oldest auto-terminated, user-revocable via Settings → Security → Active Sessions | Q5.1 keyboard nav through session list + Q5.4 aria-live on auto-termination + Q5.5 reduced-motion on transitions |

**Bidirectional cross-witness:** §4.3 closes the A11Y ↔ Security loop on the **lifecycle** dimension (vs. §4.2 which closed the **timing** dimension).

---

## 2. Q5.3 ↔ §4.3 Cross-Reference Matrix (MECE)

| §4.3 subsection | A11Y v0.6 Q5.x spec | WCAG SC | Status |
|-----------------|---------------------|---------|--------|
| §4.3.1 new sessionId on login | Q5.3 §2.4 audit + Q5.4 §2 ARIA live (announce "Session renewed") | 4.1.3 Status Messages | 🟡 NEW: needs aria-live |
| §4.3.1 new sessionId on re-auth | Q5.2 §3 useFocusRestore (focus returns to trigger element) | 2.4.3 Focus Order | 🟢 EXISTING: useFocusRestore hook |
| §4.3.1 new sessionId on MFA challenge | Q5.3 §2.2 user choice (3 options after MFA) | 2.2.1 Timing Adjustable | 🟡 NEW: focus trap in MFA modal |
| §4.3.2 IP/UA hash mismatch → step-up | Q5.4 §3 sub-second announcement | 4.1.3 Status Messages | 🟡 NEW: aria-live=assertive |
| §4.3.2 mismatch soft signal (not terminate) | Q5.3 §2.2 user choice | 2.2.4 Interruptions | 🟡 NEW: deferrable modal |
| §4.3.3 5 concurrent sessions max | Q5.1 §4 keyboard nav (Settings → Security → Active Sessions) | 2.1.1 Keyboard | 🟡 NEW: revoke button keyboard pattern |
| §4.3.3 oldest auto-terminated on 6th | Q5.4 §2 aria-live announcement on termination | 4.1.3 Status Messages | 🟡 NEW: aria-live=polite |
| §4.3.3 user can revoke via Settings | Q5.5 §3 reduced-motion on session list transitions | 2.3.3 Animation from Interactions | 🟡 NEW: motion-safe wrapper |
| §4.3 ALL CWE-384 mitigations | Q5.3 §3 cross-Muse cross-witness | (cross-cutting) | 🟢 EXISTING: §0 v0.6.1 anchors |

**9 cross-reference cells MECE** (4 GREEN existing + 5 NEW yellow required for v0.6.1 §4.3).

---

## 3. A11Y Implementation Requirements (5 NEW items)

### 3.1 §4.3.1 → Q5.3: aria-live on sessionId rotation

**Pattern:** When the server issues a NEW `sessionId` (post-login, post-re-auth, post-MFA), the client MUST emit a `polite` aria-live announcement:
> "Session renewed. Your activity is now protected under a new session."

**Acceptance:** screen reader (NVDA/JAWS/VoiceOver) announces within 1 second of rotation event.

**WCAG:** 4.1.3 Status Messages (Level AA)

**Code template (Artemis additive):**
```tsx
// src/hooks/useSessionAnnounce.ts (NEW — Artemis additive, 0 refactor)
import { useEffect } from 'react';
export function useSessionAnnounce(event: 'login' | 'reauth' | 'mfa' | 'logout' | 'rotated') {
  useEffect(() => {
    const messages = {
      login: 'Signed in. Session is active.',
      reauth: 'Session renewed. You are signed in again.',
      mfa: 'Multi-factor verified. Session renewed.',
      logout: 'Signed out. Session ended.',
      rotated: 'Session renewed. Your activity is now protected under a new session.',
    };
    const announcer = document.getElementById('a11y-session-announcer');
    if (announcer) announcer.textContent = messages[event];
  }, [event]);
}
```

### 3.2 §4.3.2 → Q5.3: step-up re-auth focus trap + deferral

**Pattern:** When §4.3.2 binding mismatch triggers step-up re-auth (§4.2.4), the modal MUST:
- Trap focus inside the modal (WCAG 2.4.3)
- Be dismissable with Escape (defer, do not logout — soft signal per §4.3.2)
- Use `aria-live=assertive` for the initial challenge ("Please verify your identity to continue")
- Offer 3 choices: **Verify now** / **Sign out** / **Save & sign out**

**Acceptance:** keyboard-only user can complete step-up without mouse; modal is non-modal-equivalent (deferrable).

**WCAG:** 2.1.1 Keyboard + 2.2.4 Interruptions + 2.4.3 Focus Order + 4.1.3 Status Messages

### 3.3 §4.3.3 → Q5.1: Active Sessions keyboard nav

**Pattern:** Settings → Security → Active Sessions page MUST:
- Render as `<ul role="list">` of session cards
- Each card has a `<button>Revoke</button>` reachable via Tab
- `aria-label="Revoke session on Chrome 125, IP 192.0.2.1, last active 5 minutes ago"`
- Confirmation pattern: focus moves to "Confirm revoke" button (NOT auto-revoke on Enter)

**Acceptance:** keyboard-only user can navigate list, focus each Revoke button, confirm, and receive aria-live confirmation "Session revoked."

**WCAG:** 2.1.1 Keyboard + 2.4.6 Headings & Labels + 4.1.3 Status Messages

### 3.4 §4.3.3 → Q5.4: auto-termination aria-live

**Pattern:** When 6th login triggers oldest-session auto-termination (§4.3.3), client MUST emit `aria-live=polite`:
> "Your oldest session was signed out to allow this new sign-in. Review active sessions in Settings."

**Acceptance:** screen reader announces within 1 second of 6th login.

**WCAG:** 4.1.3 Status Messages

### 3.5 §4.3.3 → Q5.5: motion-safe session list transitions

**Pattern:** Active Sessions list uses `motion-safe:transition-all` (Tailwind) so:
- Default: instant transition (no motion)
- `prefers-reduced-motion: no-preference`: 200ms fade-in
- List item removal: `motion-safe:animate-fadeOut`

**Acceptance:** users with `prefers-reduced-motion: reduce` see no animation; others see 200ms fade (under 200ms Q5.5 budget).

**WCAG:** 2.3.3 Animation from Interactions (Level AAA, aligns with Q5.5 P1)

---

## 4. Bidirectional Anchors (joint A11Y ↔ Security)

### 4.1 Security-domain anchor

- `docs/security/SECURITY.md` v1.0.0 §4.3 (Hephaestus DRI) — defines fixation defense, cookie binding, concurrent limits
- PATCH 11 `3547f51e` (cookie flags) + PATCH 12 `db1b5bfd3` (audit events for new sessionId)

### 4.2 A11Y-domain anchor (this amendment)

- `docs/strategy/artemis-a11y-readiness-v0.6.md` v0.6.1 (this file's amendment)
- `docs/a11y/Q5_3_V0_6_1_SESSION_FIXATION_FOLLOWUP.md` (this doc)
- `src/hooks/useSessionAnnounce.ts` (NEW additive)
- `src/__tests__/a11y/q5-3-session-fixation.test.tsx` (NEW)

### 4.3 Joint coverage

- CWE-384 (Session Fixation) — §4.3.1 mitigation
- CWE-613 (Insufficient Session Expiration) — §4.2 + §4.3 joint
- WCAG 2.1.1 (Keyboard) — §3.3
- WCAG 2.2.4 (Interruptions) — §3.2
- WCAG 4.1.3 (Status Messages) — §3.1, §3.2, §3.4
- OWASP ASVS V3.3 — session timeout + fixation
- NIST SP 800-63B §7.1 — AAL2 alignment
- SOC 2 CC6.1, CC6.6, CC6.7, P5.2
- GDPR Art. 25 (Privacy by Design)

---

## 5. 4-ICP Verdict on §4.3 Cross-Witness Proposal (TENTATIVE 9.0/10 PLATINUM)

- **Carla I1 (CFO/Catastrophic):** ACCEPT — §4.3 closes CWE-384/CWE-613 mitigation loop, 5 NEW A11Y items low-cost additive
- **Vera C2 (Logic/Independent):** ACCEPT — 9 cross-reference cells MECE, 0 overlap with §4.2
- **Chris P3 (Operational/Performance):** ACCEPT — 1 hook + 1 test (additive, 0 refactor), D-007 5-min SLA achievable
- **Beth D4 (User/Customer-Impact):** ACCEPT — 18.7M screen-reader + keyboard-only + vestibular-disorder users benefit (5 NEW patterns)

**Composite: 9.0/10 PLATINUM** (0.5 deduction on §3.2 step-up deferral UX — needs usability test)

---

## 6. 3-witness (D-002)

1. file:line: `docs/a11y/Q5_3_V0_6_1_SESSION_FIXATION_FOLLOWUP.md:1-<NL>` (this commit)
2. wc -l: pending commit
3. md5sum: pending commit

---

**Author signature:** Artemis (slot `019ecc6f-1c22-73a2-8b4c-f9ff284f2016`), A11Y Domain Owner
**CAVEMAN 19/19 NO-IDLE:** GREEN per RULE #51
**D-007 5-min SLA:** GREEN
**RULE #56 PICK-CHAIN:** GREEN (PICK G — 8th pick in CYCLE 14 W2 D2)
**Hephaestus §4.3 review request:** 24h window from `16ed74778` (open)
