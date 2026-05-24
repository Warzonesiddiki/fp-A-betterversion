import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { DrillThroughBreadcrumb } from './DrillThroughBreadcrumb';
import type { DrillBreadcrumb } from '@/engines/DrillThroughEngine';

const mockPath: DrillBreadcrumb[] = [
  { level: 'summary', label: 'North America', context: { cellValue: 5000 } },
  { level: 'detail', label: 'USA — Jan', context: { cellValue: 2000 } },
];

describe('DrillThroughBreadcrumb', () => {
  it('renders all breadcrumb items', () => {
    render(<DrillThroughBreadcrumb path={mockPath} onNavigate={vi.fn()} />);
    expect(screen.getByText('North America')).toBeInTheDocument();
    expect(screen.getByText('USA — Jan')).toBeInTheDocument();
  });

  it('calls onNavigate with correct level when non-last breadcrumb clicked', () => {
    const onNavigate = vi.fn();
    render(<DrillThroughBreadcrumb path={mockPath} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('North America'));
    expect(onNavigate).toHaveBeenCalledWith('summary');
  });

  it('does not call onNavigate when last breadcrumb clicked (disabled)', () => {
    const onNavigate = vi.fn();
    render(<DrillThroughBreadcrumb path={mockPath} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('USA — Jan'));
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('renders separator between items', () => {
    render(<DrillThroughBreadcrumb path={mockPath} onNavigate={vi.fn()} />);
    const nav = screen.getByRole('navigation');
    expect(nav.innerHTML).toContain('›');
  });

  it('returns null for empty path', () => {
    const { container } = render(<DrillThroughBreadcrumb path={[]} onNavigate={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });
});
