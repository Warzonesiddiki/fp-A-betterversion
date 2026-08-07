import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AllocationAuditTrail } from './AllocationAuditTrail';

describe('AllocationAuditTrail', () => {
  it('renders without crashing', () => {
    const { container } = render(<AllocationAuditTrail entries={[]} />);
    expect(container).toBeDefined();
  });
});
