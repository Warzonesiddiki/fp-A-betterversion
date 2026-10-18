import { describe, it, expect } from 'vitest';
import { SECTOR_VERIFICATION, sectorVerification } from './sectorVerification';
import type { SectorDriverId } from './SectorDriverDashboard';

/**
 * Phase 11: every sector the canonical dashboard can render is
 * classified; unknown sectors fail closed to EXPERIMENTAL.
 */

const ALL_SECTORS: SectorDriverId[] = [
  'technology',
  'manufacturing',
  'banking',
  'retail',
  'energy',
  'construction',
  'logistics',
  'healthcare',
  'government',
  'education',
  'realestate',
  'insurance',
];

describe('SECTOR_VERIFICATION', () => {
  it('classifies every sector id the dashboard supports', () => {
    for (const id of ALL_SECTORS) {
      expect(SECTOR_VERIFICATION[id], id).toBeDefined();
    }
    expect(Object.keys(SECTOR_VERIFICATION).sort()).toEqual([...ALL_SECTORS].sort());
  });

  it('only government and education are experimental (no derived KPI yet)', () => {
    const experimental = ALL_SECTORS.filter((id) => SECTOR_VERIFICATION[id] === 'experimental');
    expect(experimental.sort()).toEqual(['education', 'government']);
  });

  it('unknown sectors fail closed to experimental', () => {
    expect(sectorVerification('astrology')).toBe('experimental');
  });
});
