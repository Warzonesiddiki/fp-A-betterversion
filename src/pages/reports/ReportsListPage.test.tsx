/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

const glState = vi.hoisted(() => ({
  entries: [] as unknown[],
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: glState.entries,
    accounts: [],
    trialBalance: [],
    accountAnalysis: null,
    columnMappings: [],
    isLoading: false,
    importResult: null,
    setEntries: vi.fn(),
    setAccounts: vi.fn(),
    addEntries: vi.fn(),
    clearEntries: vi.fn(),
  })),
}));

import ReportsListPage from '@/pages/reports/ReportsListPage';

function renderPage(PageComponent: React.ComponentType, initialPath = '/', routePath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={routePath} element={<PageComponent />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ReportsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderPage(ReportsListPage, '/reports', '/reports');
    expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
  });

  it('displays the empty state when no GL entries exist', () => {
    renderPage(ReportsListPage, '/reports', '/reports');
    expect(screen.getByText(/No Data Available/i)).toBeInTheDocument();
  });

  it('exposes report cards as keyboard-operable buttons (K32-1)', () => {
    glState.entries = [{ id: 'e1' }];
    const { container } = renderPage(ReportsListPage, '/reports', '/reports');
    const cards = container.querySelectorAll('[role="button"][tabindex="0"]');
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.getAttribute('aria-label')).toBeTruthy();
    }
    // Enter on a card navigates to the report route.
    const target = cards[0] as HTMLElement;
    fireEvent.keyDown(target, { key: 'Enter' });
    expect(screen.getByText('Redirected')).toBeInTheDocument();
  });
});
