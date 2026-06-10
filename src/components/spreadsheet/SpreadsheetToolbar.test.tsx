import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { defaultCellStyle, SpreadsheetToolbar } from './SpreadsheetToolbar';

describe('SpreadsheetToolbar', () => {
  it('renders without crashing', () => {
    const { container } = render(<defaultCellStyle />);
    expect(container).toBeDefined();
  });
});
