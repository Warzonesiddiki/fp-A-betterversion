import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  DataBarRenderer,
  IconSetRenderer,
  ColorScaleRenderer,
  VarianceHighlighter,
  ConditionalCellRenderer,
} from '@/components/ui/ConditionalFormattingRenderers';

describe('ConditionalFormattingRenderers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DataBarRenderer', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <DataBarRenderer
          value={50}
          percentage={0.5}
          config={{ barColor: '#3b82f6', showValue: true, showAxis: false, style: 'solid' }}
        />
      );
      expect(container).toBeTruthy();
    });

    it('displays value when showValue is true', () => {
      render(
        <DataBarRenderer
          value={1234}
          percentage={0.75}
          config={{ barColor: '#3b82f6', showValue: true, showAxis: false, style: 'solid' }}
        />
      );
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('hides value when showValue is false', () => {
      const { container } = render(
        <DataBarRenderer
          value={1234}
          percentage={0.75}
          config={{ barColor: '#3b82f6', showValue: false, showAxis: false, style: 'solid' }}
        />
      );
      expect(container.textContent).toBe('');
    });
  });

  describe('IconSetRenderer', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <IconSetRenderer
          iconIndex={0}
          config={{ type: '3-arrows', reverse: false, showIconOnly: true }}
        />
      );
      expect(container).toBeTruthy();
    });

    it('renders icon with aria-label', () => {
      render(
        <IconSetRenderer
          iconIndex={1}
          config={{ type: '3-arrows', reverse: false, showIconOnly: true }}
        />
      );
      expect(screen.getByLabelText('Rating: 2 of 3')).toBeInTheDocument();
    });
  });

  describe('ColorScaleRenderer', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <ColorScaleRenderer
          interpolatedColor="#ff0000"
          config={{ type: '2-color', minColor: '#00ff00', maxColor: '#ff0000' }}
        />
      );
      expect(container).toBeTruthy();
    });

    it('displays value when provided', () => {
      render(
        <ColorScaleRenderer
          interpolatedColor="#808080"
          config={{ type: '2-color', minColor: '#00ff00', maxColor: '#ff0000' }}
          value={42}
        />
      );
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('VarianceHighlighter', () => {
    it('renders favorable direction', () => {
      render(<VarianceHighlighter value={100} direction="favorable" />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('renders unfavorable direction', () => {
      render(<VarianceHighlighter value={-50} direction="unfavorable" />);
      expect(screen.getByText('-50')).toBeInTheDocument();
    });

    it('renders neutral direction', () => {
      render(<VarianceHighlighter value="N/A" direction="neutral" />);
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('ConditionalCellRenderer', () => {
    it('renders plain value when no evaluation', () => {
      render(<ConditionalCellRenderer value="hello" evaluated={null} />);
      expect(screen.getByText('hello')).toBeInTheDocument();
    });

    it('renders empty string for null value', () => {
      const { container } = render(<ConditionalCellRenderer value={null} evaluated={null} />);
      expect(container.textContent).toBe('');
    });

    it('renders plain value when evaluation did not match', () => {
      render(
        <ConditionalCellRenderer value="test" evaluated={{ matched: false, ruleId: 'test-rule' }} />
      );
      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });
});
