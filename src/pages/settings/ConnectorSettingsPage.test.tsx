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
vi.mock('@/components/ui/Select', () => ({ Select: () => <select /> }));
vi.mock('@/components/ui/KPIValue', () => ({ KPIValue: () => <span data-testid="kpi" /> }));
vi.mock('@/engines/ConnectorEngine', () => ({
  ConnectorEngine: {
    listConnectors: () => [],
    register: vi.fn(),
    unregister: vi.fn(),
    connect: vi.fn().mockResolvedValue({ ok: true }),
  },
}));

describe('ConnectorSettingsPage', () => {
  it('renders without crashing', async () => {
    const { default: ConnectorSettingsPage } = await import('./ConnectorSettingsPage');
    render(<ConnectorSettingsPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
