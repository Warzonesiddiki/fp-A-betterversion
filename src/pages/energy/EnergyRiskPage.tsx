import { ShieldAlert } from 'lucide-react';

/**
 * Energy risk management (session 024).
 *
 * The pre-session-024 page rendered a fictional trading book for every
 * tenant: a six-month spot/forward/volatility fixture, four commodity
 * exposures with hedge amounts, four named-counterparty derivative
 * positions, and four literal KPIs — Value at Risk, net hedge ratio,
 * counterparty risk and average volatility. It read no store at all.
 *
 * This workspace records NO market-risk data: `energyStore` carries
 * renewable generation only, there is no hedge/derivative position store,
 * and no importer feeds spot/forward prices. VaR in particular requires a
 * recorded price history and a stated confidence interval — inventing one
 * is exactly the Severity-0 class this wave removes. The page therefore
 * empty-states and discloses what is missing (K18: a wrong number is worse
 * than a missing feature).
 */
export default function EnergyRiskPage() {
  return (
    <main
      className="p-12 text-center max-w-lg mx-auto"
      role="main"
      aria-label="Energy Risk Management"
    >
      <ShieldAlert className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
      <h1 className="text-xl font-semibold mb-2">Energy Risk Management</h1>
      <p className="text-[var(--text-muted)]">
        No market-risk data is recorded in this workspace. Value at Risk, hedge ratios, counterparty
        exposure and price volatility shown here must be derived from recorded positions and price
        history; none exist yet, so no figure is displayed. Record hedge positions and import price
        history to activate this dashboard.
      </p>
    </main>
  );
}
