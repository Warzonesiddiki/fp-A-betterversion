export interface FinanceDocument {
  id: string;
  name: string;
  type: 'budget' | 'forecast' | 'report' | 'scenario';
  content: Record<string, unknown>;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  signatures: string[];
}

export interface VersionDiff {
  version1: number;
  version2: number;
  changes: { path: string; oldValue: unknown; newValue: unknown }[];
  changeCount: number;
}

export class DocumentEngine {
  private versions: DocumentVersion[] = [];
  private idCounter = 0;

  createVersion(document: FinanceDocument, createdBy: string): DocumentVersion {
    const documentVersions = this.versions.filter((v) => v.documentId === document.id);
    const nextVersion = documentVersions.length + 1;

    const version: DocumentVersion = {
      id: `dv-${++this.idCounter}`,
      documentId: document.id,
      version: nextVersion,
      content: JSON.parse(JSON.stringify(document.content)),
      createdBy,
      createdAt: new Date().toISOString(),
      signatures: [],
    };

    this.versions.push(version);
    return version;
  }

  getVersionHistory(documentId: string): DocumentVersion[] {
    return this.versions
      .filter((v) => v.documentId === documentId)
      .sort((a, b) => b.version - a.version);
  }

  compareVersions(v1Id: string, v2Id: string): VersionDiff {
    const v1 = this.versions.find((v) => v.id === v1Id);
    const v2 = this.versions.find((v) => v.id === v2Id);

    if (!v1 || !v2) {
      return { version1: 0, version2: 0, changes: [], changeCount: 0 };
    }

    const changes: { path: string; oldValue: unknown; newValue: unknown }[] = [];

    const diff = (
      obj1: Record<string, unknown> | null | undefined,
      obj2: Record<string, unknown> | null | undefined,
      path: string = ''
    ) => {
      const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
      keys.forEach((key) => {
        const currentPath = path ? `${path}.${key}` : key;
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];

        if (val1 !== val2) {
          if (
            typeof val1 === 'object' &&
            typeof val2 === 'object' &&
            val1 !== null &&
            val2 !== null
          ) {
            diff(val1 as Record<string, unknown>, val2 as Record<string, unknown>, currentPath);
          } else {
            changes.push({ path: currentPath, oldValue: val1, newValue: val2 });
          }
        }
      });
    };

    diff(v1.content, v2.content);

    return {
      version1: v1.version,
      version2: v2.version,
      changes,
      changeCount: changes.length,
    };
  }

  signDocument(versionId: string, user: string): void {
    const version = this.versions.find((v) => v.id === versionId);
    if (version && !version.signatures.includes(user)) {
      version.signatures.push(user);
    }
  }
}
