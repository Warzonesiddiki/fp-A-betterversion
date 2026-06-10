import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ColumnMapper } from './ColumnMapper';

describe('ColumnMapper', () => {
  it('renders without crashing', () => {
    const { container } = render(<ColumnMapper />);
    expect(container).toBeDefined();
  });
});
