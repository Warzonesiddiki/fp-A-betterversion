import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({ organization: {} })),
}));

vi.mock('@/utils/backupRestore', () => ({
  BackupRestore: { exportBackup: vi.fn() },
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
});
