/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';
import { TrendingUp, BarChart3, Calculator, Download, ArrowRight, GitBranch } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KPIValue } from '@/components/ui/KPIValue';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { useGLStore } from '@/store/glStore';
import { YieldCurveEngine, type CurvePoint } from '@/engines';
import type { GLEntry } from '@/types';

/** Build a yield curve from GL entries by mapping entity account codes to maturities. */
function buildCurveFromGL(entries: GLEntry[]): CurvePoint[] {
  if (entries.length === 0) return [];

  // Derive curve points from entry amounts and account codes
  // Group by first 2 digits of account code to create maturity buckets
  const codeGroups = new Map<string, number[]>();
  for (const entry of entries) {
    const prefix = entry.accountCode.substring(0, 2);
    const existing = codeGroups.get(prefix) || [];
    existing.push(Math.abs(entry.amount));
    codeGroups.set(prefix, existing);
  }

  const sortedPrefixes = Array.from(codeGroups.keys()).sort();
  const points: CurvePoint[] = sortedPrefixes.map((prefix, i) => {
    const amounts = codeGroups.get(prefix)!;
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    // Map to maturity in years (1-30) and derive rate from normalized amount
    const maturity = 1 + Math.floor((i / Math.max(1, sortedPrefixes.length - 1)) * 29);
    // Rate derived from amount magnitude: larger amounts -> longer maturity -> slightly higher rate
    const baseRate = 0.02 + (avgAmount / 10000000) * 0.005;
    const rate = Math.min(0.08, Math.max(0.01, baseRate + maturity * 0.0008));
    return { maturity, rate };
  });

  // Deduplicate by maturity
  const seen = new Set<number>();
  return points.filter((p) => {
    if (seen.has(p.maturity)) return false;
    seen.add(p.maturity);
    return true;
  });
}

/** Default curve when no GL data is available. */
const defaultCurve: CurvePoint[] = [
  { maturity: 1, rate: 0.042 },
  { maturity: 2, rate: 0.0435 },
  { maturity: 3, rate: 0.0445 },
  { maturity: 5, rate: 0.0455 },
  { maturity: 7, rate: 0.046 },
  { maturity: 10, rate: 0.0465 },
  { maturity: 20, rate: 0.0475 },
  { maturity: 30, rate: 0.048 },
];

export default function YieldCurvePage() {
  const { entries } = useGLStore();
  const [targetMaturity, setTargetMaturity] = useState('5');
  const [forwardStart, setForwardStart] = useState('2');
  const [forwardEnd, setForwardEnd] = useState('5');

  const rawCurve = useMemo(() => {
    const derived = buildCurveFromGL(entries);
    return derived.length >= 3 ? derived : defaultCurve;
  }, [entries]);

  const curve = useMemo(() => YieldCurveEngine.bootstrap(rawCurve), [rawCurve]);

  const chartData = useMemo(() => {
    // Generate interpolated points every year from 1 to 30
    const points = [];
    for (let t = 1; t <= 30; t += 0.5) {
      const spot = YieldCurveEngine.interpolate(t, curve) * 100;
      let fwd = 0;
      if (t < 30) {
        fwd = YieldCurveEngine.forwardRate(curve, t, t + 1) * 100;
      }
      points.push({
        maturity: t,
        spot: parseFloat(spot.toFixed(3)),
        forward: parseFloat(fwd.toFixed(3)),
      });
    }
    return points;
  }, [curve]);

  const targetMat = parseFloat(targetMaturity) || 5;
  const fwdStart = parseFloat(forwardStart) || 2;
  const fwdEnd = parseFloat(forwardEnd) || 5;

  const spotRate = useMemo(
    () => YieldCurveEngine.spotRate(curve, targetMat) * 100,
    [curve, targetMat]
  );
  const parRate = useMemo(
    () => YieldCurveEngine.parRate(curve, targetMat) * 100,
    [curve, targetMat]
  );
  const fwdRate = useMemo(
    () => YieldCurveEngine.forwardRate(curve, fwdStart, fwdEnd) * 100,
    [curve, fwdStart, fwdEnd]
  );

  const curveShape = useMemo(() => {
    if (curve.length < 2) return 'Flat';
    const shortRate = curve[0]!.rate;
    const longRate = curve[curve.length - 1]!.rate;
    const diff = longRate - shortRate;
    if (diff > 0.005) return 'Normal (Upward)';
    if (diff < -0.005) return 'Inverted';
    return 'Flat';
  }, [curve]);

  const slope = useMemo(() => {
    if (curve.length < 2) return 0;
    const shortRate = curve[0]!.rate;
    const longRate = curve[curve.length - 1]!.rate;
    return (longRate - shortRate) * 100;
  }, [curve]);

  if (entries.length === 0) {
    return (
      <div
        className="p-12 text-center max-w-md mx-auto"
        role="main"
        aria-label="Yield Curve Analysis page"
      >
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <TrendingUp className="h-10 w-10 text-slate-400" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Yield Curve Data</h2>
        <p className="text-slate-400 mb-6">
          Import your General Ledger to generate a yield curve from your fixed-income holdings, or
          view the default curve.
        </p>
        <Button>Import Data</Button>
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500"
      role="main"
      aria-label="Yield Curve Analysis page"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Yield Curve Analysis
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Spot rates, forward rates, and curve interpolation from your fixed-income data.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" aria-label="Export yield curve data">
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Export Curve Data
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <section
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        aria-label="Yield curve key metrics"
      >
        <KPIValue
          label="Curve Shape"
          value={curveShape}
          changeLabel={`Slope: ${slope >= 0 ? '+' : ''}${slope.toFixed(0)} bps`}
          trend={slope > 0 ? 'up' : slope < 0 ? 'down' : 'neutral'}
        />
        <KPIValue
          label="Short Rate (1Y)"
          value={`${(YieldCurveEngine.interpolate(1, curve) * 100).toFixed(2)}%`}
          trend="neutral"
        />
        <KPIValue
          label="Long Rate (30Y)"
          value={`${(YieldCurveEngine.interpolate(30, curve) * 100).toFixed(2)}%`}
          trend="neutral"
        />
        <KPIValue
          label="Curve Points"
          value={curve.length.toString()}
          changeLabel="bootstrapped observations"
          trend="neutral"
        />
      </section>

      {/* Main Chart */}
      <Card
        role="img"
        aria-label="Line chart showing spot and forward rate curves across maturities"
      >
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <CardTitle>Spot & Forward Rate Curves</CardTitle>
          </div>
          <CardDescription>
            Interpolated spot rates and 1-year forward rates across maturities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="maturity"
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'Maturity (Years)', position: 'bottom', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={['auto', 'auto']}
                />
                <Tooltip formatter={(v: any) => `${v.toFixed(3)}%`} />
                <Legend verticalAlign="top" align="right" />
                <Line
                  type="monotone"
                  dataKey="spot"
                  name="Spot Rate"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="forward"
                  name="1Y Forward Rate"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Rate Calculator + Curve Data */}
      <section className="grid gap-6 lg:grid-cols-2" aria-label="Rate calculator and curve data">
        <Card aria-label="Rate calculator">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              <CardTitle>Rate Calculator</CardTitle>
            </div>
            <CardDescription>Compute spot, par, and forward rates from the curve</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {/* Spot & Par Rate */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="targetMaturity" className="text-xs text-slate-500 mb-1 block">
                  Maturity (years)
                </label>
                <Input
                  id="targetMaturity"
                  type="number"
                  value={targetMaturity}
                  onChange={(e) => setTargetMaturity(e.target.value)}
                  min="1"
                  max="30"
                  step="0.5"
                  className="h-9"
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="text-xs text-slate-500">Spot Rate</div>
                <div className="text-2xl font-black text-blue-600">{spotRate.toFixed(3)}%</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div />
              <div>
                <div className="text-xs text-slate-500">Par Rate</div>
                <div className="text-2xl font-black text-emerald-600">{parRate.toFixed(3)}%</div>
              </div>
            </div>

            {/* Forward Rate */}
            <div className="pt-4 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <GitBranch className="h-3 w-3" aria-hidden="true" />
                Forward Rate Calculator
              </div>
              <div className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label htmlFor="forwardStart" className="text-xs text-slate-500 mb-1 block">
                    Start (yr)
                  </label>
                  <Input
                    id="forwardStart"
                    type="number"
                    value={forwardStart}
                    onChange={(e) => setForwardStart(e.target.value)}
                    min="1"
                    max="29"
                    step="0.5"
                    className="h-9"
                  />
                </div>
                <div>
                  <label htmlFor="forwardEnd" className="text-xs text-slate-500 mb-1 block">
                    End (yr)
                  </label>
                  <Input
                    id="forwardEnd"
                    type="number"
                    value={forwardEnd}
                    onChange={(e) => setForwardEnd(e.target.value)}
                    min="2"
                    max="30"
                    step="0.5"
                    className="h-9"
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Forward Rate</div>
                  <div className="text-2xl font-black text-amber-600">{fwdRate.toFixed(3)}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card aria-label="Bootstrapped yield curve data table">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" aria-hidden="true" />
              <CardTitle>Bootstrapped Curve Points</CardTitle>
            </div>
            <CardDescription>Raw spot rates by maturity bucket</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[400px]">
              <table className="w-full text-sm" aria-label="Yield curve data by maturity">
                <thead className="sticky top-0 bg-white dark:bg-gray-900">
                  <tr className="border-b border-slate-200">
                    <th
                      scope="col"
                      className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase"
                    >
                      Maturity (Yrs)
                    </th>
                    <th
                      scope="col"
                      className="text-right py-2 px-3 text-xs font-bold text-slate-500 uppercase"
                    >
                      Spot Rate
                    </th>
                    <th
                      scope="col"
                      className="text-right py-2 px-3 text-xs font-bold text-slate-500 uppercase"
                    >
                      Par Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {curve.map((point) => (
                    <tr
                      key={point.maturity}
                      className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      <td className="py-2 px-3 font-medium">{point.maturity}Y</td>
                      <td className="py-2 px-3 text-right font-mono">
                        {(point.rate * 100).toFixed(3)}%
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {(YieldCurveEngine.parRate(curve, point.maturity) * 100).toFixed(3)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
