import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ConsolidationWorksheet } from './ConsolidationWorksheet';

describe('ConsolidationWorksheet', () => {
  it('renders without crashing', () => {
    const { container } = render(<ConsolidationWorksheet />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
