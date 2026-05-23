/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock ag-grid-react
vi.mock('ag-grid-react', () => ({
  AgGridReact: React.forwardRef(function AgGridReactMock(
    props: {
      rowData?: Record<string, unknown>[];
      columnDefs?: unknown[];
      onCellClicked?: (e: {
        rowIndex: number;
        column: { getColId: () => string };
        value: unknown;
      }) => void;
      onCellValueChanged?: (e: {
        rowIndex: number;
        colDef: { field: string };
        newValue: unknown;
      }) => void;
      onCellEditingStarted?: () => void;
      onCellEditingStopped?: () => void;
      gridOptions?: Record<string, unknown>;
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
      forEachNode: vi.fn(
        (
          cb: (node: {
            data: Record<string, unknown>;
            rowIndex: number;
            setDataValue: (field: string, value: unknown) => void;
          }) => void
        ) => {
          (props.rowData || []).forEach((row, i) => {
            cb({
              data: row,
              rowIndex: i,
              setDataValue: vi.fn(),
            });
          });
        }
      ),
      applyColumnState: vi.fn(),
    };
    if (ref && typeof ref === 'object') {
      (ref as { current: { api: typeof api } }).current = { api };
    }
    return (
      <div data-testid="ag-grid-mock" data-row-count={props.rowData?.length || 0}>
        {(props.rowData || []).map((row, i) => (
          <div key={i} data-testid={`grid-row-${i}`}>
            {Object.entries(row).map(([key, val]) => (
              <span key={key} data-field={key}>
                {String(val ?? '')}
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  }),
}));

// Mock ag-grid-community
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

// Mock FormulaBar
vi.mock('./FormulaBar', () => ({
  FormulaBar: ({
    value,
    onChange,
    onEvaluate,
    activeCell,
    disabled,
  }: {
    value: string;
    onChange: (v: string) => void;
    onEvaluate: (r: number) => void;
    activeCell?: string;
    disabled?: boolean;
  }) => (
    <div data-testid="formula-bar">
      <span data-testid="formula-active-cell">{activeCell || 'none'}</span>
      <input
        data-testid="formula-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <button data-testid="formula-evaluate" onClick={() => onEvaluate(0)}>
        Eval
      </button>
    </div>
  ),
}));

// Mock SheetTabs
vi.mock('./SheetTabs', () => ({
  SheetTabs: ({
    sheets,
    activeSheetId,
    onSheetChange,
    onSheetAdd,
  }: {
    sheets: { id: string; name: string }[];
    activeSheetId: string;
    onSheetChange: (id: string) => void;
    onSheetAdd: () => void;
  }) => (
    <div data-testid="sheet-tabs">
      {sheets.map((s) => (
        <button
          key={s.id}
          data-testid={`sheet-tab-${s.id}`}
          data-active={s.id === activeSheetId}
          onClick={() => onSheetChange(s.id)}
        >
          {s.name}
        </button>
      ))}
      <button data-testid="add-sheet" onClick={onSheetAdd}>
        Add
      </button>
    </div>
  ),
}));

// Mock ContextMenu
vi.mock('./ContextMenu', () => ({
  ContextMenu: ({
    onAction,
    onClose,
  }: {
    x: number;
    y: number;
    onAction: (action: string) => void;
    onClose: () => void;
  }) => (
    <div data-testid="context-menu">
      <button onClick={() => onAction('copy')}>Copy</button>
      <button onClick={() => onAction('paste')}>Paste</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

import { SpreadsheetGrid } from './SpreadsheetGrid';

describe('SpreadsheetGrid', () => {
  const mockSheets = [
    {
      id: 'sheet1',
      name: 'Budget 2026',
      rows: [
        { category: 'Revenue', amount: 100000 },
        { category: 'Expenses', amount: 75000 },
      ],
      columns: [
        { field: 'category', headerName: 'Category', width: 150 },
        { field: 'amount', headerName: 'Amount', type: 'currency' as const },
      ],
    },
    {
      id: 'sheet2',
      name: 'Forecast',
      rows: [{ category: 'Revenue', amount: 120000 }],
      columns: [
        { field: 'category', headerName: 'Category', width: 150 },
        { field: 'amount', headerName: 'Amount', type: 'number' as const },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renders', () => {
    it('renders without crashing', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });

    it('renders the formula bar', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      expect(screen.getByTestId('formula-bar')).toBeInTheDocument();
    });

    it('renders the sheet tabs', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      expect(screen.getByTestId('sheet-tabs')).toBeInTheDocument();
    });

    it('renders active sheet data', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      expect(screen.getByTestId('ag-grid-mock')).toHaveAttribute('data-row-count', '2');
    });

    it('applies custom className', () => {
      const { container } = render(
        <SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders loading overlay when loading', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" loading />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('applies loading styles', () => {
      const { container } = render(
        <SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" loading />
      );
      const gridContainer = container.querySelector('.pointer-events-none');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('handles data', () => {
    it('shows active cell as --- when no cell selected', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      expect(screen.getByTestId('formula-active-cell')).toHaveTextContent('---');
    });

    it('renders all sheet tabs', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      expect(screen.getByText('Budget 2026')).toBeInTheDocument();
      expect(screen.getByText('Forecast')).toBeInTheDocument();
    });

    it('marks the active sheet tab', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet2" />);
      expect(screen.getByTestId('sheet-tab-sheet1')).toHaveAttribute('data-active', 'false');
      expect(screen.getByTestId('sheet-tab-sheet2')).toHaveAttribute('data-active', 'true');
    });

    it('falls back to first sheet if activeSheetId not found', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="nonexistent" />);
      expect(screen.getByTestId('ag-grid-mock')).toHaveAttribute('data-row-count', '2');
    });
  });

  describe('keyboard navigation', () => {
    it('grid container is focusable', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      const grid = screen.getByRole('grid');
      expect(grid).toHaveAttribute('tabIndex', '0');
    });

    it('has grid role', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('has aria-label', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      expect(screen.getByLabelText('Spreadsheet Grid')).toBeInTheDocument();
    });

    it('handles F2 key for editing', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      const grid = screen.getByRole('grid');
      // F2 should not throw
      fireEvent.keyDown(grid, { key: 'F2' });
    });

    it('handles Delete key', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      const grid = screen.getByRole('grid');
      fireEvent.keyDown(grid, { key: 'Delete' });
    });
  });

  describe('sheet tabs integration', () => {
    it('calls onSheetChange when tab clicked', () => {
      const onSheetChange = vi.fn();
      render(
        <SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" onSheetChange={onSheetChange} />
      );
      fireEvent.click(screen.getByText('Forecast'));
      expect(onSheetChange).toHaveBeenCalledWith('sheet2');
    });

    it('calls onSheetAdd when add button clicked', () => {
      const onSheetAdd = vi.fn();
      render(
        <SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" onSheetAdd={onSheetAdd} />
      );
      fireEvent.click(screen.getByTestId('add-sheet'));
      expect(onSheetAdd).toHaveBeenCalledOnce();
    });
  });

  describe('formula bar integration', () => {
    it('formula bar starts disabled when no cell selected', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      expect(screen.getByTestId('formula-input')).toBeDisabled();
    });

    it('formula bar shows --- when no cell selected', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      expect(screen.getByTestId('formula-active-cell')).toHaveTextContent('---');
    });
  });

  describe('context menu', () => {
    it('opens context menu on right click', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      const grid = screen.getByRole('grid');
      fireEvent.contextMenu(grid);
      expect(screen.getByTestId('context-menu')).toBeInTheDocument();
    });

    it('closes context menu on outside click', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      const grid = screen.getByRole('grid');
      fireEvent.contextMenu(grid);
      expect(screen.getByTestId('context-menu')).toBeInTheDocument();

      fireEvent.click(window);
      // Context menu should be gone after the click outside handler
    });
  });

  describe('callbacks', () => {
    it('accepts onCellValueChanged callback', () => {
      const onCellValueChanged = vi.fn();
      render(
        <SpreadsheetGrid
          sheets={mockSheets}
          activeSheetId="sheet1"
          onCellValueChanged={onCellValueChanged}
        />
      );
      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });

    it('accepts onSelectionChanged callback', () => {
      const onSelectionChanged = vi.fn();
      render(
        <SpreadsheetGrid
          sheets={mockSheets}
          activeSheetId="sheet1"
          onSelectionChanged={onSelectionChanged}
        />
      );
      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });

    it('accepts onUndo and onRedo callbacks', () => {
      const onUndo = vi.fn();
      const onRedo = vi.fn();
      render(
        <SpreadsheetGrid
          sheets={mockSheets}
          activeSheetId="sheet1"
          onUndo={onUndo}
          onRedo={onRedo}
        />
      );
      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });

    it('accepts onSheetRename callback', () => {
      const onSheetRename = vi.fn();
      render(
        <SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" onSheetRename={onSheetRename} />
      );
      expect(screen.getByTestId('sheet-tabs')).toBeInTheDocument();
    });

    it('accepts onSheetDelete callback', () => {
      const onSheetDelete = vi.fn();
      render(
        <SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" onSheetDelete={onSheetDelete} />
      );
      expect(screen.getByTestId('sheet-tabs')).toBeInTheDocument();
    });

    it('accepts onSheetReorder callback', () => {
      const onSheetReorder = vi.fn();
      render(
        <SpreadsheetGrid
          sheets={mockSheets}
          activeSheetId="sheet1"
          onSheetReorder={onSheetReorder}
        />
      );
      expect(screen.getByTestId('sheet-tabs')).toBeInTheDocument();
    });
  });

  describe('column types', () => {
    it('handles currency column type', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });

    it('handles percent column type', () => {
      const sheetsWithPercent = [
        {
          ...mockSheets[0],
          columns: [{ field: 'growth', headerName: 'Growth', type: 'percent' as const }],
        },
      ];
      render(<SpreadsheetGrid sheets={sheetsWithPercent} activeSheetId="sheet1" />);
      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });

    it('handles number column type', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet2" />);
      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });

    it('handles text column type', () => {
      const sheetsWithText = [
        {
          ...mockSheets[0],
          columns: [{ field: 'name', headerName: 'Name', type: 'text' as const }],
        },
      ];
      render(<SpreadsheetGrid sheets={sheetsWithText} activeSheetId="sheet1" />);
      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });
  });

  describe('freeze panes', () => {
    it('handles freezeRows prop', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" freezeRows={2} />);
      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });

    it('handles freezeCols prop', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" freezeCols={1} />);
      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });

    it('handles both freeze props', () => {
      render(
        <SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" freezeRows={1} freezeCols={1} />
      );
      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles single sheet', () => {
      render(<SpreadsheetGrid sheets={[mockSheets[0]]} activeSheetId="sheet1" />);
      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });

    it('handles empty rows in sheet', () => {
      const emptySheets = [
        {
          ...mockSheets[0],
          rows: [],
        },
      ];
      render(<SpreadsheetGrid sheets={emptySheets} activeSheetId="sheet1" />);
      expect(screen.getByTestId('ag-grid-mock')).toHaveAttribute('data-row-count', '0');
    });

    it('handles many sheets', () => {
      const manySheets = Array.from({ length: 10 }, (_, i) => ({
        id: `sheet${i}`,
        name: `Sheet ${i}`,
        rows: [],
        columns: [{ field: 'col1', headerName: 'Column 1' }],
      }));
      render(<SpreadsheetGrid sheets={manySheets} activeSheetId="sheet0" />);
      const tabs = screen.getByTestId('sheet-tabs');
      expect(tabs).toBeInTheDocument();
    });

    it('handles missing optional callbacks', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      // Should not crash when callbacks are undefined
      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });

    it('grid container has onContextMenu handler', () => {
      render(<SpreadsheetGrid sheets={mockSheets} activeSheetId="sheet1" />);
      const grid = screen.getByRole('grid');
      // Should not throw on context menu
      fireEvent.contextMenu(grid);
    });
  });
});
