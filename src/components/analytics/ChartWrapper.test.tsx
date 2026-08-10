/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChartWrapper } from './ChartWrapper';

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, title, ...props }: React.ComponentProps<'button'>) => (
    <button onClick={onClick} title={title} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: ({
    width,
    height,
    variant,
  }: {
    width?: string | number;
    height?: string | number;
    variant?: string;
  }) => <div data-testid="skeleton" data-variant={variant} style={{ width, height }} />,
}));

describe('ChartWrapper', () => {
  it('renders without crashing', () => {
    render(
      <ChartWrapper title="Test Chart">
        <div>Chart content</div>
      </ChartWrapper>
    );
    expect(screen.getByText('Test Chart')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(
      <ChartWrapper title="Revenue Chart">
        <div>content</div>
      </ChartWrapper>
    );
    expect(screen.getByText('Revenue Chart')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <ChartWrapper title="Revenue" subtitle="Monthly breakdown">
        <div>content</div>
      </ChartWrapper>
    );
    expect(screen.getByText('Monthly breakdown')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(
      <ChartWrapper title="Revenue">
        <div>content</div>
      </ChartWrapper>
    );
    expect(screen.queryByText('Monthly breakdown')).not.toBeInTheDocument();
  });

  it('renders children when not loading, no error, not empty', () => {
    render(
      <ChartWrapper title="Chart">
        <div>Chart content</div>
      </ChartWrapper>
    );
    expect(screen.getByText('Chart content')).toBeInTheDocument();
  });

  it('renders loading skeleton when loading is true', () => {
    render(
      <ChartWrapper title="Chart" loading>
        <div>Chart content</div>
      </ChartWrapper>
    );
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Chart content')).not.toBeInTheDocument();
  });

  it('renders error message when error prop is set', () => {
    render(
      <ChartWrapper title="Chart" error="Failed to load data">
        <div>Chart content</div>
      </ChartWrapper>
    );
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.queryByText('Chart content')).not.toBeInTheDocument();
  });

  it('renders retry button when error and onRetry are provided', () => {
    const onRetry = vi.fn();
    render(
      <ChartWrapper title="Chart" error="Error" onRetry={onRetry}>
        <div>content</div>
      </ChartWrapper>
    );
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(
      <ChartWrapper title="Chart" error="Error" onRetry={onRetry}>
        <div>content</div>
      </ChartWrapper>
    );
    fireEvent.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when no onRetry', () => {
    render(
      <ChartWrapper title="Chart" error="Error">
        <div>content</div>
      </ChartWrapper>
    );
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  it('renders empty state when empty is true', () => {
    render(
      <ChartWrapper title="Chart" empty>
        <div>Chart content</div>
      </ChartWrapper>
    );
    expect(screen.getByText('No data available for this period')).toBeInTheDocument();
    expect(screen.queryByText('Chart content')).not.toBeInTheDocument();
  });

  it('does not show empty state when loading', () => {
    render(
      <ChartWrapper title="Chart" empty loading>
        <div>content</div>
      </ChartWrapper>
    );
    expect(screen.queryByText('No data available for this period')).not.toBeInTheDocument();
  });

  it('renders export button when exportable is true', () => {
    render(
      <ChartWrapper title="Chart" exportable>
        <div>content</div>
      </ChartWrapper>
    );
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('does not render export button when exportable is false', () => {
    render(
      <ChartWrapper title="Chart">
        <div>content</div>
      </ChartWrapper>
    );
    expect(screen.queryByText('Export')).not.toBeInTheDocument();
  });

  it('calls onExport when export button is clicked', () => {
    const onExport = vi.fn();
    render(
      <ChartWrapper title="Chart" exportable onExport={onExport}>
        <div>content</div>
      </ChartWrapper>
    );
    fireEvent.click(screen.getByText('Export'));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('hides children when error is present', () => {
    render(
      <ChartWrapper title="Chart" error="Some error">
        <div>Hidden content</div>
      </ChartWrapper>
    );
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('prioritizes loading over empty state', () => {
    render(
      <ChartWrapper title="Chart" loading empty>
        <div>content</div>
      </ChartWrapper>
    );
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.queryByText('No data available for this period')).not.toBeInTheDocument();
  });

  it('prioritizes error over empty state', () => {
    render(
      <ChartWrapper title="Chart" error="Error" empty>
        <div>content</div>
      </ChartWrapper>
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.queryByText('No data available for this period')).not.toBeInTheDocument();
  });

  it('renders the title as h3 by default for backward compatibility', () => {
    render(
      <ChartWrapper title="Default Level">
        <div>content</div>
      </ChartWrapper>
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Default Level' })).toBeInTheDocument();
  });

  it('renders the title as h2 when headingLevel="h2" is set', () => {
    render(
      <ChartWrapper title="Section Level" headingLevel="h2">
        <div>content</div>
      </ChartWrapper>
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Section Level' })).toBeInTheDocument();
  });
});
