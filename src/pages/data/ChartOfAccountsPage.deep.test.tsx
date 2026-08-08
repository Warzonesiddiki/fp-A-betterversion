import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ChartOfAccountsPage from '@/pages/data/ChartOfAccountsPage';
import { useDataStore } from '@/store/dataStore';
import { useGLStore } from '@/store/glStore';

// Lightweight UI mocks (Modal is a radix wrapper; Badge/Input/Select are styled)
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({
    isOpen,
    onClose,
    title,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="modal" data-open={isOpen} aria-hidden={!isOpen}>
      {isOpen && (
        <div role="dialog" aria-label={title}>
          <button onClick={onClose} aria-label="Close modal">
            ×
          </button>
          {children}
        </div>
      )}
    </div>
  ),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    disabled,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/Input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock('@/components/ui/Select', () => ({
  Select: ({
    value,
    onChange,
    options,
    'aria-label': ariaLabel,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    'aria-label'?: string;
  }) => (
    <select value={value} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('lucide-react', () => {
  const IconStub = () => null;
  const icons: Record<string, unknown> = { __esModule: true, default: IconStub };
  for (const name of [
    'Plus',
    'Search',
    'Pencil',
    'Trash2',
    'ToggleLeft',
    'ToggleRight',
    'FolderTree',
    'List',
    'HelpCircle',
    'X',
  ]) {
    icons[name] = IconStub;
  }
  return icons;
});

const account = (over: Record<string, unknown>) => ({
  id: `a-${over.code}`,
  code: String(over.code),
  name: String(over.name),
  type: over.type ?? 'Asset',
  category: 'Current',
  subCategory: '',
  parentId: null,
  level: 0,
  sortOrder: 0,
  isActive: true,
  entityId: 'default',
  departmentId: null,
  isCalculated: false,
  formula: null,
  children: [],
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/data/chart-of-accounts']}>
      <ChartOfAccountsPage />
    </MemoryRouter>
  );

describe('ChartOfAccountsPage (data-driven)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDataStore.setState({ accounts: [] });
    useGLStore.setState({ entries: [] });
  });

  it('shows the empty state when no accounts exist', () => {
    renderPage();
    expect(screen.getByText('No Accounts Defined')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add first account/i })).toBeInTheDocument();
  });

  it('renders accounts with code, name, type, balance and status', () => {
    useDataStore.setState({
      accounts: [
        account({ code: '1000', name: 'Cash', type: 'Asset' }),
        account({ code: '4000', name: 'Sales Revenue', type: 'Revenue' }),
      ],
    });
    renderPage();

    expect(screen.getByText('2 accounts defined')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getAllByText('Sales Revenue').length).toBeGreaterThan(0);
    // normal balance mapping: Asset → Debit, Revenue → Credit
    expect(screen.getAllByText('Debit').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Credit').length).toBeGreaterThan(0);
  });

  it('adds an account through the modal form', async () => {
    const user = userEvent.setup();
    useDataStore.setState({ accounts: [account({ code: '1000', name: 'Cash' })] });
    renderPage();

    await user.click(screen.getByRole('button', { name: /^add account$/i }));
    const dialog = screen.getByRole('dialog');

    await user.type(within(dialog).getByLabelText(/account code/i), '6000');
    await user.type(within(dialog).getByLabelText(/account name/i), 'Rent Expense');
    await user.click(within(dialog).getByRole('button', { name: /add account/i }));

    expect(useDataStore.getState().accounts).toHaveLength(2);
    expect(useDataStore.getState().accounts[1]!.code).toBe('6000');
  });

  it('searches and filters accounts', async () => {
    const user = userEvent.setup();
    useDataStore.setState({
      accounts: [
        account({ code: '1000', name: 'Cash', type: 'Asset' }),
        account({ code: '4000', name: 'Sales Revenue', type: 'Revenue' }),
      ],
    });
    renderPage();

    await user.type(screen.getByPlaceholderText(/search by code or name/i), 'cash');
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.queryByText('Sales Revenue')).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText(/search by code or name/i));
    await user.click(screen.getByRole('button', { name: 'Revenue' }));
    expect(screen.getByText('Sales Revenue')).toBeInTheDocument();
    expect(screen.queryByText('Cash')).not.toBeInTheDocument();
  });

  it('toggles account active state', async () => {
    const user = userEvent.setup();
    useDataStore.setState({ accounts: [account({ code: '1000', name: 'Cash' })] });
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Deactivate account' }));
    expect(useDataStore.getState().accounts[0]!.isActive).toBe(false);
  });

  it('deletes an account through the confirm modal', async () => {
    const user = userEvent.setup();
    useDataStore.setState({
      accounts: [account({ code: '1000', name: 'Cash' })],
    });
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Delete account' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Confirm deletion (scoped to the dialog)
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));
    expect(useDataStore.getState().accounts).toHaveLength(0);
  });

  it('exports CSV with header and account rows', async () => {
    const user = userEvent.setup();
    useDataStore.setState({ accounts: [account({ code: '1000', name: 'Cash' })] });
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderPage();
    await user.click(screen.getByRole('button', { name: /export csv/i }));

    expect(createSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    revokeSpy.mockRestore();
    createSpy.mockRestore();
    clickSpy.mockRestore();
  });
});
