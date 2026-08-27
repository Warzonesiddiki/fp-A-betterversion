/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useGLStore } from '@/store/glStore';

expect.extend(toHaveNoViolations);

// Mock react-router-dom to spy on useNavigate
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Mock stores
vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign(
    vi.fn((sel?: (s: unknown) => unknown) => {
      const state = { entries: [] };
      return sel ? sel(state) : state;
    }),
    { getState: () => ({ entries: [] }) }
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

// Import component directly for smoke testing
import { BankStatements } from '@/pages/banking/BankStatements';

// Helper for lazy-loaded route test pattern
function renderPage(PageComponent: React.ComponentType, initialPath = '/', routePath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path={routePath} element={<PageComponent />} />
          <Route path="*" element={<div>Redirected</div>} />
        </Routes>
      </Suspense>
    </MemoryRouter>
  );
}

const mockEntries = [
  {
    id: '1',
    date: '2026-01-01',
    accountCode: '1001',
    accountName: 'Operating Cash',
    description: 'Deposit',
    debit: 1000,
    credit: 0,
    netChange: -1000,
    segment: 'Corp',
  },
  {
    id: '2',
    date: '2026-01-02',
    accountCode: '2001',
    accountName: 'Accounts Payable',
    description: 'Payment',
    debit: 0,
    credit: 500,
    netChange: 500,
    segment: 'Corp',
  },
];

describe('Page: BankStatements', () => {
  const navigateMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
    vi.mocked(useGLStore).mockReturnValue({ entries: [] } as any);
  });

  describe('Smoke Test', () => {
    it('renders without crashing using lazy-loaded route test pattern', async () => {
      renderPage(BankStatements, '/banking/statements', '/banking/statements');
      expect(await screen.findByRole('main')).toBeInTheDocument();
    });

    it('shows empty state when no entries', async () => {
      renderPage(BankStatements, '/banking/statements', '/banking/statements');
      expect(await screen.findByText(/No Bank Statement Data/i)).toBeInTheDocument();
      expect(
        await screen.findByText(/Import GL data to view bank statements/i)
      ).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: /Import GL data/i })).toBeInTheDocument();
    });
  });

  describe('Integration Test', () => {
    it('navigates to GL upload when Import Data is clicked', async () => {
      renderPage(BankStatements, '/banking/statements', '/banking/statements');
      const importButton = await screen.findByRole('button', { name: /Import GL data/i });

      fireEvent.click(importButton);

      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith('/data/gl-upload');
      });
    });

    it('displays metrics and table when data is loaded', async () => {
      vi.mocked(useGLStore).mockReturnValue({ entries: mockEntries } as any);
      renderPage(BankStatements, '/banking/statements', '/banking/statements');

      // Main components
      expect(await screen.findByText('Bank Statements')).toBeInTheDocument();
      expect(await screen.findByText('2 entries imported')).toBeInTheDocument();

      // KPIs
      expect(await screen.findByText('Total Entries')).toBeInTheDocument();
      expect(await screen.findByText('2')).toBeInTheDocument(); // total entries value

      // Table data
      expect(await screen.findByText('Operating Cash')).toBeInTheDocument();
      expect(await screen.findByText('Accounts Payable')).toBeInTheDocument();
    });
  });

  describe('Accessibility Test', () => {
    it('has no accessibility violations in empty state', async () => {
      const { container } = renderPage(
        BankStatements,
        '/banking/statements',
        '/banking/statements'
      );
      await screen.findByRole('main');
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with data', async () => {
      vi.mocked(useGLStore).mockReturnValue({ entries: mockEntries } as any);
      const { container } = renderPage(
        BankStatements,
        '/banking/statements',
        '/banking/statements'
      );
      await screen.findByText('Bank Statements');
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
