import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EntityHierarchy } from './EntityHierarchy';

describe('EntityHierarchy', () => {
  it('renders without crashing', () => {
    const { container } = render(<EntityHierarchy />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
