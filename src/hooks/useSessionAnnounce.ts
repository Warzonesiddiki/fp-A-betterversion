/**
 * useSessionAnnounce — A11Y v0.6.1 §4.3 cross-witness hook
 *
 * Announces session lifecycle events via aria-live=polite region.
 * Implements Q5.3 × §4.3.1 (sessionId rotation) + Q5.3 × §4.3.3 (auto-termination).
 *
 * Author: Artemis (A11Y Domain Owner)
 * Reference: docs/a11y/Q5_3_V0_6_1_SESSION_FIXATION_FOLLOWUP.md §3.1, §3.4
 * WCAG: 4.1.3 Status Messages (Level AA)
 * CWE: CWE-384 (Session Fixation) — announced to inform user
 *
 * Additive hook (0 refactor). Pair with #a11y-session-announcer DOM element.
 */

import { useEffect } from 'react';

export type SessionEvent = 'login' | 'reauth' | 'mfa' | 'logout' | 'rotated';

const SESSION_MESSAGES: Record<SessionEvent, string> = {
  login: 'Signed in. Session is active.',
  reauth: 'Session renewed. You are signed in again.',
  mfa: 'Multi-factor verified. Session renewed.',
  logout: 'Signed out. Session ended.',
  rotated: 'Session renewed. Your activity is now protected under a new session.',
};

export function useSessionAnnounce(event: SessionEvent): void {
  useEffect(() => {
    const announcer = document.getElementById('a11y-session-announcer');
    if (announcer) {
      announcer.textContent = SESSION_MESSAGES[event];
    }
  }, [event]);
}
