import { randomId } from '@/utils/cryptoId';
// =============================================================================
// REPORT VERSION ENGINE — Version control for reports with diff comparison
// Pure TypeScript, deterministic, no external dependencies
// =============================================================================

export interface ReportVersion {
  id: string;
  reportId: string;
  version: number;
  name: string;
  description: string;
  data: unknown;
  createdBy: string;
  createdAt: string;
  tags: string[];
}

export interface VersionDiff {
  added: string[];
  removed: string[];
  modified: { field: string; oldValue: unknown; newValue: unknown }[];
}

export interface VersionBranch {
  id: string;
  name: string;
  reportId: string;
  baseVersion: number;
  versions: ReportVersion[];
  createdAt: string;
}

export class ReportVersionEngine {
  private versions = new Map<string, ReportVersion[]>();
  private branches = new Map<string, VersionBranch[]>();

  commitVersion(
    reportId: string,
    name: string,
    description: string,
    data: unknown,
    createdBy: string
  ): ReportVersion {
    const existing = this.versions.get(reportId) ?? [];
    const version: ReportVersion = {
      id: randomId('ver'),
      reportId,
      version: existing.length + 1,
      name,
      description,
      data,
      createdBy,
      createdAt: new Date().toISOString(),
      tags: [],
    };
    existing.push(version);
    this.versions.set(reportId, existing);
    return version;
  }

  getVersion(reportId: string, version: number): ReportVersion | undefined {
    return this.versions.get(reportId)?.find((v) => v.version === version);
  }

  getLatestVersion(reportId: string): ReportVersion | undefined {
    const versions = this.versions.get(reportId);
    return versions ? versions[versions.length - 1] : undefined;
  }

  getVersionHistory(reportId: string): ReportVersion[] {
    return this.versions.get(reportId) ?? [];
  }

  tagVersion(reportId: string, version: number, tag: string): boolean {
    const v = this.getVersion(reportId, version);
    if (!v) return false;
    if (!v.tags.includes(tag)) v.tags.push(tag);
    return true;
  }

  compareVersions(reportId: string, versionA: number, versionB: number): VersionDiff {
    const a = this.getVersion(reportId, versionA);
    const b = this.getVersion(reportId, versionB);
    if (!a || !b) return { added: [], removed: [], modified: [] };

    const aData = (a.data as Record<string, unknown>) ?? {};
    const bData = (b.data as Record<string, unknown>) ?? {};
    const aKeys = new Set(Object.keys(aData));
    const bKeys = new Set(Object.keys(bData));

    const added = [...bKeys].filter((k) => !aKeys.has(k));
    const removed = [...aKeys].filter((k) => !bKeys.has(k));
    const modified: VersionDiff['modified'] = [];

    for (const key of aKeys) {
      if (bKeys.has(key) && JSON.stringify(aData[key]!) !== JSON.stringify(bData[key]!)) {
        modified.push({ field: key, oldValue: aData[key]!, newValue: bData[key] });
      }
    }

    return { added, removed, modified };
  }

  createBranch(reportId: string, name: string, baseVersion?: number): VersionBranch | null {
    const versions = this.versions.get(reportId);
    if (!versions || versions.length === 0) return null;

    const base = baseVersion ?? versions![versions.length - 1]!.version;
    const branch: VersionBranch = {
      id: randomId('br'),
      name,
      reportId,
      baseVersion: base,
      versions: [],
      createdAt: new Date().toISOString(),
    };

    const existing = this.branches.get(reportId) ?? [];
    existing.push(branch);
    this.branches.set(reportId, existing);
    return branch;
  }

  getBranches(reportId: string): VersionBranch[] {
    return this.branches.get(reportId) ?? [];
  }

  mergeBranch(reportId: string, branchId: string): ReportVersion | null {
    const branches = this.branches.get(reportId) ?? [];
    const branch = branches.find((b) => b.id === branchId);
    if (!branch || branch.versions.length === 0) return null;

    const latestBranchVersion = branch.versions[branch.versions.length - 1];
    const merged = this.commitVersion(
      reportId,
      `Merge: ${branch.name}`,
      `Merged branch ${branch.name} (v${latestBranchVersion!.version})`,
      latestBranchVersion!.data,
      'system'
    );

    // Remove branch
    const idx = branches.indexOf(branch);
    branches.splice(idx, 1);

    return merged;
  }

  rollback(reportId: string, targetVersion: number): ReportVersion | null {
    const target = this.getVersion(reportId, targetVersion);
    if (!target) return null;

    return this.commitVersion(
      reportId,
      `Rollback to v${targetVersion}`,
      `Rolled back to version ${targetVersion}`,
      target.data,
      'system'
    );
  }

  serialize(): string {
    return JSON.stringify({
      versions: Array.from(this.versions.entries()),
      branches: Array.from(this.branches.entries()),
    });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.versions = new Map(parsed.versions);
    this.branches = new Map(parsed.branches);
  }
}
