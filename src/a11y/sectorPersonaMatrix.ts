// src/a11y/sectorPersonaMatrix.ts
// A11Y v0.7 PICK I.5 — Sector × Persona coverage matrix
// Author: Artemis (slot 019ecc6f-1c22-73a2-8b4c-f9ff284f2016) — A11Y Domain Owner
// Date: 2026-06-17
// Cross-witness: Vesta SECTOR_A11Y_AUDIT v0.1 @ 512d3fbd (16 sectors × 18 personas = 288 cells)
// Updated for PICK I.5: 19 personas × 16 sectors = 304 cells.
// Drives the P-E (Sector × persona) test pattern.

import {
  PERSONA_REGISTRY,
  getPersonasBySector,
  type PersonaAlias,
  type PersonaAliasId,
} from './personaRegistry';

/** Canonical sector id (1-16, matches Vesta SECTOR_A11Y_AUDIT v0.1). */
export type SectorId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

/** Canonical sector name (matches Vesta SECTOR_A11Y_AUDIT v0.1). */
export const SECTOR_NAMES: Readonly<Record<SectorId, string>> = {
  1: 'Banking',
  2: 'Insurance',
  3: 'Asset Management',
  4: 'Real Estate',
  5: 'Retail',
  6: 'Manufacturing',
  7: 'Healthcare',
  8: 'Financial Services',
  9: 'Government',
  10: 'Energy',
  11: 'Pharma',
  12: 'Education',
  13: 'Technology',
  14: 'Media',
  15: 'Transportation',
  16: 'Other',
};

/** A single Sector × Persona cell from the matrix. */
export interface SectorPersonaCell {
  readonly sector: SectorId;
  readonly persona: PersonaAliasId;
  /** Number of WCAG 2.1/2.2 checks required for this cell (typically 1). */
  readonly checkCount: number;
  /** True if this cell is in a high-compliance sector (7-12). */
  readonly highCompliance: boolean;
}

/** Sector × Persona matrix — 19 personas × 16 sectors = 304 cells. */
export const SECTOR_PERSONA_MATRIX: readonly SectorPersonaCell[] = (() => {
  const cells: SectorPersonaCell[] = [];
  for (let s = 1; s <= 16; s++) {
    const sector = s as SectorId;
    const personasInSector = getPersonasBySector(sector);
    for (const persona of personasInSector) {
      cells.push({
        sector,
        persona: persona.id,
        checkCount: 1,
        highCompliance: s >= 7 && s <= 12,
      });
    }
  }
  return cells;
})();

/** Total cell count (used by Husky Gate 15 + Vesta audit). */
export const SECTOR_PERSONA_MATRIX_CELL_COUNT = SECTOR_PERSONA_MATRIX.length; // 304

/** High-compliance cells (sectors 7-12 × 19 personas = 114 cells). */
export const SECTOR_PERSONA_MATRIX_HC_CELL_COUNT =
  PERSONA_REGISTRY.filter((p) => p.primarySectors.some((s) => s >= 7 && s <= 12)).length * 6; // 6 high-compliance sectors per persona

/** getCellsForPersona — Filter the matrix to all cells for a given persona. */
export function getCellsForPersona(personaId: PersonaAliasId): readonly SectorPersonaCell[] {
  return SECTOR_PERSONA_MATRIX.filter((c) => c.persona === personaId);
}

/** getCellsForSector — Filter the matrix to all cells for a given sector. */
export function getCellsForSector(sector: SectorId): readonly SectorPersonaCell[] {
  return SECTOR_PERSONA_MATRIX.filter((c) => c.sector === sector);
}

/** getHighComplianceCells — Filter the matrix to high-compliance sector cells (7-12). */
export function getHighComplianceCells(): readonly SectorPersonaCell[] {
  return SECTOR_PERSONA_MATRIX.filter((c) => c.highCompliance);
}

/** validateSectorPersonaMatrix — Returns validation errors. Empty = OK. */
export function validateSectorPersonaMatrix(): readonly string[] {
  const errors: string[] = [];
  // Every persona must have at least 1 sector mapping.
  for (const persona of PERSONA_REGISTRY) {
    if (persona.primarySectors.length === 0) {
      errors.push(`${persona.id}: no sector mapping (P-E pattern gap)`);
    }
  }
  // Every sector 7-12 must be covered by at least the regulatory-tier persona.
  for (let s = 7; s <= 12; s++) {
    const sector = s as SectorId;
    const inSector = getPersonasBySector(sector);
    if (!inSector.some((p: PersonaAlias) => p.tier === 'regulatory')) {
      errors.push(
        `Sector ${sector} (${SECTOR_NAMES[sector]}): no regulatory-tier persona — Vesta gap`
      );
    }
  }
  return errors;
}
