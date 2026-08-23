// =============================================================================
// ChurnDashboard — axe-core a11y regression (honest-empty disclosure state)
// -----------------------------------------------------------------------------
// Real store at factory defaults (no GL postings): the zero-number disclosure
// workspace renders — page h1, the EmptyState explaining that churn needs a
// customer-level feed, and the import CTA. Bar: 0 critical, 0 serious
// (UI-07); moderate findings tolerated.
// =============================================================================

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { axe } from 'jest-axe';
import { useGLStore } from '@/store/glStore';

import ChurnDashboard from './ChurnDashboard';

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

describe('ChurnDashboard a11y (axe-core, honest-empty branch)', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [] });
  });

  it('renders no critical or serious violations with no GL data', async () => {
    const { container } = render(<ChurnDashboard />);

    // The zero-number workspace is really on: page h1, the "No SaaS Data"
    // EmptyState with its subscription-feed disclosure, and the CTA.
    expect(screen.getByRole('heading', { name: /churn dashboard/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/no saas data/i)).toBeInTheDocument();
    expect(screen.getByText(/subscription-management feed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
    // Measured mount size of this branch: h1 header block + EmptyState + CTA.
    expectRenderedRealContent(container, 10);
    expectNoCriticalOrSerious(await axe(container));
  });
});
