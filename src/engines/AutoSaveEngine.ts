// =============================================================================
// AUTO-SAVE ENGINE — Automatic saving with configurable intervals
// Saves to temp file every N minutes, on blur, before close
// Pure TypeScript, deterministic, testable
// =============================================================================

export interface AutoSaveConfig {
  intervalMs: number;
  saveOnBlur: boolean;
  saveOnClose: boolean;
  maxAutoSaves: number;
  tempFileSuffix: string;
}

export interface AutoSaveEntry {
  id: string;
  timestamp: string;
  path: string;
  sizeBytes: number;
  trigger: 'interval' | 'blur' | 'close' | 'manual';
}

const DEFAULT_CONFIG: AutoSaveConfig = {
  intervalMs: 30 * 1000, // 30 seconds
  saveOnBlur: true,
  saveOnClose: true,
  maxAutoSaves: 5,
  tempFileSuffix: '.autosave',
};

export class AutoSaveEngine {
  private config: AutoSaveConfig;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private entries: AutoSaveEntry[] = [];
  private isRunning = false;
  private saveCallback: (() => Promise<string | null>) | null = null;
  private onAutoSaveCallback: ((entry: AutoSaveEntry) => void) | null = null;

  constructor(config: Partial<AutoSaveConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // --- Lifecycle ---

  start(saveCallback: () => Promise<string | null>): void {
    if (this.isRunning) return;
    this.saveCallback = saveCallback;
    this.isRunning = true;
    this.intervalId = setInterval(() => this.performAutoSave('interval'), this.config.intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  isEngineRunning(): boolean {
    return this.isRunning;
  }

  // --- Triggers ---

  async triggerBlurSave(): Promise<AutoSaveEntry | null> {
    if (!this.config.saveOnBlur) return null;
    return this.performAutoSave('blur');
  }

  async triggerCloseSave(): Promise<AutoSaveEntry | null> {
    if (!this.config.saveOnClose) return null;
    return this.performAutoSave('close');
  }

  async triggerManualSave(): Promise<AutoSaveEntry | null> {
    return this.performAutoSave('manual');
  }

  // --- Entry Management ---

  getEntries(): AutoSaveEntry[] {
    return [...this.entries];
  }

  getLatestEntry(): AutoSaveEntry | null {
    return this.entries.length > 0 ? this.entries[this.entries.length - 1] ?? null : null;
  }

  clearEntries(): void {
    this.entries = [];
  }

  removeEntry(id: string): boolean {
    const idx = this.entries.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.entries.splice(idx, 1);
    return true;
  }

  // --- Config ---

  getConfig(): AutoSaveConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<AutoSaveConfig>): void {
    this.config = { ...this.config, ...updates };
    if (this.isRunning) {
      this.stop();
      if (this.saveCallback) this.start(this.saveCallback);
    }
  }

  // --- Callbacks ---

  onAutoSave(callback: (entry: AutoSaveEntry) => void): void {
    this.onAutoSaveCallback = callback;
  }

  // --- Private ---

  setSaveCallback(callback: () => Promise<string | null>): void {
    this.saveCallback = callback;
  }

  private async performAutoSave(trigger: AutoSaveEntry['trigger']): Promise<AutoSaveEntry | null> {
    if (!this.saveCallback) return null;

    try {
      const data = await this.saveCallback();
      if (!data) return null;

      const entry: AutoSaveEntry = {
        id: `autosave-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        path: `autosave_${Date.now()}${this.config.tempFileSuffix}`,
        sizeBytes: data.length * 2,
        trigger,
      };

      this.entries.push(entry);

      // Prune old entries
      while (this.entries.length > this.config.maxAutoSaves) {
        this.entries.shift();
      }

      this.onAutoSaveCallback?.(entry);
      return entry;
    } catch {
      return null;
    }
  }
}
