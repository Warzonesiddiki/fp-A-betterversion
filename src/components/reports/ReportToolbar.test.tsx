import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReportToolbar } from './ReportToolbar';

describe('ReportToolbar', () => {
  it('renders without crashing', () => {
    const { container } = render(<ReportToolbar />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
