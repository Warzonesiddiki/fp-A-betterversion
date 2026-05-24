import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { DataGridToolbar } from './DataGridToolbar';
import type { DataGridColumn } from './DataGrid.types';

const mockColumns: DataGridColumn[] = [
  { field: 'name', headerName: 'Name' },
  { field: 'revenue', headerName: 'Revenue', type: 'currency' },
];

const baseProps = {
  columns: mockColumns,
  enableFindReplace: true,
  enableExport: true,
  enableColumnHiding: true,
  enableRowGrouping: true,
  showFindReplace: false,
  setShowFindReplace: vi.fn(),
  showColumnMenu: false,
  setShowColumnMenu: vi.fn(),
  hiddenColumns: new Set<string>(),
  toggleColumn: vi.fn(),
  groupColumn: null as string | null,
  handleGroupBy: vi.fn(),
  handleExport: vi.fn(),
};

describe('DataGridToolbar', () => {
  it('renders toolbar with all action buttons', () => {
    render(<DataGridToolbar {...baseProps} />);
    expect(screen.getByText('Find')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Columns')).toBeInTheDocument();
    expect(screen.getByText(/Group/)).toBeInTheDocument();
  });

  it('calls handleExport when Export clicked', () => {
    const handleExport = vi.fn();
    render(<DataGridToolbar {...baseProps} handleExport={handleExport} />);
    fireEvent.click(screen.getByText('Export'));
    expect(handleExport).toHaveBeenCalledTimes(1);
  });

  it('toggles find replace when Find clicked', () => {
    const setShowFindReplace = vi.fn();
    render(<DataGridToolbar {...baseProps} setShowFindReplace={setShowFindReplace} />);
    fireEvent.click(screen.getByText('Find'));
    expect(setShowFindReplace).toHaveBeenCalledWith(true);
  });

  it('shows column menu when showColumnMenu is true', () => {
    render(<DataGridToolbar {...baseProps} showColumnMenu={true} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('returns null when all features disabled', () => {
    const { container } = render(
      <DataGridToolbar
        {...baseProps}
        enableFindReplace={false}
        enableExport={false}
        enableColumnHiding={false}
        enableRowGrouping={false}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows group column name when groupColumn is set', () => {
    render(<DataGridToolbar {...baseProps} groupColumn="name" />);
    expect(screen.getByText(/Group \(name\)/)).toBeInTheDocument();
  });
});
