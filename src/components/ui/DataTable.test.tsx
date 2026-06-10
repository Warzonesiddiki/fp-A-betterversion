import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, type Column } from './DataTable';

const columns: Column[] = [
  { key: 'name', header: 'Name' },
  { key: 'age', header: 'Age', sortable: true },
  { key: 'role', header: 'Role' },
];

const data = [
  { name: 'Alice', age: 30, role: 'Engineer' },
  { name: 'Bob', age: 25, role: 'Designer' },
  { name: 'Charlie', age: 35, role: 'Manager' },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Engineer')).toBeInTheDocument();
    expect(screen.getByText('Designer')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
  });

  it('shows correct values in cells', () => {
    render(<DataTable columns={columns} data={data} />);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(4); // header + 3 data rows
    expect(rows![1]!.textContent).toContain('Alice');
    expect(rows![1]!.textContent).toContain('30');
    expect(rows![1]!.textContent).toContain('Engineer');
  });

  it('handles empty data', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('shows custom empty message', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="Nothing to show" />);
    expect(screen.getByText('Nothing to show')).toBeInTheDocument();
  });

  it('renders loading state with skeleton rows', () => {
    const { container } = render(<DataTable columns={columns} data={data} loading />);
    const skeletonDivs = container.querySelectorAll('.bg-gray-200');
    expect(skeletonDivs.length).toBeGreaterThanOrEqual(columns.length * 5);
  });

  it('renders error state', () => {
    render(<DataTable columns={columns} data={[]} error="Failed to fetch" />);
    expect(screen.getByText('Error loading data')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('sorts data on column header click', () => {
    render(<DataTable columns={columns} data={data} />);
    const ageHeader = screen.getByText('Age');
    fireEvent.click(ageHeader);
    const rows = screen.getAllByRole('row');
    expect(rows![1]!.textContent).toContain('Bob');
    expect(rows![3]!.textContent).toContain('Charlie');
  });

  it('toggles sort direction on second click', () => {
    render(<DataTable columns={columns} data={data} />);
    const ageHeader = screen.getByText('Age');
    fireEvent.click(ageHeader);
    fireEvent.click(ageHeader);
    const rows = screen.getAllByRole('row');
    expect(rows![1]!.textContent).toContain('Charlie');
    expect(rows![3]!.textContent).toContain('Bob');
  });

  it('calls onRowClick when a row is clicked', () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText('Alice'));
    expect(onRowClick).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Alice', age: 30, role: 'Engineer' })
    );
  });

  it('uses custom render function for cells', () => {
    const cols: Column[] = [
      {
        key: 'name',
        header: 'Name',
        render: (value) => <strong>{String(value)}</strong>,
      },
    ];
    render(<DataTable columns={cols} data={data} />);
    expect(screen.getByText('Alice').tagName).toBe('STRONG');
  });

  it('renders filter inputs when filterable is true', () => {
    render(<DataTable columns={columns} data={data} filterable />);
    const filterInputs = screen.getAllByPlaceholderText('Filter...');
    expect(filterInputs).toHaveLength(columns.length);
  });
});
