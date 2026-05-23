/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConditionalFormatPanel } from './ConditionalFormatPanel';
import type { ReportCell, ConditionalFormat } from '@/engines/ReportBuilderEngine';

vi.mock('@/engines/ReportBuilderEngine', () => ({
  ReportBuilderEngine: {
    formatNumber: vi.fn((v: number, fmt: string) => {
      if (fmt === 'currency') return `$${v.toLocaleString()}`;
      return String(v);
    }),
  },
}));

function createMetricCell(formats: ConditionalFormat[] = []): ReportCell {
  return {
    id: 'test-cell',
    type: 'metric',
    content: {
      type: 'metric',
      content: {
        coords: 'Revenue.Q1',
        measure: 'amount',
        format: 'currency',
        decimals: 0,
        showSign: false,
        conditionalFormats: formats,
      },
    },
    style: {
      bold: false,
      italic: false,
      underline: false,
      fontSize: 11,
      fontFamily: 'Inter, sans-serif',
      textColor: '#1F2937',
      backgroundColor: 'transparent',
      borderTop: 'none',
      borderBottom: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      alignment: 'left',
      indent: 0,
      wrap: false,
    },
    colspan: 1,
    rowspan: 1,
    isVisible: true,
  };
}

describe('ConditionalFormatPanel', () => {
  const defaultProps = {
    cell: createMetricCell(),
    onUpdateFormats: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<ConditionalFormatPanel {...defaultProps} />);
  });

  it('renders the header', () => {
    render(<ConditionalFormatPanel {...defaultProps} />);
    expect(screen.getByText('Conditional Formatting')).toBeInTheDocument();
  });

  it('shows cell type', () => {
    render(<ConditionalFormatPanel {...defaultProps} />);
    expect(screen.getByText('metric')).toBeInTheDocument();
  });

  it('shows empty state when no formats', () => {
    render(<ConditionalFormatPanel {...defaultProps} />);
    expect(screen.getByText(/No conditional formats/)).toBeInTheDocument();
  });

  it('renders add rule button', () => {
    render(<ConditionalFormatPanel {...defaultProps} />);
    expect(screen.getByText('Add Rule')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<ConditionalFormatPanel {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close conditional formatting'));
    expect(onClose).toHaveBeenCalled();
  });

  it('adds a new rule when Add Rule clicked', () => {
    const onUpdateFormats = vi.fn();
    render(<ConditionalFormatPanel {...defaultProps} onUpdateFormats={onUpdateFormats} />);
    fireEvent.click(screen.getByText('Add Rule'));
    expect(onUpdateFormats).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          condition: 'gt',
          value: 0,
        }),
      ])
    );
  });

  it('renders existing format rules', () => {
    const formats: ConditionalFormat[] = [
      { id: 'cf-1', condition: 'gt', value: 0, style: { textColor: '#16A34A' }, label: 'Positive' },
      { id: 'cf-2', condition: 'lt', value: 0, style: { textColor: '#DC2626' }, label: 'Negative' },
    ];
    const cell = createMetricCell(formats);
    render(<ConditionalFormatPanel {...defaultProps} cell={cell} />);

    expect(screen.getByDisplayValue('Positive')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Negative')).toBeInTheDocument();
  });

  it('shows remove button for each rule', () => {
    const formats: ConditionalFormat[] = [
      { id: 'cf-1', condition: 'gt', value: 0, style: { textColor: '#16A34A' } },
    ];
    const cell = createMetricCell(formats);
    render(<ConditionalFormatPanel {...defaultProps} cell={cell} />);

    expect(screen.getByLabelText('Remove format rule')).toBeInTheDocument();
  });

  it('shows color presets when rule is selected', () => {
    const formats: ConditionalFormat[] = [
      { id: 'cf-1', condition: 'gt', value: 0, style: { textColor: '#16A34A' } },
    ];
    const cell = createMetricCell(formats);
    render(<ConditionalFormatPanel {...defaultProps} cell={cell} />);

    // Click the rule div (has role="button") to select it and reveal presets
    const ruleButtons = screen.getAllByRole('button');
    const ruleDiv = ruleButtons.find((el) => el.getAttribute('tabindex') === '0');
    if (ruleDiv) {
      fireEvent.click(ruleDiv);
    }

    // Should show color presets
    expect(screen.getByText('Quick colors')).toBeInTheDocument();
  });
});
