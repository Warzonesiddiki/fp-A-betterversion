import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    FlaskConical: makeIcon(),
    ChevronRight: makeIcon(),
  };
});

import { SandboxMode } from '@/components/ui/SandboxMode';

describe('SandboxMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when inactive', () => {
    const { container } = render(<SandboxMode isActive={false} onToggle={() => {}} />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders without crashing when active', () => {
    const { container } = render(<SandboxMode isActive={true} onToggle={() => {}} />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });

  it('shows "Sandbox Mode" button when inactive', () => {
    render(<SandboxMode isActive={false} onToggle={() => {}} />);
    expect(screen.getByText('Sandbox Mode')).toBeInTheDocument();
  });

  it('shows active banner when active', () => {
    render(<SandboxMode isActive={true} onToggle={() => {}} />);
    expect(screen.getByText('Sandbox Mode Active')).toBeInTheDocument();
  });

  it('shows "Exit Sandbox" button when active', () => {
    render(<SandboxMode isActive={true} onToggle={() => {}} />);
    expect(screen.getByText('Exit Sandbox')).toBeInTheDocument();
  });

  it('calls onToggle when inactive button is clicked', () => {
    const onToggle = vi.fn();
    render(<SandboxMode isActive={false} onToggle={onToggle} />);
    screen.getByText('Sandbox Mode').click();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onToggle when exit button is clicked', () => {
    const onToggle = vi.fn();
    render(<SandboxMode isActive={true} onToggle={onToggle} />);
    screen.getByText('Exit Sandbox').click();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
