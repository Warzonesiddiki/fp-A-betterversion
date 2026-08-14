import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReportProgress } from './ReportProgress';

describe('ReportProgress', () => {
  it('renders without crashing', () => {
    const { container } = render(<ReportProgress />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
