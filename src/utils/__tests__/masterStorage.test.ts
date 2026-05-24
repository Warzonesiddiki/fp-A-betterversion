import { describe, it, expect } from 'vitest';
import { masterStorage } from '../masterStorage';

describe('masterStorage', () => {
  it('has required methods', () => {
    expect(masterStorage.getItem).toBeDefined();
    expect(masterStorage.setItem).toBeDefined();
    expect(masterStorage.removeItem).toBeDefined();
  });

  it('getItem returns null when not in Tauri', async () => {
    const result = await masterStorage.getItem('test');
    expect(result).toBeNull();
  });
});
