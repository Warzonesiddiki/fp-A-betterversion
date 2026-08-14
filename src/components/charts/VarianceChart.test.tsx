import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VarianceChart } from './VarianceChart';

describe('VarianceChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<VarianceChart />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
