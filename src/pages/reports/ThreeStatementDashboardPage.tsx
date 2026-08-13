import { useEffect, useMemo, useState } from 'react';
import { reportingCurrency } from '@/store/financialContextStore';
import { currencyFormatter } from '@/utils/financialFormatting';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { KPIValue } from '@/components/ui/KPIValue';
import {
  ThreeStatementEngine,
  type IncomeStatementData,
  type BalanceSheetData,
  type CashFlowData,
} from '@/engines/ThreeStatementEngine';
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
import { roundTo, sumMoney } from '@/utils/money';

function fmt(n: number): string {
  return currencyFormatter(reportingCurrency(), { decimals: 0 })(n);
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

  const { incomeStatement, balanceSheet, cashFlow, result } = useMemo(() => {
    if (entries.length === 0)
      return { incomeStatement: null, balanceSheet: null, cashFlow: null, result: null };

    const filtered = entries.filter((e) => (e.period || e.date.slice(0, 7)) <= period);

    // Build Income Statement
    const revenue = filtered.filter((e) => (e.accountCode || '').startsWith('4'));
    const cogs = filtered.filter((e) => (e.accountCode || '').startsWith('5'));
    const opex = filtered.filter((e) => (e.accountCode || '').startsWith('6'));
    const interest = filtered.filter((e) => (e.accountCode || '').startsWith('7'));
    const tax = filtered.filter((e) => (e.accountCode || '').startsWith('8'));

    const totalRevenue = roundTo(sumMoney(revenue.map((e) => e.debit - e.credit)), 2);
    const totalCOGS = roundTo(sumMoney(cogs.map((e) => Math.abs(e.debit - e.credit))), 2);
    const grossProfit = totalRevenue - totalCOGS;
    const totalOpex = roundTo(sumMoney(opex.map((e) => Math.abs(e.debit - e.credit))), 2);
    const operatingIncome = grossProfit - totalOpex;
    const totalInterest = roundTo(sumMoney(interest.map((e) => Math.abs(e.debit - e.credit))), 2);
    const totalTax = roundTo(sumMoney(tax.map((e) => Math.abs(e.debit - e.credit))), 2);
    const netIncome = operatingIncome - totalInterest - totalTax;

    const income: IncomeStatementData = {
      revenue: revenue.map((e) => ({
        accountCode: e.accountCode || '',
        accountName: e.description || '',
        amount: e.debit - e.credit,
        category: 'revenue' as const,
      })),
      cogs: cogs.map((e) => ({
        accountCode: e.accountCode || '',
        accountName: e.description || '',
        amount: Math.abs(e.debit - e.credit),
        category: 'cogs' as const,
      })),
      grossProfit,
      opex: opex.map((e) => ({
        accountCode: e.accountCode || '',
        accountName: e.description || '',
        amount: Math.abs(e.debit - e.credit),
        category: 'opex' as const,
      })),
      depreciation: [],
      amortization: [],
      operatingIncome,
      interestExpense: interest.map((e) => ({
        accountCode: e.accountCode || '',
        accountName: e.description || '',
        amount: Math.abs(e.debit - e.credit),
        category: 'interest' as const,
      })),
      interestIncome: [],
      ebit: operatingIncome,
      taxExpense: tax.map((e) => ({
        accountCode: e.accountCode || '',
        accountName: e.description || '',
        amount: Math.abs(e.debit - e.credit),
        category: 'tax' as const,
      })),
      otherIncome: [],
      otherExpense: [],
      netIncome,
      period,
    };

    // Build Balance Sheet
    const assets = filtered.filter((e) => (e.accountCode || '').startsWith('1'));
    const liabilities = filtered.filter((e) => (e.accountCode || '').startsWith('2'));
    const equity = filtered.filter((e) => (e.accountCode || '').startsWith('3'));

    const totalAssets = roundTo(sumMoney(assets.map((e) => e.debit - e.credit)), 2);
    const totalLiabilities = roundTo(sumMoney(liabilities.map((e) => e.credit - e.debit)), 2);
    const totalEquity = roundTo(sumMoney(equity.map((e) => e.credit - e.debit)), 2);

    const bs: BalanceSheetData = {
      currentAssets: [],
      cash: roundTo(
        sumMoney(
          filtered
            .filter((e) => e.accountCode === '1000')
            .map((e) => e.debit - e.credit)
        ),
        2
      ),
      accountsReceivable: roundTo(
        sumMoney(
          filtered
            .filter((e) => e.accountCode === '1100')
            .map((e) => e.debit - e.credit)
        ),
        2
      ),
      inventory: roundTo(
        sumMoney(
          filtered
            .filter((e) => e.accountCode === '1200')
            .map((e) => e.debit - e.credit)
        ),
        2
      ),
      prepaidExpenses: 0,
      otherCurrentAssets: 0,
      totalCurrentAssets: 0,
      nonCurrentAssets: [],
      propertyPlantEquipment: filtered
        .filter((e) => e.accountCode === '1600')
        .reduce((s, e) => s + (e.debit - e.credit), 0),
      accumulatedDepreciation: 0,
      netFixedAssets: 0,
      intangibleAssets: 0,
      goodwill: 0,
      otherNonCurrentAssets: 0,
      totalNonCurrentAssets: 0,
      totalAssets,
      currentLiabilities: [],
      accountsPayable: filtered
        .filter((e) => e.accountCode === '2100')
        .reduce((s, e) => s + (e.credit - e.debit), 0),
      accruedExpenses: 0,
      shortTermDebt: 0,
      currentPortionLongTermDebt: 0,
      otherCurrentLiabilities: 0,
      totalCurrentLiabilities: 0,
      nonCurrentLiabilities: [],
      longTermDebt: 0,
      deferredTaxLiability: 0,
      otherNonCurrentLiabilities: 0,
      totalNonCurrentLiabilities: 0,
      totalLiabilities,
      equity: [],
      commonStock: 0,
      additionalPaidInCapital: 0,
      retainedEarnings: totalEquity,
      accumulatedOtherComprehensiveIncome: 0,
      treasuryStock: 0,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      period,
    };

    // Build Cash Flow
    const operating = filtered.filter(
      (e) => (e.accountCode || '').startsWith('4') || (e.accountCode || '').startsWith('6')
    );
    const investing = filtered.filter((e) => (e.accountCode || '').startsWith('1'));
    const financing = filtered.filter(
      (e) => (e.accountCode || '').startsWith('2') || (e.accountCode || '').startsWith('3')
    );

    const netOps = roundTo(sumMoney(operating.map((e) => e.debit - e.credit)), 2);
    const netInv = roundTo(sumMoney(investing.map((e) => e.debit - e.credit)), 2);
    const netFin = roundTo(sumMoney(financing.map((e) => e.debit - e.credit)), 2);
    const netChange = netOps + netInv + netFin;

    const cf: CashFlowData = {
      operatingActivities: [],
      netCashFromOperations: netOps,
      investingActivities: [],
      netCashFromInvesting: netInv,
      financingActivities: [],
      netCashFromFinancing: netFin,
      netChangeInCash: netChange,
      beginningCash: 0,
      endingCash: netChange,
      period,
    };

    // Link statements
    let linkResult = null;
    try {
      linkResult = ThreeStatementEngine.link(income, bs, cf, [], 0);
    } catch {
      // Linking may fail with incomplete data — that's OK
    }

    return { incomeStatement: income, balanceSheet: bs, cashFlow: cf, result: linkResult };
  }, [entries, period]);

  const handleExport = () => {
    if (!incomeStatement || !balanceSheet || !cashFlow) return;
    const data = {
      headers: ['Statement', 'Line Item', 'Amount'],
      rows: [
        [
          'P&L',
          'Revenue',
          incomeStatement.netIncome + (incomeStatement.grossProfit - incomeStatement.netIncome),
        ],
        ['P&L', 'Net Income', incomeStatement.netIncome],
        ['Balance Sheet', 'Total Assets', balanceSheet.totalAssets],
        ['Balance Sheet', 'Total Liabilities', balanceSheet.totalLiabilities],
        ['Balance Sheet', 'Total Equity', balanceSheet.totalEquity],
        ['Cash Flow', 'Operating', cashFlow.netCashFromOperations],
        ['Cash Flow', 'Investing', cashFlow.netCashFromInvesting],
        ['Cash Flow', 'Financing', cashFlow.netCashFromFinancing],
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
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <Scale className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to generate the three-statement model.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  if (!incomeStatement || !balanceSheet || !cashFlow) {
    return <Skeleton className="h-96 m-6" />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Three-Statement Model</h1>
          <p className="text-muted-foreground">Integrated P&L, Balance Sheet, and Cash Flow</p>
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm bg-background"
          />
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Net Income"
              value={fmt(incomeStatement.netIncome)}
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
              <span>
                {fmt(
                  incomeStatement.grossProfit +
                    (incomeStatement.grossProfit - incomeStatement.netIncome > 0
                      ? incomeStatement.grossProfit - incomeStatement.netIncome
                      : 0)
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>COGS</span>
              <span className="text-red-600">
                {fmt(
                  incomeStatement.grossProfit > 0
                    ? incomeStatement.grossProfit - incomeStatement.netIncome > 0
                      ? incomeStatement.grossProfit
                      : 0
                    : 0
                )}
              </span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1">
              <span>Gross Profit</span>
              <span>{fmt(incomeStatement.grossProfit)}</span>
            </div>
            <div className="flex justify-between">
              <span>Operating Expenses</span>
              <span className="text-red-600">
                {fmt(incomeStatement.grossProfit - incomeStatement.operatingIncome)}
              </span>
            </div>
            <div className="flex justify-between font-medium border-t pt-1">
              <span>Operating Income</span>
              <span>{fmt(incomeStatement.operatingIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span>Interest</span>
              <span className="text-red-600">
                {fmt(roundTo(sumMoney(incomeStatement.interestExpense.map((e) => e.amount)), 2))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span className="text-red-600">
                {fmt(roundTo(sumMoney(incomeStatement.taxExpense.map((e) => e.amount)), 2))}
              </span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2 text-base">
              <span>Net Income</span>
              <span className={incomeStatement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                {fmt(incomeStatement.netIncome)}
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
              <span>{fmt(cashFlow.netCashFromOperations)}</span>
            </div>
            <div className="flex justify-between">
              <span>Investing</span>
              <span>{fmt(cashFlow.netCashFromInvesting)}</span>
            </div>
            <div className="flex justify-between">
              <span>Financing</span>
              <span>{fmt(cashFlow.netCashFromFinancing)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2 text-base">
              <span>Net Change</span>
              <span className={cashFlow.netChangeInCash >= 0 ? 'text-green-600' : 'text-red-600'}>
                {fmt(cashFlow.netChangeInCash)}
              </span>
            </div>
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
