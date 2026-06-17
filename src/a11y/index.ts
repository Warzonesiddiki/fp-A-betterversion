// src/a11y/index.ts
// A11Y v0.7 PICK I.5 — barrel export for the persona A11Y module
// Author: Artemis (slot 019ecc6f-1c22-73a2-8b4c-f9ff284f2016) — A11Y Domain Owner
// Date: 2026-06-17
// Status: SHIPPED via PICK I.5 implementation

export {
  PERSONA_REGISTRY,
  PERSONA_REGISTRY_COUNT,
  getPersonaById,
  getPersonasByTier,
  getPersonasBySector,
  getAllPersonaIds,
} from './personaRegistry';
export type {
  PersonaAliasId,
  PersonaTier,
  PersonaAlias,
  PersonaA11yProfile,
  ScreenReaderPrimary,
} from './personaRegistry';

export {
  A11Y_DIMENSIONS,
  DIMENSION_WCAG_SC,
  DIMENSION_TEST_COUNT,
  TOTAL_TESTS_PER_ALIAS,
  getPerceivableAttributes,
  getOperableAttributes,
  getUnderstandableAttributes,
  getRobustAttributes,
  getCognitiveAttributes,
  getMobileAttributes,
  getPersonaA11yAttributes,
  validatePersonaA11yProfile,
} from './personaA11y';
export type {
  PersonaDimensionA11yAttributes,
  PersonaA11yAttributes,
  A11yDimensionName,
} from './personaA11y';

export {
  PERSONA_HELP_MAP,
  getHelpTopicsForPersona,
  getAllPrimaryHelpTopicIds,
  validatePersonaHelpMap,
} from './personaHelpMap';
export type { PersonaHelpTopics, HelpTopicId } from './personaHelpMap';

export {
  PERSONA_SHORTCUTS,
  getShortcutsForPersona,
  getAllBindingsFlat,
  validatePersonaShortcuts,
} from './personaShortcuts';
export type {
  PersonaShortcuts,
  PersonaShortcutBinding,
  KeyboardShortcut,
} from './personaShortcuts';

export {
  SECTOR_PERSONA_MATRIX,
  SECTOR_PERSONA_MATRIX_CELL_COUNT,
  SECTOR_PERSONA_MATRIX_HC_CELL_COUNT,
  SECTOR_NAMES,
  getCellsForPersona,
  getCellsForSector,
  getHighComplianceCells,
  validateSectorPersonaMatrix,
} from './sectorPersonaMatrix';
export type { SectorId, SectorPersonaCell } from './sectorPersonaMatrix';
