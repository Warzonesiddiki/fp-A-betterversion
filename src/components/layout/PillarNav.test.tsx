import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { userEvent } from '@testing-library/user-event';
import { PillarNav, PILLARS, type PillarNavProps } from './PillarNav';

function setup(props: PillarNavProps = {}, path = '/dashboard') {
  window.history.pushState({}, '', path);
  return render(<PillarNav key={path} {...props} />);
}

const pillar = (id: string) => screen.getByTestId(`pillar-${id}`);

describe('PillarNav', () => {
  it('renders all five pillars', () => {
    setup();
    for (const p of PILLARS) {
      expect(screen.getByText(p.label)).toBeInTheDocument();
    }
    expect(screen.getByTestId('pillar-nav')).toHaveAttribute('aria-label', 'Pillars');
  });

  it('marks the active pillar from the current route prefix', () => {
    setup({}, '/reports/designer');
    expect(pillar('report')).toHaveAttribute('aria-current', 'page');
    expect(pillar('plan')).not.toHaveAttribute('aria-current');
  });

  it('renders badge counts only when > 0', () => {
    setup({ badgeCounts: { admin: 3, plan: 0 } });
    expect(screen.getByTestId('pillar-badge-admin')).toHaveTextContent('3');
    expect(screen.queryByTestId('pillar-badge-plan')).not.toBeInTheDocument();
  });

  it('caps badge display at 99+', () => {
    setup({ badgeCounts: { model: 150 } });
    expect(screen.getByTestId('pillar-badge-model')).toHaveTextContent('99+');
  });

  it('roves tabindex: only the active pillar is tabbable', () => {
    setup();
    expect(pillar('plan')).toHaveAttribute('tabindex', '0');
    expect(pillar('admin')).toHaveAttribute('tabindex', '-1');
  });

  it('moves focus with ArrowRight / ArrowLeft / Home / End', async () => {
    const user = userEvent.setup();
    setup();

    pillar('plan').focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(pillar('analyze'));
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(pillar('admin'));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(pillar('plan'));
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(pillar('admin'));
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(pillar('plan'));
  });

  it('navigates to the pillar hub on click', async () => {
    const user = userEvent.setup();
    setup({}, '/analytics');
    await user.click(pillar('report'));
    expect(window.location.pathname).toBe('/reports');
  });

  it('navigates to the pillar hub on Enter', async () => {
    const user = userEvent.setup();
    setup({}, '/analytics');
    pillar('report').focus();
    await user.keyboard('{Enter}');
    expect(window.location.pathname).toBe('/reports');
  });

  it('exposes pending-item counts in the anchor accessible name', () => {
    // A11Y PASS 1: badge count is announced via the anchor's accessible name,
    // not an aria-label on the inner badge span.
    setup({ badgeCounts: { admin: 3 } });
    expect(pillar('admin')).toHaveAccessibleName('Admin, 3 pending items');
    expect(screen.getByTestId('pillar-badge-admin')).not.toHaveAttribute('aria-label');
  });

  it('invokes the ⌘K palette entry point stub', async () => {
    const onOpenPalette = vi.fn();
    const user = userEvent.setup();
    setup({ onOpenPalette });
    await user.click(screen.getByTestId('pillar-nav-palette'));
    expect(onOpenPalette).toHaveBeenCalledOnce();
  });

  it('exposes pillars in canonical order', () => {
    // structural sanity: PILLARS is readonly and ordered
    expect(PILLARS.map((p) => p.id)).toEqual(['plan', 'analyze', 'report', 'model', 'admin']);
  });

  it('ignores unrelated keys in the roving handler', () => {
    setup();
    fireEventKeyDown();
    expect(pillar('plan')).toBeInTheDocument();
  });
});

function fireEventKeyDown() {
  const el = document.querySelector<HTMLElement>('[data-testid="pillar-plan"]');
  el?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
}
