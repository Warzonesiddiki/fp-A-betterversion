import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SummaryTable } from './DrillTables';

describe('DrillTables', () => {
  it('renders without crashing', () => {
    const { container } = render(<SummaryTable data={[]} onSelect={vi.fn()} />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
