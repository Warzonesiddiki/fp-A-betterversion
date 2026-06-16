/**
 * ThreatModel — PATCH 10 (Hephaestus, FinPlan Pro v1.0.0, 2026-06-16)
 *
 * SECURITY ARCHITECTURE SERVICE — STRIDE categorization, DREAD risk scoring,
 * control mapping, gap analysis, and residual risk computation.
 *
 * 10.1 STRIDE categorization:
 *      S — Spoofing (authentication, identity)
 *      T — Tampering (data integrity)
 *      R — Repudiation (non-repudiation, audit trail)
 *      I — Information Disclosure (confidentiality, privacy)
 *      D — Denial of Service (availability, performance)
 *      E — Elevation of Privilege (authorization, RBAC)
 * 10.2 Threat class:
 *      id, title, category, asset, attackVector, preconditions,
 *      cweRef, dreadScore, mitigation, status
 * 10.3 Control class:
 *      id, name, type (Preventive|Detective|Corrective),
 *      description, implementation, mitigates (Threat IDs)
 * 10.4 DREAD risk scoring:
 *      D — Damage potential
 *      R — Reproducibility
 *      E — Exploitability
 *      A — Affected users
 *      D — Discoverability
 *      Each dimension scored 1-10; final score is mean → RiskLevel
 * 10.5 Gap analysis:
 *      unmitigated threats (no controls), orphan controls (no threats),
 *      residual risk per asset/category
 * 10.6 Export:
 *      toJSON, toMarkdown, exportReport (full threat model report)
 *
 * CWE references:
 * - CWE-345 (Insufficient Verification of Data Authenticity) — STRIDE-S
 * - CWE-501 (Trust Boundary Violation) — STRIDE-T
 * - CWE-778 (Insufficient Logging) — STRIDE-R
 * - CWE-200 (Exposure of Sensitive Information) — STRIDE-I
 * - CWE-400 (Uncontrolled Resource Consumption) — STRIDE-D
 * - CWE-269 (Improper Privilege Management) — STRIDE-E
 *
 * @module services/ThreatModel
 */

// ── Constants ────────────────────────────────────────────────────────────────

/**
 * THREAT_MODEL_CONSTANTS — exported for downstream consumers
 * (audit logs, RATIFICATION GATE pre-checks, SOC 2 CC7.1 risk assessment).
 */
export const THREAT_MODEL_CONSTANTS = {
  /** Schema version for export compatibility */
  SCHEMA_VERSION: 1,
  /** Maximum threats per model (DoS prevention) */
  MAX_THREATS: 500,
  /** Maximum controls per model (DoS prevention) */
  MAX_CONTROLS: 500,
  /** Maximum threats a single control can mitigate */
  MAX_MITIGATIONS_PER_CONTROL: 100,
  /** Maximum controls that can mitigate a single threat (N+1 redundancy cap) */
  MAX_CONTROLS_PER_THREAT: 10,
  /** DREAD risk score thresholds (mean of 5 dimensions) */
  DREAD_THRESHOLDS: {
    CRITICAL: 8.0, // >= 8.0
    HIGH: 6.0,     // >= 6.0
    MEDIUM: 4.0,   // >= 4.0
    LOW: 0.0,      // < 4.0
  } as const,
  /** Default FinPlan Pro asset taxonomy */
  DEFAULT_ASSETS: [
    'auth-session',
    'jwt-token',
    'financial-data',
    'cube-store',
    'scenario-store',
    'user-pii',
    'api-gateway',
    'websocket-channel',
    'plugin-sandbox',
    'audit-log',
    'encryption-key',
    'rate-limiter',
  ] as const,
  /** STRIDE category labels */
  STRIDE_LABELS: {
    S: 'Spoofing',
    T: 'Tampering',
    R: 'Repudiation',
    I: 'Information Disclosure',
    D: 'Denial of Service',
    E: 'Elevation of Privilege',
  } as const,
} as const;

// ── Enums & Types ────────────────────────────────────────────────────────────

/** STRIDE threat category */
export type ThreatCategory = 'S' | 'T' | 'R' | 'I' | 'D' | 'E';

/** Risk level derived from DREAD score */
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/** Control type — when in the threat lifecycle the control acts */
export type ControlType = 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE';

/** Threat mitigation status */
export type ThreatStatus = 'OPEN' | 'MITIGATED' | 'ACCEPTED' | 'TRANSFERRED';

/** DREAD risk scoring — each dimension 1-10 */
export interface DreadScore {
  /** Damage potential (1=minimal, 10=catastrophic) */
  damage: number;
  /** Reproducibility (1=very hard, 10=always reproducible) */
  reproducibility: number;
  /** Exploitability (1=advanced, 10=no skill required) */
  exploitability: number;
  /** Affected users (1=single, 10=entire user base) */
  affectedUsers: number;
  /** Discoverability (1=obscure, 10=publicly known) */
  discoverability: number;
}

/** Threat instance */
export interface Threat {
  id: string;
  title: string;
  description: string;
  category: ThreatCategory;
  /** Asset identifier from DEFAULT_ASSETS or custom */
  asset: string;
  /** Attack vector description */
  attackVector: string;
  /** Preconditions required for exploit */
  preconditions: string[];
  /** CWE reference (e.g. "CWE-345") */
  cweRef?: string;
  /** DREAD risk score (1-10 per dimension) */
  dreadScore: DreadScore;
  /** Mean DREAD score (computed) */
  dreadMean: number;
  /** Risk level (computed) */
  riskLevel: RiskLevel;
  /** Current mitigation status */
  status: ThreatStatus;
  /** IDs of controls mitigating this threat (computed) */
  mitigatedBy: string[];
  /** ISO timestamp of threat creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

/** Security control instance */
export interface Control {
  id: string;
  name: string;
  type: ControlType;
  description: string;
  /** Implementation reference (file path, function name, etc.) */
  implementation: string;
  /** IDs of threats this control mitigates */
  mitigates: string[];
  /** ISO timestamp of control creation */
  createdAt: string;
}

/** Threat creation input (DREAD computed automatically) */
export interface CreateThreatInput {
  id?: string;
  title: string;
  description: string;
  category: ThreatCategory;
  asset: string;
  attackVector: string;
  preconditions?: string[];
  cweRef?: string;
  dreadScore: DreadScore;
  status?: ThreatStatus;
}

/** Control creation input */
export interface CreateControlInput {
  id?: string;
  name: string;
  type: ControlType;
  description: string;
  implementation: string;
}

/** Gap analysis result */
export interface GapAnalysisResult {
  /** Threats with no mitigating controls */
  unmitigatedThreats: Threat[];
  /** Controls that don't mitigate any threat */
  orphanControls: Control[];
  /** Threats mitigated by only 1 control (no defense-in-depth) */
  singleDefenseThreats: Threat[];
  /** Aggregate risk per STRIDE category */
  riskByCategory: Record<ThreatCategory, { count: number; meanDread: number; maxDread: number }>;
  /** Aggregate risk per asset */
  riskByAsset: Record<string, { count: number; meanDread: number; maxDread: number }>;
  /** Mean residual risk (DREAD mean of all threats) */
  meanResidualRisk: number;
  /** Total threats */
  totalThreats: number;
  /** Total controls */
  totalControls: number;
  /** Total mitigated threats */
  totalMitigated: number;
  /** Mitigation coverage (0.0-1.0) */
  coverage: number;
}

/** Export options */
export interface ExportOptions {
  /** Include JSON manifest */
  includeJson: boolean;
  /** Include Markdown report */
  includeMarkdown: boolean;
  /** Include gap analysis (Markdown only) */
  includeGapAnalysis: boolean;
  /** Include full DREAD breakdown (Markdown only) */
  includeDreadBreakdown: boolean;
}

/** Export result */
export interface ExportResult {
  json?: string;
  markdown?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute mean DREAD score and risk level from a DREAD score object.
 * @param score DREAD score (1-10 per dimension)
 * @returns Mean (0-10) and risk level
 */
export function computeDreadMean(score: DreadScore): { mean: number; riskLevel: RiskLevel } {
  const sum = score.damage + score.reproducibility + score.exploitability + score.affectedUsers + score.discoverability;
  const mean = sum / 5;
  let riskLevel: RiskLevel;
  if (mean >= THREAT_MODEL_CONSTANTS.DREAD_THRESHOLDS.CRITICAL) {
    riskLevel = 'CRITICAL';
  } else if (mean >= THREAT_MODEL_CONSTANTS.DREAD_THRESHOLDS.HIGH) {
    riskLevel = 'HIGH';
  } else if (mean >= THREAT_MODEL_CONSTANTS.DREAD_THRESHOLDS.MEDIUM) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }
  return { mean, riskLevel };
}

/**
 * Validate a DREAD score — all dimensions 1-10 integers.
 */
export function isValidDreadScore(score: DreadScore): boolean {
  const dims: (keyof DreadScore)[] = ['damage', 'reproducibility', 'exploitability', 'affectedUsers', 'discoverability'];
  for (const dim of dims) {
    const v = score[dim];
    if (typeof v !== 'number' || !Number.isFinite(v) || !Number.isInteger(v) || v < 1 || v > 10) {
      return false;
    }
  }
  return true;
}

/**
 * Generate a unique threat ID (THR-XXXXX).
 */
let _threatCounter = 0;
function generateThreatId(): string {
  _threatCounter += 1;
  return `THR-${String(_threatCounter).padStart(5, '0')}`;
}

/**
 * Generate a unique control ID (CTL-XXXXX).
 */
let _controlCounter = 0;
function generateControlId(): string {
  _controlCounter += 1;
  return `CTL-${String(_controlCounter).padStart(5, '0')}`;
}

/** Reset counters (test utility) */
export function _resetThreatModelCounters(): void {
  _threatCounter = 0;
  _controlCounter = 0;
}

// ── Errors ───────────────────────────────────────────────────────────────────

/** Error codes for ThreatModel operations */
export type ThreatModelErrorCode =
  | 'INVALID_DREAD_SCORE'
  | 'DUPLICATE_THREAT_ID'
  | 'DUPLICATE_CONTROL_ID'
  | 'THREAT_NOT_FOUND'
  | 'CONTROL_NOT_FOUND'
  | 'MAX_THREATS_EXCEEDED'
  | 'MAX_CONTROLS_EXCEEDED'
  | 'MAX_MITIGATIONS_EXCEEDED'
  | 'MAX_CONTROLS_PER_THREAT_EXCEEDED'
  | 'INVALID_CATEGORY'
  | 'INVALID_CONTROL_TYPE'
  | 'INVALID_EXPORT_OPTIONS'
  | 'CIRCULAR_DEPENDENCY';

/** Custom error with code */
export class ThreatModelError extends Error {
  public readonly code: ThreatModelErrorCode;
  public readonly details?: Record<string, unknown>;
  constructor(code: ThreatModelErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ThreatModelError';
    this.code = code;
    this.details = details;
  }
}

// ── ThreatModel class ────────────────────────────────────────────────────────

/**
 * ThreatModel — manages threats, controls, mitigations, and gap analysis.
 *
 * Singleton via `getInstance()`; DI via `create()`; reset via `resetInstance()`.
 */
export class ThreatModel {
  private readonly threats: Map<string, Threat> = new Map();
  private readonly controls: Map<string, Control> = new Map();
  private readonly auditEmitter: ((event: ThreatModelAuditEvent) => void) | null = null;
  private modelName: string = 'default';
  private modelVersion: string = '1.0.0';

  // ── Audit event types ────────────────────────────────────────────────────

  /**
   * Construct a ThreatModel. Use `create()` for DI or `getInstance()` for singleton.
   */
  private constructor(auditEmitter?: (event: ThreatModelAuditEvent) => void) {
    if (auditEmitter) {
      this.auditEmitter = auditEmitter;
    }
  }

  /**
   * Create a new ThreatModel instance (dependency injection).
   */
  public static create(auditEmitter?: (event: ThreatModelAuditEvent) => void): ThreatModel {
    return new ThreatModel(auditEmitter);
  }

  // ── Singleton management ─────────────────────────────────────────────────

  private static _instance: ThreatModel | null = null;

  /**
   * Get the singleton ThreatModel instance.
   */
  public static getInstance(): ThreatModel {
    if (!ThreatModel._instance) {
      ThreatModel._instance = new ThreatModel();
    }
    return ThreatModel._instance;
  }

  /**
   * Reset the singleton (test utility).
   */
  public static resetInstance(): void {
    ThreatModel._instance = null;
    _resetThreatModelCounters();
  }

  // ── Model metadata ───────────────────────────────────────────────────────

  /**
   * Set the model name and version.
   */
  public setModelMetadata(name: string, version: string): void {
    this.modelName = name;
    this.modelVersion = version;
  }

  /**
   * Get the model name.
   */
  public getModelName(): string {
    return this.modelName;
  }

  /**
   * Get the model version.
   */
  public getModelVersion(): string {
    return this.modelVersion;
  }

  // ── Threat operations ────────────────────────────────────────────────────

  /**
   * Add a threat. ID is auto-generated if not provided.
   */
  public addThreat(input: CreateThreatInput): Threat {
    if (this.threats.size >= THREAT_MODEL_CONSTANTS.MAX_THREATS) {
      throw new ThreatModelError('MAX_THREATS_EXCEEDED', `Max threats (${THREAT_MODEL_CONSTANTS.MAX_THREATS}) exceeded`);
    }
    if (!isValidDreadScore(input.dreadScore)) {
      throw new ThreatModelError('INVALID_DREAD_SCORE', 'DREAD score must have all 5 dimensions as integers 1-10', { dreadScore: input.dreadScore });
    }
    const id = input.id ?? generateThreatId();
    if (this.threats.has(id)) {
      throw new ThreatModelError('DUPLICATE_THREAT_ID', `Threat ${id} already exists`);
    }
    if (!['S', 'T', 'R', 'I', 'D', 'E'].includes(input.category)) {
      throw new ThreatModelError('INVALID_CATEGORY', `Invalid STRIDE category: ${input.category}`);
    }
    const { mean, riskLevel } = computeDreadMean(input.dreadScore);
    const now = new Date().toISOString();
    const threat: Threat = {
      id,
      title: input.title,
      description: input.description,
      category: input.category,
      asset: input.asset,
      attackVector: input.attackVector,
      preconditions: input.preconditions ?? [],
      cweRef: input.cweRef,
      dreadScore: input.dreadScore,
      dreadMean: mean,
      riskLevel,
      status: input.status ?? 'OPEN',
      mitigatedBy: [],
      createdAt: now,
      updatedAt: now,
    };
    this.threats.set(id, threat);
    this.emitAudit('THREAT_ADDED', { threatId: id, category: input.category, riskLevel });
    return threat;
  }

  /**
   * Get a threat by ID.
   */
  public getThreat(id: string): Threat | undefined {
    return this.threats.get(id);
  }

  /**
   * List all threats.
   */
  public listThreats(): Threat[] {
    return Array.from(this.threats.values()).sort((a, b) => b.dreadMean - a.dreadMean);
  }

  /**
   * List threats by category.
   */
  public listThreatsByCategory(category: ThreatCategory): Threat[] {
    return this.listThreats().filter((t) => t.category === category);
  }

  /**
   * List threats by risk level.
   */
  public listThreatsByRiskLevel(level: RiskLevel): Threat[] {
    return this.listThreats().filter((t) => t.riskLevel === level);
  }

  /**
   * List threats by asset.
   */
  public listThreatsByAsset(asset: string): Threat[] {
    return this.listThreats().filter((t) => t.asset === asset);
  }

  /**
   * Update a threat's status.
   */
  public updateThreatStatus(id: string, status: ThreatStatus): Threat {
    const threat = this.threats.get(id);
    if (!threat) {
      throw new ThreatModelError('THREAT_NOT_FOUND', `Threat ${id} not found`);
    }
    threat.status = status;
    threat.updatedAt = new Date().toISOString();
    this.emitAudit('THREAT_STATUS_UPDATED', { threatId: id, status });
    return threat;
  }

  /**
   * Delete a threat.
   */
  public deleteThreat(id: string): void {
    if (!this.threats.has(id)) {
      throw new ThreatModelError('THREAT_NOT_FOUND', `Threat ${id} not found`);
    }
    // Remove from all controls' mitigates arrays
    for (const control of this.controls.values()) {
      control.mitigates = control.mitigates.filter((tid) => tid !== id);
    }
    this.threats.delete(id);
    this.emitAudit('THREAT_DELETED', { threatId: id });
  }

  // ── Control operations ───────────────────────────────────────────────────

  /**
   * Add a control. ID is auto-generated if not provided.
   */
  public addControl(input: CreateControlInput): Control {
    if (this.controls.size >= THREAT_MODEL_CONSTANTS.MAX_CONTROLS) {
      throw new ThreatModelError('MAX_CONTROLS_EXCEEDED', `Max controls (${THREAT_MODEL_CONSTANTS.MAX_CONTROLS}) exceeded`);
    }
    if (!['PREVENTIVE', 'DETECTIVE', 'CORRECTIVE'].includes(input.type)) {
      throw new ThreatModelError('INVALID_CONTROL_TYPE', `Invalid control type: ${input.type}`);
    }
    const id = input.id ?? generateControlId();
    if (this.controls.has(id)) {
      throw new ThreatModelError('DUPLICATE_CONTROL_ID', `Control ${id} already exists`);
    }
    const control: Control = {
      id,
      name: input.name,
      type: input.type,
      description: input.description,
      implementation: input.implementation,
      mitigates: [],
      createdAt: new Date().toISOString(),
    };
    this.controls.set(id, control);
    this.emitAudit('CONTROL_ADDED', { controlId: id, type: input.type });
    return control;
  }

  /**
   * Get a control by ID.
   */
  public getControl(id: string): Control | undefined {
    return this.controls.get(id);
  }

  /**
   * List all controls.
   */
  public listControls(): Control[] {
    return Array.from(this.controls.values()).sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Delete a control.
   */
  public deleteControl(id: string): void {
    if (!this.controls.has(id)) {
      throw new ThreatModelError('CONTROL_NOT_FOUND', `Control ${id} not found`);
    }
    // Remove from all threats' mitigatedBy arrays
    for (const threat of this.threats.values()) {
      threat.mitigatedBy = threat.mitigatedBy.filter((cid) => cid !== id);
    }
    this.controls.delete(id);
    this.emitAudit('CONTROL_DELETED', { controlId: id });
  }

  // ── Mitigation operations ────────────────────────────────────────────────

  /**
   * Link a control to a threat (control mitigates threat).
   * Idempotent: re-linking is a no-op.
   */
  public linkControl(controlId: string, threatId: string): void {
    const control = this.controls.get(controlId);
    if (!control) {
      throw new ThreatModelError('CONTROL_NOT_FOUND', `Control ${controlId} not found`);
    }
    const threat = this.threats.get(threatId);
    if (!threat) {
      throw new ThreatModelError('THREAT_NOT_FOUND', `Threat ${threatId} not found`);
    }
    if (control.mitigates.includes(threatId)) {
      return; // idempotent
    }
    if (control.mitigates.length >= THREAT_MODEL_CONSTANTS.MAX_MITIGATIONS_PER_CONTROL) {
      throw new ThreatModelError('MAX_MITIGATIONS_EXCEEDED', `Control ${controlId} already mitigates ${THREAT_MODEL_CONSTANTS.MAX_MITIGATIONS_PER_CONTROL} threats`);
    }
    if (threat.mitigatedBy.length >= THREAT_MODEL_CONSTANTS.MAX_CONTROLS_PER_THREAT) {
      throw new ThreatModelError('MAX_CONTROLS_PER_THREAT_EXCEEDED', `Threat ${threatId} already mitigated by ${THREAT_MODEL_CONSTANTS.MAX_CONTROLS_PER_THREAT} controls`);
    }
    control.mitigates.push(threatId);
    threat.mitigatedBy.push(controlId);
    threat.updatedAt = new Date().toISOString();
    // If all threats are now mitigated, mark status MITIGATED
    if (threat.mitigatedBy.length > 0 && threat.status === 'OPEN') {
      threat.status = 'MITIGATED';
    }
    this.emitAudit('CONTROL_LINKED', { controlId, threatId });
  }

  /**
   * Unlink a control from a threat.
   */
  public unlinkControl(controlId: string, threatId: string): void {
    const control = this.controls.get(controlId);
    if (!control) {
      throw new ThreatModelError('CONTROL_NOT_FOUND', `Control ${controlId} not found`);
    }
    const threat = this.threats.get(threatId);
    if (!threat) {
      throw new ThreatModelError('THREAT_NOT_FOUND', `Threat ${threatId} not found`);
    }
    control.mitigates = control.mitigates.filter((id) => id !== threatId);
    threat.mitigatedBy = threat.mitigatedBy.filter((id) => id !== controlId);
    threat.updatedAt = new Date().toISOString();
    if (threat.mitigatedBy.length === 0 && threat.status === 'MITIGATED') {
      threat.status = 'OPEN';
    }
    this.emitAudit('CONTROL_UNLINKED', { controlId, threatId });
  }

  // ── Gap analysis ─────────────────────────────────────────────────────────

  /**
   * Perform gap analysis: unmitigated threats, orphan controls,
   * single-defense threats, risk aggregates.
   */
  public gapAnalysis(): GapAnalysisResult {
    const allThreats = this.listThreats();
    const allControls = this.listControls();

    const unmitigatedThreats = allThreats.filter((t) => t.mitigatedBy.length === 0);
    const orphanControls = allControls.filter((c) => c.mitigates.length === 0);
    const singleDefenseThreats = allThreats.filter((t) => t.mitigatedBy.length === 1);

    // Risk by category
    const riskByCategory: GapAnalysisResult['riskByCategory'] = {
      S: { count: 0, meanDread: 0, maxDread: 0 },
      T: { count: 0, meanDread: 0, maxDread: 0 },
      R: { count: 0, meanDread: 0, maxDread: 0 },
      I: { count: 0, meanDread: 0, maxDread: 0 },
      D: { count: 0, meanDread: 0, maxDread: 0 },
      E: { count: 0, meanDread: 0, maxDread: 0 },
    };
    for (const t of allThreats) {
      const cat = riskByCategory[t.category];
      cat.count += 1;
      cat.meanDread += t.dreadMean;
      if (t.dreadMean > cat.maxDread) {
        cat.maxDread = t.dreadMean;
      }
    }
    for (const cat of Object.keys(riskByCategory) as ThreatCategory[]) {
      if (riskByCategory[cat].count > 0) {
        riskByCategory[cat].meanDread = riskByCategory[cat].meanDread / riskByCategory[cat].count;
      }
    }

    // Risk by asset
    const riskByAsset: Record<string, { count: number; meanDread: number; maxDread: number }> = {};
    for (const t of allThreats) {
      if (!riskByAsset[t.asset]) {
        riskByAsset[t.asset] = { count: 0, meanDread: 0, maxDread: 0 };
      }
      const a = riskByAsset[t.asset];
      a.count += 1;
      a.meanDread += t.dreadMean;
      if (t.dreadMean > a.maxDread) {
        a.maxDread = t.dreadMean;
      }
    }
    for (const asset of Object.keys(riskByAsset)) {
      if (riskByAsset[asset].count > 0) {
        riskByAsset[asset].meanDread = riskByAsset[asset].meanDread / riskByAsset[asset].count;
      }
    }

    // Mean residual risk
    const meanResidualRisk = allThreats.length > 0
      ? allThreats.reduce((sum, t) => sum + t.dreadMean, 0) / allThreats.length
      : 0;

    const totalMitigated = allThreats.filter((t) => t.mitigatedBy.length > 0).length;
    const coverage = allThreats.length > 0 ? totalMitigated / allThreats.length : 1.0;

    return {
      unmitigatedThreats,
      orphanControls,
      singleDefenseThreats,
      riskByCategory,
      riskByAsset,
      meanResidualRisk,
      totalThreats: allThreats.length,
      totalControls: allControls.length,
      totalMitigated,
      coverage,
    };
  }

  // ── Export ───────────────────────────────────────────────────────────────

  /**
   * Export the threat model as JSON and/or Markdown.
   */
  public export(options: ExportOptions): ExportResult {
    if (!options || (!options.includeJson && !options.includeMarkdown)) {
      throw new ThreatModelError('INVALID_EXPORT_OPTIONS', 'At least one of includeJson or includeMarkdown must be true');
    }
    const result: ExportResult = {};
    if (options.includeJson) {
      result.json = this.toJSON();
    }
    if (options.includeMarkdown) {
      result.markdown = this.toMarkdown(options.includeGapAnalysis, options.includeDreadBreakdown);
    }
    return result;
  }

  /**
   * Serialize the threat model to JSON.
   */
  public toJSON(): string {
    const data = {
      schemaVersion: THREAT_MODEL_CONSTANTS.SCHEMA_VERSION,
      modelName: this.modelName,
      modelVersion: this.modelVersion,
      exportedAt: new Date().toISOString(),
      threats: this.listThreats(),
      controls: this.listControls(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Render the threat model as a Markdown report.
   */
  public toMarkdown(includeGapAnalysis: boolean, includeDreadBreakdown: boolean): string {
    const lines: string[] = [];
    lines.push(`# Threat Model Report — ${this.modelName} v${this.modelVersion}`);
    lines.push('');
    lines.push(`**Schema version**: ${THREAT_MODEL_CONSTANTS.SCHEMA_VERSION}`);
    lines.push(`**Exported at**: ${new Date().toISOString()}`);
    lines.push(`**Total threats**: ${this.threats.size}`);
    lines.push(`**Total controls**: ${this.controls.size}`);
    lines.push('');

    // Risk summary
    const allThreats = this.listThreats();
    const riskCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const t of allThreats) {
      riskCounts[t.riskLevel] += 1;
    }
    lines.push('## Risk Summary');
    lines.push('');
    lines.push('| Risk Level | Count |');
    lines.push('|---|---|');
    lines.push(`| CRITICAL | ${riskCounts.CRITICAL} |`);
    lines.push(`| HIGH | ${riskCounts.HIGH} |`);
    lines.push(`| MEDIUM | ${riskCounts.MEDIUM} |`);
    lines.push(`| LOW | ${riskCounts.LOW} |`);
    lines.push('');

    // Threats table
    lines.push('## Threats');
    lines.push('');
    lines.push('| ID | Title | Category | Asset | DREAD | Risk | Status | Mitigated By |');
    lines.push('|---|---|---|---|---|---|---|---|');
    for (const t of allThreats) {
      lines.push(`| ${t.id} | ${t.title} | ${t.category} (${THREAT_MODEL_CONSTANTS.STRIDE_LABELS[t.category]}) | ${t.asset} | ${t.dreadMean.toFixed(2)} | ${t.riskLevel} | ${t.status} | ${t.mitigatedBy.join(', ') || '—'} |`);
    }
    lines.push('');

    if (includeDreadBreakdown) {
      lines.push('### DREAD Breakdown');
      lines.push('');
      lines.push('| ID | D | R | E | A | D | Mean |');
      lines.push('|---|---|---|---|---|---|---|');
      for (const t of allThreats) {
        const s = t.dreadScore;
        lines.push(`| ${t.id} | ${s.damage} | ${s.reproducibility} | ${s.exploitability} | ${s.affectedUsers} | ${s.discoverability} | ${t.dreadMean.toFixed(2)} |`);
      }
      lines.push('');
    }

    // Controls table
    lines.push('## Controls');
    lines.push('');
    lines.push('| ID | Name | Type | Description | Mitigates |');
    lines.push('|---|---|---|---|---|');
    for (const c of this.listControls()) {
      lines.push(`| ${c.id} | ${c.name} | ${c.type} | ${c.description} | ${c.mitigates.join(', ') || '—'} |`);
    }
    lines.push('');

    if (includeGapAnalysis) {
      const gap = this.gapAnalysis();
      lines.push('## Gap Analysis');
      lines.push('');
      lines.push(`**Total threats**: ${gap.totalThreats}`);
      lines.push(`**Total controls**: ${gap.totalControls}`);
      lines.push(`**Total mitigated**: ${gap.totalMitigated}`);
      lines.push(`**Mitigation coverage**: ${(gap.coverage * 100).toFixed(1)}%`);
      lines.push(`**Mean residual risk (DREAD)**: ${gap.meanResidualRisk.toFixed(2)}`);
      lines.push('');
      lines.push('### Unmitigated Threats');
      lines.push('');
      if (gap.unmitigatedThreats.length === 0) {
        lines.push('_None_');
      } else {
        for (const t of gap.unmitigatedThreats) {
          lines.push(`- **${t.id}** (${t.riskLevel}, DREAD ${t.dreadMean.toFixed(2)}): ${t.title}`);
        }
      }
      lines.push('');
      lines.push('### Orphan Controls');
      lines.push('');
      if (gap.orphanControls.length === 0) {
        lines.push('_None_');
      } else {
        for (const c of gap.orphanControls) {
          lines.push(`- **${c.id}**: ${c.name}`);
        }
      }
      lines.push('');
      lines.push('### Single-Defense Threats (no defense-in-depth)');
      lines.push('');
      if (gap.singleDefenseThreats.length === 0) {
        lines.push('_None_');
      } else {
        for (const t of gap.singleDefenseThreats) {
          lines.push(`- **${t.id}** (${t.riskLevel}, DREAD ${t.dreadMean.toFixed(2)}): mitigated only by ${t.mitigatedBy[0]}`);
        }
      }
      lines.push('');
      lines.push('### Risk by STRIDE Category');
      lines.push('');
      lines.push('| Category | Count | Mean DREAD | Max DREAD |');
      lines.push('|---|---|---|---|');
      for (const cat of ['S', 'T', 'R', 'I', 'D', 'E'] as ThreatCategory[]) {
        const r = gap.riskByCategory[cat];
        lines.push(`| ${cat} (${THREAT_MODEL_CONSTANTS.STRIDE_LABELS[cat]}) | ${r.count} | ${r.meanDread.toFixed(2)} | ${r.maxDread.toFixed(2)} |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  // ── Audit ────────────────────────────────────────────────────────────────

  private emitAudit(eventType: ThreatModelAuditEventType, payload: Record<string, unknown>): void {
    if (this.auditEmitter) {
      this.auditEmitter({
        type: eventType,
        timestamp: new Date().toISOString(),
        payload,
      });
    }
  }
}

// ── Audit event types ───────────────────────────────────────────────────────

export type ThreatModelAuditEventType =
  | 'THREAT_ADDED'
  | 'THREAT_DELETED'
  | 'THREAT_STATUS_UPDATED'
  | 'CONTROL_ADDED'
  | 'CONTROL_DELETED'
  | 'CONTROL_LINKED'
  | 'CONTROL_UNLINKED';

export interface ThreatModelAuditEvent {
  type: ThreatModelAuditEventType;
  timestamp: string;
  payload: Record<string, unknown>;
}
