interface BundleInfo {
  totalSize: number;
  gzippedSize: number;
  chunks: { name: string; size: number }[];
}

export function getBundleSize(): BundleInfo | null {
  if (typeof window === 'undefined' || !window.performance) return null;

  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const jsEntries = entries.filter((e) => e.name.endsWith('.js'));

  return {
    totalSize: jsEntries.reduce((sum, e) => sum + (e.transferSize || 0), 0),
    gzippedSize: jsEntries.reduce((sum, e) => sum + (e.encodedBodySize || 0), 0),
    chunks: jsEntries.map((e) => ({
      name: e.name.split('/').pop() || e.name,
      size: e.transferSize || 0,
    })),
  };
}

export function logBundleSize() {
  if (process.env.NODE_ENV !== 'development') return;
  const info = getBundleSize();
  if (info) {
    console.group('[Bundle Analysis]');
    console.log(`Total: ${(info.totalSize / 1024).toFixed(1)}KB`);
    console.log(`Gzipped: ${(info.gzippedSize / 1024).toFixed(1)}KB`);
    console.table(info.chunks.sort((a, b) => b.size - a.size).slice(0, 10));
    console.groupEnd();
  }
}
