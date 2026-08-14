import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HedgeManager } from './HedgeManager';

describe('HedgeManager', () => {
  it('renders without crashing', () => {
    const { container } = render(<HedgeManager />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
