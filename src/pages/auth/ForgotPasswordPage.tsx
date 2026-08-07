import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Lock, Clock } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    document.title = 'FinPlan Pro - Reset Password';
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleReset = async () => {
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (attempts >= 3) {
      setCooldown(60);
      setAttempts(0);
      return;
    }

    setLoading(true);
    setAttempts(attempts + 1);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setLoading(false);
    setSent(true);
  };

  const handleResend = () => {
    setSent(false);
    setEmail('');
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h1 className="text-xl font-bold mb-2">Check Your Email</h1>
              <p className="text-sm text-slate-400 mb-4">
                We&apos;ve sent a password reset link to:
              </p>
              <div className="p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 justify-center">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium">{email}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-slate-400 space-y-2">
                <p className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">1.</span>
                  Check your inbox (and spam folder)
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">2.</span>
                  Click the reset link in the email
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">3.</span>
                  Create a new secure password
                </p>
              </div>

              <div className="p-3 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-200">
                    The reset link expires in 15 minutes. Request a new one if needed.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button className="w-full" onClick={handleResend}>
                Resend Email
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                Back to Sign In
              </Button>
            </div>
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
            <div className="w-16 h-16 rounded-full bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-xl font-bold mb-2">Reset Password</h1>
            <p className="text-sm text-slate-400">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="text-sm text-slate-400 mb-1 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="email-address"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="you@company.com"
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading && cooldown === 0) handleReset();
                  }}
                  disabled={loading}
                />
              </div>
              {error && (
                <div className="flex items-center gap-1 mt-2 text-xs text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </div>
              )}
            </div>

            {attempts >= 2 && attempts < 3 && (
              <div className="p-3 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <p className="text-xs text-yellow-200">
                    {3 - attempts} attempt{3 - attempts !== 1 ? 's' : ''} remaining before cooldown.
                  </p>
                </div>
              </div>
            )}

            {cooldown > 0 && (
              <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-400" />
                  <p className="text-xs text-red-200">
                    Too many attempts. Please wait {cooldown} seconds.
                  </p>
                </div>
              </div>
            )}

            <Button className="w-full" onClick={handleReset} disabled={loading || cooldown > 0}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </div>
              ) : cooldown > 0 ? (
                `Wait ${cooldown}s`
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </div>

          <div className="text-center space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-500">OR</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mx-auto transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Sign In
            </button>

            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Sign up
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
