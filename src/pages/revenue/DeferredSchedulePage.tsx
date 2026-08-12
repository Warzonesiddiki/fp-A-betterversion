import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { type Column } from '@/components/ui/DataTable';
import {
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatCompact, formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
interface ContractRecord {
  id: string;
  customer: string;
  contractValue: number;
  deferredBalance: number;
  recognizedYTD: number;
  startDate: string;
  endDate: string;
  monthlyRecognition: number;
  status: 'Active' | 'Completed' | 'Pending';
}

// demo defaults — replaced by real data when contract schedules come from RevRec engine contracts when imported
const mockContracts: ContractRecord[] = [
  {
    id: 'CTR001',
    customer: 'Acme Corp',
    contractValue: 480000,
    deferredBalance: 320000,
    recognizedYTD: 160000,
    startDate: '2026-01-01',
    endDate: '2027-12-31',
    monthlyRecognition: 20000,
    status: 'Active',
  },
  {
    id: 'CTR002',
    customer: 'TechStart Inc',
    contractValue: 240000,
    deferredBalance: 180000,
    recognizedYTD: 60000,
    startDate: '2026-03-01',
    endDate: '2028-02-28',
    monthlyRecognition: 10000,
    status: 'Active',
  },
  {
    id: 'CTR003',
    customer: 'Global Solutions',
    contractValue: 960000,
    deferredBalance: 480000,
    recognizedYTD: 480000,
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    monthlyRecognition: 40000,
    status: 'Active',
  },
  {
    id: 'CTR004',
    customer: 'DataFlow LLC',
    contractValue: 180000,
    deferredBalance: 45000,
    recognizedYTD: 135000,
    startDate: '2025-06-01',
    endDate: '2026-05-31',
    monthlyRecognition: 15000,
    status: 'Active',
  },
  {
    id: 'CTR005',
    customer: 'CloudFirst',
    contractValue: 360000,
    deferredBalance: 300000,
    recognizedYTD: 60000,
    startDate: '2026-04-01',
    endDate: '2028-03-31',
    monthlyRecognition: 15000,
    status: 'Active',
  },
  {
    id: 'CTR006',
    customer: 'Legacy Systems',
    contractValue: 120000,
    deferredBalance: 0,
    recognizedYTD: 120000,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    monthlyRecognition: 10000,
    status: 'Completed',
  },
];

const monthlyRecognitionData = [
  { month: 'Jan', recognized: 85000, deferred: 32000 },
  { month: 'Feb', recognized: 92000, deferred: 28000 },
  { month: 'Mar', recognized: 88000, deferred: 35000 },
  { month: 'Apr', recognized: 95000, deferred: 25000 },
  { month: 'May', recognized: 100000, deferred: 30000 },
  { month: 'Jun', recognized: 98000, deferred: 22000 },
  { month: 'Jul', recognized: 105000, deferred: 18000 },
  { month: 'Aug', recognized: 110000, deferred: 15000 },
  { month: 'Sep', recognized: 108000, deferred: 20000 },
  { month: 'Oct', recognized: 112000, deferred: 12000 },
  { month: 'Nov', recognized: 115000, deferred: 10000 },
  { month: 'Dec', recognized: 120000, deferred: 8000 },
];

const deferredTrend = [
  { month: 'Jan', balance: 1200000 },
  { month: 'Feb', balance: 1168000 },
  { month: 'Mar', balance: 1205000 },
  { month: 'Apr', balance: 1180000 },
  { month: 'May', balance: 1155000 },
  { month: 'Jun', balance: 1130000 },
  { month: 'Jul', balance: 1112000 },
  { month: 'Aug', balance: 1097000 },
  { month: 'Sep', balance: 1080000 },
  { month: 'Oct', balance: 1068000 },
  { month: 'Nov', balance: 1058000 },
  { month: 'Dec', balance: 1050000 },
];

export default function DeferredSchedulePage() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'FinPlan Pro - Deferred Revenue Schedule';
  }, []);

  const _glDeferred = useMemo(
    () =>
      entries
        .filter((e) => (e.accountCode || '').startsWith('23'))
        .reduce((s, e) => s + Math.abs(e.credit - e.debit), 0),
    [entries]
  );

  const totalDeferred = mockContracts.reduce((s, c) => s + c.deferredBalance, 0);
  const totalRecognizedYTD = mockContracts.reduce((s, c) => s + c.recognizedYTD, 0);
  const totalContractValue = mockContracts.reduce((s, c) => s + c.contractValue, 0);
  const recognitionRate =
    totalContractValue > 0 ? (totalRecognizedYTD / totalContractValue) * 100 : 0;

  const _contractColumns: Column<ContractRecord>[] = [
    {
      key: 'id',
      header: '',
      render: (_, r) => (
        <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="p-1">
          {expandedId === r.id ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ),
    },
    { key: 'customer', header: 'Customer', sortable: true },
    {
      key: 'contractValue',
      header: 'Contract Value',
      render: (_, r) => fmt.currency0(r.contractValue),
      sortable: true,
    },
    {
      key: 'deferredBalance',
      header: 'Deferred Balance',
      render: (_, r) => <span className="text-yellow-400">{fmt.currency0(r.deferredBalance)}</span>,
      sortable: true,
    },
    {
      key: 'recognizedYTD',
      header: 'Recognized YTD',
      render: (_, r) => <span className="text-green-400">{fmt.currency0(r.recognizedYTD)}</span>,
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, r) => (
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            r.status === 'Active'
              ? 'bg-green-900/50 text-green-400'
              : r.status === 'Completed'
                ? 'bg-blue-900/50 text-blue-400'
                : 'bg-yellow-900/50 text-yellow-400'
          }`}
        >
          {r.status}
        </span>
      ),
    },
  ];

  const handleExport = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Customer', 'Contract Value', 'Deferred', 'Recognized YTD', 'Status'],
        rows: mockContracts.map((c) => [
          c.customer,
          c.contractValue,
          c.deferredBalance,
          c.recognizedYTD,
          c.status,
        ]),
      },
      { title: 'Deferred Revenue Schedule' }
    ).catch(reportExportFailure);
  };

  const hasData = entries.length > 0 || mockContracts.length > 0;

  if (!hasData) {
    return (
      <div className="p-12 text-center">
        <Calendar className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Deferred Revenue Data</h2>
        <p className="text-slate-400 mb-6">Import GL data with deferred revenue accounts.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deferred Revenue Schedule</h1>
          <p className="text-sm text-slate-400">{mockContracts.length} contracts tracked</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue
          label="Total Deferred"
          value={fmt.currency0(totalDeferred)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Recognized YTD"
          value={fmt.currency0(totalRecognizedYTD)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Contract Value"
          value={fmt.currency0(totalContractValue)}
          icon={<Calendar className="h-4 w-4" />}
        />
        <KPIValue
          label="Recognition Rate"
          value={`${formatPercent(recognitionRate, 1)}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Deferred Revenue Balance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={deferredTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(v) => `$${formatCompact(v)}`}
                />
                <Tooltip
                  formatter={(v) => fmt.currency0(Number(v))}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.15}
                  name="Deferred Balance"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Recognition vs Deferrals</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyRecognitionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(v) => `$${v ? formatCompact(v) : '—'}`}
                />
                <Tooltip
                  formatter={(v) => fmt.currency0(Number(v))}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
                <Bar dataKey="recognized" fill="#10b981" name="Recognized" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deferred" fill="#f59e0b" name="Deferred" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockContracts.map((contract) => (
              <div key={contract.id} className="bg-slate-800 rounded-lg overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-700/50 transition-colors"
                  onClick={() => setExpandedId(expandedId === contract.id ? null : contract.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ')
                      setExpandedId(expandedId === contract.id ? null : contract.id);
                  }}
                >
                  <div className="flex items-center gap-3">
                    {expandedId === contract.id ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                    <div>
                      <div className="font-medium">{contract.customer}</div>
                      <div className="text-xs text-slate-400">
                        {contract.id} | {contract.startDate} to {contract.endDate}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {fmt.currency0(contract.contractValue)}
                      </div>
                      <div className="text-xs text-slate-400">Contract Value</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-yellow-400">
                        {fmt.currency0(contract.deferredBalance)}
                      </div>
                      <div className="text-xs text-slate-400">Deferred</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-400">
                        {fmt.currency0(contract.recognizedYTD)}
                      </div>
                      <div className="text-xs text-slate-400">Recognized</div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        contract.status === 'Active'
                          ? 'bg-green-900/50 text-green-400'
                          : contract.status === 'Completed'
                            ? 'bg-blue-900/50 text-blue-400'
                            : 'bg-yellow-900/50 text-yellow-400'
                      }`}
                    >
                      {contract.status}
                    </span>
                  </div>
                </div>
                {expandedId === contract.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <div className="text-xs text-slate-400">Monthly Recognition</div>
                        <div className="font-medium">
                          {fmt.currency0(contract.monthlyRecognition)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Remaining Months</div>
                        <div className="font-medium">
                          {contract.deferredBalance > 0
                            ? Math.ceil(contract.deferredBalance / contract.monthlyRecognition)
                            : 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">% Recognized</div>
                        <div className="font-medium">
                          {formatPercent(
                            (contract.recognizedYTD / contract.contractValue) * 100,
                            1
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Completion</div>
                        <div className="w-full bg-slate-700 rounded-full h-2 mt-1">
                          <div
                            className="h-2 rounded-full bg-green-500"
                            style={{
                              width: `${(contract.recognizedYTD / contract.contractValue) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
