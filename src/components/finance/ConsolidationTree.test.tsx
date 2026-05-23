/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConsolidationTree } from './ConsolidationTree';

vi.mock('@/components/ui/EntityTree', () => ({
  EntityTree: () => <div data-testid="entity-tree">EntityTree Mock</div>,
}));

describe('ConsolidationTree', () => {
  it('renders without crashing', () => {
    const { container } = render(<ConsolidationTree />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders EntityTree child component', () => {
    render(<ConsolidationTree />);
    expect(screen.getByTestId('entity-tree')).toBeInTheDocument();
  });

  it('applies container styling classes', () => {
    const { container } = render(<ConsolidationTree />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('p-6');
    expect(wrapper.className).toContain('rounded-xl');
  });
});
