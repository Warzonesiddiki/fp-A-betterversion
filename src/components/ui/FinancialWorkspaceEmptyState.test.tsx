import { describe, expect, it } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { FinancialWorkspaceEmptyState } from './FinancialWorkspaceEmptyState';

describe('FinancialWorkspaceEmptyState', () => {
  it('renders an actionable, ordered finance workspace setup sequence', () => {
    render(
      <FinancialWorkspaceEmptyState
        actions={<button type="button">Import actuals</button>}
        description="Load and validate the financial inputs required for your workspace."
        steps={[
          { title: 'Import actuals', description: 'Load a controlled source file.' },
          { title: 'Set up accounts', description: 'Confirm the reporting hierarchy.' },
        ]}
        title="Set up your finance workspace"
      />
    );

    expect(screen.getByRole('heading', { name: 'Set up your finance workspace' })).toBeVisible();
    expect(screen.getByRole('list', { name: 'Setup steps' })).toHaveTextContent('Import actuals');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Import actuals' })).toBeVisible();
  });
});
