import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PluginCard } from './PluginCard';

describe('PluginCard', () => {
  it('renders without crashing', () => {
    const { container } = render(<PluginCard />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
