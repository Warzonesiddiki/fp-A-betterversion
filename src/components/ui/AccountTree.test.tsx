/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccountTree } from './AccountTree';
import type { GLAccount } from '@/types';

const makeAccount = (overrides: Partial<GLAccount> = {}): GLAccount => ({
  id: '1',
  code: '1000',
  name: 'Cash',
  type: 'asset',
  category: 'Current Assets',
  subCategory: 'Cash',
  parentId: null,
  level: 0,
  sortOrder: 0,
  isActive: true,
  isCalculated: false,
  formula: null,
  children: [],
  ...overrides,
});

const accounts: GLAccount[] = [
  makeAccount({
    id: '1',
    code: '1000',
    name: 'Assets',
    children: [
      makeAccount({ id: '1a', code: '1100', name: 'Cash', parentId: '1', level: 1 }),
      makeAccount({ id: '1b', code: '1200', name: 'Receivables', parentId: '1', level: 1 }),
    ],
  }),
  makeAccount({
    id: '2',
    code: '2000',
    name: 'Liabilities',
    isCalculated: true,
    formula: 'SUM(2100:2900)',
    children: [
      makeAccount({ id: '2a', code: '2100', name: 'Accounts Payable', parentId: '2', level: 1 }),
    ],
  }),
];

describe('AccountTree', () => {
  it('renders empty state when no accounts provided', () => {
    render(<AccountTree accounts={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('No accounts found')).toBeInTheDocument();
  });

  it('renders empty state when accounts is undefined', () => {
    // @ts-expect-error testing undefined case
    render(<AccountTree accounts={undefined} onSelect={vi.fn()} />);
    expect(screen.getByText('No accounts found')).toBeInTheDocument();
  });

  it('renders account names', () => {
    render(<AccountTree accounts={accounts} onSelect={vi.fn()} />);
    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('Liabilities')).toBeInTheDocument();
  });

  it('renders account codes', () => {
    render(<AccountTree accounts={accounts} onSelect={vi.fn()} />);
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('2000')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<AccountTree accounts={accounts} onSelect={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search accounts by code or name...')).toBeInTheDocument();
  });

  it('renders tree role with aria-label', () => {
    render(<AccountTree accounts={accounts} onSelect={vi.fn()} />);
    expect(screen.getByRole('tree', { name: 'Chart of accounts' })).toBeInTheDocument();
  });

  it('calls onSelect when account clicked', () => {
    const onSelect = vi.fn();
    render(<AccountTree accounts={accounts} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Assets'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });

  it('shows calculated badge for calculated accounts', () => {
    render(<AccountTree accounts={accounts} onSelect={vi.fn()} />);
    expect(screen.getByText('Calc')).toBeInTheDocument();
  });

  it('applies selected styling to selected account', () => {
    render(<AccountTree accounts={accounts} onSelect={vi.fn()} selectedId="1" />);
    const treeItems = screen.getAllByRole('treeitem');
    const selectedItem = treeItems.find((el) => el.getAttribute('aria-selected') === 'true');
    expect(selectedItem).toBeDefined();
  });

  it('filters accounts based on search input', () => {
    render(<AccountTree accounts={accounts} onSelect={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search accounts by code or name...');
    fireEvent.change(input, { target: { value: 'Cash' } });
    expect(screen.getByText('Cash')).toBeInTheDocument();
  });

  it('clears search when clear button clicked', () => {
    render(<AccountTree accounts={accounts} onSelect={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search accounts by code or name...');
    fireEvent.change(input, { target: { value: 'Cash' } });
    const clearBtn = screen.getByLabelText('Clear search');
    fireEvent.click(clearBtn);
    expect(input).toHaveValue('');
  });
});
