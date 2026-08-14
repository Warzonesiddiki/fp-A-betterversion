import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FindReplaceBar } from './FindReplaceBar';

describe('FindReplaceBar', () => {
  it('renders without crashing', () => {
    const { container } = render(<FindReplaceBar />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
