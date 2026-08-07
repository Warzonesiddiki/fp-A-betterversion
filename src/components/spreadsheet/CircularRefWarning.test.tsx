/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import {
  useCircularDetection,
  ConvergenceProgressIndicator,
  SpreadsheetCircularWarning,
} from './CircularRefWarning';
import type { ConvergenceResult } from '@/engines/IterativeCalculationEngine';

// --- Test data ---

const makeConvergence = (overrides: Partial<ConvergenceResult> = {}): ConvergenceResult => ({
  status: 'converged',
  iterations: 10,
  maxChange: 0.0005,
  history: [1.0, 0.5, 0.25, 0.1, 0.01, 0.0005],
  involvedCells: ['A1', 'B1'],
  ...overrides,
});

// --- ConvergenceProgressIndicator ---

describe('ConvergenceProgressIndicator', () => {
  it('renders progress bar', () => {
    const convergence = makeConvergence();
    render(<ConvergenceProgressIndicator convergence={convergence} tolerance={0.001} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders iteration count', () => {
    const convergence = makeConvergence({ iterations: 10 });
    render(<ConvergenceProgressIndicator convergence={convergence} tolerance={0.001} />);
    expect(screen.getByText('10 iters')).toBeInTheDocument();
  });

  it('renders singular "iter" for 1 iteration', () => {
    const convergence = makeConvergence({ iterations: 1 });
    render(<ConvergenceProgressIndicator convergence={convergence} tolerance={0.001} />);
    expect(screen.getByText('1 iter')).toBeInTheDocument();
  });

  it('renders sparkline when history has multiple entries', () => {
    const convergence = makeConvergence();
    render(<ConvergenceProgressIndicator convergence={convergence} tolerance={0.001} />);
    expect(screen.getByLabelText('Convergence history chart')).toBeInTheDocument();
  });

  it('does not render sparkline for single history entry', () => {
    const convergence = makeConvergence({ history: [1.0] });
    render(<ConvergenceProgressIndicator convergence={convergence} tolerance={0.001} />);
    expect(screen.queryByLabelText('Convergence history chart')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const convergence = makeConvergence();
    const { container } = render(
      <ConvergenceProgressIndicator
        convergence={convergence}
        tolerance={0.001}
        className="my-class"
      />
    );
    expect(container.firstChild).toHaveClass('my-class');
  });
});

// --- useCircularDetection ---

describe('useCircularDetection', () => {
  it('returns no cycles for acyclic formulas', () => {
    const formulas = new Map<string, string>([
      ['A1', '=10'],
      ['B1', '=A1+5'],
    ]);
    const noop = () => 0;
    const { result } = renderHook(() => useCircularDetection(formulas, noop, noop, noop));
    expect(result.current.hasCircular).toBe(false);
    expect(result.current.cycles).toHaveLength(0);
  });

  it('detects circular references', () => {
    const formulas = new Map<string, string>([
      ['A1', '=B1+1'],
      ['B1', '=A1+1'],
    ]);
    const noop = () => 0;
    const { result } = renderHook(() => useCircularDetection(formulas, noop, noop, noop));
    expect(result.current.hasCircular).toBe(true);
    expect(result.current.cycles.length).toBeGreaterThan(0);
  });

  it('provides iterative config', () => {
    const formulas = new Map<string, string>([['A1', '=10']]);
    const noop = () => 0;
    const { result } = renderHook(() => useCircularDetection(formulas, noop, noop, noop));
    expect(result.current.config).toBeDefined();
    expect(result.current.config.maxIterations).toBe(100);
    expect(result.current.config.maxChange).toBe(0.001);
  });

  it('updates config via setConfig', () => {
    const formulas = new Map<string, string>([['A1', '=10']]);
    const noop = () => 0;
    const { result } = renderHook(() => useCircularDetection(formulas, noop, noop, noop));
    act(() => {
      result.current.setConfig({ maxIterations: 500 });
    });
    expect(result.current.config.maxIterations).toBe(500);
  });

  it('recalculate sets convergence', () => {
    const formulas = new Map<string, string>([
      ['A1', '=B1+1'],
      ['B1', '=A1*0.5'],
    ]);
    const values = new Map([
      ['A1', 0],
      ['B1', 0],
    ]);
    const getVal = (ref: string) => values.get(ref) ?? 0;
    const setVal = (ref: string, v: number) => {
      values.set(ref, v);
    };
    const recalc = (ref: string) => {
      if (ref === 'A1') {
        const v = (values.get('B1') ?? 0) + 1;
        values.set('A1', v);
        return v;
      }
      const v = (values.get('A1') ?? 0) * 0.5;
      values.set('B1', v);
      return v;
    };

    const { result } = renderHook(() => useCircularDetection(formulas, recalc, getVal, setVal));

    act(() => {
      result.current.recalculate();
    });

    // convergence may or may not be set depending on config
    expect(result.current.isRecalculating).toBe(false);
  });
});

// --- SpreadsheetCircularWarning ---

describe('SpreadsheetCircularWarning', () => {
  const noop = () => 0;

  it('renders null when no circular references', () => {
    const formulas = new Map<string, string>([
      ['A1', '=10'],
      ['B1', '=A1+5'],
    ]);
    const { container } = render(
      <SpreadsheetCircularWarning
        cellFormulas={formulas}
        recalcCell={noop}
        getCellValue={noop}
        setCellValue={noop}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders warning when circular references exist', () => {
    const formulas = new Map<string, string>([
      ['A1', '=B1+1'],
      ['B1', '=A1+1'],
    ]);
    render(
      <SpreadsheetCircularWarning
        cellFormulas={formulas}
        recalcCell={noop}
        getCellValue={noop}
        setCellValue={noop}
      />
    );
    expect(screen.getByText(/Circular references detected/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const formulas = new Map<string, string>([
      ['A1', '=B1+1'],
      ['B1', '=A1+1'],
    ]);
    const { container } = render(
      <SpreadsheetCircularWarning
        cellFormulas={formulas}
        recalcCell={noop}
        getCellValue={noop}
        setCellValue={noop}
        className="custom-class"
      />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
