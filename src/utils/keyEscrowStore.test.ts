import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetStore } from '@/test/storeTestUtils';
import { RecoveryCodeInvalidError } from './keyEscrow';
import { useKeyEscrowStore, type KeyEscrowState } from './keyEscrowStore';

const fake = vi.hoisted(() => ({
  enrollKeyEscrow: vi.fn(),
  regenerateRecoveryCode: vi.fn(),
  recoverStorageKey: vi.fn(),
  snapshot: {
    enrolled: false,
    keyId: null as string | null,
    failedAttempts: 0,
    lockedUntil: null as number | null,
    locked: false,
    iter: null as number | null,
  },
}));

vi.mock('./keyEscrow', () => {
  class RecoveryCodeInvalidError extends Error {
    constructor(
      message: string,
      readonly failedAttempts = 1,
      readonly remainingAttempts = 4
    ) {
      super(message);
      this.name = 'RecoveryCodeInvalidError';
    }
  }
  return {
    RecoveryCodeInvalidError,
    enrollKeyEscrow: fake.enrollKeyEscrow,
    regenerateRecoveryCode: fake.regenerateRecoveryCode,
    recoverStorageKey: fake.recoverStorageKey,
    getEscrowStatusSnapshot: () => fake.snapshot,
  };
});

const INITIAL_STATE: KeyEscrowState = {
  status: 'unknown',
  keyId: null,
  failedAttempts: 0,
  lockedUntil: null,
  refreshedAt: 0,
  lastError: null,
  busy: false,
  pendingCode: null,
  refresh: useKeyEscrowStore.getState().refresh,
  beginEnrollment: useKeyEscrowStore.getState().beginEnrollment,
  regenerate: useKeyEscrowStore.getState().regenerate,
  confirmRecovery: useKeyEscrowStore.getState().confirmRecovery,
  dismissPendingCode: useKeyEscrowStore.getState().dismissPendingCode,
  clearError: useKeyEscrowStore.getState().clearError,
};

beforeEach(() => {
  vi.clearAllMocks();
  fake.snapshot = {
    enrolled: false,
    keyId: null,
    failedAttempts: 0,
    lockedUntil: null,
    locked: false,
    iter: null,
  };
  resetStore(useKeyEscrowStore, INITIAL_STATE);
});

describe('keyEscrowStore — refresh', () => {
  it('reflects a not-enrolled snapshot', () => {
    useKeyEscrowStore.getState().refresh();
    const s = useKeyEscrowStore.getState();
    expect(s.status).toBe('not-enrolled');
    expect(s.keyId).toBeNull();
  });

  it('reflects an enrolled snapshot', () => {
    fake.snapshot = {
      ...fake.snapshot,
      enrolled: true,
      keyId: 'aabbccdd00112233',
      iter: 600_000,
    };
    useKeyEscrowStore.getState().refresh();
    expect(useKeyEscrowStore.getState().status).toBe('enrolled');
    expect(useKeyEscrowStore.getState().keyId).toBe('aabbccdd00112233');
  });
});

describe('keyEscrowStore — enrollment flow', () => {
  it('beginEnrollment sets the show-once code in memory and marks enrolled', async () => {
    fake.enrollKeyEscrow.mockResolvedValue({ code: 'CODE1-CODE2-CODE3-CODE4', keyId: 'k1' });
    fake.snapshot = { ...fake.snapshot, enrolled: true, keyId: 'k1' };

    const code = await useKeyEscrowStore.getState().beginEnrollment();

    expect(code).toBe('CODE1-CODE2-CODE3-CODE4');
    const s = useKeyEscrowStore.getState();
    expect(s.pendingCode).toBe('CODE1-CODE2-CODE3-CODE4');
    expect(s.status).toBe('enrolled');
    expect(s.busy).toBe(false);
    // The plaintext code must exist ONLY in memory, never in persistence.
    expect(Object.keys(localStorage)).not.toContain('pendingCode');
  });

  it('beginEnrollment failure records lastError and leaves no pending code', async () => {
    fake.enrollKeyEscrow.mockRejectedValue(new Error('no device key'));

    const code = await useKeyEscrowStore.getState().beginEnrollment();

    expect(code).toBeNull();
    const s = useKeyEscrowStore.getState();
    expect(s.pendingCode).toBeNull();
    expect(s.lastError).toContain('no device key');
    expect(s.busy).toBe(false);
  });

  it('regenerate replaces the pending code on success', async () => {
    fake.regenerateRecoveryCode.mockResolvedValue({ code: 'NEW-CODE-NEW-CODE-NEWC', keyId: 'k1' });
    fake.snapshot = { ...fake.snapshot, enrolled: true, keyId: 'k1' };

    const code = await useKeyEscrowStore.getState().regenerate();

    expect(code).toBe('NEW-CODE-NEW-CODE-NEWC');
    expect(useKeyEscrowStore.getState().pendingCode).toBe('NEW-CODE-NEW-CODE-NEWC');
  });
});

describe('keyEscrowStore — recovery flow', () => {
  it('confirmRecovery clears the pending code and refreshes status on success', async () => {
    fake.recoverStorageKey.mockResolvedValue({ keyId: 'k9' });
    fake.snapshot = { ...fake.snapshot, enrolled: true, keyId: 'k9' };

    const ok = await useKeyEscrowStore.getState().confirmRecovery('SOME-CODE');

    expect(ok).toBe(true);
    const s = useKeyEscrowStore.getState();
    expect(s.pendingCode).toBeNull();
    expect(s.keyId).toBe('k9');
    expect(s.busy).toBe(false);
  });

  it('confirmRecovery surfaces attempt counters from RecoveryCodeInvalidError', async () => {
    fake.recoverStorageKey.mockImplementation(async () => {
      throw new RecoveryCodeInvalidError('rejected', 2, 3);
    });

    const ok = await useKeyEscrowStore.getState().confirmRecovery('WRONG');

    expect(ok).toBe(false);
    const s = useKeyEscrowStore.getState();
    expect(s.failedAttempts).toBe(2);
    expect(s.lastError).toContain('rejected');
  });

  it('dismissPendingCode drops the only plaintext copy', () => {
    useKeyEscrowStore.setState({ pendingCode: 'SHOW-ONCE' }, false);
    useKeyEscrowStore.getState().dismissPendingCode();
    expect(useKeyEscrowStore.getState().pendingCode).toBeNull();
  });
});
