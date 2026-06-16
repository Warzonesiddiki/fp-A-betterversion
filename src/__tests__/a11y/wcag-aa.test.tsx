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
  });

  // A11Y-P0-1 BLOCKER (Artemis + Hera co-own): WCAG 2.4.11 Focus Not Obscured
  describe('WCAG 2.4.11 Focus Not Obscured (Minimum)', () => {
    function isAuthorObscured(element: Element, container: HTMLElement): boolean {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const stack = document.elementsFromPoint(cx, cy);
      if (stack.length === 0) return false;
      const focusedIndex = stack.indexOf(element);
      if (focusedIndex === -1) return false;
      for (let i = 0; i < focusedIndex; i++) {
        const cs = window.getComputedStyle(stack[i]);
        const pos = cs.position;
        if (pos === 'fixed' || pos === 'sticky') {
          if (container.contains(stack[i])) return true;
        }
      }
      return false;
    }

    it('AppLayout focusable elements are not obscured by sticky/fixed author content', async () => {
      const AppLayoutMod = await import('../../components/layout/AppLayout');
      const AppLayout = AppLayoutMod.default;
      const { container } = render(<AppLayout><button>test</button></AppLayout>);
      const focusables = container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      expect(focusables.length).toBeGreaterThan(0);
      const obscured: string[] = [];
      focusables.forEach((el) => {
        if (isAuthorObscured(el, container)) {
          obscured.push(el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + String(el.className).split(' ').join('.') : ''));
        }
      });
      expect(obscured, 'WCAG 2.4.11 violation - author-created content obscures focused element(s): ' + obscured.join(', ')).toEqual([]);
    });

    it('Modal backdrop does not obscure focusable content within the dialog', async () => {
      const { container } = render(
        <Modal isOpen onClose={() => {}}>
          <button id="modal-action-1">Action 1</button>
          <button id="modal-action-2">Action 2</button>
        </Modal>
      );
      const focusables = container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const obscured: string[] = [];
      focusables.forEach((el) => {
        if (isAuthorObscured(el, container)) {
          obscured.push(el.id || el.tagName);
        }
      });
      expect(obscured, 'WCAG 2.4.11 violation - Modal backdrop obscures focused element(s): ' + obscured.join(', ')).toEqual([]);
    });
  });
});
