import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScenarioMerge } from './ScenarioMerge';

describe('ScenarioMerge', () => {
  it('renders without crashing', () => {
    const { container } = render(<ScenarioMerge />);
    expect(container).toBeDefined();
  });
});
