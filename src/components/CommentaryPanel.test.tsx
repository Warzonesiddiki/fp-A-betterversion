import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CommentaryPanel } from './CommentaryPanel';

describe('CommentaryPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<CommentaryPanel />);
    expect(container).toBeDefined();
  });
});
