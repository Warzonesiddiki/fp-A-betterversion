import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Leaf, ShieldCheck } from 'lucide-react';
import { sumMoney, roundTo, subtractMoney } from '@/utils/money';
import { PageHeader } from '@/components/ui/PageHeader';

/**
 * Emissions trading (sector route) — vertical truthfulness sweep (wave 2).
 *
 * This routed copy of the emissions page still carried the fabricated
 * portfolio and compliance cards its `energy/` twin shed in session 028:
 * a fictional allowance inventory (holdings, retirements, availability,
 * an average price) and a fictional compliance block (obligation volume,
 * compliance rate, shortfall, estimated penalty). No store in this app
 * records an allowance position, a market price or a regulatory cap.
 *
 * What remains is exactly what the posted general ledger supports: debits on
 * accounts whose name mentions emission/carbon (credit spend), offset spend,
 * their count and net difference — labelled as ledger amounts, not physical
 * tonnes. Inventory and compliance are disclosed as requiring an allowance
 * registry, matching the `energy/EmissionsTradingPage` contract.
 */

export default function EmissionsTradingPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Emissions Trading';
  }, []);

  const stats = useMemo(() => {
    const credits = entries.filter(
      (e) =>
        e.accountName.toLowerCase().includes('emission') ||
        e.accountName.toLowerCase().includes('carbon')
    );
    const creditValue = roundTo(sumMoney(credits.map((e) => e.debit)), 2);
    const offsetCost = roundTo(
      sumMoney(
        entries.filter((e) => e.accountName.toLowerCase().includes('offset')).map((e) => e.debit)
      ),
      2
    );
    return { creditValue, offsetCost, count: credits.length };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <main
        className="p-12 text-center"
        role="main"
        aria-label="Emissions Trading Dashboard - No Data"
      >
        <Leaf className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Emissions Trading — No Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data to view carbon-related postings.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <PageHeader
        title="Emissions Trading"
        purpose="Posted carbon and offset amounts from the general ledger."
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue label="Carbon Credit Spend" value={formatCurrency(stats.creditValue)} />
        <KPIValue label="Offset Spend" value={formatCurrency(stats.offsetCost)} />
        <KPIValue label="Matched Entries" value={formatNumber(stats.count)} />
        <KPIValue
          label="Net Position"
          value={formatCurrency(subtractMoney(stats.creditValue, stats.offsetCost).toNumber())}
        />
      </section>
      <p className="text-xs text-[var(--text-muted)]">
        Basis: debits on accounts whose name mentions emission, carbon or offset. These are posted
        currency amounts — not holdings in tCO₂e; no allowance ledger exists to count tonnes.
      </p>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Allowance Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
              <p>
                No allowance positions are recorded in this workspace. Quantities held, vintages,
                retirement status and market value require an allowance registry and a stated market
                price — neither exists in the current data model. Connect one to populate this card.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
              <p>
                Regulatory obligations, compliance rates, shortfalls and penalty exposure require a
                regulator record (cap, scheme, accreditation) and verified retirement certificates.
                None are derivable from posted amounts, so they are omitted rather than estimated.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
