/**
 * Transient UI state for the recovery-code escrow flow.
 *
 * Deliberately NOT persisted: the plaintext show-once code must never touch
 * storage (the whole point of scheme (a) is that only its PBKDF2-wrapped form
 * exists at rest), and enrollment metadata is re-read from the raw escrow
 * record on demand. AGENTS.md store pattern with `persist` intentionally
 * omitted for this transient slice.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  RecoveryCodeInvalidError,
  enrollKeyEscrow,
  getEscrowStatusSnapshot,
  recoverStorageKey,
  regenerateRecoveryCode,
  type EscrowStatusSnapshot,
} from './keyEscrow';

export type KeyEscrowStatus = 'unknown' | 'checking' | 'enrolled' | 'not-enrolled';

export interface KeyEscrowState {
  status: KeyEscrowStatus;
  /** 16-hex-char id of the escrowed root key (null when not enrolled). */
  keyId: string | null;
  failedAttempts: number;
  lockedUntil: number | null;
  /**
   * Wall-clock stamp of the last snapshot read. Lets UI derive "locked NOW"
   * purely from state (no impure Date.now() during render); freshness is
   * bounded by how recently refresh() ran.
   */
  refreshedAt: number;
  lastError: string | null;
  busy: boolean;
  /**
   * Show-once plaintext code held ONLY in memory between generation and the
   * mandatory re-type confirmation. Cleared on dismissal/unmount paths.
   */
  pendingCode: string | null;

  refresh: () => void;
  beginEnrollment: () => Promise<string | null>;
  regenerate: () => Promise<string | null>;
  confirmRecovery: (code: string) => Promise<boolean>;
  dismissPendingCode: () => void;
  clearError: () => void;
}

function applySnapshot(
  set: (fn: (state: KeyEscrowState) => void) => void,
  snapshot: EscrowStatusSnapshot
): void {
  set((state) => {
    state.status = snapshot.enrolled ? 'enrolled' : 'not-enrolled';
    state.keyId = snapshot.keyId;
    state.failedAttempts = snapshot.failedAttempts;
    state.lockedUntil = snapshot.lockedUntil;
    state.refreshedAt = Date.now();
  });
}

export const useKeyEscrowStore = create<KeyEscrowState>()(
  subscribeWithSelector(
    immer((set) => ({
      status: 'unknown',
      keyId: null,
      failedAttempts: 0,
      lockedUntil: null,
      refreshedAt: 0,
      lastError: null,
      busy: false,
      pendingCode: null,

      refresh: () => {
        applySnapshot(set, getEscrowStatusSnapshot());
      },

      beginEnrollment: async () => {
        set((state) => {
          state.busy = true;
          state.lastError = null;
          state.status = 'checking';
        });
        try {
          const { code } = await enrollKeyEscrow();
          set((state) => {
            state.pendingCode = code;
            state.busy = false;
          });
          applySnapshot(set, getEscrowStatusSnapshot());
          return code;
        } catch (cause) {
          set((state) => {
            state.busy = false;
            state.lastError =
              cause instanceof Error ? cause.message : 'Failed to generate recovery code.';
          });
          applySnapshot(set, getEscrowStatusSnapshot());
          return null;
        }
      },

      regenerate: async () => {
        set((state) => {
          state.busy = true;
          state.lastError = null;
        });
        try {
          const { code } = await regenerateRecoveryCode();
          set((state) => {
            state.pendingCode = code;
            state.busy = false;
          });
          applySnapshot(set, getEscrowStatusSnapshot());
          return code;
        } catch (cause) {
          set((state) => {
            state.busy = false;
            state.lastError =
              cause instanceof Error ? cause.message : 'Failed to regenerate recovery code.';
          });
          return null;
        }
      },

      confirmRecovery: async (code) => {
        set((state) => {
          state.busy = true;
          state.lastError = null;
        });
        try {
          await recoverStorageKey(code);
          set((state) => {
            state.busy = false;
            state.pendingCode = null;
          });
          applySnapshot(set, getEscrowStatusSnapshot());
          return true;
        } catch (cause) {
          set((state) => {
            state.busy = false;
            state.lastError =
              cause instanceof RecoveryCodeInvalidError
                ? cause.message
                : cause instanceof Error
                  ? cause.message
                  : 'Recovery failed.';
          });
          applySnapshot(set, getEscrowStatusSnapshot());
          if (cause instanceof RecoveryCodeInvalidError) {
            set((state) => {
              state.failedAttempts = cause.failedAttempts;
            });
          }
          return false;
        }
      },

      dismissPendingCode: () => {
        set((state) => {
          // Dropping the only non-wrapped copy is the security-relevant part.
          state.pendingCode = null;
        });
      },

      clearError: () => {
        set((state) => {
          state.lastError = null;
        });
      },
    }))
  )
);
