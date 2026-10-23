import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  Landmark,
  FileText,
  Table as TableIcon,
  Percent,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { WaterfallChart } from '@/components/charts/WaterfallChart';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatCompact, formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { deriveTaxProvision, type TaxProvisionLine } from './taxProvisionData';

interface DisplayLine {
  key: string;
  label: string;
  amount: number | null;
}

export default function TaxProvisionPage() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Tax Provision';
  }, []);

  const data = useMemo(
    () => (entries.length === 0 ? null : deriveTaxProvision(entries)),
    [entries]
  );

  const displayLines: DisplayLine[] = useMemo(() => {
    if (!data) return [];
    return data.lines.map((line: TaxProvisionLine) => ({
      key: line.key,
      label: line.label,
      amount: line.amount === null ? null : line.amount.toNumber(),
    }));
  }, [data]);

  const moneyOrDash = (value: number | null | undefined): string =>
    value == null ? '—' : fmt.currency0(value);

  const handleExport = (format: 'pdf' | 'excel') => {
    if (!data) return;
    const headers = ['Line', 'Amount'];
    const rows = [
      ...displayLines.map((line) => [line.label, moneyOrDash(line.amount)]),
      [
        'Effective tax rate',
        data.effectiveRatePct === null ? '—' : formatPercent(data.effectiveRatePct.toNumber(), 1),
      ],
    ];
    const job =
      format === 'pdf'
        ? ExportEngine.exportToPDF({ headers, rows }, { title: 'Tax Provision Report' })
        : ExportEngine.exportToExcel({ headers, rows }, { title: 'Tax_Provision_Report' });
    void job.catch(reportExportFailure);
  };

  const columns: Column<DisplayLine>[] = [
    { key: 'label', header: 'Line', sortable: true },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (_value, row) => moneyOrDash(row.amount),
      sortable: true,
    },
  ];

  if (!data) {
    return (
      <div className="p-12 text-center">
        <Landmark className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-[var(--text-muted)] mb-6">Import GL data for tax provisioning.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  const bookChart = displayLines
    .filter((line) => line.amount !== null && line.key !== 'netIncome')
    .map((line) => ({ name: line.label, amount: line.amount ?? 0 }));

  const trend = data.quarters.map((q) => ({
    quarter: q.quarter,
    pretax: q.pretaxIncome.toNumber(),
    tax: q.postedTaxExpense === null ? null : q.postedTaxExpense.toNumber(),
    rate: q.effectiveRatePct === null ? null : q.effectiveRatePct.toNumber(),
  }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Tax Provision"
        purpose="Book tax from the posted General Ledger. A statutory ASC 740 provision requires rates and book-tax differences the GL does not carry — those lines are omitted, not estimated."
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleExport('pdf')}
              aria-label="Export PDF"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              PDF
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleExport('excel')}
              aria-label="Export Excel"
            >
              <TableIcon className="h-3.5 w-3.5 mr-1.5" />
              Excel
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue
          label="Pre-Tax Income"
          value={fmt.currency0(data.pretaxIncome.toNumber())}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Posted Tax Expense"
          value={moneyOrDash(
            data.postedTaxExpense === null ? null : data.postedTaxExpense.toNumber()
          )}
          icon={<Landmark className="h-4 w-4" />}
        />
        <KPIValue
          label="Effective Rate"
          value={
            data.effectiveRatePct === null
              ? '—'
              : formatPercent(data.effectiveRatePct.toNumber(), 1)
          }
          icon={<Percent className="h-4 w-4" />}
        />
        <KPIValue
          label="Net Income"
          value={moneyOrDash(data.netIncome === null ? null : data.netIncome.toNumber())}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Book tax bridge</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bookChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => formatCompact(v)} />
                <Tooltip
                  formatter={(v) => fmt.currency0(Number(v))}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
                <Bar dataKey="amount" fill="#3b82f6" name="Amount" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pre-tax by quarter</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length >= 2 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="quarter" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => formatCompact(v)} />
                  <Tooltip
                    formatter={(v) => (v == null ? '—' : fmt.currency0(Number(v)))}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pretax"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Pre-tax"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[var(--text-muted)] py-8 text-center">
                Quarterly trend requires posted activity in at least two quarters. A single period
                is not turned into a four-quarter seasonality curve.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tax Provision Waterfall</CardTitle>
        </CardHeader>
        <CardContent>
          <WaterfallChart
            data={[...data.waterfall]}
            height={200}
            formatValue={(v) => fmt.currency0(v)}
            ariaLabel="Tax provision waterfall chart"
          />
        </CardContent>
      </Card>
      <DataTable
        columns={columns}
        data={displayLines}
        caption="Book tax from posted General Ledger accounts"
        ariaLabel="Tax provision book-tax table"
      />
      {data.unavailable.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              Lines not derivable from the posted General Ledger
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              These captions are omitted rather than estimated. OmniPlan never substitutes assumed
              statutory rates or jurisdiction splits for posted balances.
            </p>
            <ul className="space-y-2">
              {data.unavailable.map((item) => (
                <li key={item.label} className="text-xs text-[var(--text-muted)]">
                  <span className="font-medium text-[var(--text-secondary)]">{item.label}</span>
                  {' — '}
                  {item.reason}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
