import { useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { HelpPanel } from '@/components/ui/HelpPanel';
import { DollarSign, HelpCircle, FileText, Table as TableIcon, AlertTriangle } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { sumMoney, subtractMoney, roundTo } from '@/utils/money';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { PageHeader } from '@/components/ui/PageHeader';

const HELP_SECTIONS = [
  {
    title: 'About the Cash Flow Statement',
    content:
      'The cash flow statement tracks how cash moves through the business across three core activities: operating, investing, and financing. Ending cash is reconciled to beginning cash plus the net change.',
  },
  {
    title: 'Operating Activities',
    content:
      'Starts with Net Income, then adds back non-cash expenses (depreciation) and adjusts for working capital changes: increases in AR/Inventory/Prepaids reduce cash, while increases in AP increase cash.',
  },
  {
    title: 'Investing Activities',
    content:
      'Reflects cash used for long-term asset purchases (PP&E / CapEx) and proceeds from asset sales. Negative values indicate cash outflows for investment.',
  },
  {
    title: 'Financing Activities',
    content:
      'Covers debt issuance (inflow), debt repayment (outflow), dividend payments, and stock buybacks. Positive values indicate net cash raised from financing.',
  },
  {
    title: 'Reconciliation',
    content:
      'Beginning Cash + Operating CF + Investing CF + Financing CF = Ending Cash. This ending balance should match the cash line on the Balance Sheet.',
  },
];

export default function CashFlowPage() {
  const fmt = useCurrencyFormatter();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Cash Flow Statement';
  }, []);

  const { entries, importError } = useGLStore();
  const navigate = useNavigate();
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  });

  const report = useMemo(() => {
    if (entries.length === 0) return null;

    const [year, monthNum] = period.split('-').map(Number);
    const prevPeriod =
      monthNum === 1 ? `${year! - 1}-12` : `${year}-${String(monthNum! - 1)!.padStart(2, '0')}`;

    const currentEntries = entries.filter((e) => (e.period || e.date.slice(0, 7)) <= period);
    const priorEntries = entries.filter((e) => (e.period || e.date.slice(0, 7)) <= prevPeriod);
    const periodEntries = entries.filter((e) => (e.period || e.date.slice(0, 7)) === period);

    const balance = (arr: typeof entries, prefix: string, isLiability = false) => {
      const filtered = arr.filter((e) => (e.accountCode || '').startsWith(prefix));
      if (isLiability) {
        return roundTo(sumMoney(filtered.map((e) => subtractMoney(e.credit, e.debit))), 2);
      }
      return roundTo(sumMoney(filtered.map((e) => subtractMoney(e.debit, e.credit))), 2);
    };

    const netIncome = (() => {
      const rev = roundTo(
        sumMoney(
          periodEntries
            .filter((e) => (e.accountCode || '').startsWith('4'))
            .map((e) => subtractMoney(e.credit, e.debit))
        ),
        2
      );
      const exp = roundTo(
        sumMoney(
          periodEntries
            .filter(
              (e) =>
                (e.accountCode || '').startsWith('5') || (e.accountCode || '').startsWith('6')
            )
            .map((e) => subtractMoney(e.debit, e.credit))
        ),
        2
      );
      return roundTo(subtractMoney(rev, exp), 2);
    })();

    const depreciation = roundTo(
      sumMoney(
        periodEntries
          .filter(
            (e) =>
              (e.accountCode || '').startsWith('6') &&
              (e.description || '').toLowerCase().includes('deprec')
          )
          .map((e) => subtractMoney(e.debit, e.credit))
      ),
      2
    );

    const deltaAR = roundTo(subtractMoney(balance(priorEntries, '12'), balance(currentEntries, '12')), 2);
    const deltaInventory = roundTo(subtractMoney(balance(priorEntries, '13'), balance(currentEntries, '13')), 2);
    const deltaAP = roundTo(subtractMoney(balance(currentEntries, '21', true), balance(priorEntries, '21', true)), 2);
    const deltaPrepaids = roundTo(subtractMoney(balance(priorEntries, '14'), balance(currentEntries, '14')), 2);

    const operating = roundTo(
      sumMoney([netIncome, depreciation, deltaAR, deltaInventory, deltaAP, deltaPrepaids]),
      2
    );

    const capex = roundTo(subtractMoney(balance(priorEntries, '15'), balance(currentEntries, '15')), 2);
    const investing = capex;

    const debtChange = roundTo(subtractMoney(balance(currentEntries, '22', true), balance(priorEntries, '22', true)), 2);
    const dividends = roundTo(
      sumMoney(
        periodEntries
          .filter((e) => (e.accountCode || '').startsWith('31'))
          .map((e) => subtractMoney(e.debit, e.credit))
      ),
      2
    );

    const financing = roundTo(subtractMoney(debtChange, dividends), 2);

    const netChange = roundTo(sumMoney([operating, investing, financing]), 2);
    const beginningCash = balance(priorEntries, '11');
    const endingCash = balance(currentEntries, '11');

    const hasMovement =
      netIncome !== 0 ||
      depreciation !== 0 ||
      deltaAR !== 0 ||
      deltaInventory !== 0 ||
      deltaAP !== 0 ||
      deltaPrepaids !== 0 ||
      capex !== 0 ||
      debtChange !== 0 ||
      dividends !== 0;

    return {
      netIncome,
      depreciation,
      deltaAR,
      deltaInventory,
      deltaAP,
      deltaPrepaids,
      operating,
      capex,
      investing,
      debtChange,
      dividends,
      financing,
      netChange,
      beginningCash,
      endingCash,
      hasPriorData: priorEntries.length > 0,
      hasMovement,
      entryCount: periodEntries.length,
    };
  }, [entries, period]);

  const handleExportPDF = () => {
    if (!report) return;
    const r = (n: number) => fmt.currency0(n);
    const data = {
      headers: ['Category', 'Amount'],
      rows: [
        ['Net Income', r(report.netIncome)],
        ['Depreciation & Amortization', r(report.depreciation)],
        ['Change in Accounts Receivable', r(report.deltaAR)],
        ['Change in Inventory', r(report.deltaInventory)],
        ['Change in Accounts Payable', r(report.deltaAP)],
        ['Change in Prepaid Expenses', r(report.deltaPrepaids)],
        ['Net Cash from Operating Activities', r(report.operating)],
        ['Net Cash from Investing Activities', r(report.investing)],
        ['Net Cash from Financing Activities', r(report.financing)],
        ['Net Change in Cash', r(report.netChange)],
        ['Beginning Cash', r(report.beginningCash)],
        ['Ending Cash', r(report.endingCash)],
      ],
    };
    void ExportEngine.exportToPDF(data, {
      title: 'Cash Flow Statement',
      subtitle: `Period ending ${period}`,
    }).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!report) return;
    const data = {
      headers: ['Category', 'Amount'],
      rows: [
        ['Net Income', report.netIncome],
        ['Depreciation', report.depreciation],
        ['Δ Accounts Receivable', report.deltaAR],
        ['Δ Inventory', report.deltaInventory],
        ['Δ Accounts Payable', report.deltaAP],
        ['Δ Prepaid Expenses', report.deltaPrepaids],
        ['Operating Cash Flow', report.operating],
        ['Investing Cash Flow', report.investing],
        ['Financing Cash Flow', report.financing],
        ['Net Cash Change', report.netChange],
        ['Beginning Cash', report.beginningCash],
        ['Ending Cash', report.endingCash],
      ],
    };
    void ExportEngine.exportToExcel(data, { title: 'Cash_Flow_Statement' }).catch(reportExportFailure);
  };

  if (importError) {
    return (
      <ErrorState
        title="Failed to load data"
        message={importError}
        errorCode="GL-IMPORT-ERROR"
        onRetry={() => window.location.reload()}
        secondaryAction={{ label: 'Go to Data Import', onClick: () => navigate('/data') }}
      />
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <DollarSign className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to generate a Cash Flow statement.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <Skeleton count={12} height="32px" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageHeader
            title="Cash Flow Statement"
            actions={<button
                       onClick={() => setHelpOpen(true)}
                       className="p-2 hover:bg-slate-800 rounded-full text-[var(--text-muted)] hover:text-white transition-colors"
                       aria-label="Help"
                     >
                       <HelpCircle className="h-5 w-5" />
                     </button>}
          />
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Period ending {period} &middot; {report.entryCount.toLocaleString()} entries
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm w-40"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Select report period"
          />
          <Button size="sm" variant="ghost" onClick={handleExportPDF} aria-label="Export PDF">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExportExcel} aria-label="Export Excel">
            <TableIcon className="h-3.5 w-3.5 mr-1.5" />
            Excel
          </Button>
        </div>
      </div>

      {report.endingCash < 0 && (
        <div
          className="bg-red-900/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4" />
          Negative cash balance: {fmt.currency0(report.endingCash)}. Immediate action recommended.
        </div>
      )}

      {!report.hasPriorData && (
        <div
          className="bg-amber-900/30 text-amber-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
          role="status"
        >
          <AlertTriangle className="h-4 w-4" />
          No prior period data available. Changes shown reflect only current period activity.
        </div>
      )}

      {!report.hasMovement && (
        <div className="bg-slate-800/50 text-slate-400 px-4 py-3 rounded-lg text-sm" role="status">
          No cash movement in this period.
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm" role="grid" aria-label="Cash Flow Statement data">
            <thead>
              <tr
                className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-slate-800"
                role="row"
              >
                <th className="px-6 py-3 w-3/5" role="columnheader" scope="col">
                  Description
                </th>
                <th className="px-6 py-3 text-right w-2/5" role="columnheader" scope="col">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="bg-slate-900/50 font-semibold" role="row">
                <td
                  className="px-6 py-3 text-slate-200 text-sm uppercase tracking-wider"
                  colSpan={2}
                >
                  Operating Activities
                </td>
              </tr>
              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 pl-12 text-slate-300" role="gridcell">
                  Net Income
                </td>
                <td className="px-6 py-3 text-right tabular-nums font-medium" role="gridcell">
                  {fmt.currency0(report.netIncome)}
                </td>
              </tr>
              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 pl-12 text-slate-300" role="gridcell">
                  Depreciation &amp; Amortization
                </td>
                <td className="px-6 py-3 text-right tabular-nums font-medium" role="gridcell">
                  {fmt.currency0(report.depreciation)}
                </td>
              </tr>
              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 pl-12 text-slate-300" role="gridcell">
                  Change in Accounts Receivable
                </td>
                <td
                  className={
                    'px-6 py-3 text-right tabular-nums font-medium ' +
                    (report.deltaAR >= 0 ? 'text-green-400' : 'text-red-400')
                  }
                  role="gridcell"
                >
                  {fmt.currency0(report.deltaAR)}
                </td>
              </tr>
              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 pl-12 text-slate-300" role="gridcell">
                  Change in Inventory
                </td>
                <td
                  className={
                    'px-6 py-3 text-right tabular-nums font-medium ' +
                    (report.deltaInventory >= 0 ? 'text-green-400' : 'text-red-400')
                  }
                  role="gridcell"
                >
                  {fmt.currency0(report.deltaInventory)}
                </td>
              </tr>
              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 pl-12 text-slate-300" role="gridcell">
                  Change in Accounts Payable
                </td>
                <td
                  className={
                    'px-6 py-3 text-right tabular-nums font-medium ' +
                    (report.deltaAP >= 0 ? 'text-green-400' : 'text-red-400')
                  }
                  role="gridcell"
                >
                  {fmt.currency0(report.deltaAP)}
                </td>
              </tr>
              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 pl-12 text-slate-300" role="gridcell">
                  Change in Prepaid Expenses
                </td>
                <td
                  className={
                    'px-6 py-3 text-right tabular-nums font-medium ' +
                    (report.deltaPrepaids >= 0 ? 'text-green-400' : 'text-red-400')
                  }
                  role="gridcell"
                >
                  {fmt.currency0(report.deltaPrepaids)}
                </td>
              </tr>
              <tr className="border-t border-slate-700 font-semibold" role="row">
                <td className="px-6 py-3 pl-12 text-[var(--text-primary)]" role="gridcell">
                  Net Cash from Operating Activities
                </td>
                <td
                  className={
                    'px-6 py-3 text-right tabular-nums font-semibold ' +
                    (report.operating >= 0 ? 'text-green-400' : 'text-red-400')
                  }
                  role="gridcell"
                >
                  {fmt.currency0(report.operating)}
                </td>
              </tr>

              <tr className="bg-slate-900/50 font-semibold" role="row">
                <td
                  className="px-6 py-3 text-slate-200 text-sm uppercase tracking-wider"
                  colSpan={2}
                >
                  Investing Activities
                </td>
              </tr>
              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 pl-12 text-slate-300" role="gridcell">
                  Purchase of Property, Plant &amp; Equipment
                </td>
                <td
                  className={
                    'px-6 py-3 text-right tabular-nums font-medium ' +
                    (report.capex >= 0 ? 'text-green-400' : 'text-red-400')
                  }
                  role="gridcell"
                >
                  {fmt.currency0(report.capex)}
                </td>
              </tr>
              <tr className="border-t border-slate-700 font-semibold" role="row">
                <td className="px-6 py-3 pl-12 text-[var(--text-primary)]" role="gridcell">
                  Net Cash from Investing Activities
                </td>
                <td
                  className={
                    'px-6 py-3 text-right tabular-nums font-semibold ' +
                    (report.investing >= 0 ? 'text-green-400' : 'text-red-400')
                  }
                  role="gridcell"
                >
                  {fmt.currency0(report.investing)}
                </td>
              </tr>

              <tr className="bg-slate-900/50 font-semibold" role="row">
                <td
                  className="px-6 py-3 text-slate-200 text-sm uppercase tracking-wider"
                  colSpan={2}
                >
                  Financing Activities
                </td>
              </tr>
              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 pl-12 text-slate-300" role="gridcell">
                  Debt Issued / (Repaid)
                </td>
                <td
                  className={
                    'px-6 py-3 text-right tabular-nums font-medium ' +
                    (report.debtChange >= 0 ? 'text-green-400' : 'text-red-400')
                  }
                  role="gridcell"
                >
                  {fmt.currency0(report.debtChange)}
                </td>
              </tr>
              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 pl-12 text-slate-300" role="gridcell">
                  Dividends Paid
                </td>
                <td
                  className={
                    'px-6 py-3 text-right tabular-nums font-medium ' +
                    (report.dividends >= 0 ? 'text-green-400' : 'text-red-400')
                  }
                  role="gridcell"
                >
                  {fmt.currency0(-report.dividends)}
                </td>
              </tr>
              <tr className="border-t border-slate-700 font-semibold" role="row">
                <td className="px-6 py-3 pl-12 text-[var(--text-primary)]" role="gridcell">
                  Net Cash from Financing Activities
                </td>
                <td
                  className={
                    'px-6 py-3 text-right tabular-nums font-semibold ' +
                    (report.financing >= 0 ? 'text-green-400' : 'text-red-400')
                  }
                  role="gridcell"
                >
                  {fmt.currency0(report.financing)}
                </td>
              </tr>

              <tr className="bg-slate-800/50 font-semibold border-t-2 border-slate-700" role="row">
                <td className="px-6 py-4 text-white" role="gridcell">
                  Net Change in Cash
                </td>
                <td
                  className={
                    'px-6 py-4 text-right tabular-nums text-lg font-bold ' +
                    (report.netChange >= 0 ? 'text-green-400' : 'text-red-400')
                  }
                  role="gridcell"
                >
                  {fmt.currency0(report.netChange)}
                </td>
              </tr>

              <tr className="hover:bg-slate-900/50" role="row">
                <td className="px-6 py-3 text-slate-300" role="gridcell">
                  Beginning Cash Balance
                </td>
                <td className="px-6 py-3 text-right tabular-nums font-medium" role="gridcell">
                  {fmt.currency0(report.beginningCash)}
                </td>
              </tr>
              <tr className="border-t-2 border-slate-700 bg-slate-800/30 font-bold" role="row">
                <td className="px-6 py-3 text-white" role="gridcell">
                  Ending Cash Balance
                </td>
                <td
                  className={
                    'px-6 py-3 text-right tabular-nums text-lg ' +
                    (report.endingCash >= 0 ? 'text-green-400' : 'text-red-400')
                  }
                  role="gridcell"
                >
                  {fmt.currency0(report.endingCash)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <HelpPanel
        title="Cash Flow Statement Help"
        sections={HELP_SECTIONS}
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  );
}
