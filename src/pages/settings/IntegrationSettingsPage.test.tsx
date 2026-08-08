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
vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: () => ({
    organization: { name: 'Test Org' },
    integrations: [],
    apiKeys: {},
  }),
}));

describe('IntegrationSettingsPage', () => {
  it('renders without crashing', async () => {
    const { default: IntegrationSettingsPage } = await import('./IntegrationSettingsPage');
    render(<IntegrationSettingsPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
