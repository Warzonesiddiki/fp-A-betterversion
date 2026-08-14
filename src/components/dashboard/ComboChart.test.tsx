import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ComboChart } from './ComboChart';

describe('ComboChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<ComboChart />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
