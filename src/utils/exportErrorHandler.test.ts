import { describe, it, expect, vi, beforeEach } from 'vitest';

const { logger } = vi.hoisted(() => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/utils/logger', () => ({
  createLogger: () => logger,
}));

import { reportExportFailure } from './exportErrorHandler';

describe('reportExportFailure', () => {
  beforeEach(() => {
    logger.error.mockClear();
  });

  it('logs Error instances with their message', () => {
    reportExportFailure(new Error('PDF render failed'));
    expect(logger.error).toHaveBeenCalledWith('Export failed', {
      error: 'PDF render failed',
    });
  });

  it('stringifies non-Error failures', () => {
    reportExportFailure('boom');
    expect(logger.error).toHaveBeenCalledWith('Export failed', { error: 'boom' });

    reportExportFailure({ weird: true });
    expect(logger.error).toHaveBeenCalledWith('Export failed', { error: '[object Object]' });
  });
});
