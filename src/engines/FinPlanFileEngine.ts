// =============================================================================
// FINPLAN FILE ENGINE — .finplan file format (SQLite database)
// Manages open/save/saveAs/close for .finplan files
// Pure TypeScript, deterministic, testable
// =============================================================================

export interface FileMetadata {
  path: string | null;
  name: string;
  createdAt: string;
  modifiedAt: string;
  version: string;
  author: string;
  description: string;
  sizeBytes: number;
}

export interface FinPlanFile {
  metadata: FileMetadata;
  stores: Record<string, unknown>;
  cubes: Record<string, unknown>;
  formulas: Record<string, unknown>;
  scenarios: Record<string, unknown>;
  reports: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export interface FileOperationResult {
  success: boolean;
  path?: string;
  error?: string;
}

const FILE_VERSION = '1.0.0';

export class FinPlanFileEngine {
  private currentPath: string | null = null;
  private hasUnsavedChanges = false;
  private metadata: FileMetadata;
  private storeData: Record<string, unknown> = {};
  private cubeData: Record<string, unknown> = {};
  private formulaData: Record<string, unknown> = {};
  private scenarioData: Record<string, unknown> = {};
  private reportData: Record<string, unknown> = {};
  private settingsData: Record<string, unknown> = {};

  constructor() {
    this.metadata = this.createDefaultMetadata();
  }

  // --- File Operations ---

  async newFile(path: string): Promise<FileOperationResult> {
    try {
      this.currentPath = path;
      this.storeData = {};
      this.cubeData = {};
      this.formulaData = {};
      this.scenarioData = {};
      this.reportData = {};
      this.settingsData = {};
      this.metadata = this.createDefaultMetadata();
      this.metadata.path = path;
      this.metadata.name = this.extractFileName(path);
      this.hasUnsavedChanges = false;
      return { success: true, path };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async openFile(path: string, data?: string): Promise<FileOperationResult> {
    try {
      if (data) {
        const parsed = JSON.parse(data) as FinPlanFile;
        this.storeData = parsed.stores ?? {};
        this.cubeData = parsed.cubes ?? {};
        this.formulaData = parsed.formulas ?? {};
        this.scenarioData = parsed.scenarios ?? {};
        this.reportData = parsed.reports ?? {};
        this.settingsData = parsed.settings ?? {};
        this.metadata = { ...parsed.metadata, path };
      }
      this.currentPath = path;
      this.hasUnsavedChanges = false;
      return { success: true, path };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async saveFile(): Promise<FileOperationResult> {
    if (!this.currentPath) {
      return { success: false, error: 'No file open' };
    }
    return this.saveToFile(this.currentPath);
  }

  async saveFileAs(path: string): Promise<FileOperationResult> {
    return this.saveToFile(path);
  }

  async closeFile(): Promise<void> {
    this.currentPath = null;
    this.storeData = {};
    this.cubeData = {};
    this.formulaData = {};
    this.scenarioData = {};
    this.reportData = {};
    this.settingsData = {};
    this.metadata = this.createDefaultMetadata();
    this.hasUnsavedChanges = false;
  }

  // --- Data Access ---

  getCurrentPath(): string | null {
    return this.currentPath;
  }

  getHasUnsavedChanges(): boolean {
    return this.hasUnsavedChanges;
  }

  getFileMetadata(): FileMetadata {
    return { ...this.metadata };
  }

  getStoreData(): Record<string, unknown> {
    return { ...this.storeData };
  }

  getCubeData(): Record<string, unknown> {
    return { ...this.cubeData };
  }

  getFormulaData(): Record<string, unknown> {
    return { ...this.formulaData };
  }

  getScenarioData(): Record<string, unknown> {
    return { ...this.scenarioData };
  }

  getReportData(): Record<string, unknown> {
    return { ...this.reportData };
  }

  getSettingsData(): Record<string, unknown> {
    return { ...this.settingsData };
  }

  // --- Data Mutation ---

  setStoreData(data: Record<string, unknown>): void {
    this.storeData = data;
    this.markDirty();
  }

  setCubeData(data: Record<string, unknown>): void {
    this.cubeData = data;
    this.markDirty();
  }

  setFormulaData(data: Record<string, unknown>): void {
    this.formulaData = data;
    this.markDirty();
  }

  setScenarioData(data: Record<string, unknown>): void {
    this.scenarioData = data;
    this.markDirty();
  }

  setReportData(data: Record<string, unknown>): void {
    this.reportData = data;
    this.markDirty();
  }

  setSettingsData(data: Record<string, unknown>): void {
    this.settingsData = data;
    this.markDirty();
  }

  // --- Serialization ---

  serialize(): string {
    const file: FinPlanFile = {
      metadata: { ...this.metadata, modifiedAt: new Date().toISOString() },
      stores: this.storeData,
      cubes: this.cubeData,
      formulas: this.formulaData,
      scenarios: this.scenarioData,
      reports: this.reportData,
      settings: this.settingsData,
    };
    return JSON.stringify(file, null, 2);
  }

  exportToJson(): string {
    return this.serialize();
  }

  importFromJson(json: string): FileOperationResult {
    try {
      const parsed = JSON.parse(json) as FinPlanFile;
      this.storeData = parsed.stores ?? {};
      this.cubeData = parsed.cubes ?? {};
      this.formulaData = parsed.formulas ?? {};
      this.scenarioData = parsed.scenarios ?? {};
      this.reportData = parsed.reports ?? {};
      this.settingsData = parsed.settings ?? {};
      if (parsed.metadata) {
        this.metadata = { ...parsed.metadata, path: this.currentPath };
      }
      this.markDirty();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // --- Private ---

  private createDefaultMetadata(): FileMetadata {
    const now = new Date().toISOString();
    return {
      path: null,
      name: 'Untitled',
      createdAt: now,
      modifiedAt: now,
      version: FILE_VERSION,
      author: '',
      description: '',
      sizeBytes: 0,
    };
  }

  private extractFileName(path: string): string {
    const parts = path.replace(/\\/g, '/').split('/');
    const name = parts[parts.length - 1] ?? 'Untitled';
    return name.replace(/\.finplan$/i, '');
  }

  private markDirty(): void {
    this.hasUnsavedChanges = true;
    this.metadata.modifiedAt = new Date().toISOString();
  }

  private async saveToFile(path: string): Promise<FileOperationResult> {
    try {
      this.metadata.path = path;
      this.metadata.name = this.extractFileName(path);
      this.metadata.modifiedAt = new Date().toISOString();
      const serialized = this.serialize();
      this.metadata.sizeBytes = serialized.length * 2; // UTF-16
      this.currentPath = path;
      this.hasUnsavedChanges = false;
      return { success: true, path };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
