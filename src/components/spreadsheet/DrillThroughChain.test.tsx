import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DrillThroughChain } from './DrillThroughChain';

describe('DrillThroughChain', () => {
  it('renders without crashing', () => {
    const { container } = render(<DrillThroughChain />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
