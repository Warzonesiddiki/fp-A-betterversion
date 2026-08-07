import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WorkflowDesigner } from './WorkflowDesigner';

describe('WorkflowDesigner', () => {
  it('renders without crashing', () => {
    const { container } = render(<WorkflowDesigner />);
    expect(container).toBeDefined();
  });
});
