// =============================================================================
// RECENT FILES ENGINE — Track last N opened files with quick access
// Stores recent files with metadata, supports pinning and clearing
// Pure TypeScript, deterministic, testable
// =============================================================================

export interface RecentFile {
  path: string;
  name: string;
  lastOpened: string;
  fileSize: number;
  pinned: boolean;
  openCount: number;
}

export interface RecentFilesConfig {
  maxEntries: number;
  autoRemoveMissing: boolean;
}

const DEFAULT_CONFIG: RecentFilesConfig = {
  maxEntries: 20,
  autoRemoveMissing: true,
};

export class RecentFilesEngine {
  private files: RecentFile[] = [];
  private config: RecentFilesConfig;

  constructor(config: Partial<RecentFilesConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // --- File Tracking ---

  addFile(path: string, name: string, fileSize: number = 0): RecentFile {
    const existingIdx = this.files.findIndex((f) => f.path === path);
    if (existingIdx !== -1) {
      const existing = this.files[existingIdx]!;
      existing.lastOpened = new Date().toISOString();
      existing.openCount++;
      existing.fileSize = fileSize;
      // Move to front (will be sorted by pinned status and date)
      this.files.splice(existingIdx, 1);
      this.files.unshift(existing);
      this.sortFiles();
      return existing;
    }

    const file: RecentFile = {
      path,
      name,
      lastOpened: new Date().toISOString(),
      fileSize,
      pinned: false,
      openCount: 1,
    };

    this.files.unshift(file);
    this.prune();
    return file;
  }

  removeFile(path: string): boolean {
    const idx = this.files.findIndex((f) => f.path === path);
    if (idx === -1) return false;
    this.files.splice(idx, 1);
    return true;
  }

  // --- Access ---

  getFiles(): RecentFile[] {
    return [...this.files];
  }

  getPinnedFiles(): RecentFile[] {
    return this.files.filter((f) => f.pinned);
  }

  getUnpinnedFiles(): RecentFile[] {
    return this.files.filter((f) => !f.pinned);
  }

  getFile(path: string): RecentFile | undefined {
    return this.files.find((f) => f.path === path);
  }

  getFileCount(): number {
    return this.files.length;
  }

  hasFile(path: string): boolean {
    return this.files.some((f) => f.path === path);
  }

  // --- Pin/Unpin ---

  pin(path: string): boolean {
    const file = this.files.find((f) => f.path === path);
    if (!file) return false;
    file.pinned = true;
    this.sortFiles();
    return true;
  }

  unpin(path: string): boolean {
    const file = this.files.find((f) => f.path === path);
    if (!file) return false;
    file.pinned = false;
    this.sortFiles();
    return true;
  }

  togglePin(path: string): boolean {
    const file = this.files.find((f) => f.path === path);
    if (!file) return false;
    file.pinned = !file.pinned;
    this.sortFiles();
    return file.pinned;
  }

  // --- Management ---

  clear(): void {
    this.files = [];
  }

  clearUnpinned(): void {
    this.files = this.files.filter((f) => f.pinned);
  }

  removeMissing(validPaths: Set<string>): number {
    const before = this.files.length;
    this.files = this.files.filter((f) => f.pinned || validPaths.has(f.path));
    return before - this.files.length;
  }

  // --- Config ---

  getConfig(): RecentFilesConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<RecentFilesConfig>): void {
    this.config = { ...this.config, ...updates };
    this.prune();
  }

  // --- Serialization ---

  serialize(): string {
    return JSON.stringify({ files: this.files, config: this.config });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data) as { files: RecentFile[]; config: RecentFilesConfig };
    this.files = parsed.files ?? [];
    this.config = { ...DEFAULT_CONFIG, ...(parsed.config ?? {}) };
  }

  // --- Private ---

  private sortFiles(): void {
    this.files.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime();
    });
  }

  private prune(): void {
    while (this.files.length > this.config.maxEntries) {
      // Remove last unpinned file
      const lastUnpinned = this.files.findLastIndex((f) => !f.pinned);
      if (lastUnpinned === -1) break;
      this.files.splice(lastUnpinned, 1);
    }
  }
}
