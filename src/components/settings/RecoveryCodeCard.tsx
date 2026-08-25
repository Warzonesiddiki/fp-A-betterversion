import { forwardRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, CheckCircle, Copy, KeyRound, RefreshCw, ShieldCheck } from 'lucide-react';
import { useKeyEscrowStatus } from '@/hooks/useKeyEscrowStatus';

export interface RecoveryCodeCardProps {
  /** Fired after the code was shown once AND re-typed correctly. */
  onComplete?: () => void;
  /** Optional explicit-skip affordance (wizard steps use it). */
  onSkip?: () => void;
  allowSkip?: boolean;
  className?: string;
}

type CardView = 'idle' | 'show' | 'confirm' | 'done';

function normalize(input: string): string {
  return input.toUpperCase().replace(/[^A-Z2-7]/g, '');
}

/**
 * Recovery-code enrollment / regeneration surface (scheme a).
 *
 * Security contract: the plaintext recovery code is rendered exactly once and
 * the card refuses to leave the confirm phase until the user re-types it
 * correctly — there is no "show again" path; a lost code requires the
 * regenerate flow, which replaces the escrow record.
 */
export const RecoveryCodeCard = forwardRef<HTMLDivElement, RecoveryCodeCardProps>(
  ({ onComplete, onSkip, allowSkip = false, className }, ref) => {
    const {
      enrolled,
      keyId,
      isLocked,
      lockedUntil,
      busy,
      lastError,
      pendingCode,
      enroll,
      regenerate,
      dismissPendingCode,
    } = useKeyEscrowStatus();

    const [view, setView] = useState<CardView>('idle');
    const [typed, setTyped] = useState('');
    const [mismatch, setMismatch] = useState(false);
    const [confirmRegen, setConfirmRegen] = useState(false);
    const [copied, setCopied] = useState(false);

    const startEnrollment = async () => {
      setConfirmRegen(false);
      const code = await enroll();
      if (code) setView('show');
    };

    const startRegeneration = async () => {
      const code = await regenerate();
      if (code) {
        setTyped('');
        setMismatch(false);
        setConfirmRegen(false);
        setView('show');
      }
    };

    const handleCopy = async () => {
      if (!pendingCode) return;
      try {
        await navigator.clipboard.writeText(pendingCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard may be denied; the code stays visible for manual copying.
      }
    };

    const handleContinueToConfirm = () => {
      setView('confirm');
    };

    const handleVerifyReType = () => {
      if (!pendingCode) {
        setView('idle');
        return;
      }
      if (normalize(typed) !== normalize(pendingCode)) {
        setMismatch(true);
        return;
      }
      setMismatch(false);
      dismissPendingCode();
      setTyped('');
      setView('done');
      onComplete?.();
    };

    return (
      <div
        ref={ref}
        data-testid="recovery-code-card"
        className={cn(
          'rounded-lg border border-[var(--border-default)] bg-[var(--surface-panel)] p-6 space-y-4',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[var(--text-accent)]" aria-hidden />
          <h3 className="font-semibold text-[var(--text-primary)]">Account Recovery Code</h3>
        </div>

        {view === 'idle' && !enrolled && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Your financial data is encrypted with a key stored on this device. Generate a one-time
              recovery code now: if this device&apos;s key is ever lost or corrupted, the code is
              the only way to unlock your existing data.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={startEnrollment} disabled={busy}>
                <KeyRound className="h-4 w-4 mr-2" aria-hidden />
                {busy ? 'Generating…' : 'Generate Recovery Code'}
              </Button>
              {allowSkip && onSkip && (
                <Button variant="ghost" onClick={onSkip}>
                  Skip for now
                </Button>
              )}
            </div>
            {isLocked && (
              <p
                role="alert"
                className="text-sm text-[var(--text-negative)] flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                Recovery is temporarily locked
                {lockedUntil ? ` until ${new Date(lockedUntil).toLocaleTimeString()}` : ''}.
              </p>
            )}
            {lastError && (
              <p role="alert" className="text-sm text-[var(--text-negative)]">
                {lastError}
              </p>
            )}
          </div>
        )}

        {view === 'idle' && enrolled && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[var(--text-positive)]" aria-hidden />
              Recovery is enrolled
              {keyId ? (
                <span className="font-mono text-xs text-[var(--text-muted)]">key&nbsp;{keyId}</span>
              ) : null}
              .
            </p>
            {!confirmRegen && (
              <Button variant="secondary" onClick={() => setConfirmRegen(true)} disabled={busy}>
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden />
                Regenerate Code
              </Button>
            )}
            {confirmRegen && (
              <div className="space-y-2 rounded-md border border-[var(--warning)] p-3">
                <p className="text-sm text-[var(--text-primary)]">
                  Generate a NEW recovery code? The previous code stops working immediately.
                </p>
                <div className="flex gap-3">
                  <Button variant="destructive" onClick={startRegeneration} disabled={busy}>
                    {busy ? 'Generating…' : 'Confirm Regenerate'}
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmRegen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {lastError && (
              <p role="alert" className="text-sm text-[var(--text-negative)]">
                {lastError}
              </p>
            )}
          </div>
        )}

        {view === 'show' && pendingCode && (
          <div className="space-y-4">
            <div
              role="status"
              className="rounded-md border border-[var(--warning)] bg-[var(--bg-elevated)] p-4 space-y-2"
            >
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Write this code down NOW — it is shown only once.
              </p>
              <p className="font-mono text-xl tracking-widest text-[var(--text-primary)] select-all">
                {pendingCode}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Store it offline (paper / password manager). FinPlan cannot recover your data
                without it.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" aria-hidden />
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button onClick={handleContinueToConfirm}>I Saved It — Continue</Button>
            </div>
          </div>
        )}

        {view === 'confirm' && (
          <div className="space-y-3">
            <label
              htmlFor="recovery-code-retype"
              className="text-sm font-medium text-[var(--text-primary)]"
            >
              Re-type the code to confirm you saved it
            </label>
            <input
              id="recovery-code-retype"
              type="text"
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                setMismatch(false);
              }}
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={mismatch}
              aria-describedby={mismatch ? 'recovery-code-retype-error' : undefined}
              className="w-full max-w-sm px-3 py-2 rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-mono tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {mismatch && (
              <p
                id="recovery-code-retype-error"
                role="alert"
                className="text-sm text-[var(--text-negative)]"
              >
                The code does not match. Check each group and try again.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleVerifyReType} disabled={!typed.trim()}>
                Confirm
              </Button>
            </div>
          </div>
        )}

        {view === 'done' && (
          <p className="text-sm text-[var(--text-positive)] flex items-center gap-2" role="status">
            <CheckCircle className="h-4 w-4" aria-hidden />
            Recovery code confirmed. Keep it safe — anyone with this code can unlock your local
            data.
          </p>
        )}
      </div>
    );
  }
);
RecoveryCodeCard.displayName = 'RecoveryCodeCard';
