import { describe, it, expect } from 'vitest';
import { ApiError } from './types';

describe('ApiError', () => {
  it('should create error with all properties', () => {
    const error = new ApiError('Not Found', 404, 'Not Found', { message: 'Resource not found' });

    expect(error.message).toBe('Not Found');
    expect(error.status).toBe(404);
    expect(error.statusText).toBe('Not Found');
    expect(error.data).toEqual({ message: 'Resource not found' });
    expect(error.name).toBe('ApiError');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
  });

  it('should create error without data', () => {
    const error = new ApiError('Server Error', 500, 'Internal Server Error');

    expect(error.message).toBe('Server Error');
    expect(error.status).toBe(500);
    expect(error.statusText).toBe('Internal Server Error');
    expect(error.data).toBeUndefined();
  });

  it('should be throwable', () => {
    expect(() => {
      throw new ApiError('Unauthorized', 401, 'Unauthorized');
    }).toThrow(ApiError);
  });

  it('should preserve stack trace', () => {
    const error = new ApiError('Test', 500, 'Error');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('ApiError');
  });
});
