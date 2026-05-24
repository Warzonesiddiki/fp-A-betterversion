import type { DataGridColumn } from './DataGrid.types';

interface DataGridToolbarProps {
  columns: DataGridColumn[];
  enableFindReplace: boolean;
  enableExport: boolean;
  enableColumnHiding: boolean;
  enableRowGrouping: boolean;
  showFindReplace: boolean;
  setShowFindReplace: (show: boolean) => void;
  showColumnMenu: boolean;
  setShowColumnMenu: (show: boolean) => void;
  hiddenColumns: Set<string>;
  toggleColumn: (field: string) => void;
  groupColumn: string | null;
  handleGroupBy: (field: string | null) => void;
  handleExport: () => void;
}

export const DataGridToolbar: React.FC<DataGridToolbarProps> = ({
  columns,
  enableFindReplace,
  enableExport,
  enableColumnHiding,
  enableRowGrouping,
  showFindReplace,
  setShowFindReplace,
  showColumnMenu,
  setShowColumnMenu,
  hiddenColumns,
  toggleColumn,
  groupColumn,
  handleGroupBy,
  handleExport,
}) => {
  if (!enableFindReplace && !enableExport && !enableColumnHiding && !enableRowGrouping) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-muted)] border-b border-[var(--border-subtle)] text-xs">
      {enableFindReplace && (
        <button
          onClick={() => setShowFindReplace(!showFindReplace)}
          className="px-2 py-1 rounded hover:bg-[var(--bg-surface)] transition-colors"
          aria-label="Find and Replace"
          title="Find & Replace (Ctrl+F)"
        >
          Find
        </button>
      )}
      {enableExport && (
        <button
          onClick={handleExport}
          className="px-2 py-1 rounded hover:bg-[var(--bg-surface)] transition-colors"
          aria-label="Export to CSV"
          title="Export CSV"
        >
          Export
        </button>
      )}
      {enableColumnHiding && (
        <div className="relative">
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="px-2 py-1 rounded hover:bg-[var(--bg-surface)] transition-colors"
            aria-label="Show or hide columns"
            aria-expanded={showColumnMenu}
            title="Column Visibility"
          >
            Columns
          </button>
          {showColumnMenu && (
            <div
              className="absolute top-full left-0 z-50 mt-1 w-48 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md shadow-lg"
              role="menu"
            >
              {columns.map((col) => (
                <div
                  key={col.field}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--bg-muted)] cursor-pointer"
                  role="menuitemcheckbox"
                  aria-checked={!hiddenColumns.has(col.field)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleColumn(col.field);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!hiddenColumns.has(col.field)}
                    onChange={() => toggleColumn(col.field)}
                    className="rounded"
                  />
                  <span>{col.headerName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {enableRowGrouping && (
        <div className="relative">
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="px-2 py-1 rounded hover:bg-[var(--bg-surface)] transition-colors"
            aria-label="Group rows by column"
            title="Row Grouping"
          >
            Group {groupColumn ? `(${groupColumn})` : ''}
          </button>
          {showColumnMenu && (
            <div
              className="absolute top-full left-0 z-50 mt-1 w-48 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md shadow-lg"
              role="menu"
            >
              <button
                onClick={() => {
                  handleGroupBy(null);
                  setShowColumnMenu(false);
                }}
                className="block w-full text-left px-3 py-1.5 hover:bg-[var(--bg-muted)]"
                role="menuitem"
              >
                No Grouping
              </button>
              {columns.map((col) => (
                <button
                  key={col.field}
                  onClick={() => {
                    handleGroupBy(col.field);
                    setShowColumnMenu(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 hover:bg-[var(--bg-muted)]"
                  role="menuitem"
                >
                  Group by {col.headerName}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
