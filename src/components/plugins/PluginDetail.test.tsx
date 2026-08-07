import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PluginDetail } from './PluginDetail';

describe('PluginDetail', () => {
  it('renders without crashing', () => {
    const { container } = render(<PluginDetail />);
    expect(container).toBeDefined();
  });
});
