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
    ShieldCheck: makeIcon(),
    ShieldAlert: makeIcon(),
    Database: makeIcon(),
    Clock: makeIcon(),
    ChevronRight: makeIcon(),
  };
});

import { SystemHealthMonitor } from '@/components/ui/SystemHealthMonitor';

describe('SystemHealthMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when online', () => {
    const { container } = render(<SystemHealthMonitor isOnline={true} />);
    expect(container).toBeTruthy();
  });

  it('renders without crashing when offline', () => {
    const { container } = render(<SystemHealthMonitor isOnline={false} />);
    expect(container).toBeTruthy();
  });

  it('displays "System Healthy" when online', () => {
    render(<SystemHealthMonitor isOnline={true} />);
    expect(screen.getByText('System Healthy')).toBeInTheDocument();
  });

  it('displays "System Offline" when offline', () => {
    render(<SystemHealthMonitor isOnline={false} />);
    expect(screen.getByText('System Offline')).toBeInTheDocument();
  });

  it('displays DB storage when dbSize is provided', () => {
    render(<SystemHealthMonitor isOnline={true} dbSize={1048576} />);
    expect(screen.getByText('DB Storage')).toBeInTheDocument();
    expect(screen.getByText('1 MB')).toBeInTheDocument();
  });

  it('displays last backup when provided', () => {
    render(<SystemHealthMonitor isOnline={true} lastBackup="2 hours ago" />);
    expect(screen.getByText('Last Sync')).toBeInTheDocument();
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });

  it('renders all info together', () => {
    render(<SystemHealthMonitor isOnline={true} dbSize={5242880} lastBackup="5 min ago" />);
    expect(screen.getByText('System Healthy')).toBeInTheDocument();
    expect(screen.getByText('DB Storage')).toBeInTheDocument();
    expect(screen.getByText('Last Sync')).toBeInTheDocument();
  });
});
