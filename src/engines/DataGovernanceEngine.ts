// =============================================================================
// DATA GOVERNANCE ENGINE
// Data quality, lineage, catalog, classification, retention
// Pure TypeScript, deterministic, testable
// =============================================================================

export type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'restricted';
export type DataQualityDimension =
  | 'completeness'
  | 'accuracy'
  | 'consistency'
  | 'timeliness'
  | 'uniqueness';

export interface DataAsset {
  id: string;
  name: string;
  type: 'table' | 'column' | 'report' | 'dashboard' | 'file';
  source: string;
  owner: string;
  sensitivity: SensitivityLevel;
  tags: string[];
  description: string;
  lastUpdated: string;
}

export interface DataLineageNode {
  id: string;
  name: string;
  type: 'source' | 'transform' | 'destination';
  children: string[];
}

export interface DataQualityRule {
  id: string;
  name: string;
  dimension: DataQualityDimension;
  target: string;
  condition: string;
  threshold: number;
}

export interface DataQualityScore {
  target: string;
  dimension: DataQualityDimension;
  score: number;
  passed: boolean;
  details: string;
}

export interface RetentionPolicy {
  id: string;
  name: string;
  targetType: string;
  retentionDays: number;
  archiveAfterDays?: number;
  deleteAfterDays?: number;
}

export class DataGovernanceEngine {
  private catalog = new Map<string, DataAsset>();
  private lineage = new Map<string, DataLineageNode>();
  private qualityRules: DataQualityRule[] = [];
  private qualityScores: DataQualityScore[] = [];
  private retentionPolicies: RetentionPolicy[] = [];
  private accessLog: Array<{ userId: string; assetId: string; action: string; timestamp: string }> =
    [];

  // ---------------------------------------------------------------------------
  // Data Catalog
  // ---------------------------------------------------------------------------

  addAsset(asset: DataAsset): void {
    this.catalog.set(asset.id, asset);
  }

  getAsset(id: string): DataAsset | undefined {
    return this.catalog.get(id);
  }

  removeAsset(id: string): boolean {
    return this.catalog.delete(id);
  }

  searchAssets(query: string): DataAsset[] {
    const q = query.toLowerCase();
    return Array.from(this.catalog.values()).filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  getAssetsByOwner(owner: string): DataAsset[] {
    return Array.from(this.catalog.values()).filter((a) => a.owner === owner);
  }

  getAssetsBySensitivity(level: SensitivityLevel): DataAsset[] {
    return Array.from(this.catalog.values()).filter((a) => a.sensitivity === level);
  }

  // ---------------------------------------------------------------------------
  // Data Lineage
  // ---------------------------------------------------------------------------

  addLineageNode(node: DataLineageNode): void {
    this.lineage.set(node.id, node);
  }

  getLineage(id: string): DataLineageNode | undefined {
    return this.lineage.get(id);
  }

  getUpstream(id: string): string[] {
    const upstream: string[] = [];
    for (const [nodeId, node] of this.lineage) {
      if (node.children.includes(id)) {
        upstream.push(nodeId);
        upstream.push(...this.getUpstream(nodeId));
      }
    }
    return [...new Set(upstream)];
  }

  getDownstream(id: string): string[] {
    const node = this.lineage.get(id);
    if (!node) return [];
    const downstream = [...node.children];
    for (const child of node.children) {
      downstream.push(...this.getDownstream(child));
    }
    return [...new Set(downstream)];
  }

  // ---------------------------------------------------------------------------
  // Data Quality
  // ---------------------------------------------------------------------------

  addQualityRule(rule: DataQualityRule): void {
    this.qualityRules.push(rule);
  }

  removeQualityRule(id: string): boolean {
    const idx = this.qualityRules.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.qualityRules.splice(idx, 1);
    return true;
  }

  recordQualityScore(score: DataQualityScore): void {
    this.qualityScores.push(score);
  }

  getQualityScores(target: string): DataQualityScore[] {
    return this.qualityScores.filter((s) => s.target === target);
  }

  getOverallQualityScore(target: string): number {
    const scores = this.getQualityScores(target);
    if (scores.length === 0) return 0;
    return scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  }

  // ---------------------------------------------------------------------------
  // Data Classification
  // ---------------------------------------------------------------------------

  classifyAsset(id: string, sensitivity: SensitivityLevel): boolean {
    const asset = this.catalog.get(id);
    if (!asset) return false;
    asset.sensitivity = sensitivity;
    return true;
  }

  tagAsset(id: string, tag: string): boolean {
    const asset = this.catalog.get(id);
    if (!asset) return false;
    if (!asset.tags.includes(tag)) asset.tags.push(tag);
    return true;
  }

  untagAsset(id: string, tag: string): boolean {
    const asset = this.catalog.get(id);
    if (!asset) return false;
    asset.tags = asset.tags.filter((t) => t !== tag);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Data Retention
  // ---------------------------------------------------------------------------

  addRetentionPolicy(policy: RetentionPolicy): void {
    this.retentionPolicies.push(policy);
  }

  removeRetentionPolicy(id: string): boolean {
    const idx = this.retentionPolicies.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.retentionPolicies.splice(idx, 1);
    return true;
  }

  getExpiredAssets(): DataAsset[] {
    const now = Date.now();
    return Array.from(this.catalog.values()).filter((asset) => {
      const policy = this.retentionPolicies.find((p) => p.targetType === asset.type);
      if (!policy) return false;
      const age = (now - new Date(asset.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
      return age > policy.retentionDays;
    });
  }

  // ---------------------------------------------------------------------------
  // Access Logging
  // ---------------------------------------------------------------------------

  logAccess(userId: string, assetId: string, action: string): void {
    this.accessLog.push({ userId, assetId, action, timestamp: new Date().toISOString() });
  }

  getAccessLog(filter?: {
    userId?: string;
    assetId?: string;
  }): Array<{ userId: string; assetId: string; action: string; timestamp: string }> {
    let log = [...this.accessLog];
    if (filter?.userId) log = log.filter((e) => e.userId === filter.userId);
    if (filter?.assetId) log = log.filter((e) => e.assetId === filter.assetId);
    return log;
  }

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  getStats(): {
    totalAssets: number;
    bySensitivity: Record<SensitivityLevel, number>;
    byType: Record<string, number>;
  } {
    const assets = Array.from(this.catalog.values());
    const bySensitivity: Record<SensitivityLevel, number> = {
      public: 0,
      internal: 0,
      confidential: 0,
      restricted: 0,
    };
    const byType: Record<string, number> = {};

    for (const asset of assets) {
      bySensitivity[asset.sensitivity]++;
      byType[asset.type] = (byType[asset.type] || 0) + 1;
    }

    return { totalAssets: assets.length, bySensitivity, byType };
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  serialize(): string {
    return JSON.stringify({
      catalog: Array.from(this.catalog.entries()),
      lineage: Array.from(this.lineage.entries()),
      qualityRules: this.qualityRules,
      retentionPolicies: this.retentionPolicies,
    });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.catalog = new Map(parsed.catalog);
    this.lineage = new Map(parsed.lineage);
    this.qualityRules = parsed.qualityRules ?? [];
    this.retentionPolicies = parsed.retentionPolicies ?? [];
  }
}
