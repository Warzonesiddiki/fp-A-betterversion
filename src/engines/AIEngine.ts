// AI Engine — Lazy-loaded to avoid bundling ONNX WASM (23.5MB) in initial load
// Only loaded when the /ai page is visited

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PipelineFunction = (...args: any[]) => Promise<any>;
type ClassifierResult = Array<{ label: string; score: number }>;
type ExtractorResult = Array<{ word: string; score: number; start: number; end: number }>;
type PipelineInstance = ((text: string) => Promise<ClassifierResult | ExtractorResult>) & {
  dispose?: () => Promise<void>;
};

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

export class AIEngine {
  private static classifier: PipelineInstance | null = null;
  private static extractor: PipelineInstance | null = null;

  static async init(onProgress?: (progress: number) => void) {
    if (this.classifier) return;

    await loadTransformers();

    try {
      this.classifier = (await pipeline!(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        {
          device: 'webgpu',
          progress_callback: (info: { status: string; progress: number }) => {
            if (info.status === 'progress' && onProgress) {
              onProgress(info.progress);
            }
          },
        }
      )) as unknown as PipelineInstance;
    } catch (e) {
      console.warn('WebGPU not available, falling back to WASM/CPU', e);
      this.classifier = (await pipeline!(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        {
          device: 'wasm',
        }
      )) as unknown as PipelineInstance;
    }
  }

  static async classifyTransaction(description: string) {
    if (!this.classifier) await this.init();
    const result = await this.classifier(description);
    return result[0];
  }

  static async getEmbeddings(text: string) {
    await loadTransformers();
    if (!this.extractor) {
      this.extractor = (await pipeline!(
        'feature-extraction',
        'onnx-community/all-MiniLM-L6-v2-ONNX',
        {
          device: 'webgpu',
        }
      )) as unknown as PipelineInstance;
    }
    const output = await this.extractor(text);
    return output;
  }

  static async detectAnomalies(descriptions: string[]) {
    const results = [];
    for (const desc of descriptions) {
      const sentiment = await this.classifyTransaction(desc);
      results.push({ description: desc, sentiment: sentiment.label, confidence: sentiment.score });
    }
    return results;
  }
}
