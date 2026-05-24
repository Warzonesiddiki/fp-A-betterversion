/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger, createLogger } from './logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports a Logger object', () => {
    expect(Logger).toBeDefined();
    expect(typeof Logger.debug).toBe('function');
    expect(typeof Logger.info).toBe('function');
    expect(typeof Logger.warn).toBe('function');
    expect(typeof Logger.error).toBe('function');
  });

  it('debug logs in dev mode', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    Logger.debug('test debug message');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('info logs messages', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    Logger.info('test info message');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('warn logs warnings', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    Logger.warn('test warning');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('error logs errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    Logger.error('test error');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('logs with context object', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    Logger.info('test', { userId: '123', action: 'login' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('gets log buffer', () => {
    Logger.info('buffered message');
    const buffer = Logger.getBuffer();
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('clears log buffer', () => {
    Logger.info('to be cleared');
    Logger.clearBuffer();
    const buffer = Logger.getBuffer();
    expect(buffer.length).toBe(0);
  });

  it('creates child logger with source', () => {
    const child = createLogger('TestComponent');
    expect(child).toBeDefined();
    expect(typeof child.info).toBe('function');
  });
});
