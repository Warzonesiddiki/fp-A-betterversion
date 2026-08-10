import { describe, expect, it } from 'vitest';
import { render } from '@/test/testUtils';
import { FinancialStatusBadge } from './FinancialStatusBadge';
import { FinancialWorkspaceEmptyState } from './FinancialWorkspaceEmptyState';
import { PageHeader } from './PageHeader';

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
});
