import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportMenu } from './ExportMenu';

vi.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Trigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    <>{children}</>
  ),
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Content: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="dropdown-content" {...props}>
      {children}
    </div>
  ),
  Item: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <div data-testid="dropdown-item" onClick={onClick} {...props}>
      {children}
    </div>
  ),
  Separator: () => <div data-testid="dropdown-separator" />,
}));

describe('ExportMenu', () => {
  it('renders export button with default label', () => {
    render(<ExportMenu onExport={() => {}} />);
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<ExportMenu onExport={() => {}} label="Download Report" />);
    expect(screen.getByText('Download Report')).toBeInTheDocument();
  });

  it('button is disabled when disabled prop is true', () => {
    render(<ExportMenu onExport={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows dropdown options when clicked', () => {
    render(<ExportMenu onExport={() => {}} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Excel (.xlsx)')).toBeInTheDocument();
    expect(screen.getByText('PDF Document')).toBeInTheDocument();
    expect(screen.getByText('CSV (Data Only)')).toBeInTheDocument();
  });

  it('shows format header when open', () => {
    render(<ExportMenu onExport={() => {}} />);
    expect(screen.getByText('Choose Format')).toBeInTheDocument();
  });

  it('calls onExport with "excel" when Excel is clicked', () => {
    const onExport = vi.fn();
    render(<ExportMenu onExport={onExport} />);
    fireEvent.click(screen.getByText('Excel (.xlsx)'));
    expect(onExport).toHaveBeenCalledWith('excel');
  });

  it('calls onExport with "pdf" when PDF is clicked', () => {
    const onExport = vi.fn();
    render(<ExportMenu onExport={onExport} />);
    fireEvent.click(screen.getByText('PDF Document'));
    expect(onExport).toHaveBeenCalledWith('pdf');
  });

  it('calls onExport with "csv" when CSV is clicked', () => {
    const onExport = vi.fn();
    render(<ExportMenu onExport={onExport} />);
    fireEvent.click(screen.getByText('CSV (Data Only)'));
    expect(onExport).toHaveBeenCalledWith('csv');
  });

  it('renders deterministic export protocol text', () => {
    render(<ExportMenu onExport={() => {}} />);
    expect(screen.getByText('Deterministic Export Protocol v3.1')).toBeInTheDocument();
  });
});
