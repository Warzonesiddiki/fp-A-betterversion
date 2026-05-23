import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/dataStore', () => ({
  useDataStore: vi.fn(() => ({
    accounts: [],
    addAccount: vi.fn(),
    updateAccount: vi.fn(),
    deleteAccount: vi.fn(),
    toggleAccountActive: vi.fn(),
  })),
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
    Plus: makeIcon(),
    Search: makeIcon(),
    Filter: makeIcon(),
    Pencil: makeIcon(),
    Trash2: makeIcon(),
    ToggleLeft: makeIcon(),
    ToggleRight: makeIcon(),
    FolderTree: makeIcon(),
    List: makeIcon(),
  };
});

import ChartOfAccountsPage from '@/pages/data/ChartOfAccountsPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/data/chart-of-accounts']}>
      <ChartOfAccountsPage />
    </MemoryRouter>
  );
}

describe('ChartOfAccountsPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays Chart of Accounts heading', () => {
    renderPage();
    const heading = screen.queryByText(/Chart of Accounts/i);
    expect(heading).toBeTruthy();
  });
});
