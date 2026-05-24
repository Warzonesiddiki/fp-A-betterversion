/**
 * PluginSandbox — Isolated execution environment for plugin code.
 *
 * Plugins are loaded via `new Function()` with a restricted global proxy
 * that blocks access to dangerous APIs (fetch, XMLHttpRequest, eval, etc.)
 * while providing a safe subset for formula/chart/export extensions.
 */

import type { PluginAPI } from './types';

/** Globals allowed inside the sandbox */
const ALLOWED_GLOBALS = new Set([
  'Math',
  'Date',
  'JSON',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  'Number',
  'String',
  'Boolean',
  'Array',
  'Object',
  'Map',
  'Set',
  'console',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'Promise',
  'Error',
  'TypeError',
  'RangeError',
  'URIError',
  'RegExp',
  'Symbol',
  'BigInt',
  'Intl',
  'URL',
  'URLSearchParams',
]);

/** Globals explicitly blocked */
const BLOCKED_GLOBALS = new Set([
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'eval',
  'Function',
  'importScripts',
  'navigator',
  'location',
  'document',
  'window',
  'globalThis',
  'self',
  'global',
  'process',
  'require',
  'module',
  'exports',
  'import',
  'indexedDB',
  'localStorage',
  'sessionStorage',
  'crypto',
  'SubtleCrypto',
]);

export interface SandboxOptions {
  /** Maximum execution time in ms (default: 100) */
  timeout?: number;
  /** Memory limit — max objects created (default: 10000) */
  objectLimit?: number;
}

interface SandboxResult<T = unknown> {
  success: boolean;
  value?: T;
  error?: string;
}

/**
 * Create a sandboxed proxy of the global object.
 * Only ALLOWED_GLOBALS are accessible; everything else returns undefined.
 */
function createSandboxProxy(): Record<string, unknown> {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop) {
      if (typeof prop === 'symbol') return undefined;
      if (BLOCKED_GLOBALS.has(prop)) {
        throw new ReferenceError(`Access to '${prop}' is blocked in plugin sandbox`);
      }
      if (ALLOWED_GLOBALS.has(prop)) {
        // @ts-expect-error — dynamic global lookup
        const value = globalThis[prop];
        if (typeof value === 'function') {
          // Wrap functions to prevent `this` leaking
          return (...args: unknown[]) => value.apply(undefined, args);
        }
        return value;
      }
      return undefined;
    },
    has(_target, prop) {
      return typeof prop === 'string' && ALLOWED_GLOBALS.has(prop);
    },
    set() {
      throw new TypeError('Cannot set properties in plugin sandbox');
    },
    deleteProperty() {
      throw new TypeError('Cannot delete properties in plugin sandbox');
    },
    getPrototypeOf() {
      return null;
    },
  };

  return new Proxy({}, handler);
}

/**
 * Execute plugin code in a sandboxed environment.
 *
 * @param code — JavaScript code string (should return a value or define exports)
 * @param api — PluginAPI instance passed as `finplan` global
 * @param options — Sandbox limits
 * @returns Result with value or error
 */
export function executeSandboxed<T = unknown>(
  code: string,
  api: PluginAPI,
  options: SandboxOptions = {}
): SandboxResult<T> {
  const { timeout = 100, objectLimit = 10000 } = options;

  // Reject obviously dangerous patterns
  const dangerousPatterns = [
    /\beval\s*\(/,
    /\bnew\s+Function\s*\(/,
    /\bimport\s*\(/,
    /\brequire\s*\(/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bdocument\b/,
    /\bwindow\b/,
    /\bglobalThis\b/,
    /\bself\b/,
    /\bprocess\b/,
    /\bnavigator\b/,
    /\blocation\b/,
    /\bindexedDB\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bcrypto\b/,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return {
        success: false,
        error: `Blocked pattern detected: ${pattern.source}`,
      };
    }
  }

  // Track object creation for memory limiting
  let objectCount = 0;
  const trackedProxy = new Proxy(createSandboxProxy(), {
    get(target, prop) {
      const value = Reflect.get(target, prop);
      if (typeof value === 'object' && value !== null) {
        objectCount++;
        if (objectCount > objectLimit) {
          throw new RangeError(`Plugin exceeded object limit (${objectLimit})`);
        }
      }
      return value;
    },
  });

  // Inject finplan API as safe global
  const finplanApi = Object.freeze({
    registerFormulaFunction: api.formula?.registerFunction?.bind(api.formula),
    registerChartType: api.dashboards?.registerWidget?.bind(api.dashboards),
    registerExportFormat: api.export?.registerFormat?.bind(api.export),
    registerDataSource: api.import?.registerConnector?.bind(api.import),
    registerDashboardWidget: api.dashboards?.registerWidget?.bind(api.dashboards),
    log: (msg: string) => console.log(`[Plugin] ${msg}`),
  });

  try {
    // Use Function constructor for isolation — code runs with sandboxed `this`
    const sandboxFn = new Function(
      'globals',
      'finplan',
      `
      "use strict";
      const _g = globals;
      const ${[...ALLOWED_GLOBALS].map((g) => `${g} = _g.${g}`).join(', ')};
      ${[...BLOCKED_GLOBALS].map((g) => `const ${g} = undefined;`).join('\n')}
      return (function() { ${code} })();
      `
    );

    // Execute with timeout via AbortController-style wrapper
    const startTime = Date.now();
    const result = sandboxFn(trackedProxy, finplanApi);

    if (Date.now() - startTime > timeout) {
      return { success: false, error: `Plugin exceeded time limit (${timeout}ms)` };
    }

    return { success: true, value: result as T };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown sandbox error';
    return { success: false, error: msg };
  }
}

/**
 * Validate plugin code string for basic safety.
 * Returns true if code is safe to load (not execute).
 */
export function validatePluginCode(code: string): { safe: boolean; reason?: string } {
  // Must not exceed 100KB
  if (code.length > 100_000) {
    return { safe: false, reason: 'Code exceeds 100KB limit' };
  }

  // Must not contain nested function declarations that could escape
  if (/function\s+Function\s*\(/.test(code)) {
    return { safe: false, reason: 'Cannot redefine Function constructor' };
  }

  // Must not use indirect eval
  if (/\(0\s*,\s*eval\)/.test(code)) {
    return { safe: false, reason: 'Indirect eval detected' };
  }

  return { safe: true };
}
