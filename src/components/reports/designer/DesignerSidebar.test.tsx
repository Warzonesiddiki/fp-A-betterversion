import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DesignerSidebar } from './DesignerSidebar';

describe('DesignerSidebar', () => {
  it('renders without crashing', () => {
    const { container } = render(<DesignerSidebar />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
