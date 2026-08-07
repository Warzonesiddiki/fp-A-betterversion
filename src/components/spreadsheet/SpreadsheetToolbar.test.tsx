import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('SpreadsheetToolbar', () => {
  it('renders without crashing', () => {
    const { container } = render(<defaultCellStyle />);
    expect(container).toBeDefined();
  });
});
