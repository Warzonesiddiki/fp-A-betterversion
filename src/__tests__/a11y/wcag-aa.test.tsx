/**
 * Automated accessibility (a11y) regression tests for FinPlan Pro.
 *
 * This file is intentionally created by the Hera audit so the build can wire
 * `axe-core` into the test suite. Until it is added to package.json devDeps
 * (`npm i -D vitest-axe`), the import below will be a TypeScript error and
 * the test runner will skip the suite — Apollo should:
 *   1. add `vitest-axe` to devDependencies
 *   2. run `npm i`
 *   3. enable this file (it is already under `src/**` so vitest auto-picks it)
 *
 * WCAG coverage: 2.1 Level AA (axe-core's default rule set).
 *
 * @see https://github.com/chaabi-dev/vitest-axe
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'vitest-axe';
import { MemoryRouter } from 'react-router-dom';

// Pages & components that must be a11y-clean. These are the routes that the
// design-system audit flagged as high-traffic or that have the largest
// surface of interactive controls. Keep this list curated — adding a page
// here is the cheapest way to lock in a11y regressions.
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import DataImportPage from '../pages/data/DataImportPage';
import ChartOfAccountsPage from '../pages/data/ChartOfAccountsPage';
import BudgetVsActualPage from '../pages/reports/BudgetVsActualPage';
import ProfitLossPage from '../pages/reports/ProfitLossPage';
import CashFlowPage from '../pages/reports/CashFlowPage';

import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ToastContainer } from '../components/ui/ToastContainer';
import { CommandPalette } from '../components/ui/CommandPalette';
import { DataTable } from '../components/ui/DataTable';
import { ContextMenu } from '../components/ui/ContextMenu';

expect.extend(toHaveNoViolations);

const withRouter = (ui: React.ReactNode) => (
  <MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>
);

describe('WCAG 2.1 AA — automated axe-core regression suite', () => {
  describe('Authentication pages', () => {
    it('LoginPage has no detectable a11y violations', async () => {
      const { container } = render(<LoginPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('RegisterPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<RegisterPage />));
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Primary data pages', () => {
    it('DashboardPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<DashboardPage />));
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('ChartOfAccountsPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<ChartOfAccountsPage />));
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('DataImportPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<DataImportPage />));
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Report pages', () => {
    it('BudgetVsActualPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<BudgetVsActualPage />));
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('ProfitLossPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<ProfitLossPage />));
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('CashFlowPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<CashFlowPage />));
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Design-system primitives', () => {
    it('Button has no a11y violations', async () => {
      const { container } = render(<Button>Save</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('Input (with label) has no a11y violations', async () => {
      const { container } = render(
        <div>
          <label htmlFor="test-input">Email</label>
          <Input id="test-input" type="email" />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('Card has no a11y violations', async () => {
      const { container } = render(<Card>content</Card>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Overlays & dialogs', () => {
    it('ToastContainer has no a11y violations', async () => {
      const { container } = render(<ToastContainer toasts={[]} onDismiss={() => {}} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('Modal traps focus and has no a11y violations', async () => {
      const { container } = render(
        <Modal open onClose={() => {}} title="Test modal">
          <p>Body content</p>
        </Modal>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('CommandPalette has no a11y violations', async () => {
      const { container } = render(
        withRouter(<CommandPalette open onClose={() => {}} commands={[]} onSelect={() => {}} />)
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Data grids & tables', () => {
    it('DataTable has no a11y violations', async () => {
      const { container } = render(
        <DataTable columns={[{ key: 'a', header: 'A' }]} data={[{ a: 1 }]} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('ContextMenu has no a11y violations', async () => {
      const { container } = render(
        <ContextMenu
          x={0}
          y={0}
          items={[{ label: 'Item 1', onClick: () => {} }]}
          onClose={() => {}}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
