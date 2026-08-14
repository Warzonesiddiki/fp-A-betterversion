import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChartExportButton } from './ChartExportButton';

describe('ChartExportButton', () => {
  it('renders without crashing', () => {
    const { container } = render(<ChartExportButton />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
