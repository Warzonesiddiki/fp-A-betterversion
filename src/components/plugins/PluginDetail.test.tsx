import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PluginDetail } from './PluginDetail';

describe('PluginDetail', () => {
  it('renders without crashing', () => {
    const { container } = render(<PluginDetail />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
