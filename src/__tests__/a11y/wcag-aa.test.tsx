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
import { axe } from 'vitest-axe';
import { MemoryRouter } from 'react-router-dom';

import LoginPage from '../../pages/auth/LoginPage';
import RegisterPage from '../../pages/auth/RegisterPage';
import DashboardPage from '../../pages/DashboardPage';
import DataImportPage from '../../pages/data/DataImportPage';
import ChartOfAccountsPage from '../../pages/charts/ChartOfAccountsPage';
import SettingsPage from '../../pages/settings/SettingsPage';
import BudgetVsActualPage from '../../pages/reports/BudgetVsActualPage';
import ProfitLossPage from '../../pages/reports/ProfitLossPage';
import CashFlowPage from '../../pages/reports/CashFlowPage';

import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ToastContainer } from '../../components/ui/ToastContainer';
import { CommandPalette } from '../../components/ui/CommandPalette';
import { DataTable } from '../../components/ui/DataTable';
import { ContextMenu } from '../../components/ui/ContextMenu';

const withRouter = (ui: React.ReactNode) => (
  <MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>
);

describe('WCAG 2.1 AA — automated axe-core regression suite', () => {
  describe('Authentication pages', () => {
    it('LoginPage has no detectable a11y violations', async () => {
      const { container } = render(<LoginPage />);
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('RegisterPage has no detectable a11y violations', async () => {
      const { container } = render(<RegisterPage />);
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });

  describe('Main application pages', () => {
    it('DashboardPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<DashboardPage />));
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('DataImportPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<DataImportPage />));
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('ChartOfAccountsPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<ChartOfAccountsPage />));
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('SettingsPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<SettingsPage />));
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });

  describe('Report pages', () => {
    it('BudgetVsActualPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<BudgetVsActualPage />));
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('ProfitLossPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<ProfitLossPage />));
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('CashFlowPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<CashFlowPage />));
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });

  describe('UI primitives', () => {
    it('Button has no detectable a11y violations', async () => {
      const { container } = render(<Button>Click me</Button>);
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('Modal has no detectable a11y violations', async () => {
      const { container } = render(
        <Modal isOpen onClose={() => {}}>
          Modal content
        </Modal>
      );
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('Input has no detectable a11y violations', async () => {
      const { container } = render(<Input label="Username" />);
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('Card has no detectable a11y violations', async () => {
      const { container } = render(<Card>Card content</Card>);
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('ToastContainer has no detectable a11y violations', async () => {
      const { container } = render(<ToastContainer />);
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('CommandPalette has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<CommandPalette isOpen onClose={() => {}} />));
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('DataTable has no detectable a11y violations', async () => {
      const columns = [{ key: 'name', header: 'Name' }];
      const rows = [{ name: 'Alpha' }, { name: 'Beta' }];
      const { container } = render(<DataTable columns={columns} rows={rows} rowKey="name" />);
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('ContextMenu has no detectable a11y violations', async () => {
      const items = [{ label: 'Cut', onClick: () => {} }];
      const { container } = render(<ContextMenu x={0} y={0} items={items} onClose={() => {}} />);
      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });
});
