// =============================================================================
// StorePerformancePage — axe-core a11y regression (honest-empty state)
// -----------------------------------------------------------------------------
// Real store at factory defaults (no GL postings): the page renders its
// honest-empty branch — h1, disclosure copy (labor-hour and satisfaction
// benchmarks "not invented") and the import CTA. Bar: 0 critical,
// 0 serious (UI-07); moderate findings tolerated.
// =============================================================================

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { axe } from 'jest-axe';
import { useGLStore } from '@/store/glStore';

import StorePerformancePage from './StorePerformancePage';

const expectNoCriticalOrSerious = (results: { violations: Array<{ impact?: string }> }) => {
  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  expect(blocking).toEqual([]);
};

/** Guards against a silent fallback to an unmounted or near-empty render. */
const expectRenderedRealContent = (container: HTMLElement, minElements: number) => {
  const elementCount = container.querySelectorAll('*').length;
  expect(
    elementCount,
    `expected the empty-branch content (>= ${minElements} elements) but rendered ${elementCount}`
  ).toBeGreaterThanOrEqual(minElements);
};

describe('StorePerformancePage a11y (axe-core, honest-empty branch)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [] });
  });

  it('renders no critical or serious violations with no GL data', async () => {
    const { container } = render(<StorePerformancePage />);

    // The honest-empty branch is really on: the h1, the not-invented
    // benchmarks disclosure in the copy, and the import CTA.
    expect(screen.getByRole('heading', { name: /no retail data/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/not invented/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
    // Measured mount size of this branch: icon + h1 + copy + CTA.
    expectRenderedRealContent(container, 5);
    expectNoCriticalOrSerious(await axe(container));
  });
});
