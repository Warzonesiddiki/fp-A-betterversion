/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FXEngine, MissingFXRateError } from '@/engines/FXEngine';
import { useFxRateStore } from '@/store/fxRateStore';
import { TrendingUp, TrendingDown, Eye, EyeOff, AlertTriangle, BarChart3 } from 'lucide-react';
import Decimal from 'decimal.js';
import { addMoney, multiplyMoney, roundTo, subtractMoney, sumMoney } from '@/utils/money';
import { CURRENCIES, formatMoney } from './constants';

/**
 * GAP-1 (F-0006) — exact-decimal FX exposure aggregations.
 *
 * Per-currency long/short/net/usdValue were accumulated with raw `+=` and
 * `netLocal * rate` float products, feeding the KPI cards and the
 * large-exposure alert (`> $10M notional`) — display and LOGIC.
 * Percentages (concentration) stay float. Exported for *.money.test.ts.
 */
export interface PositionLike {
  currency: string;
  longAmount: number;
  shortAmount: number;
  entityCurrency?: string;
}

export interface ExposureRow {
  currency: string;
  long: number;
  short: number;
  net: number;
  usdValue: number;
}

export interface ExposureTotals {
  totalLong: number;
  totalShort: number;
  totalNet: number;
}

export function aggregateFXExposure(
  positions: readonly PositionLike[],
  rateFor: (entityCurrency: string, ccy: string) => number | null
): { rows: ExposureRow[]; missingRates: string[] } {
  const agg = new Map<string, { long: Decimal; short: Decimal; net: Decimal; usdValue: Decimal }>();
  const missingRates: string[] = [];
  for (const p of positions) {
    const entCcy = p.entityCurrency ?? 'USD';
    const rate = rateFor(entCcy, p.currency);
    if (rate == null) {
      const key = `${entCcy}_${p.currency}`;
      if (!missingRates.includes(key)) missingRates.push(key);
      continue;
    }
    const netLocal = subtractMoney(p.longAmount, p.shortAmount);
    const usdValue = multiplyMoney(netLocal, rate);
    const existing = agg.get(p.currency) ?? {
      long: new Decimal(0),
      short: new Decimal(0),
      net: new Decimal(0),
      usdValue: new Decimal(0),
    };
    existing.long = existing.long.plus(p.longAmount);
    existing.short = existing.short.plus(p.shortAmount);
    existing.net = existing.net.plus(netLocal);
    existing.usdValue = existing.usdValue.plus(usdValue);
    agg.set(p.currency, existing);
  }
  const rows = Array.from(agg.entries())
    .map(([currency, data]) => ({
      currency,
      long: roundTo(data.long),
      short: roundTo(data.short),
      net: roundTo(data.net),
      usdValue: roundTo(data.usdValue),
    }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  return { rows, missingRates };
}

export function totalFXExposure(rows: readonly ExposureRow[]): ExposureTotals {
  return {
    totalLong: roundTo(sumMoney(rows.map((r) => r.long))),
    totalShort: roundTo(sumMoney(rows.map((r) => r.short))),
    totalNet: roundTo(sumMoney(rows.map((r) => r.net))),
  };
}

export function netPosition(p: { longAmount: number; shortAmount: number }): number {
  return roundTo(subtractMoney(p.longAmount, p.shortAmount));
}

interface FXPosition {
  id: string;
  currency: string;
  longAmount: number;
  shortAmount: number;
  entityCurrency: string;
  counterparty: string;
  maturityDate: string;
}

const SAMPLE_POSITIONS: FXPosition[] = [
  {
    id: 'p1',
    currency: 'EUR',
    longAmount: 2000000,
    shortAmount: 500000,
    entityCurrency: 'USD',
    counterparty: 'Deutsche Bank',
    maturityDate: '2026-07-15',
  },
  {
    id: 'p2',
    currency: 'GBP',
    longAmount: 1500000,
    shortAmount: 300000,
    entityCurrency: 'USD',
    counterparty: 'Barclays',
    maturityDate: '2026-08-20',
  },
  {
    id: 'p3',
    currency: 'JPY',
    longAmount: 100000000,
    shortAmount: 20000000,
    entityCurrency: 'USD',
    counterparty: 'MUFG',
    maturityDate: '2026-09-30',
  },
  {
    id: 'p4',
    currency: 'CHF',
    longAmount: 800000,
    shortAmount: 100000,
    entityCurrency: 'USD',
    counterparty: 'UBS',
    maturityDate: '2026-10-15',
  },
  {
    id: 'p5',
    currency: 'CAD',
    longAmount: 1200000,
    shortAmount: 400000,
    entityCurrency: 'USD',
    counterparty: 'RBC',
    maturityDate: '2026-11-01',
  },
  {
    id: 'p6',
    currency: 'AUD',
    longAmount: 600000,
    shortAmount: 200000,
    entityCurrency: 'USD',
    counterparty: 'NAB',
    maturityDate: '2026-12-15',
  },
];

export function FXPositionGrid() {
  const storeRates = useFxRateStore((s) => s.rates);
  const [positions, setPositions] = useState<FXPosition[]>(SAMPLE_POSITIONS);
  const [hideZero, setHideZero] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);

  const ratesMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of storeRates) {
      map.set(`${r.fromCurrency}_${r.toCurrency}`, r.rate);
    }
    return map;
  }, [storeRates]);

  // F-0001: positions whose FX rate is missing are EXCLUDED from translated
  // values and reported via a blocking banner. The old code silently valued
  // them at their LOCAL amount as if it were USD (`rate > 0 ? ... : netLocal`).
  const exposureResult = useMemo(() => {
    const rateFor = (entityCurrency: string, ccy: string): number | null => {
      const key = `${entityCurrency}_${ccy}`;
      const r = ratesMap.get(key);
      if (r !== undefined) return r;
      try {
        return FXEngine.getRate(entityCurrency, ccy);
      } catch (e) {
        if (e instanceof MissingFXRateError) return null;
        throw e;
      }
    };
    const result = aggregateFXExposure(positions, rateFor);
    result.rows = result.rows.filter((e) => !hideZero || e.net !== 0);
    return result;
  }, [positions, ratesMap, hideZero]);
  const exposure = exposureResult.rows;
  const missingRatePairs = exposureResult.missingRates;

  const totals = useMemo(() => totalFXExposure(exposure), [exposure]);

  const currencyDetail = useMemo(
    () => positions.filter((p) => p.currency === selectedCurrency),
    [positions, selectedCurrency]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" /> FX Position Grid
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {positions.length} positions across {exposure.length} currencies
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setHideZero((v) => !v)}>
          {hideZero ? (
            <>
              <EyeOff className="h-3.5 w-3.5 mr-1.5" /> Show Zero
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5 mr-1.5" /> Hide Zero
            </>
          )}
        </Button>
      </div>

      {missingRatePairs.length > 0 && (
        <div
          role="alert"
          className="rounded-md border border-amber-500 bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-800 dark:text-amber-300"
        >
          {missingRatePairs.length} position(s) excluded from translated values: no FX rate for{' '}
          {missingRatePairs.map((k) => k.replace('_', '→')).join(', ')}. Load the missing rates to
          include them — untranslated amounts are never shown as USD.
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Total Long</div>
            <div className="text-lg font-bold tabular-nums text-green-400">
              {formatMoney(totals.totalLong)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Total Short</div>
            <div className="text-lg font-bold tabular-nums text-red-400">
              {formatMoney(totals.totalShort)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Net Exposure</div>
            <div
              className="text-lg font-bold tabular-nums"
              style={{ color: totals.totalNet >= 0 ? '#16A34A' : '#DC2626' }}
            >
              {formatMoney(totals.totalNet)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-slate-400">Concentration</div>
            <div className="text-lg font-bold">
              {exposure.length > 0
                ? `${((Math.abs(exposure[0]!.net) / Math.abs(totals.totalNet)) * 100).toFixed(0)}%`
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                <th className="px-4 py-3" scope="col">
                  Currency
                </th>
                <th className="px-4 py-3 text-right" scope="col">
                  Long
                </th>
                <th className="px-4 py-3 text-right" scope="col">
                  Short
                </th>
                <th className="px-4 py-3 text-right" scope="col">
                  Net
                </th>
                <th className="px-4 py-3 text-right" scope="col">
                  USD Value
                </th>
                <th className="px-4 py-3 text-right" scope="col">
                  Positions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {exposure.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No positions.
                  </td>
                </tr>
              ) : (
                exposure.map((e) => (
                  <tr
                    key={e.currency}
                    className="hover:bg-slate-900/50 cursor-pointer"
                    onClick={() =>
                      setSelectedCurrency(selectedCurrency === e.currency ? null : e.currency)
                    }
                  >
                    <td className="px-4 py-3 font-mono font-medium">{e.currency}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-green-400">
                      {formatMoney(e.long, e.currency)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-400">
                      {formatMoney(e.short, e.currency)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      <span
                        className="flex items-center justify-end gap-1"
                        style={{ color: e.net >= 0 ? '#16A34A' : '#DC2626' }}
                      >
                        {e.net >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {formatMoney(e.net, e.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(e.usdValue)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline">
                        {positions.filter((p) => p.currency === e.currency).length}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Modal isOpen={selectedCurrency !== null} onClose={() => setSelectedCurrency(null)}>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">{selectedCurrency} Position Details</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-700">
                <th className="px-2 py-2" scope="col">
                  Counterparty
                </th>
                <th className="px-2 py-2 text-right" scope="col">
                  Long
                </th>
                <th className="px-2 py-2 text-right" scope="col">
                  Short
                </th>
                <th className="px-2 py-2 text-right" scope="col">
                  Net
                </th>
                <th className="px-2 py-2" scope="col">
                  Maturity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {currencyDetail.map((p) => {
                const netLocal = netPosition(p);
                return (
                  <tr key={p.id}>
                    <td className="px-2 py-2">{p.counterparty}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-green-400">
                      {formatMoney(p.longAmount, p.currency)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-red-400">
                      {formatMoney(p.shortAmount, p.currency)}
                    </td>
                    <td
                      className="px-2 py-2 text-right tabular-nums font-medium"
                      style={{ color: netLocal >= 0 ? '#16A34A' : '#DC2626' }}
                    >
                      {formatMoney(netLocal, p.currency)}
                    </td>
                    <td className="px-2 py-2 text-slate-400">{p.maturityDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={() => setSelectedCurrency(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {exposure.some((e) => Math.abs(e.net) > 10000000) && (
        <Card className="border-amber-600">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-400">Large Exposure Detected</p>
              <p className="text-xs text-slate-400">
                Some positions exceed $10M notional. Consider hedging to reduce FX risk.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
