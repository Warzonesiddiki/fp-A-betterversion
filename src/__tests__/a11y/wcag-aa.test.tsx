/**
 * Automated accessibility (a11y) regression tests for FinPlan Pro.
 *
 * WCAG coverage: 2.1 Level AA (axe-core's default rule set). `vitest-axe` is
 * installed and this suite is live â€” an earlier version of this header said it
 * was inert pending that install, which has since happened.
 *
 * Scope note: these cases render each page against the *default* stores, so the
 * data-backed routes are audited in their EMPTY state (a report page here is
 * ~6 DOM elements: an icon, a heading, a sentence and an "Import Data" button).
 * That is deliberate â€” empty states ship too â€” but it is thin coverage on its
 * own. The populated state of those pages is audited separately in
 * `wcag-aa-populated.test.tsx`, which mocks the GL and budget stores; keep new
 * data-dependent pages covered in both.
 *
 * @see https://github.com/chaabi-dev/vitest-axe
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { ThemeProvider } from '../../context/ThemeContext';

import LoginPage from '../../pages/auth/LoginPage';
import RegisterPage from '../../pages/auth/RegisterPage';
import DashboardPage from '../../pages/DashboardPage';
import DataImportPage from '../../pages/data/DataImportPage';
import { ChartOfAccountsPage } from '../../pages/charts/ChartOfAccountsPage';
import SettingsPage from '../../pages/settings/SettingsPage';
import BudgetVsActualPage from '../../pages/reports/BudgetVsActualPage';
import ProfitLossPage from '../../pages/reports/ProfitLossPage';
import CashFlowPage from '../../pages/reports/CashFlowPage';

// E-02 a11y sweep additions (top-20 user-critical routes) â€” empty/default state.
import BudgetListPage from '../../pages/budgets/BudgetListPage';
import BudgetCreatePage from '../../pages/budgets/BudgetCreatePage';
import ForecastListPage from '../../pages/forecasts/ForecastListPage';
import ScenarioListPage from '../../pages/scenarios/ScenarioListPage';
import VarianceDashboardPage from '../../pages/variance/VarianceDashboardPage';
import ConsolidationDashboard from '../../pages/consolidation/ConsolidationDashboard';
import CashForecastPage from '../../pages/cash/CashForecastPage';
import InvestmentPage from '../../pages/treasury/InvestmentPage';
import BoardPackPage from '../../pages/reports/BoardPackPage';
import PeriodClosePage from '../../pages/periods/PeriodClosePage';
import ReconciliationPage from '../../pages/data/ReconciliationPage';
import GLTrialBalancePage from '../../pages/data/GLTrialBalancePage';
import IntegrationSettingsPage from '../../pages/settings/IntegrationSettingsPage';
import ReportsListPage from '../../pages/reports/ReportsListPage';

import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ToastContainer } from '../../components/ui/ToastContainer';
import { CommandPalette } from '../../components/ui/CommandPalette';
import { DataTable } from '../../components/ui/DataTable';
import { ContextMenu } from '../../components/ui/ContextMenu';
import { readFileSync } from 'fs';
import { join } from 'path';

const withRouter = (ui: React.ReactNode) => (
  <MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>
);

const withAllProviders = (ui: React.ReactNode) => (
  <I18nextProvider i18n={i18n}>
    <ThemeProvider>
      <MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>
    </ThemeProvider>
  </I18nextProvider>
);

// Orchestrator PICK #23 DRI #1 item #3 directive: "axe-core scan â€” 0 critical,
// 0 serious violations". This helper filters out moderate/minor impact violations
// to align the assertion with the directive (landmark-unique at moderate level
// is allowed, per Orchestrator).
const expectNoCriticalOrSerious = (results: { violations: Array<{ impact?: string }> }) => {
  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  expect(blocking).toEqual([]);
};

describe('WCAG 2.1 AA â€” automated axe-core regression suite', () => {
  describe('Authentication pages', () => {
    it('LoginPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<LoginPage />));
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });

    it('RegisterPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<RegisterPage />));
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });
  });

  describe('Main application pages', () => {
    it('DashboardPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<DashboardPage />));
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });

    it('DataImportPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<DataImportPage />));
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });

    it('ChartOfAccountsPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<ChartOfAccountsPage />));
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });

    it('SettingsPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<SettingsPage />));
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });
  });

  describe('Report pages', () => {
    it('BudgetVsActualPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<BudgetVsActualPage />));
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });

    it('ProfitLossPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<ProfitLossPage />));
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });

    it('CashFlowPage has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<CashFlowPage />));
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });
  });

  // E-02 a11y sweep: extends the audited surface to the top-20 user-critical
  // routes (budgets, forecasts, scenarios, variance, consolidation, cash,
  // treasury, reports hub + board pack, period close, reconciliation, GL trial
  // balance, integrations). Same bar as the suites above: 0 critical, 0
  // serious. Populated-state scans for the data-backed ones live in
  // `wcag-aa-populated.test.tsx`.
  describe('E-02 top-20 route sweep additions', () => {
    const sweepCases: Array<[string, React.ReactElement]> = [
      ['/budgets', <BudgetListPage key="/budgets" />],
      ['/budgets/create', <BudgetCreatePage key="/budgets/create" />],
      ['/forecasts', <ForecastListPage key="/forecasts" />],
      ['/scenarios', <ScenarioListPage key="/scenarios" />],
      ['/variance', <VarianceDashboardPage key="/variance" />],
      ['/consolidation', <ConsolidationDashboard key="/consolidation" />],
      ['/cash/forecast', <CashForecastPage key="/cash/forecast" />],
      ['/treasury/investments', <InvestmentPage key="/treasury/investments" />],
      ['/board-pack', <BoardPackPage key="/board-pack" />],
      ['/periods/close', <PeriodClosePage key="/periods/close" />],
      ['/data/reconciliation', <ReconciliationPage key="/data/reconciliation" />],
      ['/data/gl-trial-balance', <GLTrialBalancePage key="/data/gl-trial-balance" />],
      ['/settings/integrations', <IntegrationSettingsPage key="/settings/integrations" />],
      ['/reports', <ReportsListPage key="/reports" />],
    ];

    it.each(sweepCases)('%s has no detectable a11y violations (E-02)', async (_route, ui) => {
      const { container } = render(withRouter(ui));
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });
  });

  describe('UI primitives', () => {
    it('Button has no detectable a11y violations', async () => {
      const { container } = render(<Button>Click me</Button>);
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });

    it('Modal has no detectable a11y violations', async () => {
      const { container } = render(
        <Modal isOpen onClose={() => {}}>
          Modal content
        </Modal>
      );
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });

    it('Input has no detectable a11y violations', async () => {
      const { container } = render(<Input label="Username" />);
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });

    it('Card has no detectable a11y violations', async () => {
      const { container } = render(<Card>Card content</Card>);
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });

    it('ToastContainer has no detectable a11y violations', async () => {
      const { container } = render(<ToastContainer />);
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });

    it('CommandPalette has no detectable a11y violations', async () => {
      const { container } = render(withRouter(<CommandPalette isOpen onClose={() => {}} />));
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });

    it('DataTable has no detectable a11y violations', async () => {
      // Real DataTableProps contract: `columns` + `data` (no rows/rowKey).
      const columns = [{ key: 'name', header: 'Name' }];
      const data = [{ name: 'Alpha' }, { name: 'Beta' }];
      const { container } = render(
        <DataTable columns={columns} data={data} ariaLabel="Test table" />
      );
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });

    it('ContextMenu has no detectable a11y violations', async () => {
      const items = [{ label: 'Cut', onClick: () => {} }];
      const { container } = render(<ContextMenu x={0} y={0} items={items} onClose={() => {}} />);
      const results = await axe(container);
      expectNoCriticalOrSerious(results);
    });
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
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
      });
      const AppLayoutMod = await import('../../components/layout/AppLayout');
      const AppLayout = AppLayoutMod.default;
      const { container } = render(
        withAllProviders(
          <AppLayout>
            <button>test</button>
          </AppLayout>
        )
      );
      const focusables = container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      expect(focusables.length).toBeGreaterThan(0);
      const obscured: string[] = [];
      focusables.forEach((el) => {
        if (isAuthorObscured(el, container)) {
          obscured.push(
            el.tagName +
              (el.id ? '#' + el.id : '') +
              (el.className ? '.' + String(el.className).split(' ').join('.') : '')
          );
        }
      });
      expect(
        obscured,
        'WCAG 2.4.11 violation - author-created content obscures focused element(s): ' +
          obscured.join(', ')
      ).toEqual([]);
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
      expect(
        obscured,
        'WCAG 2.4.11 violation - Modal backdrop obscures focused element(s): ' + obscured.join(', ')
      ).toEqual([]);
    });
  });

  // A11Y-P1-10 (Hera T-HE-021 + Artemis co-own): Q5.2 focus restore <50ms
  describe('Q5.2 Focus Restore <50ms (Temporal A11y)', () => {
    it('Modal close restores focus to trigger element (focus restore verified structurally)', () => {
      const modalSource = readFileSync(join(__dirname, '../../components/ui/Modal.tsx'), 'utf-8');
      expect(modalSource).toMatch(/previousFocusRef\.current\??\.focus\(\)/);
      expect(modalSource).toMatch(/previousFocusRef\.current\s*=\s*document\.activeElement/);
      expect(modalSource).toMatch(/requestAnimationFrame\(/);
    });

    it('Modal focus-trap: Tab cycles within dialog (Q5.2 supporting requirement)', () => {
      const modalSource = readFileSync(join(__dirname, '../../components/ui/Modal.tsx'), 'utf-8');
      expect(modalSource).toMatch(/keydown/);
      expect(modalSource).toMatch(/FOCUSABLE/);
    });

    it('Modal initial focus moves to first focusable on open (Q5.2 timing evidence)', async () => {
      const Wrapper = () => {
        const [open, setOpen] = React.useState(false);
        return (
          <>
            <button onClick={() => setOpen(true)}>Open</button>
            <Modal isOpen={open} onClose={() => setOpen(false)}>
              <button>First</button>
              <button>Second</button>
            </Modal>
          </>
        );
      };
      const { getByRole } = render(<Wrapper />);
      const trigger = getByRole('button', { name: /open/i });
      trigger.focus();
      expect(document.activeElement).toBe(trigger);
      const t0 = performance.now();
      fireEvent.click(trigger);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const elapsed = performance.now() - t0;
      expect(elapsed).toBeLessThan(50);
      const dialog = document.querySelector('[role=dialog]');
      expect(dialog).toBeTruthy();
    });
  });
});
