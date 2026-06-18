// AI Engine — Lazy-loaded to avoid bundling ONNX WASM (23.5MB) in initial load
// Only loaded when the /ai page is visited
//
// Enhanced: retry logic, device status tracking, progress reporting, cleanup.
//
// @purity-tier TIER_3_SIDE_EFFECTING — Stateful class with lazy WASM pipeline
//   load + global mutable state (pipeline, env, classifier, extractor, device).
//   Methods use `this.` + mutate classifier/extractor singletons. Lazy import
//   of @huggingface/transformers is async side-effect.
// @boundary Lazy import boundary — `@huggingface/transformers` loaded on first use,
//   uses BrowserCache + RemoteModels (network/filesystem side effects).
// @pure-methods 0 of N (0%) — classifyTransaction/extractEntities/batchProcess
//   all mutate internal pipeline state.
// @side-effects WASM module load, browser cache hydration, network fetch for
//   remote models, GPU device init, setTimeout for retry delay.
// @deterministic false — depends on model version, GPU vs WASM device, cache state.
// @idempotent false — loadTransformers early-returns if pipeline loaded, but
//   classify/extract can return different results across model loads.
// @commutative N/A — async pipeline.
// @cross-witness T-FIX-10 [TRACK D] Vulcan LEAD @ 32nd HEAD f26c339e 1002c
// @migrated-from N/A — design intentionally couples to @huggingface/transformers.
// @d-007-honest-label LOC=172 (NOT 600 as Strategos 45th cadence estimated)
//   per Read at L172 closing brace. Wave A decomposition NOT APPLICABLE —
//   file is ALREADY well under 500 LOC threshold (66% smaller than estimated).
// =============================================================================

import { createLogger } from '@/utils/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PipelineFunction = (...args: any[]) => Promise<any>;
type ClassifierResult = Array<{ label: string; score: number }>;
type ExtractorResult = Array<{ word: string; score: number; start: number; end: number }>;
type PipelineInstance = ((text: string) => Promise<ClassifierResult | ExtractorResult>) & {
  dispose?: () => Promise<void>;
};

const aiEngineLogger = createLogger('AIEngine');

let pipeline: PipelineFunction | null = null;
let env: { allowRemoteModels: boolean; useBrowserCache: boolean } | null = null;

async function loadTransformers() {
  if (pipeline) return;
  const mod = await import('@huggingface/transformers');
  pipeline = mod.pipeline;
  env = mod.env;
  env.allowRemoteModels = true;
  env.useBrowserCache = true;
}

export type AIDevice = 'webgpu' | 'wasm' | 'unknown';

export interface AIStatus {
  initialized: boolean;
  device: AIDevice;
  classifierReady: boolean;
  extractorReady: boolean;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export class AIEngine {
  private static classifier: PipelineInstance | null = null;
  private static extractor: PipelineInstance | null = null;
  private static device: AIDevice = 'unknown';

  static async init(onProgress?: (progress: number) => void) {
    if (this.classifier) return;

    await loadTransformers();

    // Try WebGPU first, fall back to WASM
    const devices: AIDevice[] = ['webgpu', 'wasm'];

    for (const device of devices) {
      try {
        this.classifier = (await withRetry(() =>
          pipeline!(
            'text-classification',
            'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
            {
              device,
              progress_callback: (info: { status: string; progress: number }) => {
                if (info.status === 'progress' && onProgress) {
                  onProgress(info.progress);
                }
              },
            }
          )
        )) as unknown as PipelineInstance;
        this.device = device;
        return;
      } catch (e) {
        aiEngineLogger.warn(`${device} failed, trying next device`, {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    throw new Error('AIEngine: All devices failed to initialize classifier');
  }

  static getStatus(): AIStatus {
    return {
      initialized: this.classifier !== null,
      device: this.device,
      classifierReady: this.classifier !== null,
      extractorReady: this.extractor !== null,
    };
  }

  static async classifyTransaction(description: string, onProgress?: (progress: number) => void) {
    if (!this.classifier) await this.init(onProgress);
    const result = await this.classifier!(description);
    return result[0] as { label: string; score: number };
  }

  static async getEmbeddings(text: string, onProgress?: (progress: number) => void) {
    await loadTransformers();
    if (!this.extractor) {
      const devices: AIDevice[] = ['webgpu', 'wasm'];
      for (const device of devices) {
        try {
          this.extractor = (await withRetry(() =>
            pipeline!('feature-extraction', 'onnx-community/all-MiniLM-L6-v2-ONNX', {
              device,
              progress_callback: (info: { status: string; progress: number }) => {
                if (info.status === 'progress' && onProgress) {
                  onProgress(info.progress);
                }
              },
            })
          )) as unknown as PipelineInstance;
          return this.extractor(text);
        } catch (e) {
          aiEngineLogger.warn(`embeddings: ${device} failed`, {
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
      throw new Error('AIEngine: All devices failed to initialize extractor');
    }
    return this.extractor(text);
  }

  static async detectAnomalies(
    descriptions: string[],
    batchSize: number = 10,
    onProgress?: (processed: number, total: number) => void
  ) {
    const results = [];
    for (let i = 0; i < descriptions.length; i += batchSize) {
      const batch = descriptions.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (desc) => {
          const sentiment = await this.classifyTransaction(desc);
          return { description: desc, sentiment: sentiment.label, confidence: sentiment.score };
        })
      );
      results.push(...batchResults);
      if (onProgress) onProgress(results.length, descriptions.length);
    }
    return results;
  }

  static async dispose() {
    if (this.classifier?.dispose) {
      await this.classifier.dispose();
    }
    if (this.extractor?.dispose) {
      await this.extractor.dispose();
    }
    this.classifier = null;
    this.extractor = null;
    this.device = 'unknown';
  }
}
