import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockStatus = vi.hoisted(() => ({
  status: 'not-enrolled' as string,
  enrolled: false,
  keyId: null as string | null,
  failedAttempts: 0,
  lockedUntil: null as number | null,
  isLocked: false,
  busy: false,
  lastError: null as string | null,
  pendingCode: null as string | null,
  refresh: vi.fn(),
  enroll: vi.fn(),
  regenerate: vi.fn(),
  recover: vi.fn(),
  dismissPendingCode: vi.fn(),
  clearError: vi.fn(),
}));

vi.mock('@/hooks/useKeyEscrowStatus', () => ({
  useKeyEscrowStatus: () => mockStatus,
}));

import { RecoveryCodeCard } from './RecoveryCodeCard';

function resetState(overrides: Partial<typeof mockStatus> = {}) {
  Object.assign(mockStatus, {
    status: 'not-enrolled',
    enrolled: false,
    keyId: null,
    failedAttempts: 0,
    lockedUntil: null,
    isLocked: false,
    busy: false,
    lastError: null,
    pendingCode: null,
  });
  Object.assign(mockStatus, overrides);
}

describe('RecoveryCodeCard — not enrolled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
  });

  it('offers enrollment with an optional skip affordance', async () => {
    const onSkip = vi.fn();
    const { rerender } = render(<RecoveryCodeCard />);

    expect(screen.getByRole('button', { name: /Generate Recovery Code/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Skip for now/i })).not.toBeInTheDocument();

    rerender(<RecoveryCodeCard allowSkip onSkip={onSkip} />);
    await userEvent.click(screen.getByRole('button', { name: /Skip for now/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('shows the lockout notice when recovery is temporarily locked', () => {
    resetState({ isLocked: true, lockedUntil: 1893456000000 });
    render(<RecoveryCodeCard />);
    expect(screen.getByRole('alert')).toHaveTextContent(/temporarily locked/i);
  });

  it('surfaces enrollment errors from the store', () => {
    resetState({ lastError: 'MASTER_STORAGE_KEY override is active' });
    render(<RecoveryCodeCard />);
    expect(screen.getByRole('alert')).toHaveTextContent(/MASTER_STORAGE_KEY override/);
  });
});

describe('RecoveryCodeCard — show-once + mandatory re-type', () => {
  const CODE = 'ABCDE-FGH2J-KLMNO-PQRST';

  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
  });

  it('generates a code, displays it exactly once, then requires re-typing it', async () => {
    mockStatus.enroll.mockImplementation(async () => {
      resetState({
        status: 'enrolled',
        enrolled: true,
        keyId: '0123456789abcdef',
        pendingCode: CODE,
      });
      return CODE;
    });

    render(<RecoveryCodeCard />);
    await userEvent.click(screen.getByRole('button', { name: /Generate Recovery Code/i }));

    const shown = await screen.findByText(CODE);
    expect(shown).toBeInTheDocument();

    // Show-once contract: no path back from the confirm phase re-renders it.
    await userEvent.click(screen.getByRole('button', { name: /I Saved It/i }));
    expect(screen.queryByText(CODE)).not.toBeInTheDocument();

    // Wrong re-type blocks dismissal…
    const input = screen.getByLabelText(/re-type the code/i);
    await userEvent.type(input, 'XXXXX-XXXXX-XXXXX-XXXXX');
    await userEvent.click(screen.getByRole('button', { name: /^Confirm$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/does not match/i);
    expect(mockStatus.dismissPendingCode).not.toHaveBeenCalled();

    // …and a correct re-type completes the mandatory confirmation.
    await userEvent.clear(input);
    await userEvent.type(input, 'abcde fgh2j klmno pqrst');
    await userEvent.click(screen.getByRole('button', { name: /^Confirm$/i }));
    await waitFor(() => {
      expect(screen.getByText(/Recovery code confirmed/i)).toBeInTheDocument();
    });
    expect(mockStatus.dismissPendingCode).toHaveBeenCalledTimes(1);
  });

  it('fires onComplete after successful confirmation', async () => {
    const onComplete = vi.fn();
    mockStatus.enroll.mockImplementation(async () => {
      resetState({
        status: 'enrolled',
        enrolled: true,
        keyId: '0123456789abcdef',
        pendingCode: CODE,
      });
      return CODE;
    });

    render(<RecoveryCodeCard onComplete={onComplete} />);
    await userEvent.click(screen.getByRole('button', { name: /Generate Recovery Code/i }));
    await userEvent.click(await screen.findByRole('button', { name: /I Saved It/i }));
    await userEvent.type(screen.getByLabelText(/re-type the code/i), CODE);
    await userEvent.click(screen.getByRole('button', { name: /^Confirm$/i }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });
});

describe('RecoveryCodeCard — enrolled state + regeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState({ status: 'enrolled', enrolled: true, keyId: 'feedfacefeedface' });
  });

  it('shows enrolled status with key id and a two-step regenerate flow', async () => {
    mockStatus.regenerate.mockImplementation(async () => {
      resetState({
        status: 'enrolled',
        enrolled: true,
        keyId: 'feedfacefeedface',
        pendingCode: 'ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ',
      });
      return 'ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ';
    });

    render(<RecoveryCodeCard />);
    expect(screen.getByText(/key\s*feedfacefeedface/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Regenerate Code/i }));
    expect(screen.getByText(/The previous code stops working immediately/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Confirm Regenerate/i }));
    expect(mockStatus.regenerate).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByText('ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ')).toBeInTheDocument();
    });
  });
});
