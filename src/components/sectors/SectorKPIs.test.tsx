import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SectorKPIs } from './SectorKPIs';

describe('SectorKPIs', () => {
  it('renders without crashing', () => {
    const { container } = render(<SectorKPIs />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
