import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CommentIndicator } from './CommentIndicator';

describe('CommentIndicator', () => {
  it('renders without crashing', () => {
    const { container } = render(<CommentIndicator />);
    expect(container).toBeDefined();
  });
});
