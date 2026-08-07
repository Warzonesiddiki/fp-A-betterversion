import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { AlertTriangle, TrendingDown, Download, CheckCircle } from 'lucide-react';
import { ImpairmentEngine } from '@/engines/ImpairmentEngine';
import { DepreciationEngine } from '@/engines/DepreciationEngine';
import { roundTo, sumMoney } from '@/utils/money';
import { formatCompact } from '@/utils/financialFormatting';

interface Asset {
  id: string;
  name: string;
  carryingAmount: number;
  recoverableAmount: number;
  impairmentLoss: number;
  status: 'impaired' | 'not_impaired' | 'reversed';
  testDate: string;
}

interface AssetInput {
  id: string;
  name: string;
  carryingAmount: number;
  /** Fair value less costs to sell (observed market value — input). */
  fairValueLessCostsToSell: number;
  /** Cash flows for the value-in-use DCF (IAS 36). */
  cashFlows: number[];
  discountRate: number;
  testDate: string;
}

const ASSET_INPUTS: AssetInput[] = [
  {
    id: '1',
    name: 'Manufacturing Plant A',
    carryingAmount: 5000000,
    fairValueLessCostsToSell: 4200000,
    cashFlows: [900000, 900000, 900000, 900000, 900000],
    discountRate: 0.08,
    testDate: '2026-03-31',
  },
  {
    id: '2',
    name: 'Office Building B',
    carryingAmount: 3000000,
    fairValueLessCostsToSell: 3200000,
    cashFlows: [700000, 700000, 700000, 700000, 700000],
    discountRate: 0.08,
    testDate: '2026-03-31',
  },
  {
    id: '3',
    name: 'IT Equipment',
    carryingAmount: 800000,
    fairValueLessCostsToSell: 600000,
    cashFlows: [150000, 150000, 150000, 150000, 150000],
    discountRate: 0.1,
    testDate: '2026-03-31',
  },
  {
    id: '4',
    name: 'Goodwill',
    carryingAmount: 2000000,
    fairValueLessCostsToSell: 1800000,
    cashFlows: [400000, 400000, 400000, 400000, 400000],
    discountRate: 0.1,
    testDate: '2026-03-31',
  },
  {
    id: '5',
    name: 'Delivery Fleet',
    carryingAmount: 450000,
    fairValueLessCostsToSell: 470000,
    cashFlows: [110000, 110000, 110000, 110000, 110000],
    discountRate: 0.08,
    testDate: '2026-03-31',
  },
];

// REAL impairment test (IAS 36): recoverable amount = max(value-in-use DCF, fair
// value less costs to sell) via ImpairmentEngine; verdict + loss via
// DepreciationEngine.impairmentTest (pure). The stateful
// ImpairmentEngine.testImpairment is intentionally avoided at module load (no
// global history mutation in a read-only page).
const ASSETS: Asset[] = ASSET_INPUTS.map((input) => {
  const valueInUse = ImpairmentEngine.calculateValueInUse(input.cashFlows, input.discountRate);
  const recoverableAmount = ImpairmentEngine.calculateRecoverableAmount(
    valueInUse,
    input.fairValueLessCostsToSell
  );
  const verdict = DepreciationEngine.impairmentTest(input.carryingAmount, recoverableAmount);
  return {
    id: input.id,
    name: input.name,
    carryingAmount: input.carryingAmount,
    recoverableAmount: Math.round(recoverableAmount),
    impairmentLoss: verdict.impairmentLoss,
    status: verdict.isImpaired ? ('impaired' as const) : ('not_impaired' as const),
    testDate: input.testDate,
  };
});

export default function ImpairmentPage() {
  const assets = ASSETS;
  const impaired = assets.filter((a) => a.status === 'impaired');
  const totalCarrying = roundTo(sumMoney(assets.map((a) => a.carryingAmount)), 2);
  const totalRecoverable = roundTo(sumMoney(assets.map((a) => a.recoverableAmount)), 2);
  const totalLoss = roundTo(sumMoney(assets.map((a) => a.impairmentLoss)), 2);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Impairment Testing</h1>
          <p className="text-muted-foreground">IAS 36 / ASC 360 asset impairment analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Total Carrying Amount"
              value={totalCarrying}
              icon={<TrendingDown className="h-4 w-4" />}
              format="currency"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue label="Total Recoverable" value={totalRecoverable} format="currency" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Total Impairment Loss"
              value={totalLoss}
              icon={<AlertTriangle className="h-4 w-4" />}
              format="currency"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Assets Impaired"
              value={impaired.length}
              icon={<CheckCircle className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Impairment Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm" aria-label="Impairment testing results">
            <caption className="sr-only">Detailed breakdown of impairment testing results</caption>
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th
                  scope="col"
                  className="text-left px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Asset
                </th>
                <th
                  scope="col"
                  className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Carrying Amt
                </th>
                <th
                  scope="col"
                  className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Recoverable
                </th>
                <th
                  scope="col"
                  className="text-right px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Impairment
                </th>
                <th
                  scope="col"
                  className="text-center px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="text-center px-3 py-2 text-xs font-medium text-[var(--text-muted)]"
                >
                  Test Date
                </th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr
                  key={asset.id}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]"
                >
                  <td className="px-3 py-2">{asset.name}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    ${asset.carryingAmount ? formatCompact(asset.carryingAmount) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    ${asset.recoverableAmount ? formatCompact(asset.recoverableAmount) : '—'}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono ${asset.impairmentLoss > 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {asset.impairmentLoss > 0
                      ? `($${asset.impairmentLoss ? formatCompact(asset.impairmentLoss) : '—'})`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        asset.status === 'impaired'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : asset.status === 'reversed'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {asset.status === 'impaired'
                        ? 'Impaired'
                        : asset.status === 'reversed'
                          ? 'Reversed'
                          : 'Not Impaired'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                    {asset.testDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
