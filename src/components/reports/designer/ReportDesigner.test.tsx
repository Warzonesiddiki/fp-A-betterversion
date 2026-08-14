import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReportDesigner } from './ReportDesigner';

describe('ReportDesigner', () => {
  it('renders without crashing', () => {
    const { container } = render(<ReportDesigner />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
