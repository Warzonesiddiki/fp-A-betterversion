/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports a logger object', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('debug logs in dev mode', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug('test debug message');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('info logs messages', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('test info message');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('warn logs warnings', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test warning');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('error logs errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('test error');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('logs with context object', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('test', { userId: '123', action: 'login' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('gets log buffer', () => {
    logger.info('buffered message');
    const buffer = logger.getBuffer();
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('clears log buffer', () => {
    logger.info('to be cleared');
    logger.clearBuffer();
    const buffer = logger.getBuffer();
    expect(buffer.length).toBe(0);
  });

  it('creates child logger with source', () => {
    const child = logger.child('TestComponent');
    expect(child).toBeDefined();
    expect(typeof child.info).toBe('function');
  });
});
