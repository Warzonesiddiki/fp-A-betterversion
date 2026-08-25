import { useCallback, useEffect } from 'react';
import { useKeyEscrowStore } from '@/utils/keyEscrowStore';

export interface KeyEscrowStatusView {
  status: 'unknown' | 'checking' | 'enrolled' | 'not-enrolled';
  enrolled: boolean;
  keyId: string | null;
  failedAttempts: number;
  lockedUntil: number | null;
  isLocked: boolean;
  busy: boolean;
  lastError: string | null;
  /** Show-once plaintext code while an enrollment/regeneration is on screen. */
  pendingCode: string | null;
  refresh: () => void;
  enroll: () => Promise<string | null>;
  regenerate: () => Promise<string | null>;
  recover: (code: string) => Promise<boolean>;
  dismissPendingCode: () => void;
  clearError: () => void;
}

/**
 * Read-model over the escrow record + flow actions for settings/onboarding UI.
 * The snapshot read is synchronous (raw localStorage), so `refresh` is cheap
 * and safe inside effects.
 */
export function useKeyEscrowStatus(): KeyEscrowStatusView {
  const status = useKeyEscrowStore((s) => s.status);
  const keyId = useKeyEscrowStore((s) => s.keyId);
  const failedAttempts = useKeyEscrowStore((s) => s.failedAttempts);
  const lockedUntil = useKeyEscrowStore((s) => s.lockedUntil);
  const refreshedAt = useKeyEscrowStore((s) => s.refreshedAt);
  const busy = useKeyEscrowStore((s) => s.busy);
  const lastError = useKeyEscrowStore((s) => s.lastError);
  const pendingCode = useKeyEscrowStore((s) => s.pendingCode);
  const refresh = useKeyEscrowStore((s) => s.refresh);
  const enroll = useKeyEscrowStore((s) => s.beginEnrollment);
  const regenerate = useKeyEscrowStore((s) => s.regenerate);
  const recover = useKeyEscrowStore((s) => s.confirmRecovery);
  const dismissPendingCode = useKeyEscrowStore((s) => s.dismissPendingCode);
  const clearError = useKeyEscrowStore((s) => s.clearError);

  useEffect(() => {
    if (useKeyEscrowStore.getState().status === 'unknown') {
      refresh();
    }
  }, [refresh]);

  // Pure render-time derivation: "locked as of the last snapshot read".
  const isLocked = lockedUntil !== null && refreshedAt > 0 && lockedUntil > refreshedAt;

  return {
    status,
    enrolled: status === 'enrolled',
    keyId,
    failedAttempts,
    lockedUntil,
    isLocked,
    busy,
    lastError,
    pendingCode,
    refresh: useCallback(() => refresh(), [refresh]),
    enroll,
    regenerate,
    recover,
    dismissPendingCode,
    clearError,
  };
}
