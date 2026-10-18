import type { SectorDriverId } from './SectorDriverDashboard';

/**
 * Phase 11 — sector verification registry.
 *
 * Sector certification (checklist extension E5, §14.9 depth) is not
 * complete for ANY sector. What IS measured today, per sector, is
 * whether the canonical SectorDriverDashboard exposes at least one
 * KPI derived from the classified GL and pinned by the oracle table
 * in `SectorDriverDashboard.money.test.ts` ("derived vs simulator
 * separation"). Sectors with no GL-derivable KPI are labelled
 * EXPERIMENTAL in the UI: their screens show simulator projections
 * only, and a projection must never read as a measurement.
 *
 * When a sector gains a derived KPI, update both the oracle table
 * and this registry in the same change — the registry test pins the
 * two together.
 */
export type SectorVerification = 'derived-verified' | 'experimental';

export const SECTOR_VERIFICATION: Record<SectorDriverId, SectorVerification> = {
  technology: 'derived-verified',
  manufacturing: 'derived-verified',
  banking: 'derived-verified',
  retail: 'derived-verified',
  energy: 'derived-verified',
  construction: 'derived-verified',
  logistics: 'derived-verified',
  healthcare: 'derived-verified',
  insurance: 'derived-verified',
  realestate: 'derived-verified',
  government: 'experimental',
  education: 'experimental',
};

export function sectorVerification(sectorId: string): SectorVerification {
  return (SECTOR_VERIFICATION as Record<string, SectorVerification>)[sectorId] ?? 'experimental';
}
