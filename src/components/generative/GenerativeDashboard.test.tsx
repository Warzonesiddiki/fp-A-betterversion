import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GenerativeDashboard } from './GenerativeDashboard';

vi.mock(import('@json-render/core'), async (importOriginal) => {
  const actual = await importOriginal();
  const passthrough = () => ({});
  return {
    ...actual,
    defineRegistry: passthrough,
    defineRenderers: passthrough,
    defineCatalog: passthrough,
  };
});

describe('GenerativeDashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(<GenerativeDashboard />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
