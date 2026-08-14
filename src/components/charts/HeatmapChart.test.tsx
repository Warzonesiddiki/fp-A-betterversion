import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeatmapChart } from './HeatmapChart';

describe('HeatmapChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<HeatmapChart />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
