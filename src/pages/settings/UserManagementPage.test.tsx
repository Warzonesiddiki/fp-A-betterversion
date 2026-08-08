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
vi.mock('@/components/ui/Input', () => ({ Input: () => <input /> }));
vi.mock('@/components/ui/DataTable', () => ({ DataTable: () => <div data-testid="data-table" /> }));
vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: () => ({
    users: [],
    roles: [],
    addUser: vi.fn(),
    removeUser: vi.fn(),
  }),
}));

describe('UserManagementPage', () => {
  it('renders without crashing', async () => {
    const { default: UserManagementPage } = await import('./UserManagementPage');
    render(<UserManagementPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
