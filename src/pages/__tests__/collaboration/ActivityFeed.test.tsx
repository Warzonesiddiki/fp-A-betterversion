/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Mock stores
const useGLStoreMock = vi.fn();
vi.mock('@/store/glStore', () => ({
  useGLStore: () => useGLStoreMock(),
}));

const useCollaborationStoreMock = vi.fn();
vi.mock('@/store/collaborationStore', () => ({
  useCollaborationStore: () => useCollaborationStoreMock(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  const mocked: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) {
    mocked[key] = makeIcon();
  }
  return mocked;
});

import { ActivityFeed } from '@/pages/collaboration/ActivityFeed';

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
    accountCode: '1000',
    accountName: 'Cash',
    debit: 100,
    credit: 0,
    netChange: 100,
    period: '2023-01',
    description: 'desc',
    currency: 'USD',
  },
  {
    id: '2',
    accountCode: '2000',
    accountName: 'AP',
    debit: 0,
    credit: 50,
    netChange: -50,
    period: '2023-01',
    description: 'desc2',
    currency: 'USD',
  },
];

describe('Page: ActivityFeed', () => {
  const navigateMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);

    useGLStoreMock.mockReturnValue({
      entries: mockEntries,
    });

    useCollaborationStoreMock.mockReturnValue({
      activityLog: [{ id: '1', action: 'import', timestamp: '2023-01-01' }],
      comments: [{ id: '1', text: 'test' }],
      tasks: [{ id: '1', title: 'task' }],
    });
  });

  describe('Smoke Test', () => {
    it('renders without crashing using lazy-loaded route test pattern', async () => {
      renderPage(ActivityFeed, '/activity', '/activity');
      expect(await screen.findByText('Activity Feed')).toBeInTheDocument();
    });

    it('renders empty state when no entries', async () => {
      useGLStoreMock.mockReturnValue({ entries: [] });
      renderPage(ActivityFeed, '/activity', '/activity');
      expect(await screen.findByText('No Activity Feed Data')).toBeInTheDocument();
    });
  });

  describe('Integration Test', () => {
    it('navigates to GL upload when import button is clicked in empty state', async () => {
      useGLStoreMock.mockReturnValue({ entries: [] });
      renderPage(ActivityFeed, '/activity', '/activity');

      const importBtn = await screen.findByRole('button', { name: /Import GL data/i });
      fireEvent.click(importBtn);

      expect(navigateMock).toHaveBeenCalledWith('/data/gl-upload');
    });

    it('renders KPI metrics correctly based on collaboration store', async () => {
      renderPage(ActivityFeed, '/activity', '/activity');

      expect(await screen.findByText('Total Activities')).toBeInTheDocument();
      // Values: 1 activity, 1 comment, 1 task, 2 unique accounts
      const ones = await screen.findAllByText('1');
      expect(ones.length).toBeGreaterThanOrEqual(3);
      const twos = await screen.findAllByText('2');
      expect(twos.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Accessibility Test', () => {
    it('has no accessibility violations in loaded state', async () => {
      const { container } = renderPage(ActivityFeed, '/activity', '/activity');
      await screen.findByText('Activity Feed');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in empty state', async () => {
      useGLStoreMock.mockReturnValue({ entries: [] });
      const { container } = renderPage(ActivityFeed, '/activity', '/activity');
      await screen.findByText('No Activity Feed Data');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
