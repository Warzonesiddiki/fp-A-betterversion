import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AllocationRuleBuilder } from './AllocationRuleBuilder';

describe('AllocationRuleBuilder', () => {
  it('renders without crashing', () => {
    const { container } = render(<AllocationRuleBuilder />);
    expect(container).toBeDefined();
  });
});
