import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScenarioComparison } from './ScenarioComparison';

describe('ScenarioComparison', () => {
  it('renders without crashing', () => {
    const { container } = render(<ScenarioComparison />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
