import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PersistenceDebouncer } from '../persistenceDebouncer';

describe('PersistenceDebouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('queues writes and flushes after debounce', async () => {
    const writeFn = vi.fn().mockResolvedValue(undefined);
    const debouncer = new PersistenceDebouncer(100);
    debouncer.setWriteFn(writeFn);

    debouncer.queue('key1', { data: 1 });
    debouncer.queue('key2', { data: 2 });

    expect(debouncer.getPendingCount()).toBe(2);

    await vi.advanceTimersByTimeAsync(100);
    expect(writeFn).toHaveBeenCalledTimes(2);
    expect(debouncer.getPendingCount()).toBe(0);
  });

  it('debounces repeated writes to same key', async () => {
    const writeFn = vi.fn().mockResolvedValue(undefined);
    const debouncer = new PersistenceDebouncer(100);
    debouncer.setWriteFn(writeFn);

    debouncer.queue('key1', { data: 1 });
    debouncer.queue('key1', { data: 2 });
    debouncer.queue('key1', { data: 3 });

    await vi.advanceTimersByTimeAsync(100);
    expect(writeFn).toHaveBeenCalledTimes(1);
    expect(writeFn).toHaveBeenCalledWith('key1', { data: 3 });
  });

  it('pause prevents flushing', async () => {
    const writeFn = vi.fn().mockResolvedValue(undefined);
    const debouncer = new PersistenceDebouncer(100);
    debouncer.setWriteFn(writeFn);

    debouncer.queue('key1', { data: 1 });
    debouncer.pause();

    await vi.advanceTimersByTimeAsync(200);
    expect(writeFn).not.toHaveBeenCalled();
  });

  it('resume flushes pending', async () => {
    const writeFn = vi.fn().mockResolvedValue(undefined);
    const debouncer = new PersistenceDebouncer(100);
    debouncer.setWriteFn(writeFn);

    debouncer.queue('key1', { data: 1 });
    debouncer.pause();
    await debouncer.resume();

    await vi.advanceTimersByTimeAsync(100);
    expect(writeFn).toHaveBeenCalled();
  });

  it('flush writes nothing when no fn set', async () => {
    const debouncer = new PersistenceDebouncer(100);
    debouncer.queue('key', 'value');
    await debouncer.flush();
  });

  it('clear removes all pending', () => {
    const debouncer = new PersistenceDebouncer(100);
    debouncer.queue('key1', 1);
    debouncer.queue('key2', 2);
    debouncer.clear();
    expect(debouncer.getPendingCount()).toBe(0);
  });

  it('re-queues failed writes', async () => {
    const writeFn = vi.fn().mockRejectedValue(new Error('write failed'));
    const debouncer = new PersistenceDebouncer(100);
    debouncer.setWriteFn(writeFn);

    debouncer.queue('key1', { data: 1 });
    await vi.advanceTimersByTimeAsync(100);

    expect(debouncer.getPendingCount()).toBe(1);
  });
});
