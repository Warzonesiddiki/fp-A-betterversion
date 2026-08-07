import { randomId } from '@/utils/cryptoId';
// =============================================================================
// CRASH RECOVERY ENGINE — Recover work from auto-save temp files
// Detects unrecovered auto-saves on launch, offers recovery
// Pure TypeScript, deterministic, testable
// =============================================================================

export interface RecoveryCandidate {
  id: string;
  path: string;
  timestamp: string;
  sizeBytes: number;
  originalPath: string | null;
  data: string;
}

export interface RecoveryResult {
  success: boolean;
  recoveredPath?: string;
  error?: string;
}

export class CrashRecoveryEngine {
  private candidates: RecoveryCandidate[] = [];
  private recovered: Set<string> = new Set();

  // --- Candidate Management ---

  addCandidate(candidate: Omit<RecoveryCandidate, 'id'>): RecoveryCandidate {
    const full: RecoveryCandidate = {
      id: randomId('recovery'),
      ...candidate,
    };
    this.candidates.push(full);
    return full;
  }

  getCandidates(): RecoveryCandidate[] {
    return this.candidates.filter((c) => !this.recovered.has(c.id));
  }

  getCandidate(id: string): RecoveryCandidate | undefined {
    return this.candidates.find((c) => c.id === id);
  }

  hasCandidates(): boolean {
    return this.getCandidates().length > 0;
  }

  getCandidateCount(): number {
    return this.getCandidates().length;
  }

  // --- Recovery ---

  async recover(id: string): Promise<RecoveryResult> {
    const candidate = this.candidates.find((c) => c.id === id);
    if (!candidate) {
      return { success: false, error: `Candidate ${id} not found` };
    }

    try {
      this.recovered.add(id);
      return { success: true, recoveredPath: candidate.originalPath ?? candidate.path };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async recoverAll(): Promise<RecoveryResult[]> {
    const results: RecoveryResult[] = [];
    for (const candidate of this.getCandidates()) {
      results.push(await this.recover(candidate.id));
    }
    return results;
  }

  discard(id: string): boolean {
    const idx = this.candidates.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.candidates.splice(idx, 1);
    return true;
  }

  discardAll(): void {
    this.candidates = [];
    this.recovered.clear();
  }

  // --- State ---

  isRecovered(id: string): boolean {
    return this.recovered.has(id);
  }

  getRecoveredCount(): number {
    return this.recovered.size;
  }

  // --- Serialization ---

  serialize(): string {
    return JSON.stringify({
      candidates: this.candidates,
      recovered: [...this.recovered],
    });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data) as { candidates: RecoveryCandidate[]; recovered: string[] };
    this.candidates = parsed.candidates ?? [];
    this.recovered = new Set(parsed.recovered ?? []);
  }
}
