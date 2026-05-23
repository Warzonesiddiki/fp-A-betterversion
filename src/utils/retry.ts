export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, i)));
    }
  }
  throw new Error('Retry failed');
}

export function createWorker<T>(workerFactory: () => Worker): {
  run: (data: unknown) => Promise<T>;
  terminate: () => void;
} {
  const worker = workerFactory();
  const run = (data: unknown): Promise<T> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        worker.terminate();
        reject(new Error('Computation timed out'));
      }, 30000);
      worker.onmessage = (e) => {
        clearTimeout(timer);
        if (e.data.error) reject(new Error(e.data.error));
        else resolve(e.data.result);
      };
      worker.onerror = (e) => {
        clearTimeout(timer);
        reject(e);
      };
      worker.postMessage(data);
    });
  };
  return { run, terminate: () => worker.terminate() };
}
