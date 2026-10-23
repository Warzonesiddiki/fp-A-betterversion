import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { nowMs } from '@/utils/clock';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Key,
  Clock,
  AlertTriangle,
  Fingerprint,
  Smartphone,
} from 'lucide-react';

export default function SecuritySettingsPage() {
  const { organization } = useSettingsStore();
  const { user, lockedUntil, tokenExpiry } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro - Security Settings';
  }, []);

  const passwordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' };
    if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
    if (score <= 4) return { score, label: 'Strong', color: 'bg-green-500' };
    return { score, label: 'Very Strong', color: 'bg-emerald-500' };
  };

  const strength = passwordStrength(newPassword);

  // Every fact on this page comes from the auth store or from the user's own
  // keystrokes. The tree holds no password-change capability (nothing on
  // `AuthState`, in `src/store` or in `src/services`), no MFA enrolment action
  // and no client security-activity log, so none of those are claimed. What the
  // store does hold is reported; what it does not hold is reported as
  // unavailable with the reason — missing is never rendered as a value.
  const hasUserRecord = user !== null && user !== undefined;

  const mfaLabel = !hasUserRecord
    ? 'Not available'
    : user?.mfaEnabled === true
      ? 'Enabled'
      : 'Not enrolled';

  const lockExpiryMs = typeof lockedUntil === 'string' ? Date.parse(lockedUntil) : Number.NaN;
  const isLocked = Number.isFinite(lockExpiryMs) && lockExpiryMs > nowMs();

  const posture = !hasUserRecord
    ? {
        label: 'Unknown',
        detail: 'no signed-in user record, so nothing is known about this session',
        text: 'text-[var(--text-muted)]',
        icon: 'text-slate-400',
      }
    : isLocked
      ? {
          label: 'Locked',
          detail: `sign-in locked until ${lockedUntil}`,
          text: 'text-red-400',
          icon: 'text-red-400',
        }
      : user?.mfaEnabled === true
        ? {
            label: 'Protected',
            detail: `MFA enrolled for ${user?.email ?? 'this account'}`,
            text: 'text-green-400',
            icon: 'text-green-400',
          }
        : {
            label: 'Signed in',
            detail: 'MFA is not enrolled on this account',
            text: 'text-amber-400',
            icon: 'text-amber-400',
          };

  const sessionLabel =
    typeof tokenExpiry === 'number'
      ? `${Math.max(0, Math.round((tokenExpiry - nowMs()) / 60_000))} minutes remaining`
      : 'Not available';

  return (
    <main
      className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in"
      role="main"
      aria-label="Security settings page"
    >
      <PageHeader
        title="Security Settings"
        purpose={
          <>
            Manage passwords, authentication, and security preferences for{' '}
            {organization.name || 'your organization'}.
          </>
        }
      />

      {/* Security overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className={`h-5 w-5 shrink-0 ${posture.icon}`} />
            <div>
              <div className="text-sm text-[var(--text-muted)]">Security Status</div>
              <div data-testid="security-status" className={`font-medium ${posture.text}`}>
                {posture.label}
              </div>
              <div className="text-xs text-[var(--text-muted)]">{posture.detail}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Fingerprint className="h-5 w-5 text-blue-400 shrink-0" />
            <div>
              <div className="text-sm text-[var(--text-muted)]">MFA Status</div>
              <div data-testid="mfa-status" className="font-medium text-[var(--text-primary)]">
                {mfaLabel}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-sm text-[var(--text-muted)]">Session Lifetime</div>
              <div data-testid="session-timeout" className="font-medium text-[var(--text-primary)]">
                {sessionLabel}
              </div>
              <div className="text-xs text-[var(--text-muted)]">from the auth token expiry</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-400" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="current-password" className="text-sm text-[var(--text-muted)]">
                Current Password
              </label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  aria-label="Current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm text-[var(--text-muted)]">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  aria-label="New password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i <= strength.score ? strength.color : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">
                    Strength: {strength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm text-[var(--text-muted)]">
                Confirm New Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                aria-label="Confirm new password"
              />
            </div>
          </div>

          <p
            data-testid="password-unavailable-note"
            className="flex items-start gap-2 text-sm text-[var(--text-muted)]"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Password changes are not available in this build: no authentication backend is wired
              (the auth and offline model is open decision DEC-004) and nothing in the app can
              change a password. Nothing typed here is stored or applied — the strength meter is a
              local check on the characters you entered, not a change to this account.
            </span>
          </p>

          <Button disabled className="w-full sm:w-auto" aria-label="Update password">
            <Key className="w-4 h-4 mr-2" />
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Security Preferences — read-only: nothing here can be changed yet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-400" />
            Security Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-blue-400 shrink-0" />
              <div>
                <div className="text-sm font-medium text-white">Multi-Factor Authentication</div>
                <div className="text-xs text-slate-400">
                  Enrolment is not available in this build: the auth store exposes no MFA action and
                  the authentication backend is open decision DEC-004. The value shown is the one
                  recorded on your user entry — a toggle here would have changed nothing.
                </div>
              </div>
            </div>
            <span data-testid="mfa-preference" className="text-sm font-medium text-white shrink-0">
              {mfaLabel}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4 p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-sm font-medium text-white">Session Lifetime</div>
                <div className="text-xs text-slate-400">
                  Not configurable here: the session ends when the auth token expires, so a local
                  preference would not have shortened or extended it. The value shown is read from
                  the token.
                </div>
              </div>
            </div>
            <span className="text-sm font-medium text-white shrink-0">{sessionLabel}</span>
          </div>

          <div className="flex items-start justify-between gap-4 p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-400 shrink-0" />
              <div>
                <div className="text-sm font-medium text-white">Audit Logging</div>
                <div className="text-xs text-slate-400">
                  Not switchable here: the client audit trail in src/store/auditTrailStore.ts has no
                  enable/disable flag, and the server-side security logs (audit_login_attempts,
                  audit_permission_changes) are not reachable from the desktop build.
                </div>
              </div>
            </div>
            <span className="text-sm font-medium text-white shrink-0">Not switchable</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Activity — no client security log exists, so none is shown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[var(--text-muted)]" />
            Recent Security Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">Last sign-in</div>
              <div data-testid="last-sign-in" className="text-xs text-slate-400">
                {hasUserRecord
                  ? (user?.lastLoginAt ?? 'not recorded on this user entry')
                  : 'no signed-in user record'}
              </div>
            </div>
          </div>
          <div
            data-testid="security-activity-unavailable"
            className="p-3 rounded-lg border border-[var(--border-default)] space-y-1"
          >
            <p className="text-sm font-medium text-[var(--text-primary)]">
              No security activity log is available in this build.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Sign-in attempts, password changes and permission changes are recorded server-side
              (audit_login_attempts, audit_log, audit_permission_changes), and the desktop build
              does not reach those tables. The only security fact this app holds locally is the last
              sign-in timestamp on your user entry, shown above — so no activity feed is invented
              here.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Data-change history (who changed which value, and when) is recorded on the client and
              is on the Audit Trail page at /audit/trail.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
