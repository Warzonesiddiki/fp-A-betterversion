export interface ChunkConfig {
  chunkSize: number;
  prefetchCount: number;
  maxCachedChunks: number;
  loadTimeout: number;
}

export interface DataChunk<T> {
  id: string;
  startIndex: number;
  endIndex: number;
  data: T[];
  loadedAt: number;
  lastAccessed: number;
}

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentChunk: string;
}

export type DataFetcher<T> = (startIndex: number, endIndex: number) => Promise<T[]>;

const DEFAULT_CONFIG: ChunkConfig = {
  chunkSize: 100,
  prefetchCount: 2,
  maxCachedChunks: 20,
  loadTimeout: 5000,
};

export class VirtualDataLoader<T = unknown> {
  private chunks = new Map<string, DataChunk<T>>();
  private loadingChunks = new Set<string>();
  private config: ChunkConfig;
  private fetcher: DataFetcher<T>;
  private totalCount = 0;
  private loadCallbacks = new Set<(progress: LoadProgress) => void>();

  constructor(fetcher: DataFetcher<T>, totalCount: number, config: Partial<ChunkConfig> = {}) {
    this.fetcher = fetcher;
    this.totalCount = totalCount;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getChunkId(startIndex: number): string {
    const chunkIndex = Math.floor(startIndex / this.config.chunkSize);
    return `chunk-${chunkIndex}`;
  }

  private getChunkRange(chunkId: string): { start: number; end: number } {
    const chunkIndex = parseInt(chunkId.replace('chunk-', ''), 10);
    const start = chunkIndex * this.config.chunkSize;
    const end = Math.min(start + this.config.chunkSize - 1, this.totalCount - 1);
    return { start, end };
  }

  private evictOldestChunk(): void {
    if (this.chunks.size <= this.config.maxCachedChunks) return;

    let oldestId: string | null = null;
    let oldestTime = Infinity;

    for (const [id, chunk] of Array.from(this.chunks)) {
      if (chunk.lastAccessed < oldestTime) {
        oldestTime = chunk.lastAccessed;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.chunks.delete(oldestId);
    }
  }

  private async loadChunk(chunkId: string): Promise<DataChunk<T>> {
    if (this.loadingChunks.has(chunkId)) {
      return new Promise((resolve) => {
        const check = () => {
          const chunk = this.chunks.get(chunkId);
          if (chunk) {
            resolve(chunk);
          } else {
            setTimeout(check, 50);
          }
        };
        check();
      });
    }

    const existing = this.chunks.get(chunkId);
    if (existing) {
      existing.lastAccessed = Date.now();
      return existing;
    }

    this.loadingChunks.add(chunkId);
    const { start, end } = this.getChunkRange(chunkId);

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Chunk ${chunkId} load timeout`)),
          this.config.loadTimeout
        );
      });

      const data = await Promise.race([this.fetcher(start, end), timeoutPromise]);

      const chunk: DataChunk<T> = {
        id: chunkId,
        startIndex: start,
        endIndex: end,
        data,
        loadedAt: Date.now(),
        lastAccessed: Date.now(),
      };

      this.evictOldestChunk();
      this.chunks.set(chunkId, chunk);
      this.loadingChunks.delete(chunkId);

      return chunk;
    } catch (error) {
      this.loadingChunks.delete(chunkId);
      throw error;
    }
  }

  async getRange(startIndex: number, endIndex: number): Promise<T[]> {
    const results: T[] = [];
    const chunksToLoad = new Set<string>();

    for (let i = startIndex; i <= endIndex; i++) {
      const chunkId = this.getChunkId(i);
      chunksToLoad.add(chunkId);
    }

    const loadPromises = Array.from(chunksToLoad).map((id) => this.loadChunk(id));
    const loadedChunks = await Promise.all(loadPromises);

    for (let i = startIndex; i <= endIndex; i++) {
      const chunkId = this.getChunkId(i);
      const chunk = loadedChunks.find((c) => c.id === chunkId);
      if (chunk) {
        const localIndex = i - chunk.startIndex;
        if (localIndex >= 0 && localIndex < chunk.data.length) {
          results.push(chunk.data[localIndex]);
        }
      }
    }

    return results;
  }

  async getItem(index: number): Promise<T | undefined> {
    const chunkId = this.getChunkId(index);
    const chunk = await this.loadChunk(chunkId);
    const localIndex = index - chunk.startIndex;
    return chunk.data[localIndex];
  }

  async getVisibleRange(startIndex: number, visibleCount: number): Promise<T[]> {
    const endIndex = Math.min(startIndex + visibleCount - 1, this.totalCount - 1);
    const result = await this.getRange(startIndex, endIndex);

    this.prefetchAdjacent(startIndex, endIndex);

    return result;
  }

  private async prefetchAdjacent(startIndex: number, endIndex: number): Promise<void> {
    const prefetchPromises: Promise<DataChunk<T>>[] = [];

    for (let i = 1; i <= this.config.prefetchCount; i++) {
      const beforeStart = startIndex - i * this.config.chunkSize;
      if (beforeStart >= 0) {
        const chunkId = this.getChunkId(beforeStart);
        if (!this.chunks.has(chunkId) && !this.loadingChunks.has(chunkId)) {
          prefetchPromises.push(this.loadChunk(chunkId));
        }
      }

      const afterStart = endIndex + 1 + (i - 1) * this.config.chunkSize;
      if (afterStart < this.totalCount) {
        const chunkId = this.getChunkId(afterStart);
        if (!this.chunks.has(chunkId) && !this.loadingChunks.has(chunkId)) {
          prefetchPromises.push(this.loadChunk(chunkId));
        }
      }
    }

    if (prefetchPromises.length > 0) {
      Promise.all(prefetchPromises).catch(() => {
        // Prefetch failures are non-critical
      });
    }
  }

  onProgress(callback: (progress: LoadProgress) => void): () => void {
    this.loadCallbacks.add(callback);
    return () => this.loadCallbacks.delete(callback);
  }

  private notifyProgress(chunkId: string, loaded: number): void {
    const progress: LoadProgress = {
      loaded,
      total: this.totalCount,
      percentage: (loaded / this.totalCount) * 100,
      currentChunk: chunkId,
    };
    this.loadCallbacks.forEach((cb) => cb(progress));
  }

  isChunkLoaded(index: number): boolean {
    const chunkId = this.getChunkId(index);
    return this.chunks.has(chunkId);
  }

  isChunkLoading(index: number): boolean {
    const chunkId = this.getChunkId(index);
    return this.loadingChunks.has(chunkId);
  }

  getCachedRange(): { start: number; end: number } | null {
    if (this.chunks.size === 0) return null;

    let minStart = Infinity;
    let maxEnd = -Infinity;

    for (const chunk of Array.from(this.chunks.values())) {
      minStart = Math.min(minStart, chunk.startIndex);
      maxEnd = Math.max(maxEnd, chunk.endIndex);
    }

    return { start: minStart, end: maxEnd };
  }

  getCacheStats(): {
    cachedChunks: number;
    loadingChunks: number;
    totalItems: number;
    cachedItems: number;
    memoryEstimate: number;
  } {
    let cachedItems = 0;
    for (const chunk of Array.from(this.chunks.values())) {
      cachedItems += chunk.data.length;
    }

    return {
      cachedChunks: this.chunks.size,
      loadingChunks: this.loadingChunks.size,
      totalItems: this.totalCount,
      cachedItems,
      memoryEstimate: cachedItems * 64,
    };
  }

  updateTotalCount(newCount: number): void {
    this.totalCount = newCount;
  }

  clearCache(): void {
    this.chunks.clear();
    this.loadingChunks.clear();
  }

  invalidateChunk(index: number): void {
    const chunkId = this.getChunkId(index);
    this.chunks.delete(chunkId);
  }

  invalidateAll(): void {
    this.chunks.clear();
  }
}

export function createGridDataLoader<T>(
  fetcher: DataFetcher<T>,
  totalRows: number,
  config?: Partial<ChunkConfig>
): VirtualDataLoader<T> {
  return new VirtualDataLoader(fetcher, totalRows, {
    chunkSize: 50,
    prefetchCount: 2,
    maxCachedChunks: 30,
    ...config,
  });
}

export function createLargeDatasetLoader<T>(
  fetcher: DataFetcher<T>,
  totalRows: number,
  config?: Partial<ChunkConfig>
): VirtualDataLoader<T> {
  return new VirtualDataLoader(fetcher, totalRows, {
    chunkSize: 500,
    prefetchCount: 3,
    maxCachedChunks: 10,
    ...config,
  });
}
