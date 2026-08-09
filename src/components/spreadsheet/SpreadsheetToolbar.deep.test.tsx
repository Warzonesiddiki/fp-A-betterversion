import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpreadsheetToolbar, defaultCellStyle, type CellStyle } from './SpreadsheetToolbar';

describe('SpreadsheetToolbar (deep tests)', () => {
  it('renders toolbar with default cell styles and active state indicators', () => {
    const activeStyle: CellStyle = {
      ...defaultCellStyle,
      bold: true,
      textAlign: 'center',
      numberFormat: 'currency',
      wrapText: true,
    };

    render(
      <SpreadsheetToolbar
        style={activeStyle}
        onStyleChange={vi.fn()}
        canUndo={true}
        canRedo={false}
        formatPainterActive={true}
      />
    );

    expect(
      screen.getByRole('toolbar', { name: 'Spreadsheet formatting toolbar' })
    ).toBeInTheDocument();

    // Check undo enabled and redo disabled
    expect(screen.getByRole('button', { name: 'Undo' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();

    // Check active buttons
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Align center' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Align left' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: 'Wrap text' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Format painter' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('triggers style toggles for bold, italic, underline, and wrap text', async () => {
    const user = userEvent.setup();
    const onStyleChange = vi.fn();

    render(<SpreadsheetToolbar style={defaultCellStyle} onStyleChange={onStyleChange} />);

    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(onStyleChange).toHaveBeenCalledWith({ bold: true });

    onStyleChange.mockClear();
    await user.click(screen.getByRole('button', { name: 'Italic' }));
    expect(onStyleChange).toHaveBeenCalledWith({ italic: true });

    onStyleChange.mockClear();
    await user.click(screen.getByRole('button', { name: 'Underline' }));
    expect(onStyleChange).toHaveBeenCalledWith({ underline: true });

    onStyleChange.mockClear();
    await user.click(screen.getByRole('button', { name: 'Wrap text' }));
    expect(onStyleChange).toHaveBeenCalledWith({ wrapText: true });
  });

  it('triggers text alignment changes', async () => {
    const user = userEvent.setup();
    const onStyleChange = vi.fn();

    render(<SpreadsheetToolbar style={defaultCellStyle} onStyleChange={onStyleChange} />);

    await user.click(screen.getByRole('button', { name: 'Align center' }));
    expect(onStyleChange).toHaveBeenCalledWith({ textAlign: 'center' });

    onStyleChange.mockClear();
    await user.click(screen.getByRole('button', { name: 'Align right' }));
    expect(onStyleChange).toHaveBeenCalledWith({ textAlign: 'right' });

    onStyleChange.mockClear();
    await user.click(screen.getByRole('button', { name: 'Align left' }));
    expect(onStyleChange).toHaveBeenCalledWith({ textAlign: 'left' });
  });

  it('triggers number format quick toggles', async () => {
    const user = userEvent.setup();
    const onStyleChange = vi.fn();

    // When format is 'general', clicking currency sets it to 'currency'
    const { rerender } = render(
      <SpreadsheetToolbar style={defaultCellStyle} onStyleChange={onStyleChange} />
    );

    await user.click(screen.getByRole('button', { name: 'Currency format' }));
    expect(onStyleChange).toHaveBeenCalledWith({ numberFormat: 'currency' });

    // When format is already 'currency', clicking currency toggles back to 'general'
    onStyleChange.mockClear();
    rerender(
      <SpreadsheetToolbar
        style={{ ...defaultCellStyle, numberFormat: 'currency' }}
        onStyleChange={onStyleChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Currency format' }));
    expect(onStyleChange).toHaveBeenCalledWith({ numberFormat: 'general' });

    // Percent quick toggle
    onStyleChange.mockClear();
    await user.click(screen.getByRole('button', { name: 'Percent format' }));
    expect(onStyleChange).toHaveBeenCalledWith({ numberFormat: 'percent' });

    // Number quick toggle
    onStyleChange.mockClear();
    await user.click(screen.getByTitle('Number'));
    expect(onStyleChange).toHaveBeenCalledWith({ numberFormat: 'number' });
  });

  it('opens number format dropdown menu and selects format option', async () => {
    const user = userEvent.setup();
    const onStyleChange = vi.fn();

    render(<SpreadsheetToolbar style={defaultCellStyle} onStyleChange={onStyleChange} />);

    const formatDropdownBtn = screen.getByRole('button', { expanded: false });
    expect(formatDropdownBtn).toHaveAttribute('aria-label', 'Number format');

    await user.click(formatDropdownBtn);
    expect(formatDropdownBtn).toHaveAttribute('aria-expanded', 'true');

    const listbox = screen.getByRole('listbox', { name: 'Number format options' });
    expect(listbox).toBeInTheDocument();

    const percentOption = screen.getByRole('option', { name: 'Percent' });
    await user.click(percentOption);

    expect(onStyleChange).toHaveBeenCalledWith({ numberFormat: 'percent' });
    expect(
      screen.queryByRole('listbox', { name: 'Number format options' })
    ).not.toBeInTheDocument();
  });

  it('handles clipboard, history, merge, and painter callbacks', async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const onCut = vi.fn();
    const onCopy = vi.fn();
    const onPaste = vi.fn();
    const onMerge = vi.fn();
    const onFormatPainter = vi.fn();

    render(
      <SpreadsheetToolbar
        style={defaultCellStyle}
        onStyleChange={vi.fn()}
        onUndo={onUndo}
        onRedo={onRedo}
        onCut={onCut}
        onCopy={onCopy}
        onPaste={onPaste}
        onMerge={onMerge}
        onFormatPainter={onFormatPainter}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onUndo).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Redo' }));
    expect(onRedo).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Cut' }));
    expect(onCut).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(onCopy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Paste' }));
    expect(onPaste).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Merge cells' }));
    expect(onMerge).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Format painter' }));
    expect(onFormatPainter).toHaveBeenCalledTimes(1);
  });
});
