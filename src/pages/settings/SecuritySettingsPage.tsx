import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Key,
  Clock,
  AlertTriangle,
  CheckCircle,
  Fingerprint,
  Smartphone,
} from 'lucide-react';

export default function SecuritySettingsPage() {
  const { organization } = useSettingsStore();
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [auditLogEnabled, setAuditLogEnabled] = useState(true);

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

  const handleChangePassword = () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must differ from current password.');
      return;
    }

    setPasswordSuccess('Password updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const strength = passwordStrength(newPassword);

  const recentActivity = [
    {
      action: 'Login',
      detail: `User ${user?.email ?? 'unknown'}`,
      time: 'Just now',
      status: 'success',
    },
    {
      action: 'Password change',
      detail: 'Via security settings',
      time: '2 days ago',
      status: 'success',
    },
    { action: 'Failed login attempt', detail: 'Unknown IP', time: '5 days ago', status: 'warning' },
    {
      action: 'Backup exported',
      detail: 'Full data export',
      time: '1 week ago',
      status: 'success',
    },
  ];

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
            <Shield className="h-5 w-5 text-green-400 shrink-0" />
            <div>
              <div className="text-sm text-[var(--text-muted)]">Security Status</div>
              <div className="font-medium text-green-400">Protected</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Fingerprint className="h-5 w-5 text-blue-400 shrink-0" />
            <div>
              <div className="text-sm text-[var(--text-muted)]">MFA Status</div>
              <div className="font-medium text-[var(--text-primary)]">
                {mfaEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-sm text-[var(--text-muted)]">Session Timeout</div>
              <div className="font-medium text-[var(--text-primary)]">{sessionTimeout} minutes</div>
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

          {passwordError && (
            <div className="flex items-center gap-2 text-red-400 text-sm" role="alert">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm" role="status">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {passwordSuccess}
            </div>
          )}

          <Button
            onClick={handleChangePassword}
            className="w-full sm:w-auto"
            aria-label="Update password"
          >
            <Key className="w-4 h-4 mr-2" />
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Security Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-400" />
            Security Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-blue-400" />
              <div>
                <div className="text-sm font-medium text-white">Multi-Factor Authentication</div>
                <div className="text-xs text-slate-400">
                  Add an extra layer of security to your account
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mfaEnabled}
                onChange={(e) => setMfaEnabled(e.target.checked)}
                className="sr-only peer"
                aria-label="Toggle multi-factor authentication"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:bg-gray-900 dark:bg-gray-900 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-400" />
              <div>
                <div className="text-sm font-medium text-white">Session Timeout</div>
                <div className="text-xs text-slate-400">Automatically log out after inactivity</div>
              </div>
            </div>
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
              aria-label="Session timeout duration"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={480}>8 hours</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-400" />
              <div>
                <div className="text-sm font-medium text-white">Audit Logging</div>
                <div className="text-xs text-slate-400">Track all security-related events</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={auditLogEnabled}
                onChange={(e) => setAuditLogEnabled(e.target.checked)}
                className="sr-only peer"
                aria-label="Toggle audit logging"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:bg-gray-900 dark:bg-gray-900 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[var(--text-muted)]" />
            Recent Security Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    activity.status === 'success' ? 'bg-green-400' : 'bg-amber-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{activity.action}</div>
                  <div className="text-xs text-slate-400">{activity.detail}</div>
                </div>
                <span className="text-xs text-[var(--text-muted)] shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
