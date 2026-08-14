import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CarbonFootprintTracker } from './CarbonFootprintTracker';

describe('CarbonFootprintTracker', () => {
  it('renders without crashing', () => {
    const { container } = render(<CarbonFootprintTracker />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
