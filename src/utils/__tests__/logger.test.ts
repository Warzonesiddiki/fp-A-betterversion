import { describe, it, expect, beforeEach } from 'vitest';
import { Logger, createLogger } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    Logger.clearBuffer();
    Logger.setLevel('debug');
  });

  it('logs debug messages', () => {
    Logger.debug('test debug');
    const buf = Logger.getBuffer();
    expect(buf).toHaveLength(1);
    expect(buf![0]!.level).toBe('debug');
    expect(buf![0]!.message).toBe('test debug');
  });

  it('logs info messages', () => {
    Logger.info('test info');
    const buf = Logger.getBuffer();
    expect(buf![0]!.level).toBe('info');
  });

  it('logs warn messages', () => {
    Logger.warn('test warn', { key: 'value' });
    const buf = Logger.getBuffer();
    expect(buf![0]!.level).toBe('warn');
    expect(buf![0]!.context).toEqual({ key: 'value' });
  });

  it('logs error messages', () => {
    Logger.error('test error');
    const buf = Logger.getBuffer();
    expect(buf![0]!.level).toBe('error');
  });

  it('setLevel filters lower levels', () => {
    Logger.setLevel('error');
    Logger.info('should not appear');
    expect(Logger.getBuffer()).toHaveLength(0);
  });

  it('clearBuffer empties buffer', () => {
    Logger.info('msg');
    expect(Logger.getBuffer()).toHaveLength(1);
    Logger.clearBuffer();
    expect(Logger.getBuffer()).toHaveLength(0);
  });

  it('getRecent returns last N entries', () => {
    Logger.info('msg1');
    Logger.info('msg2');
    Logger.info('msg3');
    const recent = Logger.getRecent(2);
    expect(recent).toHaveLength(2);
    expect(recent![0]!.message).toBe('msg2');
  });

  it('createLogger adds source', () => {
    const log = createLogger('TestModule');
    log.info('module message');
    const buf = Logger.getBuffer();
    expect(buf![0]!.source).toBe('TestModule');
  });

  it('buffers up to max and shifts', () => {
    for (let i = 0; i < 1100; i++) Logger.info(`msg-${i}`);
    expect(Logger.getBuffer().length).toBeLessThanOrEqual(1000);
  });
});
