/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  CircularReferenceWarning,
  CircularCellIndicator,
  useIterativeConfig,
} from './CircularReferenceWarning';
import { renderHook, act } from '@testing-library/react';
import type {
  CircularGroup,
  ConvergenceResult,
  IterativeConfig,
} from '@/engines/IterativeCalculationEngine';
import { DEFAULT_ITERATIVE_CONFIG } from '@/engines/IterativeCalculationEngine';

const makeCycle = (overrides: Partial<CircularGroup> = {}): CircularGroup => ({
  cells: ['A1', 'B2', 'C3'],
  description: 'A1 -> B2 -> C3 -> A1',
  ...overrides,
});

const makeConvergence = (overrides: Partial<ConvergenceResult> = {}): ConvergenceResult => ({
  status: 'converged',
  iterations: 15,
  maxChange: 0.0005,
  history: [1.0, 0.5, 0.25, 0.1, 0.0005],
  involvedCells: ['A1', 'B2', 'C3'],
  ...overrides,
});

const defaultConfig: IterativeConfig = {
  maxIterations: 100,
  maxChange: 0.001,
  enableIterativeCalc: true,
};

const defaultProps = {
  cycles: [makeCycle()],
  config: defaultConfig,
  onConfigChange: vi.fn(),
};

describe('CircularReferenceWarning', () => {
  // Rendering
  it('renders without crashing', () => {
    render(<CircularReferenceWarning {...defaultProps} />);
    expect(screen.getByText(/Circular references detected/)).toBeInTheDocument();
  });

  it('renders null when cycles is empty', () => {
    const { container } = render(<CircularReferenceWarning {...defaultProps} cycles={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders cycle count', () => {
    render(<CircularReferenceWarning {...defaultProps} />);
    expect(screen.getByText(/1 circular group.*3 cells involved/)).toBeInTheDocument();
  });

  it('renders multiple cycle counts', () => {
    const cycles = [makeCycle(), makeCycle({ cells: ['D4', 'E5'] })];
    render(<CircularReferenceWarning {...defaultProps} cycles={cycles} />);
    expect(screen.getByText(/2 circular groups/)).toBeInTheDocument();
  });

  // Convergence statuses
  it('renders converged status', () => {
    const convergenceResult = makeConvergence({ status: 'converged' });
    render(<CircularReferenceWarning {...defaultProps} convergenceResult={convergenceResult} />);
    expect(screen.getByText('Converged')).toBeInTheDocument();
  });

  it('renders diverged status', () => {
    const convergenceResult = makeConvergence({ status: 'diverged' });
    render(<CircularReferenceWarning {...defaultProps} convergenceResult={convergenceResult} />);
    expect(screen.getByText(/Diverged/)).toBeInTheDocument();
  });

  it('renders max-iterations status', () => {
    const convergenceResult = makeConvergence({ status: 'max-iterations' });
    render(<CircularReferenceWarning {...defaultProps} convergenceResult={convergenceResult} />);
    expect(screen.getByText(/Max iterations/)).toBeInTheDocument();
  });

  // Expand/collapse
  it('toggles expanded state', () => {
    render(<CircularReferenceWarning {...defaultProps} />);
    const expandBtn = screen.getByLabelText('Expand details');
    fireEvent.click(expandBtn);
    expect(screen.getByText('Circular reference groups:')).toBeInTheDocument();
    expect(screen.getByText('A1 \u2192 B2 \u2192 C3 \u2192 A1')).toBeInTheDocument();
  });

  // Settings
  it('toggles settings panel', () => {
    render(<CircularReferenceWarning {...defaultProps} />);
    fireEvent.click(screen.getByText('Settings'));
    expect(screen.getByText('Enable iterative calculation')).toBeInTheDocument();
    expect(screen.getByText('Max iterations:')).toBeInTheDocument();
    expect(screen.getByText('Tolerance:')).toBeInTheDocument();
  });

  // Recalculate button
  it('renders recalculate button when onRecalc is provided', () => {
    const onRecalc = vi.fn();
    render(<CircularReferenceWarning {...defaultProps} onRecalc={onRecalc} />);
    expect(screen.getByText('Recalculate')).toBeInTheDocument();
  });

  it('calls onRecalc when recalculate button is clicked', () => {
    const onRecalc = vi.fn();
    render(<CircularReferenceWarning {...defaultProps} onRecalc={onRecalc} />);
    fireEvent.click(screen.getByText('Recalculate'));
    expect(onRecalc).toHaveBeenCalled();
  });

  it('does not render recalculate button when onRecalc is not provided', () => {
    render(<CircularReferenceWarning {...defaultProps} />);
    expect(screen.queryByText('Recalculate')).not.toBeInTheDocument();
  });

  // Convergence details
  it('shows convergence details when expanded', () => {
    const convergenceResult = makeConvergence();
    render(<CircularReferenceWarning {...defaultProps} convergenceResult={convergenceResult} />);
    fireEvent.click(screen.getByLabelText('Expand details'));
    expect(screen.getByText('Iterations:')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Final max change:')).toBeInTheDocument();
    expect(screen.getByText('Tolerance:')).toBeInTheDocument();
  });

  // Config change
  it('calls onConfigChange when iterative calc is toggled', () => {
    const onConfigChange = vi.fn();
    render(<CircularReferenceWarning {...defaultProps} onConfigChange={onConfigChange} />);
    fireEvent.click(screen.getByText('Settings'));
    fireEvent.click(screen.getByText('Enable iterative calculation'));
    expect(onConfigChange).toHaveBeenCalledWith({
      ...defaultConfig,
      enableIterativeCalc: false,
    });
  });
});

describe('CircularCellIndicator', () => {
  it('renders null when not circular', () => {
    const { container } = render(<CircularCellIndicator cellRef="A1" isCircular={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders warning icon when circular', () => {
    render(<CircularCellIndicator cellRef="A1" isCircular={true} />);
    expect(screen.getByText('\u26a0')).toBeInTheDocument();
    expect(screen.getByLabelText('Circular reference')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CircularCellIndicator cellRef="A1" isCircular={true} className="custom-class" />);
    const indicator = screen.getByLabelText('Circular reference');
    expect(indicator.className).toContain('custom-class');
  });
});

describe('useIterativeConfig', () => {
  it('returns default config when no initial provided', () => {
    const { result } = renderHook(() => useIterativeConfig());
    expect(result.current.config).toEqual(DEFAULT_ITERATIVE_CONFIG);
  });

  it('merges initial config with defaults', () => {
    const { result } = renderHook(() => useIterativeConfig({ maxIterations: 500 }));
    expect(result.current.config.maxIterations).toBe(500);
    expect(result.current.config.maxChange).toBe(DEFAULT_ITERATIVE_CONFIG.maxChange);
  });

  it('updates config via setConfig', () => {
    const { result } = renderHook(() => useIterativeConfig());
    act(() => {
      result.current.setConfig({ maxIterations: 200 });
    });
    expect(result.current.config.maxIterations).toBe(200);
  });

  it('resets config to defaults', () => {
    const { result } = renderHook(() => useIterativeConfig({ maxIterations: 999 }));
    act(() => {
      result.current.resetConfig();
    });
    expect(result.current.config).toEqual(DEFAULT_ITERATIVE_CONFIG);
  });
});
