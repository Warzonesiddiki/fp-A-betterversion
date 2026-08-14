import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FinPlanGrid } from './FinPlanGrid';

describe('FinPlanGrid', () => {
  it('renders without crashing', () => {
    const { container } = render(<FinPlanGrid columns={[]} rows={[]} />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
