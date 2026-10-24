import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import {
  allocatePurchasePrice,
  testGoodwillImpairment,
  type FairValueItem,
} from '@/engines/AcquisitionAccounting';

/**
 * Phase 8 remainder — acquisition workflow for the ASC 805/350
 * engine (previously catalogued EXPERIMENTAL for lack of a product
 * path). The user supplies the deal inputs (consideration, NCI
 * basis, fair-value schedule); the engine computes. Fair values are
 * appraisal inputs, never derived from the ledger, and the panel
 * says so. Results are a computation aid for the consolidation
 * workflow — they do not post anything.
 */

interface ItemRow {
  name: string;
  fairValue: string;
}

function toItems(rows: ItemRow[]): FairValueItem[] {
  return rows
    .filter((r) => r.name.trim() !== '' || r.fairValue !== '')
    .map((r) => ({ name: r.name.trim() || 'Item', fairValue: Number(r.fairValue) || 0 }));
}

function ItemEditor({
  title,
  rows,
  setRows,
}: {
  title: string;
  rows: ItemRow[];
  setRows: (rows: ItemRow[]) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{title}</legend>
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input
            aria-label={`${title} name ${i + 1}`}
            className="flex-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-sm"
            placeholder="Name"
            value={row.name}
            onChange={(e) =>
              setRows(rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))
            }
          />
          <input
            aria-label={`${title} fair value ${i + 1}`}
            className="w-36 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-sm"
            placeholder="Fair value"
            type="number"
            min="0"
            value={row.fairValue}
            onChange={(e) =>
              setRows(rows.map((r, j) => (j === i ? { ...r, fairValue: e.target.value } : r)))
            }
          />
        </div>
      ))}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setRows([...rows, { name: '', fairValue: '' }])}
      >
        Add row
      </Button>
    </fieldset>
  );
}

export function AcquisitionWorkflowCard() {
  const fmt = useCurrencyFormatter();
  const [consideration, setConsideration] = useState('');
  const [nciMode, setNciMode] = useState<'fv' | 'proportionate'>('fv');
  const [nciFairValue, setNciFairValue] = useState('');
  const [ownershipPct, setOwnershipPct] = useState('80');
  const [prevHeld, setPrevHeld] = useState('0');
  const [assets, setAssets] = useState<ItemRow[]>([{ name: '', fairValue: '' }]);
  const [liabilities, setLiabilities] = useState<ItemRow[]>([{ name: '', fairValue: '' }]);
  const [unitCarrying, setUnitCarrying] = useState('');
  const [unitFairValue, setUnitFairValue] = useState('');
  const [goodwillCarrying, setGoodwillCarrying] = useState('');

  const ppa = useMemo(() => {
    try {
      return {
        result: allocatePurchasePrice({
          considerationTransferred: Number(consideration) || 0,
          nonControllingInterestFairValue: nciMode === 'fv' ? Number(nciFairValue) || 0 : null,
          ownershipPct: nciMode === 'proportionate' ? Number(ownershipPct) || 0 : undefined,
          previouslyHeldInterestFairValue: Number(prevHeld) || 0,
          identifiableAssets: toItems(assets),
          liabilitiesAssumed: toItems(liabilities),
        }),
        error: null as string | null,
      };
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : 'Invalid inputs' };
    }
  }, [consideration, nciMode, nciFairValue, ownershipPct, prevHeld, assets, liabilities]);

  const impairment = useMemo(() => {
    try {
      return {
        result: testGoodwillImpairment({
          reportingUnitCarryingAmount: Number(unitCarrying) || 0,
          reportingUnitFairValue: Number(unitFairValue) || 0,
          goodwillCarryingAmount: Number(goodwillCarrying) || 0,
        }),
        error: null as string | null,
      };
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : 'Invalid inputs' };
    }
  }, [unitCarrying, unitFairValue, goodwillCarrying]);

  const numField = (label: string, value: string, set: (v: string) => void) => (
    <label className="block text-sm">
      <span className="mb-1 block text-[var(--text-muted)]">{label}</span>
      <input
        aria-label={label}
        className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1"
        type="number"
        min="0"
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    </label>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Acquisition Accounting (ASC 805 / 350)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-xs text-[var(--text-muted)]">
          Fair values below are appraisal inputs you supply — they are not derived from the ledger.
          Results compute only; nothing is posted.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {numField('Consideration transferred', consideration, setConsideration)}
          {numField('Previously held interest (FV)', prevHeld, setPrevHeld)}
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--text-muted)]">NCI basis</span>
            <select
              aria-label="NCI basis"
              className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1"
              value={nciMode}
              onChange={(e) => setNciMode(e.target.value as 'fv' | 'proportionate')}
            >
              <option value="fv">Fair value (full goodwill)</option>
              <option value="proportionate">Proportionate share (partial goodwill)</option>
            </select>
          </label>
          {nciMode === 'fv'
            ? numField('NCI fair value', nciFairValue, setNciFairValue)
            : numField('Ownership acquired %', ownershipPct, setOwnershipPct)}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ItemEditor title="Identifiable assets" rows={assets} setRows={setAssets} />
          <ItemEditor title="Liabilities assumed" rows={liabilities} setRows={setLiabilities} />
        </div>

        {ppa.error ? (
          <p role="alert" className="text-sm text-[var(--text-negative)]">
            {ppa.error}
          </p>
        ) : (
          ppa.result && (
            <div className="space-y-1 text-sm" aria-label="Purchase price allocation result">
              <div className="flex justify-between max-w-md">
                <span>Net identifiable assets</span>
                <span>{fmt.currency(ppa.result.netIdentifiableAssets)}</span>
              </div>
              <div className="flex justify-between max-w-md">
                <span>Attributed total ({ppa.result.method} goodwill method)</span>
                <span>{fmt.currency(ppa.result.attributedTotal)}</span>
              </div>
              <div className="flex justify-between max-w-md font-semibold">
                <span>Goodwill</span>
                <span>{fmt.currency(ppa.result.goodwill)}</span>
              </div>
              {ppa.result.bargainPurchaseGain > 0 && (
                <div className="flex justify-between max-w-md">
                  <span>Bargain purchase gain</span>
                  <span>{fmt.currency(ppa.result.bargainPurchaseGain)}</span>
                </div>
              )}
            </div>
          )
        )}

        <fieldset className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
          <legend className="text-sm font-medium">Goodwill impairment test (ASC 350)</legend>
          <div className="grid gap-3 md:grid-cols-3">
            {numField('Reporting unit carrying amount', unitCarrying, setUnitCarrying)}
            {numField('Reporting unit fair value', unitFairValue, setUnitFairValue)}
            {numField('Goodwill carrying amount', goodwillCarrying, setGoodwillCarrying)}
          </div>
          {impairment.error ? (
            <p role="alert" className="text-sm text-[var(--text-negative)]">
              {impairment.error}
            </p>
          ) : (
            impairment.result && (
              <div className="space-y-1 text-sm" aria-label="Impairment result">
                <div className="flex justify-between max-w-md">
                  <span>Impairment loss</span>
                  <span>{fmt.currency(impairment.result.impairmentLoss)}</span>
                </div>
                <div className="flex justify-between max-w-md">
                  <span>Goodwill after impairment</span>
                  <span>{fmt.currency(impairment.result.goodwillAfterImpairment)}</span>
                </div>
              </div>
            )
          )}
        </fieldset>
      </CardContent>
    </Card>
  );
}
