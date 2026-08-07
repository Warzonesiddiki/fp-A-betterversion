import { randomId } from '@/utils/cryptoId';
// MasterDataEngine — Single source of truth for entities, accounts, periods
// Pure TypeScript, deterministic, no external dependencies

export type MasterDataType =
  | 'entity'
  | 'account'
  | 'period'
  | 'currency'
  | 'scenario'
  | 'department'
  | 'cost_center';

export interface MasterDataRecord {
  id: string;
  type: MasterDataType;
  code: string;
  name: string;
  parentId: string | null;
  attributes: Record<string, unknown>;
  status: 'active' | 'inactive' | 'archived';
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
}

export interface MasterDataHierarchy {
  id: string;
  code: string;
  name: string;
  children: MasterDataHierarchy[];
  level: number;
  path: string[];
}

export interface MasterDataChange {
  id: string;
  recordId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changedAt: string;
  changedBy: string;
  reason?: string;
}

export interface MasterDataValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class MasterDataEngine {
  private records = new Map<string, MasterDataRecord>();
  private changes: MasterDataChange[] = [];
  private codeIndex = new Map<string, Map<string, string>>();

  add(record: Omit<MasterDataRecord, 'createdAt' | 'updatedAt' | 'version'>): MasterDataRecord {
    const id = record.id || randomId('md');
    const now = new Date().toISOString();
    const fullRecord: MasterDataRecord = {
      ...record,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    this.records.set(id, fullRecord);
    this.updateCodeIndex(fullRecord);
    return fullRecord;
  }

  update(
    id: string,
    updates: Partial<MasterDataRecord>,
    changedBy: string,
    reason?: string
  ): MasterDataRecord | null {
    const record = this.records.get(id);
    if (!record) return null;

    for (const [key, newValue] of Object.entries(updates)) {
      if (key === 'id' || key === 'createdAt' || key === 'version') continue;
      const oldValue = (record as unknown as Record<string, unknown>)[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        this.changes.push({
          id: randomId('chg'),
          recordId: id,
          field: key,
          oldValue,
          newValue,
          changedAt: new Date().toISOString(),
          changedBy,
          reason,
        });
        (record as unknown as Record<string, unknown>)[key] = newValue;
      }
    }

    record.updatedAt = new Date().toISOString();
    record.version++;
    this.updateCodeIndex(record);
    return record;
  }

  get(id: string): MasterDataRecord | undefined {
    return this.records.get(id);
  }

  getByCode(type: MasterDataType, code: string): MasterDataRecord | undefined {
    const typeIndex = this.codeIndex.get(type);
    if (!typeIndex) return undefined;
    const id = typeIndex.get(code);
    return id ? this.records.get(id) : undefined;
  }

  list(type?: MasterDataType, status?: MasterDataRecord['status']): MasterDataRecord[] {
    let records = Array.from(this.records.values());
    if (type) records = records.filter((r) => r.type === type);
    if (status) records = records.filter((r) => r.status === status);
    return records;
  }

  search(query: string, type?: MasterDataType): MasterDataRecord[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    let records = Array.from(this.records.values());
    if (type) records = records.filter((r) => r.type === type);

    return records.filter((r) => {
      const searchable = `${r.code} ${r.name} ${JSON.stringify(r.attributes)}`.toLowerCase();
      return terms.every((term) => searchable.includes(term));
    });
  }

  deactivate(id: string): boolean {
    const record = this.records.get(id);
    if (!record) return false;
    record.status = 'inactive';
    record.updatedAt = new Date().toISOString();
    record.version++;
    return true;
  }

  archive(id: string): boolean {
    const record = this.records.get(id);
    if (!record) return false;
    record.status = 'archived';
    record.updatedAt = new Date().toISOString();
    record.version++;
    return true;
  }

  getChildren(parentId: string, type?: MasterDataType): MasterDataRecord[] {
    return Array.from(this.records.values()).filter(
      (r) => r.parentId === parentId && (!type || r.type === type)
    );
  }

  getHierarchy(type: MasterDataType, rootId?: string): MasterDataHierarchy[] {
    const allRecords = this.list(type, 'active');
    const buildTree = (
      parentId: string | null,
      level: number,
      path: string[]
    ): MasterDataHierarchy[] => {
      return allRecords
        .filter((r) => r.parentId === parentId)
        .map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          level,
          path: [...path, r.code],
          children: buildTree(r.id, level + 1, [...path, r.code]),
        }));
    };

    if (rootId) {
      const root = this.records.get(rootId);
      if (!root) return [];
      return [
        {
          id: root.id,
          code: root.code,
          name: root.name,
          level: 0,
          path: [root.code],
          children: buildTree(rootId, 1, [root.code]),
        },
      ];
    }
    return buildTree(null, 0, []);
  }

  getPath(id: string): MasterDataRecord[] {
    const path: MasterDataRecord[] = [];
    let current = this.records.get(id);
    while (current) {
      path.unshift(current);
      current = current.parentId ? this.records.get(current.parentId) : undefined;
    }
    return path;
  }

  validate(record: MasterDataRecord): MasterDataValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.code.trim()) errors.push('Code is required');
    if (!record.name.trim()) errors.push('Name is required');

    const existing = this.getByCode(record.type, record.code);
    if (existing && existing.id !== record.id) {
      errors.push(`Code "${record.code}" already exists for ${record.type}`);
    }

    if (record.parentId) {
      const parent = this.records.get(record.parentId);
      if (!parent) errors.push(`Parent "${record.parentId}" not found`);
      else if (parent.type !== record.type)
        errors.push(`Parent type mismatch: expected ${record.type}, got ${parent.type}`);
    }

    if (record.effectiveFrom && record.effectiveTo) {
      if (new Date(record.effectiveFrom) > new Date(record.effectiveTo)) {
        errors.push('Effective from date must be before effective to date');
      }
    }

    if (record.status === 'archived') {
      warnings.push('Record is archived and will not appear in active lists');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  getChanges(recordId?: string, limit?: number): MasterDataChange[] {
    const changes = recordId
      ? this.changes.filter((c) => c.recordId === recordId)
      : [...this.changes];
    changes.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
    return limit ? changes.slice(0, limit) : changes;
  }

  getStats(): Record<
    MasterDataType,
    { total: number; active: number; inactive: number; archived: number }
  > {
    const stats: Record<
      string,
      { total: number; active: number; inactive: number; archived: number }
    > = {};
    for (const record of this.records.values()) {
      if (!stats[record.type])
        stats[record.type] = { total: 0, active: 0, inactive: 0, archived: 0 };
      stats![record.type]!.total++;
      stats![record.type]![record.status]++;
    }
    return stats as Record<
      MasterDataType,
      { total: number; active: number; inactive: number; archived: number }
    >;
  }

  serialize(): string {
    return JSON.stringify({
      records: Array.from(this.records.entries()),
      changes: this.changes,
    });
  }

  deserialize(data: string): void {
    const p = JSON.parse(data);
    this.records = new Map(p.records);
    this.changes = p.changes || [];
    this.rebuildCodeIndex();
  }

  private updateCodeIndex(record: MasterDataRecord): void {
    if (!this.codeIndex.has(record.type)) this.codeIndex.set(record.type, new Map());
    this.codeIndex.get(record.type)!.set(record.code, record.id);
  }

  private rebuildCodeIndex(): void {
    this.codeIndex.clear();
    for (const record of this.records.values()) {
      this.updateCodeIndex(record);
    }
  }
}

// Preset master data creators
export function createSystemEntities(): Omit<
  MasterDataRecord,
  'createdAt' | 'updatedAt' | 'version'
>[] {
  return [
    {
      id: 'entity-corp',
      type: 'entity',
      code: 'CORP',
      name: 'Corporate Headquarters',
      parentId: null,
      attributes: { country: 'US', currency: 'USD' },
      status: 'active',
      createdBy: 'system',
    },
    {
      id: 'entity-na',
      type: 'entity',
      code: 'NA',
      name: 'North America',
      parentId: 'entity-corp',
      attributes: { region: 'NA' },
      status: 'active',
      createdBy: 'system',
    },
    {
      id: 'entity-emea',
      type: 'entity',
      code: 'EMEA',
      name: 'Europe, Middle East & Africa',
      parentId: 'entity-corp',
      attributes: { region: 'EMEA' },
      status: 'active',
      createdBy: 'system',
    },
    {
      id: 'entity-apac',
      type: 'entity',
      code: 'APAC',
      name: 'Asia Pacific',
      parentId: 'entity-corp',
      attributes: { region: 'APAC' },
      status: 'active',
      createdBy: 'system',
    },
  ];
}

export function createSystemAccounts(): Omit<
  MasterDataRecord,
  'createdAt' | 'updatedAt' | 'version'
>[] {
  return [
    {
      id: 'acct-bs',
      type: 'account',
      code: 'BS',
      name: 'Balance Sheet',
      parentId: null,
      attributes: { accountType: 'balance_sheet' },
      status: 'active',
      createdBy: 'system',
    },
    {
      id: 'acct-is',
      type: 'account',
      code: 'IS',
      name: 'Income Statement',
      parentId: null,
      attributes: { accountType: 'income_statement' },
      status: 'active',
      createdBy: 'system',
    },
    {
      id: 'acct-cf',
      type: 'account',
      code: 'CF',
      name: 'Cash Flow',
      parentId: null,
      attributes: { accountType: 'cash_flow' },
      status: 'active',
      createdBy: 'system',
    },
    {
      id: 'acct-rev',
      type: 'account',
      code: 'REV',
      name: 'Revenue',
      parentId: 'acct-is',
      attributes: { debitSide: 'credit' },
      status: 'active',
      createdBy: 'system',
    },
    {
      id: 'acct-cogs',
      type: 'account',
      code: 'COGS',
      name: 'Cost of Goods Sold',
      parentId: 'acct-is',
      attributes: { debitSide: 'debit' },
      status: 'active',
      createdBy: 'system',
    },
    {
      id: 'acct-opex',
      type: 'account',
      code: 'OPEX',
      name: 'Operating Expenses',
      parentId: 'acct-is',
      attributes: { debitSide: 'debit' },
      status: 'active',
      createdBy: 'system',
    },
  ];
}
