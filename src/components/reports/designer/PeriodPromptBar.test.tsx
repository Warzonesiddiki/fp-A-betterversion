import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PeriodPromptBar } from './PeriodPromptBar';

describe('PeriodPromptBar', () => {
  it('renders without crashing', () => {
    const { container } = render(<PeriodPromptBar />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
