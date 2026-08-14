import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AllocationAuditTrail } from './AllocationAuditTrail';

describe('AllocationAuditTrail', () => {
  it('renders without crashing', () => {
    const { container } = render(<AllocationAuditTrail entries={[]} />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
