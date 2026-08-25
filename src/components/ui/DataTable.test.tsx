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

  // K32-5: ARIA grid arrow-key cell navigation
  describe('K32-5 arrow-key navigation', () => {
    const getCell = (text: string) => screen.getByText(text).closest('td')!;

    it('first visible cell is the initial tab stop (roving tabindex)', () => {
      render(<DataTable columns={columns} data={data} />);
      expect(getCell('Alice')).toHaveAttribute('tabindex', '0');
      expect(getCell('Bob')).toHaveAttribute('tabindex', '-1');
      expect(getCell('Engineer')).toHaveAttribute('tabindex', '-1');
    });

    it('ArrowRight moves focus to the next cell in the row', async () => {
      vi.useFakeTimers();
      render(<DataTable columns={columns} data={data} />);
      fireEvent.keyDown(getCell('Alice'), { key: 'ArrowRight' });
      await vi.runAllTimersAsync();
      expect(getCell('30')).toHaveFocus();
      expect(getCell('30')).toHaveAttribute('aria-selected', 'true');
      vi.useRealTimers();
    });

    it('ArrowDown moves focus to the cell below', async () => {
      vi.useFakeTimers();
      render(<DataTable columns={columns} data={data} />);
      fireEvent.keyDown(getCell('Alice'), { key: 'ArrowDown' });
      await vi.runAllTimersAsync();
      expect(getCell('Bob')).toHaveFocus();
      vi.useRealTimers();
    });

    it('navigation clamps at the last column and row', async () => {
      vi.useFakeTimers();
      render(<DataTable columns={columns} data={data} />);
      const manager = getCell('Manager');
      manager.focus();
      fireEvent.focus(manager);
      fireEvent.keyDown(manager, { key: 'ArrowRight' });
      await vi.runAllTimersAsync();
      expect(getCell('Manager')).toHaveFocus();

      fireEvent.keyDown(getCell('Manager'), { key: 'ArrowDown' });
      await vi.runAllTimersAsync();
      expect(screen.getByText('Charlie').closest('td')).not.toBeNull();
      vi.useRealTimers();
    });

    it('does not hijack arrow keys pressed inside header cells or filter inputs', () => {
      render(<DataTable columns={columns} data={data} filterable />);
      const input = screen.getAllByPlaceholderText('Filter...')[0]!;
      input.focus();
      fireEvent.keyDown(input, { key: 'ArrowRight' });
      expect(input).toHaveFocus();
    });
  });

  // W-A11Y-002 M2+M3: single focus model for the interactive grid.
  // Cells form the only roving-tabindex set; rows are never tab stops;
  // headers/inputs keep their natural stops exactly once.
  describe('W-A11Y-002 focus model', () => {
    const getCell = (text: string) => screen.getByText(text).closest('td')!;

    it('clickable rows are never tab stops — no double stop per datum', () => {
      render(<DataTable columns={columns} data={data} onRowClick={() => {}} />);
      const grid = screen.getByRole('grid');
      expect(grid.querySelectorAll('tr[tabindex]')).toHaveLength(0);
      expect(grid.querySelectorAll('tbody td[tabindex="0"]')).toHaveLength(1);
    });

    it('tab order: one natural stop per sortable header plus exactly one cell stop', () => {
      render(<DataTable columns={columns} data={data} />);
      const grid = screen.getByRole('grid');
      const stops = Array.from(grid.querySelectorAll('[tabindex="0"]'));
      expect(stops.filter((el) => el.tagName === 'TH')).toHaveLength(columns.length);
      expect(stops.filter((el) => el.tagName === 'TD')).toHaveLength(1);
    });

    it('Enter on a focused cell activates a clickable row', () => {
      const onRowClick = vi.fn();
      render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />);
      fireEvent.keyDown(getCell('Alice'), { key: 'Enter' });
      expect(onRowClick).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Alice', age: 30, role: 'Engineer' })
      );
    });

    it('Space on a focused cell activates a clickable row and is preventDefaulted', () => {
      const onRowClick = vi.fn();
      render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />);
      const notCancelled = fireEvent.keyDown(getCell('Bob'), { key: ' ', cancelable: true });
      expect(onRowClick).toHaveBeenCalledTimes(1);
      expect(notCancelled).toBe(false);
    });

    it('nested interactive control keeps its own Enter activation', () => {
      const cols: Column[] = [
        {
          key: 'name',
          header: 'Name',
          render: (value) => (
            <button type="button" onClick={() => undefined}>
              {String(value)}
            </button>
          ),
        },
      ];
      const onRowClick = vi.fn();
      render(<DataTable columns={cols} data={data} onRowClick={onRowClick} />);
      fireEvent.keyDown(screen.getAllByRole('button')[0]!, { key: 'Enter' });
      expect(onRowClick).not.toHaveBeenCalled();
    });

    it('first rendered cell of page 2 becomes the tab stop after paging', () => {
      render(<DataTable columns={columns} data={data} pageSize={2} />);
      fireEvent.click(screen.getByLabelText('Next page'));
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
      expect(getCell('Charlie')).toHaveAttribute('tabindex', '0');
    });

    it('cells expose a visible focus ring via Tailwind focus-visible classes', () => {
      render(<DataTable columns={columns} data={data} />);
      expect(getCell('Alice').className).toContain('focus-visible:ring');
    });

    it('sorted column exposes aria-sort', () => {
      render(<DataTable columns={columns} data={data} />);
      const ageHeader = screen.getByText('Age').closest('th')!;
      expect(ageHeader).not.toHaveAttribute('aria-sort');
      fireEvent.click(screen.getByText('Age'));
      expect(ageHeader).toHaveAttribute('aria-sort', 'ascending');
    });

    it('ArrowLeft from the first column stays put', async () => {
      vi.useFakeTimers();
      render(<DataTable columns={columns} data={data} />);
      fireEvent.keyDown(getCell('Alice'), { key: 'ArrowLeft' });
      await vi.runAllTimersAsync();
      expect(getCell('Alice')).toHaveFocus();
      vi.useRealTimers();
    });
  });

  // UI-HF numeric-sort hotfix: String() coercion sorted numbers lexically
  // ("100" < "20" < "3"). Numbers must compare numerically; empties sort
  // last in both directions; Dates by epoch; text keeps locale collation.
  describe('UI-HF type-aware sorting', () => {
    const amountCols: Column[] = [
      { key: 'label', header: 'Label' },
      { key: 'amount', header: 'Amount', sortable: true },
    ];
    // Label lives in the FIRST td; reading it directly avoids textContent
    // concatenating the numeric amount cell after it.
    const rowOrder = () =>
      screen
        .getAllByRole('row')
        .slice(1) // drop header row
        .map((r) => r.querySelector('td')?.textContent ?? '');

    it('sorts numbers numerically ascending (100 > 20 > 3 — was "100" < "20" < "3")', () => {
      render(
        <DataTable
          columns={amountCols}
          data={[
            { label: 'row-100', amount: 100 },
            { label: 'row-20', amount: 20 },
            { label: 'row-3', amount: 3 },
          ]}
        />
      );
      fireEvent.click(screen.getByText('Amount'));
      expect(rowOrder()).toEqual(['row-3', 'row-20', 'row-100']);
    });

    it('sorts numbers numerically descending on second click', () => {
      render(
        <DataTable
          columns={amountCols}
          data={[
            { label: 'row-100', amount: 100 },
            { label: 'row-20', amount: 20 },
            { label: 'row-3', amount: 3 },
          ]}
        />
      );
      const header = screen.getByText('Amount');
      fireEvent.click(header);
      fireEvent.click(header);
      expect(rowOrder()).toEqual(['row-100', 'row-20', 'row-3']);
    });

    it('null/undefined/empty cells sort last in BOTH directions, values keep numeric order', () => {
      render(
        <DataTable
          columns={amountCols}
          data={[
            { label: 'gap-null', amount: null },
            { label: 'val-5', amount: 5 },
            { label: 'gap-undef' },
            { label: 'val-50', amount: 50 },
            { label: 'gap-empty', amount: '' },
          ]}
        />
      );
      const header = screen.getByText('Amount');
      fireEvent.click(header); // asc
      let labels = rowOrder();
      expect(labels.slice(0, 2)).toEqual(['val-5', 'val-50']);
      expect(labels.slice(2)).toEqual(['gap-null', 'gap-undef', 'gap-empty']);
      fireEvent.click(header); // desc
      labels = rowOrder();
      expect(labels.slice(0, 2)).toEqual(['val-50', 'val-5']);
      expect(labels.slice(2)).toEqual(['gap-null', 'gap-undef', 'gap-empty']);
    });

    it('Date cells sort chronologically (epoch order)', () => {
      render(
        <DataTable
          columns={[
            { key: 'label', header: 'Label' },
            { key: 'when', header: 'When', sortable: true },
          ]}
          data={[
            { label: 'late', when: new Date('2026-03-01T00:00:00Z') },
            { label: 'early', when: new Date('2025-01-15T00:00:00Z') },
            { label: 'mid', when: new Date('2025-09-09T00:00:00Z') },
          ]}
        />
      );
      fireEvent.click(screen.getByText('When'));
      expect(rowOrder()).toEqual(['early', 'mid', 'late']);
    });

    it('text columns keep locale-aware collation (not ASCII codepoint order)', () => {
      // ASCII would put 'X9' before 'x1' ('X'=88 < 'x'=120); locale collation
      // is case-insensitive at primary strength → '1' < '9' decides.
      render(
        <DataTable
          columns={[{ key: 'name', header: 'Name', sortable: true }]}
          data={[{ name: 'X9' }, { name: 'x1' }]}
        />
      );
      fireEvent.click(screen.getByText('Name'));
      const names = rowOrder();
      expect(names[0]).toBe('x1');
      expect(names[1]).toBe('X9');
    });
  });

  // Wave-7E a11y-announcements: the results live region used to be rendered
  // ONLY when filteredData.length > pageSize, so filters that shrank (or
  // emptied) the result set went completely unannounced. The region must be
  // persistent — mounted for every non-error state — with only its text
  // swapped. It deliberately uses bare aria-live (no role) so page-level
  // getByRole('status') queries in other suites keep resolving to their own
  // components.
  describe('Wave-7E filter/empty announcements', () => {
    const getLiveRegion = (container: HTMLElement): HTMLElement | null =>
      container.querySelector<HTMLElement>('[aria-live="polite"]');

    it('renders the results live region persistently when rows fit one page', () => {
      const { container } = render(<DataTable columns={columns} data={data} />);
      expect(getLiveRegion(container)).toHaveTextContent('Showing all 3 entries');
    });

    it('announces filtered counts below one page instead of going silent', () => {
      const { container } = render(<DataTable columns={columns} data={data} filterable />);
      fireEvent.change(screen.getAllByPlaceholderText('Filter...')[0]!, {
        target: { value: 'Bob' },
      });
      expect(getLiveRegion(container)).toHaveTextContent('Showing all 1 entries');
    });

    it('announces zero-match filters', () => {
      const { container } = render(<DataTable columns={columns} data={data} filterable />);
      fireEvent.change(screen.getAllByPlaceholderText('Filter...')[0]!, {
        target: { value: 'zzz-no-match' },
      });
      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(getLiveRegion(container)).toHaveTextContent(
        /showing 0 entries for the current filters/i
      );
    });

    it('announces pagination ranges by swapping text in the same persistent region', () => {
      const { container } = render(<DataTable columns={columns} data={data} pageSize={2} />);
      expect(getLiveRegion(container)).toHaveTextContent('Showing 1 to 2 of 3 entries');
      fireEvent.click(screen.getByLabelText('Next page'));
      expect(getLiveRegion(container)).toHaveTextContent('Showing 3 to 3 of 3 entries');
    });
  });
});
