import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StepDownConfigPanel } from './StepDownConfigPanel';

describe('StepDownConfigPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<StepDownConfigPanel />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
