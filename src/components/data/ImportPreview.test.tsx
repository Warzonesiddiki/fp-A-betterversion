import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ImportPreview } from './ImportPreview';

describe('ImportPreview', () => {
  it('renders without crashing', () => {
    const { container } = render(<ImportPreview />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
