import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TreemapChart } from './TreemapChart';

describe('TreemapChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<TreemapChart />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
