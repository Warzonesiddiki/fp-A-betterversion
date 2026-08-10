import { describe, expect, it } from 'vitest';
import { render } from '@/test/testUtils';
import { FinancialStatusBadge } from './FinancialStatusBadge';
import { FinancialWorkspaceEmptyState } from './FinancialWorkspaceEmptyState';
import { PageHeader } from './PageHeader';
import { FinancialContextBar } from '@/components/layout/FinancialContextBar';
import { useFinancialContextStore } from '@/store/financialContextStore';
import { DEFAULT_FINANCIAL_CONTEXT } from '@/types/financialContext';

/**
 * Browser screenshot baselines remain the final visual gate. This deterministic
 * DOM/class contract is an interim regression signal for environments that
 * cannot provision a Playwright browser; it intentionally does not claim to
 * validate rendered pixels, fonts, or responsive layout.
 */
describe('Atlas foundation visual structure contract', () => {
  it('preserves the canonical finance workspace hierarchy and state semantics', () => {
    const { container } = render(
      <main className="fp-page">
        <PageHeader
          actions={<button type="button">Import actuals</button>}
          purpose="Review financial data and complete the next safe action."
          status={<FinancialStatusBadge detail="Local workspace data" status="draft" />}
          title="Executive Dashboard"
        />
        <FinancialWorkspaceEmptyState
          actions={<button type="button">Set up accounts</button>}
          description="Load and validate financial inputs before planning and reporting."
          steps={[
            { title: 'Import actuals', description: 'Load a controlled financial source.' },
            { title: 'Confirm reporting accounts', description: 'Verify the reporting hierarchy.' },
          ]}
          title="Set up your finance workspace"
        />
      </main>
    );

    expect(container).toMatchSnapshot();
  });

  it('preserves the financial context bar hierarchy and trust semantics (F-03)', () => {
    useFinancialContextStore.setState({ context: DEFAULT_FINANCIAL_CONTEXT });
    const { container } = render(
      <main className="fp-page">
        <FinancialContextBar
          entities={[
            { id: 'ent-1', label: 'US Parent', currency: 'USD' },
            { id: 'ent-2', label: 'UK Subsidiary', currency: 'GBP' },
          ]}
          versions={[{ id: 'v-2026', label: '2026 Plan' }]}
        />
        <PageHeader
          actions={<button type="button">Import</button>}
          purpose="Workspace data is a local draft until a server-authorized context exists."
          status={<FinancialStatusBadge detail="Local workspace data" status="draft" />}
          title="Executive Dashboard"
        />
      </main>
    );

    expect(container).toMatchSnapshot();
  });

  it('keeps trust-state semantics structural: text + role + data attribute, never color-only', () => {
    const { container } = render(
      <FinancialStatusBadge detail="Local workspace data" status="draft" />
    );

    const badge = container.querySelector('[data-financial-status="draft"]');
    expect(badge).not.toBeNull();
    expect(badge!.getAttribute('role')).toBe('status');
    expect(badge!.getAttribute('class')).toContain('fp-financial-status--draft');
    expect(badge!.textContent).toContain('Draft');
    expect(badge!.textContent).toContain('Local workspace data');
    // The accessible name carries the consequence, not just the label.
    expect(badge!.getAttribute('aria-label')).toContain('Draft; not published');
  });

  it('keeps the context bar freshness text explicit when no sync state exists', () => {
    useFinancialContextStore.setState({ context: DEFAULT_FINANCIAL_CONTEXT });
    const { container } = render(<FinancialContextBar entities={[]} />);

    expect(container.textContent).toContain('Freshness unknown');
    expect(container.textContent).toContain('Draft');
    expect(container.textContent).toContain('Local workspace data');
  });
});
