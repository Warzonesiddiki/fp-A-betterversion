import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChartShowcasePage } from './ChartShowcasePage';

describe('ChartShowcasePage', () => {
  it('renders without crashing', () => {
    const { container } = render(<ChartShowcasePage />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
