/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BoardPackBuilder } from './BoardPackBuilder';

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) => (
    <button className={className} {...props}>{children}</button>
  ),
}));

describe('BoardPackBuilder', () => {
  it('renders without crashing', () => {
    render(<BoardPackBuilder />);
  });

  it('renders the Sections heading', () => {
    render(<BoardPackBuilder />);
    expect(screen.getByText('Sections')).toBeInTheDocument();
  });

  it('renders all default section names', () => {
    render(<BoardPackBuilder />);
    // "Executive Summary" appears both as section card and preview h1
    expect(screen.getAllByText('Executive Summary').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('P&L Statement')).toBeInTheDocument();
    expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
    expect(screen.getByText('Cash Flow')).toBeInTheDocument();
    expect(screen.getByText('Variance Analysis')).toBeInTheDocument();
  });

  it('renders the Generate PDF button', () => {
    render(<BoardPackBuilder />);
    expect(screen.getByRole('button', { name: /generate pdf/i })).toBeInTheDocument();
  });

  it('renders the preview area with h1 heading', () => {
    render(<BoardPackBuilder />);
    expect(screen.getByText('Executive Summary', { selector: 'h1' })).toBeInTheDocument();
  });

  it('renders five section cards', () => {
    render(<BoardPackBuilder />);
    const cards = screen.getAllByTestId('card');
    expect(cards.length).toBeGreaterThanOrEqual(5);
  });
});
