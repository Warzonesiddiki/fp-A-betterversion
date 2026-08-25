/**
 * F-B4-11 / F-B4-2 — the storage failure banner must OFFER escape hatches,
 * not just advise them. Covers both actions: the independent raw emergency
 * download and navigation to Backup & Restore.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { StorageErrorEvent } from '@/utils/masterStorage';

const hoisted = vi.hoisted(() => {
  const listeners = new Set<(event: never) => void>();
  return {
    listeners,
    emitStorageError: (event: unknown) => {
      for (const listener of listeners) listener(event as never);
    },
    navigate: vi.fn(),
    downloadRawEmergencyBackup: vi.fn(),
  };
});

vi.mock('@/utils/masterStorage', () => ({
  subscribeStorageErrors: (listener: (event: never) => void) => {
    hoisted.listeners.add(listener);
    return () => {
      hoisted.listeners.delete(listener);
    };
  },
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNavigate: () => hoisted.navigate,
}));

vi.mock('@/utils/backupRestore', () => ({
  downloadRawEmergencyBackup: hoisted.downloadRawEmergencyBackup,
}));

import { StorageFailureBanner } from './StorageFailureBanner';

function writeEvent(storeKey = 'budget-store'): StorageErrorEvent {
  const error = new Error('QuotaExceededError');
  return { operation: 'write', storeKey, message: error.message, error };
}

function readEvent(storeKey = 'gl-store'): StorageErrorEvent {
  const error = new Error('backend unavailable');
  return { operation: 'read', storeKey, message: error.message, error };
}

function renderBanner() {
  return render(
    <MemoryRouter>
      <StorageFailureBanner />
    </MemoryRouter>
  );
}

describe('StorageFailureBanner', () => {
  beforeEach(() => {
    hoisted.listeners.clear();
    vi.clearAllMocks();
    hoisted.downloadRawEmergencyBackup.mockResolvedValue({ entries: [], errors: [] });
  });

  afterEach(() => {
    hoisted.listeners.clear();
  });

  it('renders nothing while no storage errors have been emitted', () => {
    renderBanner();
    expect(screen.queryByTestId('storage-failure-banner')).not.toBeInTheDocument();
  });

  it('announces a write failure with role=alert and lists the failing store', () => {
    renderBanner();
    act(() => {
      hoisted.emitStorageError(writeEvent());
    });
    const banner = screen.getByTestId('storage-failure-banner');
    expect(banner).toHaveAttribute('role', 'alert');
    expect(banner).toHaveAttribute('aria-live', 'assertive');
    expect(banner.textContent).toMatch(/export a backup now/i);
    expect(screen.getByText(/budget-store/)).toBeInTheDocument();
  });

  it('collapses repeated events for the same operation and store key', () => {
    renderBanner();
    act(() => {
      hoisted.emitStorageError(writeEvent());
      hoisted.emitStorageError(writeEvent());
      hoisted.emitStorageError(writeEvent());
    });
    expect(screen.getByRole('list').children).toHaveLength(1);
  });

  it('keeps distinct operation/store pairs as separate list items', () => {
    renderBanner();
    act(() => {
      hoisted.emitStorageError(writeEvent());
      hoisted.emitStorageError(readEvent());
    });
    expect(screen.getByRole('list').children).toHaveLength(2);
  });

  it('downloads an emergency copy via the raw-dump util when the action is clicked', async () => {
    renderBanner();
    act(() => {
      hoisted.emitStorageError(writeEvent());
    });
    fireEvent.click(screen.getByTestId('emergency-download-button'));
    await waitFor(() => {
      expect(hoisted.downloadRawEmergencyBackup).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText(/emergency download failed/i)).not.toBeInTheDocument();
  });

  it('surfaces an in-banner error when the emergency download fails', async () => {
    hoisted.downloadRawEmergencyBackup.mockRejectedValue(new Error('disk full'));
    renderBanner();
    act(() => {
      hoisted.emitStorageError(writeEvent());
    });
    fireEvent.click(screen.getByTestId('emergency-download-button'));
    await waitFor(() => {
      expect(screen.getByText(/Emergency download failed: disk full/)).toBeInTheDocument();
    });
  });

  it('navigates to /settings/backup from the backup-page link', () => {
    renderBanner();
    act(() => {
      hoisted.emitStorageError(writeEvent());
    });
    fireEvent.click(screen.getByTestId('backup-page-link'));
    expect(hoisted.navigate).toHaveBeenCalledWith('/settings/backup');
  });
});
