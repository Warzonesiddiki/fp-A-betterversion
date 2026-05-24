import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import {
  Download,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { ExportEngine } from '@/engines/ExportEngine';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface LeaseSummary {
  id: string;
  property: string;
  type: 'Operating' | 'Finance';
  monthlyPayment: number;
  endDate: string;
  liability: number;
  status: 'Active' | 'Expiring Soon' | 'Expired';
}

const mockLeases: LeaseSummary[] = [
  {
    id: 'L001',
    property: 'HQ Office - Floor 12',
    type: 'Finance',
    monthlyPayment: 45000,
    endDate: '2029-12-31',
    liability: 2100000,
    status: 'Active',
  },
  {
    id: 'L002',
    property: 'Warehouse - East',
    type: 'Operating',
    monthlyPayment: 28000,
    endDate: '2028-05-31',
    liability: 1350000,
    status: 'Active',
  },
  {
    id: 'L003',
    property: 'Data Center - North',
    type: 'Finance',
    monthlyPayment: 62000,
    endDate: '2030-12-31',
    liability: 2900000,
    status: 'Active',
  },
  {
    id: 'L004',
    property: 'Retail - Downtown',
    type: 'Operating',
    monthlyPayment: 18000,
    endDate: '2027-02-28',
    liability: 720000,
    status: 'Active',
  },
  {
    id: 'L005',
    property: 'Office - West Wing',
    type: 'Finance',
    monthlyPayment: 35000,
    endDate: '2025-12-31',
    liability: 450000,
    status: 'Expired',
  },
  {
    id: 'L006',
    property: 'Lab Space - South',
    type: 'Operating',
    monthlyPayment: 52000,
    endDate: '2026-06-30',
    liability: 312000,
    status: 'Expiring Soon',
  },
];

const monthlyPayments = [
  { month: 'Jan', operating: 98000, finance: 142000 },
  { month: 'Feb', operating: 98000, finance: 142000 },
  { month: 'Mar', operating: 98000, finance: 142000 },
  { month: 'Apr', operating: 98000, finance: 142000 },
  { month: 'May', operating: 98000, finance: 142000 },
  { month: 'Jun', operating: 46000, finance: 142000 },
  { month: 'Jul', operating: 46000, finance: 142000 },
  { month: 'Aug', operating: 46000, finance: 142000 },
  { month: 'Sep', operating: 46000, finance: 142000 },
  { month: 'Oct', operating: 46000, finance: 142000 },
  { month: 'Nov', operating: 46000, finance: 142000 },
  { month: 'Dec', operating: 46000, finance: 142000 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export default function LeaseDashboard() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro - Lease Dashboard';
  }, []);

  const glLeaseTotal = useMemo(
    () =>
      entries
        .filter(
          (e) =>
            (e.description || '').toLowerCase().includes('lease') ||
            (e.accountCode || '').startsWith('15')
        )
        .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0),
    [entries]
  );

  const activeLeases = mockLeases.filter(
    (l) => l.status === 'Active' || l.status === 'Expiring Soon'
  );
  const totalLiability = activeLeases.reduce((s, l) => s + l.liability, 0);
  const totalMonthlyPayment = activeLeases.reduce((s, l) => s + l.monthlyPayment, 0);
  const avgTermMonths = 36;
  const operatingLeases = activeLeases.filter((l) => l.type === 'Operating');
  const financeLeases = activeLeases.filter((l) => l.type === 'Finance');

  const typeBreakdown = [
    { name: 'Operating', value: operatingLeases.reduce((s, l) => s + l.liability, 0) },
    { name: 'Finance', value: financeLeases.reduce((s, l) => s + l.liability, 0) },
  ];

  const handleExport = () => {
    ExportEngine.exportToPDF(
      {
        headers: ['Property', 'Type', 'Monthly Payment', 'Liability', 'End Date', 'Status'],
        rows: mockLeases.map((l) => [
          l.property,
          l.type,
          l.monthlyPayment,
          l.liability,
          l.endDate,
          l.status,
        ]),
      },
      { title: 'Lease Portfolio Dashboard' }
    );
  };

  if (entries.length === 0 && glLeaseTotal === 0) {
    return (
      <div className="p-12 text-center">
        <FileText className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Lease Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view lease portfolio.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lease Portfolio Dashboard</h1>
          <p className="text-sm text-slate-400">{activeLeases.length} active leases</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button size="sm" onClick={() => navigate('/lease/detail')}>
            View Details <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue
          label="Total Liability"
          value={formatCurrency(totalLiability)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Monthly Payment"
          value={formatCurrency(totalMonthlyPayment)}
          icon={<Calendar className="h-4 w-4" />}
        />
        <KPIValue
          label="Active Leases"
          value={String(activeLeases.length)}
          icon={<FileText className="h-4 w-4" />}
        />
        <KPIValue
          label="Avg Term"
          value={`${avgTermMonths} months`}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lease Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {typeBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any) => formatCurrency(v)}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Payment Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyPayments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(v: any) => formatCurrency(v)}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
                <Bar dataKey="operating" fill="#10b981" name="Operating" stackId="a" />
                <Bar dataKey="finance" fill="#3b82f6" name="Finance" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Expirations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockLeases
              .filter((l) => l.status === 'Expiring Soon' || l.status === 'Expired')
              .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
              .map((lease) => {
                const daysUntilExpiry = Math.ceil(
                  (new Date(lease.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={lease.id}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${daysUntilExpiry <= 0 ? 'bg-red-500' : daysUntilExpiry < 180 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      />
                      <div>
                        <div className="font-medium">{lease.property}</div>
                        <div className="text-xs text-slate-400">
                          {lease.type} | {formatCurrency(lease.monthlyPayment)}/mo
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{lease.endDate}</div>
                      <div
                        className={`text-xs ${daysUntilExpiry <= 0 ? 'text-red-400' : daysUntilExpiry < 180 ? 'text-yellow-400' : 'text-green-400'}`}
                      >
                        {daysUntilExpiry <= 0 ? 'Expired' : `${daysUntilExpiry} days remaining`}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lease Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockLeases.map((lease) => (
              <div
                key={lease.id}
                className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/lease/detail?id=${lease.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') navigate(`/lease/detail?id=${lease.id}`);
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      lease.type === 'Finance' ? 'bg-blue-900/50' : 'bg-green-900/50'
                    }`}
                  >
                    <FileText
                      className={`h-4 w-4 ${lease.type === 'Finance' ? 'text-blue-400' : 'text-green-400'}`}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{lease.property}</div>
                    <div className="text-xs text-slate-400">
                      {lease.type} Lease | Ends {lease.endDate}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(lease.liability)}</div>
                    <div className="text-xs text-slate-400">Liability</div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      lease.status === 'Active'
                        ? 'bg-green-900/50 text-green-400'
                        : lease.status === 'Expiring Soon'
                          ? 'bg-yellow-900/50 text-yellow-400'
                          : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {lease.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
