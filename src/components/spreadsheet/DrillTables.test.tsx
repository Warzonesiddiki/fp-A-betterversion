/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { formatCurrency, SummaryTable, DetailTable, JournalEntryTable } from './DrillTables';

describe('DrillTables', () => {
  it('renders without crashing', () => {
    const { container } = render(<formatCurrency />);
    expect(container).toBeDefined();
  });
});
