import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FindReplaceBar } from './FindReplaceBar';

describe('FindReplaceBar', () => {
  it('renders without crashing', () => {
    const { container } = render(<FindReplaceBar />);
    expect(container).toBeDefined();
  });
});
