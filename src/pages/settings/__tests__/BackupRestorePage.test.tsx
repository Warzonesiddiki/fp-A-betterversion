import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/testUtils';

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({ organization: {} })),
}));

const addToastMock = vi.hoisted(() => vi.fn());

vi.mock('@/store/uiStore', () => ({
  useUIStore: { getState: () => ({ addToast: addToastMock }) },
}));

const exportBackupMock = vi.hoisted(() => vi.fn());

vi.mock('@/utils/backupRestore', () => ({
  BackupRestore: { exportBackup: exportBackupMock },
}));

vi.mock('@/engines/FinPlanFileEngine', () => ({
  FinPlanFileEngine: {},
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    Download: makeIcon(),
    Upload: makeIcon(),
    Trash2: makeIcon(),
    ShieldCheck: makeIcon(),
    Clock: makeIcon(),
    FileJson: makeIcon(),
    AlertTriangle: makeIcon(),
    CheckCircle: makeIcon(),
    HardDrive: makeIcon(),
    Globe: makeIcon(),
  };
});

import BackupRestorePage from '@/pages/settings/BackupRestorePage';

describe('BackupRestorePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<BackupRestorePage />);
    expect(screen.getAllByText(/backup/i).length).toBeGreaterThan(0);
  });

  it('surfaces an error toast when the export fails instead of failing silently', async () => {
    exportBackupMock.mockRejectedValue(new Error('QuotaExceededError'));
    render(<BackupRestorePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Download backup file' }));

    await waitFor(() => {
      expect(addToastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Backup export failed',
          message: 'QuotaExceededError',
        })
      );
    });
  });
});
