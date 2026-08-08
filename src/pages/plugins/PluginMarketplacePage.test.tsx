import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockPlugins = [
  {
    id: 'p1',
    name: 'Test Plugin',
    description: 'A test plugin',
    category: 'engine',
    author: 'author',
    version: '1.0.0',
    rating: 4.5,
    downloads: 100,
    installed: false,
    verified: true,
    createdAt: Date.now(),
    tags: ['test'],
  },
];

vi.mock('@/plugins/PluginMarketplace', () => ({
  PluginMarketplace: {
    fetchPlugins: vi.fn().mockResolvedValue(mockPlugins),
    browse: vi.fn().mockResolvedValue(mockPlugins),
    install: vi.fn(),
    uninstall: vi.fn(),
  },
}));
class MockRegistry {
  getInstalledPlugins() {
    return [];
  }
  install() {}
  uninstall() {}
  register() {}
}
vi.mock('@/plugins/PluginRegistry', () => ({
  PluginRegistry: MockRegistry,
}));
vi.mock('@/components/plugins/PluginCard', () => ({
  PluginCard: ({ plugin }: { plugin: { name: string } }) => (
    <div data-testid="plugin-card">{plugin.name}</div>
  ),
}));
vi.mock('@/components/plugins/PluginDetail', () => ({
  PluginDetail: () => <div data-testid="plugin-detail">PluginDetail</div>,
}));

describe('PluginMarketplacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and loads plugins', async () => {
    const { default: PluginMarketplacePage } = await import('./PluginMarketplacePage');
    render(<PluginMarketplacePage />);
    expect(screen.getByText(/marketplace/i)).toBeInTheDocument();
    await waitFor(() => screen.getByTestId('plugin-card'));
    expect(screen.getByTestId('plugin-card')).toHaveTextContent('Test Plugin');
  });
});
