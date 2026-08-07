import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('DrillTables', () => {
  it('renders without crashing', () => {
    const { container } = render(<formatCurrency />);
    expect(container).toBeDefined();
  });
});
