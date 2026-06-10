import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ApprovalWorkflow } from './ApprovalWorkflow';

describe('ApprovalWorkflow', () => {
  it('renders without crashing', () => {
    const { container } = render(<ApprovalWorkflow />);
    expect(container).toBeDefined();
  });
});
