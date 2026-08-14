import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CommentIndicator } from './CommentIndicator';

describe('CommentIndicator', () => {
  it('renders without crashing', () => {
    const { container } = render(<CommentIndicator />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
