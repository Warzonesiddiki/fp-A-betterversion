import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VarianceCommentaryPanel } from './VarianceCommentaryPanel';

describe('VarianceCommentaryPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<VarianceCommentaryPanel />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
