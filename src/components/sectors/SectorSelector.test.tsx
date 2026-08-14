import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SectorSelector } from './SectorSelector';

describe('SectorSelector', () => {
  it('renders without crashing', () => {
    const { container } = render(<SectorSelector />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
