/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SheetTabs } from './SheetTabs';

const defaultSheets = [
  { id: 's1', name: 'Sheet1' },
  { id: 's2', name: 'Sheet2' },
  { id: 's3', name: 'Sheet3' },
];

const defaultProps = {
  sheets: defaultSheets,
  activeSheetId: 's1',
  onSheetChange: vi.fn(),
  onSheetAdd: vi.fn(),
  onSheetRename: vi.fn(),
  onSheetDelete: vi.fn(),
  onSheetReorder: vi.fn(),
};

describe('SheetTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering
  it('renders all sheet tabs', () => {
    render(<SheetTabs {...defaultProps} />);
    expect(screen.getByText('Sheet1')).toBeInTheDocument();
    expect(screen.getByText('Sheet2')).toBeInTheDocument();
    expect(screen.getByText('Sheet3')).toBeInTheDocument();
  });

  it('renders with role="tablist"', () => {
    render(<SheetTabs {...defaultProps} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('renders aria-label on tablist', () => {
    render(<SheetTabs {...defaultProps} />);
    expect(screen.getByLabelText('Spreadsheet Sheets')).toBeInTheDocument();
  });

  it('marks active sheet with aria-selected', () => {
    render(<SheetTabs {...defaultProps} activeSheetId="s2" />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]!).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]!).toHaveAttribute('aria-selected', 'true');
    expect(tabs[2]!).toHaveAttribute('aria-selected', 'false');
  });

  it('renders add sheet button', () => {
    render(<SheetTabs {...defaultProps} />);
    expect(screen.getByLabelText('Add new sheet')).toBeInTheDocument();
  });

  it('renders delete button only for active sheet when multiple sheets exist', () => {
    render(<SheetTabs {...defaultProps} />);
    expect(screen.getByLabelText('Delete sheet Sheet1')).toBeInTheDocument();
    expect(screen.queryByLabelText('Delete sheet Sheet2')).not.toBeInTheDocument();
  });

  it('does not render delete button when only one sheet', () => {
    render(<SheetTabs {...defaultProps} sheets={[{ id: 's1', name: 'Only' }]} />);
    expect(screen.queryByLabelText(/Delete sheet/)).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<SheetTabs {...defaultProps} className="custom" />);
    expect(container.firstChild).toHaveAttribute('class');
  });

  // Interactions
  it('calls onSheetChange when tab clicked', () => {
    const onSheetChange = vi.fn();
    render(<SheetTabs {...defaultProps} onSheetChange={onSheetChange} />);
    fireEvent.click(screen.getByText('Sheet2'));
    expect(onSheetChange).toHaveBeenCalledWith('s2');
  });

  it('calls onSheetAdd when add button clicked', () => {
    const onSheetAdd = vi.fn();
    render(<SheetTabs {...defaultProps} onSheetAdd={onSheetAdd} />);
    fireEvent.click(screen.getByLabelText('Add new sheet'));
    expect(onSheetAdd).toHaveBeenCalled();
  });

  it('calls onSheetDelete when delete button clicked', () => {
    const onSheetDelete = vi.fn();
    render(<SheetTabs {...defaultProps} onSheetDelete={onSheetDelete} />);
    fireEvent.click(screen.getByLabelText('Delete sheet Sheet1'));
    expect(onSheetDelete).toHaveBeenCalledWith('s1');
  });

  // Double-click rename
  it('enters rename mode on double-click', () => {
    render(<SheetTabs {...defaultProps} />);
    const tab = screen.getByText('Sheet1');
    fireEvent.doubleClick(tab);
    const input = screen.getByDisplayValue('Sheet1');
    expect(input).toBeInTheDocument();
  });

  it('calls onSheetRename on blur after editing', () => {
    const onSheetRename = vi.fn();
    render(<SheetTabs {...defaultProps} onSheetRename={onSheetRename} />);
    fireEvent.doubleClick(screen.getByText('Sheet1'));
    const input = screen.getByDisplayValue('Sheet1');
    fireEvent.change(input, { target: { value: 'Renamed' } });
    fireEvent.blur(input);
    expect(onSheetRename).toHaveBeenCalledWith('s1', 'Renamed');
  });

  it('calls onSheetRename on Enter key', () => {
    const onSheetRename = vi.fn();
    render(<SheetTabs {...defaultProps} onSheetRename={onSheetRename} />);
    fireEvent.doubleClick(screen.getByText('Sheet1'));
    const input = screen.getByDisplayValue('Sheet1');
    fireEvent.change(input, { target: { value: 'NewName' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSheetRename).toHaveBeenCalledWith('s1', 'NewName');
  });

  it('cancels rename on Escape key', () => {
    const onSheetRename = vi.fn();
    render(<SheetTabs {...defaultProps} onSheetRename={onSheetRename} />);
    fireEvent.doubleClick(screen.getByText('Sheet1'));
    const input = screen.getByDisplayValue('Sheet1');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onSheetRename).not.toHaveBeenCalled();
    expect(screen.getByText('Sheet1')).toBeInTheDocument();
  });

  // Keyboard
  it('activates tab on Enter key', () => {
    const onSheetChange = vi.fn();
    render(<SheetTabs {...defaultProps} onSheetChange={onSheetChange} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[1]!, { key: 'Enter' });
    expect(onSheetChange).toHaveBeenCalledWith('s2');
  });

  it('activates tab on Space key', () => {
    const onSheetChange = vi.fn();
    render(<SheetTabs {...defaultProps} onSheetChange={onSheetChange} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[2]!, { key: ' ' });
    expect(onSheetChange).toHaveBeenCalledWith('s3');
  });
});
