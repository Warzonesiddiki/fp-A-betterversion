import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/Button', () => ({ Button: () => <button>btn</button> }));
vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: () => ({
    organization: { name: 'Test Org' },
    backupLocation: 'mock/path',
    autoBackup: false,
    lastBackupAt: null,
  }),
}));
vi.mock('@/utils/backupRestore', () => ({
  BackupRestore: {
    createBackup: vi.fn().mockResolvedValue({ success: true, path: '/tmp', sizeBytes: 0 }),
    restoreBackup: vi.fn().mockResolvedValue(true),
    listBackups: vi.fn().mockResolvedValue([]),
  },
}));

describe('BackupRestorePage', () => {
  it('renders without crashing', async () => {
    const { default: BackupRestorePage } = await import('./BackupRestorePage');
    render(<BackupRestorePage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
