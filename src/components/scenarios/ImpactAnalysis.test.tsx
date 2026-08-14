import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ImpactAnalysis } from './ImpactAnalysis';

describe('ImpactAnalysis', () => {
  it('renders without crashing', () => {
    const { container } = render(<ImpactAnalysis />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
