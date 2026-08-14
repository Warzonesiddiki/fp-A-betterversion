import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReportLeftPanel } from './ReportLeftPanel';

describe('ReportLeftPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<ReportLeftPanel />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
