import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WorkflowDesigner } from './WorkflowDesigner';

describe('WorkflowDesigner', () => {
  it('renders without crashing', () => {
    const { container } = render(<WorkflowDesigner />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
