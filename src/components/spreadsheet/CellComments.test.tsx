import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CellComments } from './CellComments';

describe('CellComments', () => {
  it('renders without crashing', () => {
    const { container } = render(<CellComments />);
    expect(container).toBeDefined();
  });
});
