import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DrillBreadcrumb } from './DrillBreadcrumb';

describe('DrillBreadcrumb', () => {
  it('renders a crumb per drill level', () => {
    render(
      <DrillBreadcrumb
        levels={[
          { label: 'Total', filter: null },
          { label: 'Marketing', filter: null },
        ]}
        onNavigate={vi.fn()}
      />
    );
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
  });

  it('renders nothing when there are no levels', () => {
    const { container } = render(<DrillBreadcrumb levels={[]} onNavigate={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });
});
