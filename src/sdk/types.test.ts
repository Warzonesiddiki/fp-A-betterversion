/**
 * Vitest spec for src/sdk/types.ts
 *
 * Validates the public type contract of the FpaClient SDK:
 *  - AuthConfig 4-way discriminated union
 *  - OAuth2 client/tokens split
 *  - FpaClientConfig defaults and overrides
 *  - ConnectorOptions shape
 *  - SdkResult discriminator
 *  - SDK_VERSION semver format
 *  - Realtime event type taxonomy (10 types)
 *
 * NO mocks: this file exercises only pure type-shape and constant values.
 * Runtime behaviour of FpaClient / RealtimeChannel is covered in their own specs.
 *
 * @see docs/parts/API_REFERENCE.md §11 (versioning) and §16 (sub-persona coverage)
 */

import { describe, it, expect } from 'vitest';
import * as sdkTypes from './types';
import {
  SDK_VERSION,
  DEFAULT_REALTIME_PATH,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_RETRY_COUNT,
  ApiNotConfiguredError,
  type AuthConfig,
  type FpaClientConfig,
  type ConnectorOptions,
  type SdkResult,
  type SdkError,
  type RealtimeEvent,
  type ConnectionState,
  type OAuth2ClientConfig,
  type OAuth2TokenState,
} from './types';

describe('SDK_VERSION', () => {
  it('is a semver string', () => {
    expect(SDK_VERSION).toMatch(/^\d+\.\d+\.\d+(?:-[\w.]+)?$/);
  });

  it('is currently 0.1.0', () => {
    expect(SDK_VERSION).toBe('0.1.0');
  });
});

describe('defaults', () => {
  it('exports NO fictional default base URL — the module namespace must not reference finplanpro.dev', () => {
    // W6-P0-13 api-origin-truth: the SDK used to ship a hardcoded
    // `https://api.finplanpro.dev/v1` DEFAULT_BASE_URL. That host does not
    // exist; the constant (and every string export) must stay free of it.
    for (const value of Object.values(sdkTypes)) {
      if (typeof value === 'string') {
        expect(value).not.toContain('finplanpro.dev');
      }
    }
    expect('DEFAULT_BASE_URL' in sdkTypes).toBe(false);
  });

  it('ApiNotConfiguredError is exported, is an Error, and explains VITE_API_URL configuration', () => {
    expect(typeof ApiNotConfiguredError).toBe('function');
    const err = new ApiNotConfiguredError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiNotConfiguredError');
    expect(err.message).toContain('VITE_API_URL');
  });

  it('DEFAULT_REALTIME_PATH is /realtime', () => {
    expect(DEFAULT_REALTIME_PATH).toBe('/realtime');
  });

  it('DEFAULT_TIMEOUT_MS is 30s', () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(30_000);
  });

  it('DEFAULT_RETRY_COUNT is 3', () => {
    expect(DEFAULT_RETRY_COUNT).toBe(3);
  });
});

describe('AuthConfig — discriminated union', () => {
  it('accepts oauth2 with full client config + tokens', () => {
    const auth: AuthConfig = {
      type: 'oauth2',
      client: {
        clientId: 'cid',
        clientSecret: 'csec',
        tokenUrl: 'https://oauth.example.com/token',
        redirectUri: 'https://app/cb',
        scopes: ['workbook.read', 'workbook.write'],
      },
      tokens: {
        accessToken: 'at',
        refreshToken: 'rt',
        expiresAt: Date.now() + 3_600_000,
        tokenType: 'Bearer',
        scope: 'workbook.read workbook.write',
      },
    };
    expect(auth.type).toBe('oauth2');
    if (auth.type === 'oauth2') {
      expect(auth.client.clientId).toBe('cid');
      expect(auth.tokens.refreshToken).toBe('rt');
      expect(auth.tokens.expiresAt).toBeGreaterThan(0);
    }
  });

  it('accepts oauth2 with minimal OAuth2ClientConfig (only required fields)', () => {
    const client: OAuth2ClientConfig = {
      clientId: 'cid',
      clientSecret: 'csec',
      tokenUrl: 'https://oauth.example.com/token',
    };
    const tokens: OAuth2TokenState = {
      accessToken: 'at',
      refreshToken: 'rt',
      expiresAt: 0, // 0 = disable preemptive refresh
    };
    const auth: AuthConfig = { type: 'oauth2', client, tokens };
    expect(auth.type).toBe('oauth2');
  });

  it('accepts apiKey', () => {
    const auth: AuthConfig = { type: 'apiKey', apiKey: 'sk_test', headerName: 'X-API-Key' };
    expect(auth.type).toBe('apiKey');
    if (auth.type === 'apiKey') {
      expect(auth.apiKey).toBe('sk_test');
      expect(auth.headerName).toBe('X-API-Key');
    }
  });

  it('accepts bearer', () => {
    const auth: AuthConfig = { type: 'bearer', token: 'ey...' };
    expect(auth.type).toBe('bearer');
    if (auth.type === 'bearer') {
      expect(auth.token).toBe('ey...');
    }
  });

  it('accepts basic', () => {
    const auth: AuthConfig = { type: 'basic', username: 'u', password: 'p' };
    expect(auth.type).toBe('basic');
    if (auth.type === 'basic') {
      expect(auth.username).toBe('u');
      expect(auth.password).toBe('p');
    }
  });

  it('discriminator narrows correctly — 4 distinct shapes', () => {
    // Type-level test: each variant must be assignable to AuthConfig.
    const variants: AuthConfig[] = [
      {
        type: 'oauth2',
        client: { clientId: '', clientSecret: '', tokenUrl: '' },
        tokens: { accessToken: '', refreshToken: '', expiresAt: 0 },
      },
      { type: 'apiKey', apiKey: '' },
      { type: 'bearer', token: '' },
      { type: 'basic', username: '', password: '' },
    ];
    expect(variants).toHaveLength(4);
    const types = variants.map((v) => v.type).sort();
    expect(types).toEqual(['apiKey', 'basic', 'bearer', 'oauth2']);
  });
});

describe('FpaClientConfig', () => {
  it('requires only auth', () => {
    const cfg: FpaClientConfig = { auth: { type: 'bearer', token: 't' } };
    expect(cfg.auth.type).toBe('bearer');
    expect(cfg.baseUrl).toBeUndefined();
  });

  it('accepts all optional fields', () => {
    const cfg: FpaClientConfig = {
      baseUrl: 'https://api.example.com',
      auth: { type: 'apiKey', apiKey: 'k' },
      timeoutMs: 15_000,
      retryCount: 5,
      connector: 'qbo',
      headers: { 'X-Org-Id': 'org-1' },
      realtimeUrl: 'wss://ws.example.com/r',
      onAuthRefresh: async (auth) => auth,
    };
    expect(cfg.timeoutMs).toBe(15_000);
    expect(cfg.retryCount).toBe(5);
    expect(cfg.connector).toBe('qbo');
    expect(cfg.headers!['X-Org-Id']).toBe('org-1');
    expect(typeof cfg.onAuthRefresh).toBe('function');
  });
});

describe('ConnectorOptions', () => {
  it('all fields are optional', () => {
    const opts: ConnectorOptions = {};
    expect(opts.tenantId).toBeUndefined();
  });

  it('accepts tenantId + minorVersion + sandbox', () => {
    const opts: ConnectorOptions = {
      tenantId: 'realm-123',
      minorVersion: '65',
      sandbox: true,
    };
    expect(opts.sandbox).toBe(true);
  });
});

describe('SdkResult', () => {
  it('ok: true carries value', () => {
    const r: SdkResult<number> = { ok: true, value: 42 };
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(42);
  });

  it('ok: false carries error', () => {
    const err: SdkError = { code: 'E_AUTH', message: 'invalid token', status: 401 };
    const r: SdkResult<number> = { ok: false, error: err };
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('E_AUTH');
      expect(r.error.status).toBe(401);
    }
  });
});

describe('Realtime event taxonomy (10 types)', () => {
  it('all 10 expected event types are valid', () => {
    const types: RealtimeEvent['type'][] = [
      'cell:edit',
      'sheet:created',
      'cell:formatted',
      'cursor:moved',
      'comment:added',
      'selection:changed',
      'presence:joined',
      'presence:left',
      'data:imported',
      'formula:recalculated',
    ];
    expect(types).toHaveLength(10);
    // Each must be constructable
    const events: RealtimeEvent[] = [
      { type: 'cell:edit', payload: { sheetId: 's', cell: 'A1', value: 1, userId: 'u', ts: 1 } },
      { type: 'sheet:created', payload: { sheetId: 's', userId: 'u' } },
      { type: 'cell:formatted', payload: { range: 'A1:B2', style: {} } },
      { type: 'cursor:moved', payload: { userId: 'u', cell: 'A1' } },
      { type: 'comment:added', payload: { cell: 'A1', author: 'u', text: 'hi' } },
      { type: 'selection:changed', payload: { userId: 'u', range: 'A1:A10' } },
      { type: 'presence:joined', payload: { userId: 'u', name: 'Alice' } },
      { type: 'presence:left', payload: { userId: 'u' } },
      { type: 'data:imported', payload: { source: 'qbo', rows: 100 } },
      { type: 'formula:recalculated', payload: { sheetId: 's', durationMs: 50 } },
    ];
    expect(events).toHaveLength(10);
  });
});

describe('ConnectionState', () => {
  it('has 6 valid states', () => {
    const states: ConnectionState[] = [
      'idle',
      'connecting',
      'connected',
      'reconnecting',
      'closed',
      'error',
    ];
    expect(states).toHaveLength(6);
  });
});
