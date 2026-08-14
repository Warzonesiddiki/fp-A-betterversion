import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScenarioMerge } from './ScenarioMerge';

describe('ScenarioMerge', () => {
  it('renders without crashing', () => {
    const { container } = render(<ScenarioMerge />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
