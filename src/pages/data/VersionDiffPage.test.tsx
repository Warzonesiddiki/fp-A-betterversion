import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * The page must commit the WHOLE ledger and the WHOLE budget to the diff
 * engine. It used to slice both to 50 while the commit message claimed
 * "Imported {glEntries.length} GL entries" / "{lineItems.length} items", so
 * the version history described a baseline it had not recorded. These mocks
 * record the engine calls so the contract is observable.
 */
const mocks = vi.hoisted(() => ({
  glEntries: [] as Record<string, unknown>[],
  lineItems: [] as Record<string, unknown>[],
  commit: vi.fn(),
  createBranch: vi.fn((name: string, description: string) => ({
    id: `branch-${name}`,
    name,
    description,
  })),
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: (selector: (state: { entries: unknown[] }) => unknown) =>
    selector({ entries: mocks.glEntries }),
}));

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: (selector: (state: { lineItems: unknown[] }) => unknown) =>
    selector({ lineItems: mocks.lineItems }),
}));

vi.mock('@/engines/VersionControlEngine', () => {
  class MockVersionControlEngine {
    createBranch = mocks.createBranch;
    commit = mocks.commit;
    diff = vi.fn(() => ({ changes: [] }));
    listBranches = vi.fn(() => [{ id: 'branch-main', name: 'main' }]);
    getBranch = vi.fn(() => ({ id: 'branch-main', name: 'main' }));
    getBranchCommits = vi.fn(() => []);
  }
  return { VersionControlEngine: MockVersionControlEngine };
});

vi.mock('@/components/ui/VersionDiffViewer', () => ({
  VersionDiffViewer: () => <div data-testid="version-diff-viewer" />,
}));

import VersionDiffPage from '@/pages/data/VersionDiffPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/data/version-diff']}>
      <VersionDiffPage />
    </MemoryRouter>
  );
}

function glEntry(i: number): Record<string, unknown> {
  return {
    id: `e${i}`,
    accountCode: `A${i}`,
    accountName: `Account ${i}`,
    entityId: 'entity-1',
    period: '2026-04',
    date: '2026-04-15',
    debit: i % 2 === 0 ? 100 : 0,
    credit: i % 2 === 0 ? 0 : 100,
    description: `Entry ${i}`,
  };
}

describe('VersionDiffPage', () => {
  beforeEach(() => {
    mocks.glEntries = [];
    mocks.lineItems = [];
    mocks.commit.mockClear();
  });

  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays empty state when no data', () => {
    renderPage();
    expect(screen.getByText('No Data to Compare')).toBeTruthy();
  });

  it('commits every GL entry, not a sample, and states the committed count', () => {
    mocks.glEntries = Array.from({ length: 60 }, (_, i) => glEntry(i));

    renderPage();

    expect(mocks.commit).toHaveBeenCalledTimes(1);
    const [branchId, message, , changes] = mocks.commit.mock.calls[0]!;
    expect(branchId).toBe('branch-main');
    expect(message).toBe('Imported 60 GL entries');
    expect(changes).toHaveLength(60);
  });

  it('commits every budget line item, not a sample, and states the committed count', () => {
    mocks.lineItems = Array.from({ length: 60 }, (_, i) => ({
      id: `b${i}`,
      accountCode: `B${i}`,
      periodId: '2026-04',
      amount: 100 + i,
    }));

    renderPage();

    expect(mocks.commit).toHaveBeenCalledTimes(1);
    const [branchId, message, , changes] = mocks.commit.mock.calls[0]!;
    expect(branchId).toBe('branch-current');
    expect(message).toBe('Current budget state (60 items)');
    expect(changes).toHaveLength(60);
  });
});
