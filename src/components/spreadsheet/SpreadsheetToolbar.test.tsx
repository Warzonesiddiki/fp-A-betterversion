import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SpreadsheetToolbar, defaultCellStyle } from './SpreadsheetToolbar';

describe('SpreadsheetToolbar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <SpreadsheetToolbar style={defaultCellStyle} onStyleChange={vi.fn()} />
    );
    expect(container).toBeDefined();
  });
});
