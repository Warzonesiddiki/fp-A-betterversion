import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AboutDialog } from './AboutDialog';

describe('AboutDialog', () => {
  it('renders without crashing', () => {
    const { container } = render(<AboutDialog isOpen={true} onClose={() => {}} />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
