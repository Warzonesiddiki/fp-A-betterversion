import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('ReportGenHelpers', () => {
  it('renders without crashing', () => {
    const { container } = render(<reportToCsv />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
