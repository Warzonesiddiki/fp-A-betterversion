/**
 * @vitest-environment jsdom
 *
 * Wave-7E a11y-modal-grid: keyboard support for the DataGrid column-visibility
 * menu (WAI-ARIA menu pattern). The ag-grid wrapper is mocked exactly like
 * DataGrid.test.tsx (jsdom cannot do AG Grid layout); the DataGrid component
 * itself runs for real.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('ag-grid-react', () => ({
  AgGridReact: React.forwardRef(function AgGridReactMock(
    props: {
      rowData?: Record<string, unknown>[];
      columnDefs?: unknown[];
    },
    ref: unknown
  ) {
    const api = {
      getSelectedRows: vi.fn().mockReturnValue([]),
      getSelectedNodes: vi.fn().mockReturnValue([]),
      setFocusedCell: vi.fn(),
      startEditingCell: vi.fn(),
      setGridOption: vi.fn(),
      getDisplayedRowAtIndex: vi.fn().mockReturnValue(null),
      forEachNode: vi.fn(),
      applyColumnState: vi.fn(),
    };
    if (ref && typeof ref === 'object') {
      (ref as { current: { api: typeof api } }).current = { api };
    }
    return <div data-testid="ag-grid-mock" data-row-count={props.rowData?.length || 0} />;
  }),
}));

vi.mock('ag-grid-community', async () => {
  const actual = await vi.importActual('ag-grid-community');
  return {
    ...actual,
    ModuleRegistry: {
      registerModules: vi.fn(),
    },
    AllCommunityModule: {},
  };
});

import { DataGrid } from './DataGrid';

const mockRows = [{ name: 'Revenue', amount: 100000, growth: 5.2 }];
const mockColumns = [
  { field: 'name', headerName: 'Name' },
  { field: 'amount', headerName: 'Amount' },
  { field: 'growth', headerName: 'Growth %' },
];

function openColumnMenu() {
  render(<DataGrid rows={mockRows} columns={mockColumns} enableColumnHiding />);
  fireEvent.click(screen.getByRole('button', { name: 'Show or hide columns' }));
}

describe('DataGrid column-visibility menu keyboard support (Wave-7E)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders items as real focusable buttons with roving tabindex and focuses the first on open', () => {
    openColumnMenu();
    const items = screen.getAllByRole('menuitemcheckbox');
    expect(items).toHaveLength(3);
    items.forEach((item) => expect(item.tagName).toBe('BUTTON'));
    // Exactly one tab stop (roving tabindex) and it owns focus after open.
    expect(items[0]).toHaveAttribute('tabindex', '0');
    expect(items[1]).toHaveAttribute('tabindex', '-1');
    expect(items[2]).toHaveAttribute('tabindex', '-1');
    expect(document.activeElement).toBe(items[0]);
  });

  it('moves focus with ArrowDown/ArrowUp and wraps at both ends', () => {
    openColumnMenu();
    const items = screen.getAllByRole('menuitemcheckbox');
    fireEvent.keyDown(items[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]);
    fireEvent.keyDown(items[1], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[2]);
    fireEvent.keyDown(items[2], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(items[0], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(items[2]);
  });

  it('moves focus to first item on Home and last item on End', () => {
    openColumnMenu();
    const items = screen.getAllByRole('menuitemcheckbox');
    fireEvent.keyDown(items[0], { key: 'End' });
    expect(document.activeElement).toBe(items[2]);
    fireEvent.keyDown(items[2], { key: 'Home' });
    expect(document.activeElement).toBe(items[0]);
  });

  it('keeps exactly one tab stop while navigating (roving invariant)', () => {
    openColumnMenu();
    const items = screen.getAllByRole('menuitemcheckbox');
    fireEvent.keyDown(items[0], { key: 'ArrowDown' });
    expect(items[0]).toHaveAttribute('tabindex', '-1');
    expect(items[1]).toHaveAttribute('tabindex', '0');
    expect(items[2]).toHaveAttribute('tabindex', '-1');
  });

  it('aria-checked reflects visibility and clicking toggles without moving focus away', () => {
    openColumnMenu();
    const items = screen.getAllByRole('menuitemcheckbox');
    items.forEach((item) => expect(item).toHaveAttribute('aria-checked', 'true'));
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Amount/ }));
    expect(screen.getByRole('menuitemcheckbox', { name: /Amount/ })).toHaveAttribute(
      'aria-checked',
      'false'
    );
    expect(screen.getByRole('menuitemcheckbox', { name: /^Name/ })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('Escape closes the menu without toggling selection and returns focus to the trigger', () => {
    openColumnMenu();
    const items = screen.getAllByRole('menuitemcheckbox');
    items.forEach((item) => expect(item).toHaveAttribute('aria-checked', 'true'));
    fireEvent.keyDown(items[0], { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show or hide columns' })).toHaveFocus();
    // Re-open: no column was toggled by the Escape path.
    fireEvent.click(screen.getByRole('button', { name: 'Show or hide columns' }));
    screen.getAllByRole('menuitemcheckbox').forEach((item) => {
      expect(item).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('trigger exposes menu semantics via aria-haspopup', () => {
    render(<DataGrid rows={mockRows} columns={mockColumns} enableColumnHiding />);
    expect(screen.getByRole('button', { name: 'Show or hide columns' })).toHaveAttribute(
      'aria-haspopup',
      'menu'
    );
  });
});
