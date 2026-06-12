/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="mock-icon" />,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

import { render, screen } from '@/test/testUtils';
import { AddDriverForm, INITIAL_FORM } from '@/pages/forecasts/AddDriverForm';

describe('AddDriverForm', () => {
  const defaultProps = {
    form: { ...INITIAL_FORM },
    onFormChange: vi.fn(),
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with title', () => {
    render(<AddDriverForm {...defaultProps} />);
    expect(screen.getByText(/Add New Driver/i)).toBeInTheDocument();
  });

  it('renders all form fields with empty defaults', () => {
    render(<AddDriverForm {...defaultProps} />);
    expect(screen.getByLabelText(/Driver Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Unit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Base/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Min/i)).toBeInTheDocument();
  });

  it('disables submit when name is empty', () => {
    render(<AddDriverForm {...defaultProps} />);
    expect(screen.getByText(/Add Driver/i).closest('button')).toBeDisabled();
  });
});
