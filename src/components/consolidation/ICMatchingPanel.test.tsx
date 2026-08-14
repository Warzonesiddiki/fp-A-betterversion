import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ICMatchingPanel } from './ICMatchingPanel';

describe('ICMatchingPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<ICMatchingPanel />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
