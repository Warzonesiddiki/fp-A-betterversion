import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/ui/Button', () => ({ Button: () => <button>btn</button> }));
vi.mock('@/components/ui/Input', () => ({ Input: () => <input /> }));
vi.mock('@/engines/EngineRegistry', () => ({
  engineRegistry: {
    getAll: () => [],
    get: () => undefined,
    register: vi.fn(),
  },
}));
vi.mock('@/engines/engineManifest.generated', () => ({
  ENGINE_IDS: [],
  ENGINE_COUNT: 0,
}));

describe('EngineCatalogPage', () => {
  it('renders without crashing', async () => {
    const { default: EngineCatalogPage } = await import('./EngineCatalogPage');
    render(<EngineCatalogPage />);
    expect(screen.getByRole('heading', { level: 1, name: /Engine Catalog/i })).toBeInTheDocument();
  });
});
