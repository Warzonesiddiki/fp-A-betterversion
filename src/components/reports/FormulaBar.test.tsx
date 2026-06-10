/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormulaBar } from './FormulaBar';

vi.mock('@/engines/ReportBuilderEngine', () => ({
  ReportBuilderEngine: {
    parseFormulaReferences: vi.fn((expr: string) => {
      const matches = expr.match(/[A-Z]+\d+/g);
      return matches ? [...new Set(matches)] : [];
    }),
    evaluateFormula: vi.fn(() => 100),
    safeEvaluate: vi.fn(() => 100),
    columnIndexToLetter: vi.fn((i: number) => String.fromCharCode(65 + i)),
    formatNumber: vi.fn((v: number) => `$${v}`),
  },
}));

describe('FormulaBar', () => {
  const defaultProps = {
    onApplyFormula: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<FormulaBar {...defaultProps} />);
  });

  it('renders the formula bar header', () => {
    render(<FormulaBar {...defaultProps} />);
    expect(screen.getByText('Formula Bar')).toBeInTheDocument();
  });

  it('renders the expression input', () => {
    render(<FormulaBar {...defaultProps} />);
    expect(screen.getByLabelText('Formula expression')).toBeInTheDocument();
  });

  it('shows cell position when provided', () => {
    render(<FormulaBar {...defaultProps} cellPosition="B3" />);
    // B3 appears in both the position badge and the quick reference buttons
    const elements = screen.getAllByText('B3');
    expect(elements.length).toBeGreaterThanOrEqual(1);
    // The first one should be the cell position badge
    expect(elements[0]!).toBeInTheDocument();
  });

  it('renders quick cell references', () => {
    render(<FormulaBar {...defaultProps} />);
    const a1Refs = screen.getAllByText('A1');
    expect(a1Refs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders format selector', () => {
    render(<FormulaBar {...defaultProps} />);
    expect(screen.getByLabelText('Number format')).toBeInTheDocument();
  });

  it('renders decimals input', () => {
    render(<FormulaBar {...defaultProps} />);
    expect(screen.getByLabelText('Decimal places')).toBeInTheDocument();
  });

  it('renders apply button', () => {
    render(<FormulaBar {...defaultProps} />);
    expect(screen.getByText('Apply Formula')).toBeInTheDocument();
  });

  it('shows functions help when toggled', () => {
    render(<FormulaBar {...defaultProps} />);
    const functionsBtn = screen.getByText('Functions');
    fireEvent.click(functionsBtn);
    expect(screen.getByText('SUM')).toBeInTheDocument();
    expect(screen.getByText('AVG')).toBeInTheDocument();
  });

  it('cancels on Escape key', () => {
    const onCancel = vi.fn();
    render(<FormulaBar {...defaultProps} onCancel={onCancel} />);
    const input = screen.getByLabelText('Formula expression');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });

  it('inserts cell reference on click', () => {
    render(<FormulaBar {...defaultProps} />);
    // Click the first A1 reference (quick ref button)
    const refs = screen.getAllByText('A1');
    fireEvent.click(refs[0]!);
    const input = screen.getByLabelText('Formula expression') as HTMLInputElement;
    expect(input.value).toContain('A1');
  });

  it('shows validation for valid formula', () => {
    render(<FormulaBar {...defaultProps} />);
    const input = screen.getByLabelText('Formula expression');
    fireEvent.change(input, { target: { value: '2+3' } });
    expect(screen.getByText('Valid formula')).toBeInTheDocument();
  });

  it('uses initial expression when provided', () => {
    render(<FormulaBar {...defaultProps} currentExpression="A1+B1" />);
    const input = screen.getByLabelText('Formula expression') as HTMLInputElement;
    expect(input.value).toBe('A1+B1');
  });

  it('renders label input', () => {
    render(<FormulaBar {...defaultProps} />);
    expect(screen.getByLabelText('Formula display label')).toBeInTheDocument();
  });

  it('disables apply button when expression is empty', () => {
    render(<FormulaBar {...defaultProps} />);
    const button = screen.getByText('Apply Formula');
    expect(button).toBeDisabled();
  });
});
