import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/collaborationStore', () => ({
  useCollaborationStore: vi.fn(() => ({ approvals: [], addComment: vi.fn() })),
}));

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({ budgets: [] })),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    CheckCircle: makeIcon(),
    XCircle: makeIcon(),
    Clock: makeIcon(),
    FileText: makeIcon(),
    Table: makeIcon(),
    MessageSquare: makeIcon(),
    AlertCircle: makeIcon(),
    ChevronUp: makeIcon(),
    ChevronDown: makeIcon(),
    Search: makeIcon(),
    Filter: makeIcon(),
    MoreHorizontal: makeIcon(),
    ChevronLeft: makeIcon(),
    ChevronRight: makeIcon(),
  };
});

import ApprovalQueuePage from '@/pages/collaboration/ApprovalQueuePage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/collaboration/approvals']}>
      <ApprovalQueuePage />
    </MemoryRouter>
  );
}

describe('ApprovalQueuePage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays Approval Queue heading', () => {
    renderPage();
    expect(screen.getByText('Approval Queue')).toBeTruthy();
  });
});
