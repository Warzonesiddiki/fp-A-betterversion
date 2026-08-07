import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EntityHierarchy } from './EntityHierarchy';

describe('EntityHierarchy', () => {
  it('renders without crashing', () => {
    const { container } = render(<EntityHierarchy />);
    expect(container).toBeDefined();
  });
});
