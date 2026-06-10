import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [], lastImportResult: null })),
}));

vi.mock('@/engines/CellAuditTrailEngine', () => ({
  CellAuditTrailEngine: vi.fn(function () {
    return { getAllEntries: vi.fn(() => []) };
  }),
}));

vi.mock('@/engines/AuditLogEngine', () => ({
  AuditLogEngine: class {
    getEntries() {
      return [];
    }
    getStats() {
      return { total: 0, byUser: {} };
    }
    log() {}
  },
}));

import AuditTrailPage from '@/pages/audit/AuditTrailPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/audit']}>
      <AuditTrailPage />
    </MemoryRouter>
  );
}

describe('AuditTrailPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays empty state', () => {
    renderPage();
    expect(screen.getByText('No Audit Entries')).toBeTruthy();
  });
});
