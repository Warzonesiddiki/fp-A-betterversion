import { Wrench } from 'lucide-react';

/**
 * Equipment management (session 024).
 *
 * The pre-session-024 page rendered a fictional fleet — five named assets
 * with utilization, fuel efficiency and service dates, four hardcoded KPIs
 * (fleet utilization, maintenance cost, equipment ROI, downtime) and a
 * six-month utilization trend — for every tenant, from module literals.
 *
 * This workspace records NO equipment, telemetry or maintenance data:
 * there is no equipment store, no asset ledger and no integration that
 * feeds fleet hours. Rather than display invented figures, the page
 * empty-states and discloses exactly what is missing (K18: a wrong number
 * is worse than a missing feature).
 */
export default function EquipmentManagementPage() {
  return (
    <main
      className="p-12 text-center max-w-lg mx-auto"
      role="main"
      aria-label="Equipment Management"
    >
      <Wrench className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
      <h1 className="text-xl font-semibold mb-2">Equipment Management</h1>
      <p className="text-[var(--text-muted)]">
        No fleet data is recorded in this workspace. Utilization, fuel efficiency, maintenance
        schedules and downtime shown here must come from recorded equipment assets and telemetry;
        none exist yet, so no figure is displayed. Connect an equipment source or record fleet data
        to activate this dashboard.
      </p>
    </main>
  );
}
