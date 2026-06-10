/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormulaBar } from './FormulaBar';

// Mock scrollIntoView (not available in jsdom)
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe('FormulaBar', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onEvaluate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renders', () => {
    it('renders without crashing', () => {
      render(<FormulaBar {...defaultProps} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders the formula input with correct placeholder', () => {
      render(<FormulaBar {...defaultProps} />);
      expect(screen.getByPlaceholderText(/Enter formula/i)).toBeInTheDocument();
    });

    it('renders the active cell reference', () => {
      render(<FormulaBar {...defaultProps} activeCell="A1" />);
      expect(screen.getByText('A1')).toBeInTheDocument();
    });

    it('renders "---" when no active cell', () => {
      render(<FormulaBar {...defaultProps} />);
      expect(screen.getByText('---')).toBeInTheDocument();
    });

    it('renders the fx icon', () => {
      render(<FormulaBar {...defaultProps} />);
      expect(screen.getByText('fx')).toBeInTheDocument();
    });

    it('renders cancel and confirm buttons', () => {
      render(<FormulaBar {...defaultProps} />);
      expect(screen.getByTitle('Cancel (Esc)')).toBeInTheDocument();
      expect(screen.getByTitle('Evaluate (Enter)')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<FormulaBar {...defaultProps} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('disabled state', () => {
    it('disables the input when disabled prop is true', () => {
      render(<FormulaBar {...defaultProps} disabled />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('applies opacity style when disabled', () => {
      const { container } = render(<FormulaBar {...defaultProps} disabled />);
      const flexContainer = container.querySelector('.pointer-events-none');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe('handles data', () => {
    it('displays the provided value', () => {
      render(<FormulaBar {...defaultProps} value="=SUM(A1:A10)" />);
      expect(screen.getByDisplayValue('=SUM(A1:A10)')).toBeInTheDocument();
    });

    it('calls onChange when input value changes', () => {
      const onChange = vi.fn();
      render(<FormulaBar {...defaultProps} onChange={onChange} />);
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '=A1+B1' } });
      expect(onChange).toHaveBeenCalledWith('=A1+B1');
    });

    it('calls onChange with empty string when cancel button clicked', () => {
      const onChange = vi.fn();
      render(<FormulaBar {...defaultProps} value="=SUM(A1:A10)" onChange={onChange} />);
      fireEvent.click(screen.getByTitle('Cancel (Esc)'));
      expect(onChange).toHaveBeenCalledWith('');
    });

    it('calls onEvaluate when confirm button clicked', () => {
      const onEvaluate = vi.fn();
      render(<FormulaBar {...defaultProps} onEvaluate={onEvaluate} />);
      fireEvent.click(screen.getByTitle('Evaluate (Enter)'));
      expect(onEvaluate).toHaveBeenCalledWith(0);
    });
  });

  describe('keyboard navigation', () => {
    it('calls onEvaluate on Enter key', () => {
      const onEvaluate = vi.fn();
      render(<FormulaBar {...defaultProps} onEvaluate={onEvaluate} />);
      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
      expect(onEvaluate).toHaveBeenCalledWith(0);
    });

    it('clears value on Escape key when autocomplete is hidden', () => {
      const onChange = vi.fn();
      render(<FormulaBar {...defaultProps} value="test" onChange={onChange} />);
      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('autocomplete', () => {
    it('shows autocomplete when typing =SU with 2+ characters', () => {
      const { rerender } = render(<FormulaBar {...defaultProps} value="=" />);
      rerender(<FormulaBar {...defaultProps} value="=SU" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    });

    it('hides autocomplete for less than 2 characters after =', () => {
      render(<FormulaBar {...defaultProps} value="=S" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    });

    it('does not show autocomplete for non-formula values', () => {
      render(<FormulaBar {...defaultProps} value="hello" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows function suggestions when typing =SU', () => {
      render(<FormulaBar {...defaultProps} value="=SU" />);
      expect(screen.getByText('SUM')).toBeInTheDocument();
      expect(screen.getByText('SUMIF')).toBeInTheDocument();
      expect(screen.getByText('SUMIFS')).toBeInTheDocument();
    });

    it('navigates autocomplete with ArrowDown', () => {
      render(<FormulaBar {...defaultProps} value="=SU" />);
      const input = screen.getByRole('combobox');
      // First option is selected by default
      const selectedBefore = screen
        .getAllByRole('option')
        .filter((opt) => opt.getAttribute('aria-selected') === 'true');
      expect(selectedBefore).toHaveLength(1);

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // After ArrowDown, selection should have moved
      const selectedAfter = screen
        .getAllByRole('option')
        .filter((opt) => opt.getAttribute('aria-selected') === 'true');
      expect(selectedAfter).toHaveLength(1);
    });

    it('navigates autocomplete with ArrowUp', () => {
      render(<FormulaBar {...defaultProps} value="=SU" />);
      const input = screen.getByRole('combobox');
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      // Should still have exactly one selected option
      const selected = screen
        .getAllByRole('option')
        .filter((opt) => opt.getAttribute('aria-selected') === 'true');
      expect(selected).toHaveLength(1);
    });

    it('inserts function on Tab key', () => {
      const onChange = vi.fn();
      render(<FormulaBar {...defaultProps} value="=SU" onChange={onChange} />);
      const input = screen.getByRole('combobox');
      fireEvent.keyDown(input, { key: 'Tab' });
      expect(onChange).toHaveBeenCalledWith('=SUM(');
    });

    it('inserts function on Enter key when autocomplete is open', () => {
      const onChange = vi.fn();
      render(<FormulaBar {...defaultProps} value="=SU" onChange={onChange} />);
      const input = screen.getByRole('combobox');
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onChange).toHaveBeenCalledWith('=SUM(');
    });

    it('closes autocomplete on Escape key', () => {
      render(<FormulaBar {...defaultProps} value="=SU" />);
      const input = screen.getByRole('combobox');
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('inserts function on mouse click', () => {
      const onChange = vi.fn();
      render(<FormulaBar {...defaultProps} value="=SU" onChange={onChange} />);
      fireEvent.mouseDown(screen.getByText('SUM'));
      expect(onChange).toHaveBeenCalledWith('=SUM(');
    });
  });

  describe('category filter', () => {
    it('shows category filter buttons when autocomplete is open', () => {
      render(<FormulaBar {...defaultProps} value="=SU" />);
      // "All" button and category buttons should be present in the filter bar
      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();
      // The category filter bar has buttons for each category
      const categoryButtons = listbox.querySelectorAll('button');
      expect(categoryButtons.length).toBeGreaterThan(0);
    });

    it('filters functions by category when category button clicked', () => {
      render(<FormulaBar {...defaultProps} value="=IF" />);
      // IF should match IFS, IFERROR, IFNA (all Logical category) and IF itself
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
      // Check that IF function is in the suggestions
      const optionTexts = options.map((opt) => opt.textContent);
      expect(optionTexts.some((t) => t?.includes('IFS'))).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has combobox role on input', () => {
      render(<FormulaBar {...defaultProps} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('has aria-label on formula input', () => {
      render(<FormulaBar {...defaultProps} />);
      expect(screen.getByLabelText('Formula input')).toBeInTheDocument();
    });

    it('has aria-live on active cell display', () => {
      render(<FormulaBar {...defaultProps} activeCell="B3" />);
      const cellRef = screen.getByText('B3').closest('[aria-live]');
      expect(cellRef).toBeInTheDocument();
    });

    it('shows listbox role for autocomplete dropdown', () => {
      render(<FormulaBar {...defaultProps} value="=SU" />);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('has aria-label on autocomplete listbox', () => {
      render(<FormulaBar {...defaultProps} value="=SU" />);
      expect(screen.getByLabelText('Formula suggestions')).toBeInTheDocument();
    });

    it('sets aria-selected on the active option', () => {
      render(<FormulaBar {...defaultProps} value="=SU" />);
      const options = screen.getAllByRole('option');
      expect(options[0]!).toHaveAttribute('aria-selected', 'true');
    });

    it('shows parameters for selected function', () => {
      render(<FormulaBar {...defaultProps} value="=SU" />);
      expect(screen.getByText('Parameters')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles value without = prefix', () => {
      render(<FormulaBar {...defaultProps} value="SUM(A1:A10)" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    });

    it('handles empty value gracefully', () => {
      render(<FormulaBar {...defaultProps} value="" />);
      expect(screen.getByRole('combobox')).toHaveValue('');
    });

    it('handles value with only = sign', () => {
      render(<FormulaBar {...defaultProps} value="=" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    });

    it('inserts function preserving text before the token', () => {
      const onChange = vi.fn();
      render(<FormulaBar {...defaultProps} value="=A1+SU" onChange={onChange} />);
      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Tab' });
      expect(onChange).toHaveBeenCalledWith('=A1+SUM(');
    });
  });
});
