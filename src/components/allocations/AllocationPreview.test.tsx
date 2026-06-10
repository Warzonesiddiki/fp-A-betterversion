import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AllocationPreview } from './AllocationPreview';

describe('AllocationPreview', () => {
  const mockResult = {
    ruleId: 'test-rule',
    allocations: [],
    totalAllocated: 0,
    timestamp: new Date().toISOString(),
    auditComment: 'Test comment',
  };

  it('renders without crashing', () => {
    const { container } = render(<AllocationPreview result={mockResult} />);
    expect(container).toBeDefined();
  });
});
