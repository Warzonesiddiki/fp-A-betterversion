/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { FormulaBar } from '../FormulaBar';

vi.mock('lucide-react', () => {
  const makeIcon = (n: string) => (p: any) => <span data-testid={`icon-${n}`} {...p} />;
  return {
    FunctionSquare: makeIcon('FunctionSquare'),
    AlertCircle: makeIcon('AlertCircle'),
    CheckCircle: makeIcon('CheckCircle'),
    X: makeIcon('X'),
  };
});
vi.mock('@/utils/cn', () => ({ cn: (...a: any[]) => a.filter(Boolean).join(' ') }));
vi.mock('@/engines/ReportBuilderEngine', () => ({
  ReportBuilderEngine: {
    parseFormulaReferences: () => [],
    evaluateFormula: () => 0,
    safeEvaluate: () => 0,
    columnIndexToLetter: (i: number) => String.fromCharCode(65 + i),
  },
}));

describe('FormulaBar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders expression input', () => {
    render(<FormulaBar onApplyFormula={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText('Formula expression')).toBeTruthy();
  });

  it('renders format options', () => {
    render(<FormulaBar onApplyFormula={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Formula Bar')).toBeTruthy();
    expect(screen.getByLabelText('Number format')).toBeTruthy();
  });
});
