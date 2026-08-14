import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReportResultsPanel } from './ReportResultsPanel';

describe('ReportResultsPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<ReportResultsPanel />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
