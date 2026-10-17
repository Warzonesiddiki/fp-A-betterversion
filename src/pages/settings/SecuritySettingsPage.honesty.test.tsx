/**
 * @vitest-environment jsdom
 *
 * A security console must not fabricate its own evidence.
 *
 * What this page used to render, none of it from any source:
 *  - "Security Status: Protected" (green) unconditionally, for any session;
 *  - "MFA Status" from a local `useState(false)`, so a user whose record says
 *    `mfaEnabled: true` was still shown "Disabled";
 *  - "Session Timeout: 30 minutes" from a local `useState(30)` that nothing
 *    enforced, plus a <select> that changed only that local state;
 *  - an MFA toggle and an audit-logging toggle wired to local state — no
 *    capability behind either (`AuthState` exposes no MFA action, and
 *    `auditTrailStore` has no enable/disable flag);
 *  - "Recent Security Activity": four hard-coded rows inventing a password
 *    change "2 days ago", a failed login "5 days ago" from an "Unknown IP" and
 *    a full backup export "1 week ago";
 *  - "Password updated successfully." from a handler that called nothing —
 *    there is no password-change capability anywhere in src/store, src/services
 *    or src/utils.
 *
 * These tests use the REAL authStore (via src/test/rbacFixtures) and a pinned
 * clock, so every assertion is about a fact the tree actually holds.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { useAuthStore } from '@/store/authStore';
import { actAs, makeTestUser, signOut } from '@/test/rbacFixtures';
import { setClock, resetClock, nowMs } from '@/utils/clock';
import SecuritySettingsPage from '@/pages/settings/SecuritySettingsPage';

const PINNED = '2026-03-31T12:00:00.000Z';

function renderPage() {
  return render(<SecuritySettingsPage />);
}

beforeEach(() => {
  setClock(PINNED);
});

afterEach(() => {
  resetClock();
  signOut();
  useAuthStore.setState({ lockedUntil: null, tokenExpiry: null });
});

describe('SecuritySettingsPage — only what the tree knows (NFR-002)', () => {
  it('reports the MFA state from the user record, not from a local default', () => {
    useAuthStore.setState({
      user: { ...makeTestUser('Admin'), mfaEnabled: true },
      isAuthenticated: true,
    });

    renderPage();

    expect(screen.getByTestId('mfa-status')).toHaveTextContent('Enabled');
  });

  it('says the MFA state is unavailable when there is no signed-in user', () => {
    signOut();

    renderPage();

    // Missing is not "Disabled": no user record means nothing is known.
    expect(screen.getByTestId('mfa-status')).toHaveTextContent(/not available/i);
    expect(screen.getByTestId('mfa-status')).not.toHaveTextContent('Disabled');
  });

  it('does not invent a security activity feed', () => {
    actAs('Admin');

    renderPage();

    expect(screen.queryByText(/Failed login attempt/i)).toBeNull();
    expect(screen.queryByText(/Backup exported/i)).toBeNull();
    expect(screen.queryByText(/2 days ago/i)).toBeNull();
    expect(screen.queryByText(/5 days ago/i)).toBeNull();
    expect(screen.queryByText(/1 week ago/i)).toBeNull();
    expect(screen.getByTestId('security-activity-unavailable')).toBeInTheDocument();
  });

  it('shows the real last sign-in from the user record', () => {
    actAs('Admin'); // makeTestUser pins lastLoginAt to 2026-01-01T00:00:00.000Z

    renderPage();

    expect(screen.getByTestId('last-sign-in')).toHaveTextContent('2026-01-01');
  });

  it('does not claim a password change it has no way to perform', () => {
    actAs('Admin');

    renderPage();

    expect(screen.getByRole('button', { name: /Update password/i })).toBeDisabled();
    expect(screen.getByTestId('password-unavailable-note')).toHaveTextContent(
      /not available in this build/i
    );
    expect(screen.queryByText(/Password updated successfully/i)).toBeNull();
  });

  it('derives the security posture instead of always reporting Protected', () => {
    signOut();

    renderPage();

    expect(screen.getByTestId('security-status')).not.toHaveTextContent('Protected');
    expect(screen.getByTestId('security-status')).toHaveTextContent(/unknown/i);
  });

  it('reports a locked session from the real lock expiry', () => {
    actAs('Admin');
    useAuthStore.setState({
      lockedUntil: new Date(nowMs() + 5 * 60 * 1000).toISOString(),
    });

    renderPage();

    expect(screen.getByTestId('security-status')).toHaveTextContent(/locked/i);
  });

  it('reports the session lifetime from the token, not from a local preference', () => {
    actAs('Admin');
    useAuthStore.setState({ tokenExpiry: nowMs() + 30 * 60 * 1000 });
    const { unmount } = renderPage();
    expect(screen.getByTestId('session-timeout')).toHaveTextContent(/30 minutes/);

    unmount();
    useAuthStore.setState({ tokenExpiry: null });
    renderPage();
    expect(screen.getByTestId('session-timeout')).toHaveTextContent(/not available/i);
  });

  it('offers no control that changes nothing', () => {
    actAs('Admin');

    renderPage();

    expect(screen.queryByLabelText('Toggle multi-factor authentication')).toBeNull();
    expect(screen.queryByLabelText('Session timeout duration')).toBeNull();
    expect(screen.queryByLabelText('Toggle audit logging')).toBeNull();
  });

  it('still grades the password the user types', () => {
    actAs('Admin');

    renderPage();

    // The strength meter is a real local computation and stays: it is the one
    // part of this card that was never a claim about the account.
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'Tr0ubadour&x9Lm' },
    });

    expect(screen.getByText(/Strength: Very Strong/i)).toBeInTheDocument();
  });
});
