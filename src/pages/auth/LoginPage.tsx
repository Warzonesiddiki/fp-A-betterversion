import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { LogIn, Eye, EyeOff, AlertCircle, Loader2, Mail, Lock } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required.').email('Invalid email address.'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .min(6, 'Password must be at least 6 characters.'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showForgotPw, setShowForgotPw] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Login';
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = (): boolean => {
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    clearError();
    try {
      await login(email, password);
      if (rememberMe) {
        localStorage.setItem('finplan_remembered_email', email);
      } else {
        localStorage.removeItem('finplan_remembered_email');
      }
      navigate('/', { replace: true });
    } catch {
      // Error is handled by authStore
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) handleLogin();
  };

  const handleForgotPassword = () => {
    if (!forgotEmail) return;
    // Simulate sending reset email (no backend)
    setForgotSent(true);
  };

  // Load remembered email
  useEffect(() => {
    const remembered = localStorage.getItem('finplan_remembered_email');
    if (remembered) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  // Forgot password UI
  if (showForgotPw) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <Mail className="h-10 w-10 text-blue-400 mx-auto mb-2" />
              <h1 className="text-xl font-bold">Reset Password</h1>
              <p className="text-sm text-slate-400 mt-1">
                Enter your email to receive a reset link.
              </p>
            </div>

            {forgotSent ? (
              <div className="text-center space-y-4">
                <div className="p-3 bg-green-900/30 text-green-400 rounded-lg text-sm">
                  If an account exists for <strong>{forgotEmail}</strong>, a reset link has been
                  sent.
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowForgotPw(false);
                    setForgotSent(false);
                  }}
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email</label>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@company.com"
                    onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
                  />
                </div>
                <Button className="w-full" onClick={handleForgotPassword}>
                  Send Reset Link
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setShowForgotPw(false)}>
                  Back to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <LogIn className="h-10 w-10 text-blue-400 mx-auto mb-2" />
            <h1 className="text-xl font-bold">FinPlan Pro</h1>
            <p className="text-sm text-slate-400 mt-1">Sign in to your workspace</p>
          </div>

          {/* Global error */}
          {error && (
            <div
              className="flex items-start gap-2 p-3 bg-red-900/30 text-red-400 rounded-lg text-sm"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLoginSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs text-slate-400 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((p) => ({ ...p, email: '' }));
                  }}
                  placeholder="you@company.com"
                  className="pl-10"
                  autoComplete="email"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="text-xs text-red-400 mt-1">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block text-xs text-slate-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPw(true);
                    setForgotEmail(email);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((p) => ({ ...p, password: '' }));
                  }}
                  placeholder="Enter password"
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="text-xs text-red-400 mt-1">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="remember-me" className="text-xs text-slate-400 cursor-pointer">
                Remember my email
              </label>
            </div>

            {/* Submit */}
            <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Demo hint */}
          <div className="p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-300">Offline Demo Accounts:</p>
            <p>
              <code className="text-blue-400">admin@finplan.com</code> — Admin (full access)
            </p>
            <p>
              <code className="text-blue-400">analyst@finplan.com</code> — Analyst
            </p>
            <p>
              <code className="text-blue-400">viewer@finplan.com</code> — Viewer (read-only)
            </p>
            <p className="text-slate-500">Any password works in offline mode.</p>
          </div>

          <p className="text-xs text-center text-slate-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
