/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AllocationAuditTrail } from './AllocationAuditTrail';

describe('AllocationAuditTrail', () => {
  it('renders without crashing', () => {
    const { container } = render(<AllocationAuditTrail entries={[]} />);
    expect(container).toBeDefined();
  });
});
