import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CSRDReportGenerator } from './CSRDReportGenerator';

describe('CSRDReportGenerator', () => {
  it('renders without crashing', () => {
    const { container } = render(<CSRDReportGenerator />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
