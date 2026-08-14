import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReciprocalConfigPanel } from './ReciprocalConfigPanel';

describe('ReciprocalConfigPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<ReciprocalConfigPanel />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
