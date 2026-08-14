import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ConditionalFormatRules } from './ConditionalFormatRules';

describe('ConditionalFormatRules', () => {
  it('renders without crashing', () => {
    const { container } = render(<ConditionalFormatRules />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
