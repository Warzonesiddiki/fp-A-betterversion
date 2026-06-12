/* eslint-disable @typescript-eslint/no-explicit-any */
import { AIEngine } from '@/engines/AIEngine';
import { masterStorage } from '@/utils/masterStorage';

export interface BenchmarkResult {
  timestamp: number;
  name: string;
  duration: number;
  metadata?: Record<string, any>;
}

export interface BenchmarkReport {
  aiEngine: {
    init: number;
    classify: number;
    embedding: number;
  };
  storage: {
    write: number;
    read: number;
    delete: number;
  };
}

export class BenchmarkService {
  static async runFullSuite(): Promise<BenchmarkReport> {
    const report: Partial<BenchmarkReport> = {
      aiEngine: { init: 0, classify: 0, embedding: 0 },
      storage: { write: 0, read: 0, delete: 0 },
    };

    // 1. Storage Benchmarks
    const testData = { state: { id: 'bench-test', value: 'x'.repeat(1024 * 100) }, version: 1 }; // 1KB test data

    // Write
    let start = performance.now();
    await masterStorage.setItem('benchmark_test', testData as any);
    report.storage!.write = performance.now() - start;

    // Read
    start = performance.now();
    await masterStorage.getItem('benchmark_test');
    report.storage!.read = performance.now() - start;

    // Delete
    start = performance.now();
    await masterStorage.removeItem('benchmark_test');
    report.storage!.delete = performance.now() - start;

    // 2. AI Engine Benchmarks
    // Init (might be already initialized)
    start = performance.now();
    await AIEngine.init();
    report.aiEngine!.init = performance.now() - start;

    // Classify
    start = performance.now();
    await AIEngine.classifyTransaction('Quarterly budget review for marketing department');
    report.aiEngine!.classify = performance.now() - start;

    // Embedding
    start = performance.now();
    await AIEngine.getEmbeddings('Financial forecast for 2026');
    report.aiEngine!.embedding = performance.now() - start;

    return report as BenchmarkReport;
  }

  static async getHistory(): Promise<BenchmarkResult[]> {
    const history = await masterStorage.getItem('benchmark_history');
    return (history?.state as BenchmarkResult[]) || [];
  }

  static async saveResult(report: BenchmarkReport) {
    const history = await this.getHistory();
    const newResults: BenchmarkResult[] = [
      ...history,
      { timestamp: Date.now(), name: 'ai_init', duration: report.aiEngine.init },
      { timestamp: Date.now(), name: 'ai_classify', duration: report.aiEngine.classify },
      { timestamp: Date.now(), name: 'ai_embedding', duration: report.aiEngine.embedding },
      { timestamp: Date.now(), name: 'storage_write', duration: report.storage.write },
      { timestamp: Date.now(), name: 'storage_read', duration: report.storage.read },
      { timestamp: Date.now(), name: 'storage_delete', duration: report.storage.delete },
    ];

    // Keep only last 100 entries per type to avoid bloating storage
    const limitedHistory = newResults.slice(-600);
    await masterStorage.setItem('benchmark_history', { state: limitedHistory, version: 1 } as any);
  }
}
