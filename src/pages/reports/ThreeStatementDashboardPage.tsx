import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { reportingCurrency } from '@/store/financialContextStore';
import { currencyFormatter } from '@/utils/financialFormatting';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { KPIValue } from '@/components/ui/KPIValue';
import { ThreeStatementEngine } from '@/engines/ThreeStatementEngine';
import { ExportEngine } from '@/engines/ExportEngine';
import {
  Download,
  TrendingUp,
  Scale,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { deriveThreeStatement } from './threeStatementData';

function fmt(n: number | { toNumber(): number }): string {
  const value = typeof n === 'number' ? n : n.toNumber();
  return currencyFormatter(reportingCurrency(), { decimals: 0 })(value);
}

export default function ThreeStatementDashboardPage() {
  const navigate = useNavigate();
  const { entries } = useGLStore();
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  });

  useEffect(() => {
    document.title = 'FinPlan Pro — Three-Statement Model';
  }, []);

  const { incomeStatement, balanceSheet, cashFlow, totals, result } = useMemo(() => {
    if (entries.length === 0)
      return {
        incomeStatement: null,
        balanceSheet: null,
        cashFlow: null,
        totals: null,
        result: null,
      };

    const derived = deriveThreeStatement(entries, period);

    // Linking may fail with incomplete data — the page still renders the statements.
    let linkResult = null;
    try {
      linkResult = ThreeStatementEngine.link(
        derived.incomeStatement,
        derived.balanceSheet,
        derived.cashFlow,
        [],
        0
      );
    } catch {
      linkResult = null;
    }

    return { ...derived, result: linkResult };
  }, [entries, period]);

  const handleExport = () => {
    if (!incomeStatement || !balanceSheet || !cashFlow || !totals) return;
    const data = {
      headers: ['Statement', 'Line Item', 'Amount'],
      rows: [
        ['P&L', 'Revenue', totals.revenue.toNumber()],
        ['P&L', 'COGS', totals.cogs.toNumber()],
        ['P&L', 'Gross Profit', totals.grossProfit.toNumber()],
        ['P&L', 'Operating Expenses', totals.opex.toNumber()],
        ['P&L', 'Operating Income', totals.operatingIncome.toNumber()],
        ['P&L', 'Net Income', totals.netIncome.toNumber()],
        ['Balance Sheet', 'Total Assets', balanceSheet.totalAssets],
        ['Balance Sheet', 'Total Liabilities', balanceSheet.totalLiabilities],
        ['Balance Sheet', 'Total Equity', balanceSheet.totalEquity],
        ['Cash Flow', 'Net Change in Cash', cashFlow.netChangeInCash],
      ],
    };
    void ExportEngine.exportToPDF(data, {
      title: 'Three-Statement Model',
      subtitle: `Period: ${period}`,
    }).catch(reportExportFailure);
  };

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Scale className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to generate the three-statement model.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  if (!incomeStatement || !balanceSheet || !cashFlow || !totals) {
    return <Skeleton className="h-96 m-6" />;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
  title="Three-Statement Model"
  purpose={"Integrated P&L, Balance Sheet, and Cash Flow"}
  actions={<div className="flex gap-2">
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm bg-background"
          />
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>}
/>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Net Income"
              value={fmt(totals.netIncome)}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Total Assets"
              value={fmt(balanceSheet.totalAssets)}
              icon={<Scale className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Net Cash Flow"
              value={fmt(cashFlow.netChangeInCash)}
              icon={<DollarSign className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Balance Check"
              value={result?.balanceCheck.isBalanced ? 'Balanced' : 'Imbalanced'}
              icon={
                result?.balanceCheck.isBalanced ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Three Statements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* P&L */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profit & Loss</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Revenue</span>
              <span>{fmt(totals.revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span>COGS</span>
              <span className="text-red-600">{fmt(totals.cogs)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1">
              <span>Gross Profit</span>
              <span>{fmt(totals.grossProfit)}</span>
            </div>
            <div className="flex justify-between">
              <span>Operating Expenses</span>
              <span className="text-red-600">{fmt(totals.opex)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1">
              <span>Operating Income</span>
              <span>{fmt(totals.operatingIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span>Interest</span>
              <span className="text-red-600">{fmt(totals.interest)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span className="text-red-600">{fmt(totals.tax)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2 text-base">
              <span>Net Income</span>
              <span className={totals.netIncome.gte(0) ? 'text-green-600' : 'text-red-600'}>
                {fmt(totals.netIncome)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Balance Sheet */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balance Sheet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Assets</span>
              <span className="font-medium">{fmt(balanceSheet.totalAssets)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Liabilities</span>
              <span>{fmt(balanceSheet.totalLiabilities)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Equity</span>
              <span>{fmt(balanceSheet.totalEquity)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2 text-base">
              <span>A = L + E</span>
              <span className={result?.balanceCheck.isBalanced ? 'text-green-600' : 'text-red-600'}>
                {result?.balanceCheck.isBalanced
                  ? '✓ Balanced'
                  : `✗ ${fmt(result?.balanceCheck.imbalance ?? 0)}`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cash Flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Operating</span>
              <span className="text-[var(--text-muted)]">—</span>
            </div>
            <div className="flex justify-between">
              <span>Investing</span>
              <span className="text-[var(--text-muted)]">—</span>
            </div>
            <div className="flex justify-between">
              <span>Financing</span>
              <span className="text-[var(--text-muted)]">—</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2 text-base">
              <span>Net Change in Cash</span>
              <span className={cashFlow.netChangeInCash >= 0 ? 'text-green-600' : 'text-red-600'}>
                {fmt(cashFlow.netChangeInCash)}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] pt-1">
              Net change in cash is measured directly on the cash account. Splitting it into
              operating, investing and financing activities requires per-account activity
              mapping that the posted ledger does not carry, so those lines are not estimated.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Link Validation */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Link Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.linkedAccounts.map((link, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {link.isLinked ? (
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  )}
                  <span className="flex-1">{link.accountName}</span>
                  <span className="text-muted-foreground">{link.linkType.replace(/_/g, ' ')}</span>
                </div>
              ))}
              {result.discrepancies.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                  <p className="text-sm font-medium text-yellow-600 mb-1">Discrepancies</p>
                  {result.discrepancies.map((d, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      {d.description}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Retained Earnings Roll-Forward */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Retained Earnings Roll-Forward</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm max-w-md">
              <div className="flex justify-between">
                <span>Beginning Retained Earnings</span>
                <span>{fmt(result.beginningRetainedEarnings)}</span>
              </div>
              <div className="flex justify-between">
                <span>+ Net Income</span>
                <span className="text-green-600">{fmt(result.netIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span>- Dividends</span>
                <span className="text-red-600">{fmt(result.dividendsDeclared)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2 text-base">
                <span>Ending Retained Earnings</span>
                <span>{fmt(result.endingRetainedEarnings)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
