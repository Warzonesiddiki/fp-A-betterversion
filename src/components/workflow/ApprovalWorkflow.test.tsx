import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ApprovalWorkflow } from './ApprovalWorkflow';

describe('ApprovalWorkflow', () => {
  it('renders without crashing', () => {
    const { container } = render(<ApprovalWorkflow />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
