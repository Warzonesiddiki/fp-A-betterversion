/** Exact, side-effect-free GL chunk computation. Persistence stays with the coordinator. */
import { SmartImportMapper } from '@/engines/SmartImportMapper';
import { validateGLIngestionChunk } from './glIngestionRequest';
import { readMessageId, readMessagePayload } from './validateRequest';
import type { WorkerResponse } from './types';
import type { GLIngestResult } from '@/types/glIngestion';

self.onmessage = (event: MessageEvent<unknown>) => {
  const id = readMessageId(event.data);
  try {
    const input = validateGLIngestionChunk(readMessagePayload(event.data));
    const response: WorkerResponse<GLIngestResult> = {
      id,
      type: 'result',
      payload: SmartImportMapper.ingest(input),
    };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      type: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};
