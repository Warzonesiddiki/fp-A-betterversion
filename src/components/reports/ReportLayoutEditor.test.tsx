import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReportLayoutEditor } from './ReportLayoutEditor';

describe('ReportLayoutEditor', () => {
  it('renders without crashing', () => {
    const { container } = render(<ReportLayoutEditor />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
