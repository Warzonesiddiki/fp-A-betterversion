import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const serverRoot = resolve(__dirname, '..', '..');
const FORBIDDEN_SECRET = 'finplan-dev-secret-change-in-production';

function readServerSource(...parts: string[]): string {
  return readFileSync(join(serverRoot, ...parts), 'utf-8');
}

function walkSource(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      files.push(...walkSource(full));
    } else if (entry.isFile() && (full.endsWith('.ts') || full.endsWith('.js'))) {
      files.push(full);
    }
  }
  return files;
}

describe('server environment configuration', () => {
  it('removes hardcoded JWT fallback from auth middleware', () => {
    const content = readServerSource('src', 'middleware', 'auth.ts');
    expect(content).not.toContain(FORBIDDEN_SECRET);
    expect(content).toContain("from '../config/env.js'");
  });

  it('removes hardcoded JWT fallback from auth routes', () => {
    const content = readServerSource('src', 'routes', 'auth.ts');
    expect(content).not.toContain(FORBIDDEN_SECRET);
    expect(content).toContain("from '../config/env.js'");
  });

  it('uses env-driven JWT secret with production fail-fast', () => {
    const content = readServerSource('src', 'config', 'env.ts');
    expect(content).toContain('process.env.JWT_SECRET');
    expect(content).toMatch(/process\.exit\(/);
    expect(content).not.toContain(FORBIDDEN_SECRET);
  });

  it('auto-generates a development secret only outside production', () => {
    const content = readServerSource('src', 'config', 'env.ts');
    expect(content).toMatch(/crypto\.randomBytes|randomUUID/);
    expect(content).toMatch(/development|!IS_PRODUCTION/);
  });

  it('documents JWT_SECRET as an empty placeholder in .env.example', () => {
    const envExample = join(serverRoot, '.env.example');
    expect(existsSync(envExample)).toBe(true);
    const content = readFileSync(envExample, 'utf-8');
    expect(content).toContain('JWT_SECRET');
    expect(content).not.toMatch(/JWT_SECRET=.+\S/);
  });

  it('does not reference the forbidden fallback in server source files', () => {
    const offenders = walkSource(join(serverRoot, 'src')).filter((file) => {
      if (file.endsWith('env.test.ts')) return false;
      return readFileSync(file, 'utf-8').includes(FORBIDDEN_SECRET);
    });
    expect(offenders).toEqual([]);
  });
});
