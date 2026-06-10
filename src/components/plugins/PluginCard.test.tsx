import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PluginCard } from './PluginCard';

describe('PluginCard', () => {
  it('renders without crashing', () => {
    const { container } = render(<PluginCard />);
    expect(container).toBeDefined();
  });
});
