/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CommentThread } from './CommentThread';

describe('CommentThread', () => {
  it('renders without crashing', () => {
    const { container } = render(<CommentThread />);
    expect(container).toBeDefined();
  });
});
