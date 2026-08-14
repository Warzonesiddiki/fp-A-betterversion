import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FXRateManager } from './FXRateManager';

describe('FXRateManager', () => {
  it('renders without crashing', () => {
    const { container } = render(<FXRateManager />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
