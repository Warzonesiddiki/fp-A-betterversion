/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DurabilityBanner } from './DurabilityBanner';

expect.extend(toHaveNoViolations);

describe('DurabilityBanner (W0.8.5)', () => {
  it('states that the ledger is local-only and that clearing site data destroys it', () => {
    render(<DurabilityBanner />);
    const banner = screen.getByTestId('durability-banner');
    expect(banner).toHaveAttribute('role', 'status');
    expect(banner.textContent).toMatch(/local only/i);
    expect(banner.textContent).toMatch(/clearing site data/i);
    expect(banner.textContent).toMatch(/not a backup/i);
    expect(banner.textContent).not.toMatch(/saved to the cloud/i);
    expect(banner.textContent).not.toMatch(/backed up/i);
  });

  it('is not colour-only: text carries the warning without relying on hue', () => {
    render(<DurabilityBanner />);
    expect(screen.getByText(/Draft workspace/i)).toBeTruthy();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<DurabilityBanner />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
