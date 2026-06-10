import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { FormulaAutocomplete } from './FormulaAutocomplete';
import { createRef } from 'react';
import type { FormulaFunction } from './formulaFunctions';

const mockFunctions: FormulaFunction[] = [
  {
    name: 'SUM',
    description: 'Adds numbers',
    category: 'Math',
    syntax: 'SUM(range)',
    params: ['range'],
  },
  {
    name: 'AVERAGE',
    description: 'Average of numbers',
    category: 'Math',
    syntax: 'AVERAGE(range)',
    params: ['range'],
  },
  {
    name: 'IF',
    description: 'Conditional check',
    category: 'Logic',
    syntax: 'IF(logical, value_if_true)',
    params: ['logical', 'value_if_true'],
  },
];

const baseProps = {
  filteredFunctions: mockFunctions,
  autocompleteIndex: 0,
  categories: ['All', 'Math', 'Logic'],
  selectedCategory: null as string | null,
  listRef: createRef<HTMLDivElement>(),
  onSelectCategory: vi.fn(),
  onSelectFunction: vi.fn(),
  onHoverIndex: vi.fn(),
};

describe('FormulaAutocomplete', () => {
  it('renders filtered function list as options', () => {
    render(<FormulaAutocomplete {...baseProps} />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]!).toHaveTextContent('SUM');
    expect(options[1]!).toHaveTextContent('AVERAGE');
    expect(options[2]!).toHaveTextContent('IF');
  });

  it('renders category filter buttons', () => {
    render(<FormulaAutocomplete {...baseProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toContain('All');
    expect(buttons.map((b) => b.textContent)).toContain('Math');
    expect(buttons.map((b) => b.textContent)).toContain('Logic');
  });

  it('calls onSelectCategory when category button clicked', () => {
    const onSelectCategory = vi.fn();
    render(<FormulaAutocomplete {...baseProps} onSelectCategory={onSelectCategory} />);
    const buttons = screen.getAllByRole('button');
    const mathButton = buttons.find((b) => b.textContent === 'Math')!;
    fireEvent.click(mathButton);
    expect(onSelectCategory).toHaveBeenCalledWith('Math');
  });

  it('calls onSelectFunction on mousedown (not click)', () => {
    const onSelectFunction = vi.fn();
    render(<FormulaAutocomplete {...baseProps} onSelectFunction={onSelectFunction} />);
    const options = screen.getAllByRole('option');
    fireEvent.mouseDown(options[0]!);
    expect(onSelectFunction).toHaveBeenCalledWith(mockFunctions[0]!);
  });

  it('calls onHoverIndex on mouse enter', () => {
    const onHoverIndex = vi.fn();
    render(<FormulaAutocomplete {...baseProps} onHoverIndex={onHoverIndex} />);
    const options = screen.getAllByRole('option');
    fireEvent.mouseEnter(options[0]!);
    expect(onHoverIndex).toHaveBeenCalledWith(0);
  });

  it('shows selected function params', () => {
    render(<FormulaAutocomplete {...baseProps} />);
    expect(screen.getByText('range')).toBeInTheDocument();
  });

  it('highlights selected function based on autocompleteIndex', () => {
    const { container } = render(<FormulaAutocomplete {...baseProps} autocompleteIndex={2} />);
    const options = container.querySelectorAll('[role="option"]');
    expect(options![2]!.getAttribute('aria-selected')).toBe('true');
  });
});
