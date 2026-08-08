import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/ui/Button', () => ({ Button: () => <button>btn</button> }));
vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock('@/services/BenchmarkService', () => ({
  BenchmarkService: class {
    runAll() {
      return Promise.resolve({ results: [], timestamp: Date.now() });
    }
    listReports() {
      return [];
    }
  },
}));
vi.mock('@/utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
}));
vi.mock('@/utils/financialFormatting', () => ({ formatNumber: (n: number) => String(n) }));

describe('BenchmarksPage', () => {
  it('renders without crashing', async () => {
    const { default: BenchmarksPage } = await import('./BenchmarksPage');
    render(<BenchmarksPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
