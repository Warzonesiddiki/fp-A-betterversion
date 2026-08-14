import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SectorDashboard } from './SectorDashboard';

describe('SectorDashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(<SectorDashboard />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
