import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CellEditor } from './CellEditor';

describe('CellEditor', () => {
  it('renders without crashing', () => {
    const { container } = render(<CellEditor />);
    expect(container).toBeDefined();
  });
});
