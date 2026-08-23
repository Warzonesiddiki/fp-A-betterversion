/**
 * @vitest-environment jsdom
 *
 * R9-d — jest-axe content-state spec for the five-pillar top navigation.
 * Content states: default (active pillar derived from route) and populated
 * badge counts. Bar: 0 violations per UI-07.
 */

// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PillarNav, PILLARS } from './PillarNav';

expect.extend(toHaveNoViolations);

// matchMedia is unavailable in jsdom; stub it so any hook consumer of
// useReducedMotion or prefers-color-scheme resolves deterministically.
const originalMatchMedia = window.matchMedia;
function mockMatchMedia(prefersReducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? prefersReducedMotion : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function setup(
  props: React.ComponentProps<typeof PillarNav> = {},
  path = '/dashboard'
): ReturnType<typeof render> {
  window.history.pushState({}, '', path);
  return render(<PillarNav {...props} />);
}

describe('PillarNav a11y (axe-core content states)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia(false);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('renders all five pillars with zero axe violations', async () => {
    const { container } = setup();

    expect(screen.getByRole('navigation', { name: 'Pillars' })).toBeInTheDocument();
    for (const pillar of PILLARS) {
      expect(screen.getByTestId(`pillar-${pillar.id}`)).toBeInTheDocument();
    }
    // Roving tabindex: exactly one tab stop inside the landmark.
    const tabbable = container.querySelectorAll('a[data-pillar][tabindex="0"]');
    expect(tabbable).toHaveLength(1);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('keeps the populated badge-count state free of violations', async () => {
    const { container } = setup({ badgeCounts: { admin: 12, plan: 99 } }, '/settings');

    expect(screen.getByTestId('pillar-badge-admin')).toHaveTextContent('12');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
