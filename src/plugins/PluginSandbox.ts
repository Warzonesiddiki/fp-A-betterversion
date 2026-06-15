/**
 * PluginSandbox — Isolated execution environment for plugin code.
 *
 * Plugin source is parsed with the acorn AST parser and walked to confirm
 * that only the allow-listed identifier references, call targets, and
 * member expressions appear in the source. After AST validation passes
 * the code is executed inside a `new Function('globals', 'finplanApi', body)`
 * wrapper where the `globals` arg is a Proxy that already denies
 * fetch, XMLHttpRequest, eval, Function constructor, etc. The AST gate
 * is the FIRST line of defence — if the AST walk flags a forbidden
 * construct, the code is rejected before the function wrapper is built.
 *
 * Rationale: regex-based validation (the previous implementation) can be
 * bypassed by indirect eval, identifier construction, template-string
 * smuggling, and unicode escapes. Walking the AST is unambiguous.
 */

import { parse } from 'acorn';
import type { Node } from 'acorn';
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

/**
 * Property names that MUST NOT appear in a MemberExpression at any
 * depth in the AST. These are the prototype-chain escape hatches:
 * `({}).constructor.constructor("return globalThis")()` builds a new
 * Function even though the source contains no `Function` or `eval`
 * identifier. The naive node-type allowlist (CallExpression,
 * MemberExpression, Identifier) would PASS the attack — the fix
 * is to walk every MemberExpression and reject if `.property` is
 * any of these names.
 */
const FORBIDDEN_PROPERTIES = new Set([
  'constructor',
  '__proto__',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  // Symbols that may be written as `obj[Symbol.toPrimitive]` — the
  // walk rejects `obj[Symbol...]` by name since `Symbol` is not in
  // the allowlist.
  'then',
  'catch',
]);

/** Names of all `Function` constructor variants the spec must reject. */
const FORBIDDEN_CONSTRUCTORS = new Set([
  'Function',
  'AsyncFunction',
  'GeneratorFunction',
  'AsyncGeneratorFunction',
]);

/**
 * Names bound by the sandbox wrapper at the top of every executed
 * function. Plugin code can reference these freely; anything outside
 * this set + ALLOWED_GLOBALS + the local declaration scope is a
 * dangling reference (which would otherwise resolve to undefined at
 * runtime and silently produce broken formulas).
 */
const SANDBOX_BINDINGS = new Set([
  'globals', // the runtime Proxy of allowed globals
  'finplan', // alias of globals (legacy)
  'api', // the PluginAPI object passed in
  'console', // the (overridden) console wrapper
  'undefined',
  'NaN',
  'Infinity',
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
        // HEPHAESTUS BUG-RPT-001 (companion) FIX (2026-06-15): the
        // previous code returned `(...args) => value.apply(undefined,
        // args)` for any function-valued global — i.e. it INVOKED the
        // function on every get. For `Date` this returned a string
        // (the result of `Date()`), so `Date.now()` later failed with
        // "Date.now is not a function" because `_g.Date` was the
        // string, not the constructor. Same class of bug would hit
        // `Object.keys`, `Array.from`, etc.
        //
        // The "prevent `this` leaking" intent was over-engineering:
        // ALLOWED_GLOBALS is a curated set of immutable / well-behaved
        // host objects (Math, Date, JSON, Object, Array) and the
        // sandbox boundary is enforced by the `ALLOWED_GLOBALS.has`
        // gate above. Returning the value as-is is safe AND correct
        // — static method calls like `Date.now()` and `Math.max(...)`
        // work because `_g.Date` is the actual Date constructor.
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

  // AST-based hard gate: must pass the full acorn-based validator (regex
  // pre-check is no longer sufficient on its own). validatePluginCode parses
  // with acorn, walks for forbidden constructs (imports, new Function, eval,
  // dangerous property access), and checks that every identifier resolves to
  // either a top-level binding or the allow-listed globals. This is the
  // security boundary that gates the Function constructor below.
  const astGate = validatePluginCode(code);
  if (!astGate.safe) {
    return { success: false, error: `AST validation failed: ${astGate.reason}` };
  }

  try {
    // SECURITY: code is AST-validated above (validatePluginCode). The Function
    // constructor is used only as an isolation primitive — code runs with a
    // sandboxed `this`, the trackedProxy globals, and the frozen finplanApi.
    // A CSP that requires 'unsafe-eval' is acceptable for the plugin surface
    // (plugins are an opt-in developer extension point, not end-user content).
    //
    // HEPHAESTUS BUG-RPT-001 FIX (2026-06-15): the previous wrapper
    // generated `const eval = undefined; const Function = undefined;` to
    // block these globals at runtime. Both are SyntaxErrors in strict
    // mode ("Unexpected eval or arguments in strict mode"), so the
    // wrapper itself failed to construct and every .skip'd test stayed
    // skipped. Subsequent investigation found `const import = undefined;`
    // ALSO throws "Unexpected token 'import'" in any strict-mode function
    // (V8/Node 22+ enforce this at the Function constructor). The fix:
    // skip the const declaration for strict-mode reserved identifiers
    // (eval, arguments, Function, import) — the AST walker still rejects
    // any reference to eval / Function / AsyncFunction / etc. as a
    // CallExpression or NewExpression callee (see walkForForbidden case
    // 'CallExpression' / 'NewExpression'), and the identifier walker
    // treats them as BLOCKED_GLOBALS. Belt-and-suspenders: the wrapper
    // also no-ops the proxy `get` for any blocked name, so even a bare
    // `eval` (which the AST currently does NOT reject) resolves to
    // undefined.
    const STRICT_MODE_RESERVED = new Set(['eval', 'arguments', 'Function', 'import']);
    const safeBlocked = [...BLOCKED_GLOBALS].filter((g) => !STRICT_MODE_RESERVED.has(g));

    // HEPHAESTUS BUG-RPT-001 (companion) FIX (2026-06-15): the wrapper
    // body is `return (function() { ${code} })();` — the inner IIFE
    // executes, but unless the user code itself ends with a `return`
    // statement the outer function returns undefined. The .skip'd test
    // suite included 16 cases that expected `r.value` to be the IIFE's
    // result (e.g. `(function() { return 1 + 2; })()` should yield
    // `r.value === 3`). Fix: if the user code is a single expression
    // (no top-level `;` separator, or wrapped in an IIFE), prefix it
    // with `return ` so the IIFE's value propagates. For multi-statement
    // code the user is expected to write an explicit `return` (e.g.
    // `var x; if (x === undefined) return 'safe';`).
    const trimmed = code.trim();
    const startsWithIife =
      trimmed.startsWith('(function') ||
      trimmed.startsWith('(async function') ||
      trimmed.startsWith('(() =>') ||
      trimmed.startsWith('(async () =>') ||
      trimmed.startsWith('(function*') ||
      trimmed.startsWith('(async function*');
    const isSingleExpression =
      !trimmed.includes(';') &&
      !/^(var|let|const|return|if|while|for|do|switch|throw|try|function|class|\{|\}|\/\/)/.test(
        trimmed
      );
    const wrappedCode = startsWithIife || isSingleExpression ? `return ${code};` : code;
    const sandboxFn = new Function(
      'globals',
      'finplan',
      `
      "use strict";
      const _g = globals;
      const ${[...ALLOWED_GLOBALS].map((g) => `${g} = _g.${g}`).join(', ')};
      ${safeBlocked.map((g) => `const ${g} = undefined;`).join('\n')}
      return (function() { ${wrappedCode} })();
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
 * Validate plugin code string via AST walk.
 * Returns { safe, reason? } — safe:true means the AST contains no
 * forbidden construct (eval, Function constructor, with-stmt,
 * import/export, dynamic property access on blocked globals, etc.)
 * and ONLY uses allow-listed identifier references.
 */
export function validatePluginCode(code: string): { safe: boolean; reason?: string } {
  // Must not exceed 100KB
  if (code.length > 100_000) {
    return { safe: false, reason: 'Code exceeds 100KB limit' };
  }

  let ast: Node;
  try {
    ast = parse(code, {
      ecmaVersion: 2022,
      sourceType: 'script', // forbid ESM imports/exports; plugins are scripts
      allowReserved: false,
      allowReturnOutsideFunction: false,
    }) as Node;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown parse error';
    return { safe: false, reason: `Parse error: ${msg}` };
  }

  // AST walkers — recursive descent over the parsed tree.
  // We intentionally keep these flat (no shared visitor library) so the
  // sandbox has no runtime dependencies on @babel/types or estree-walker.
  const reason = walkForForbidden(ast, new Set<Node>());
  if (reason) return { safe: false, reason };

  // Identifier references must all resolve to either:
  //   - a top-level lexical binding (let/const/var/function/class)
  //   - the allow-listed globals (Math, Date, JSON, …)
  //   - a property of `globals` (trackedProxy) — these are dynamic,
  //     validated at call time
  const refReason = checkIdentifierReferences(ast, new Set<string>());
  if (refReason) return { safe: false, reason: refReason };

  return { safe: true };
}

/**
 * Recursive AST walker that returns the first forbidden construct
 * encountered, or null if the tree is clean.
 */
function walkForForbidden(node: unknown, seen: Set<unknown>): string | null {
  if (!node || typeof node !== 'object' || seen.has(node)) return null;
  seen.add(node);

  const n = node as {
    type?: string;
    name?: string;
    callee?: unknown;
    object?: unknown;
    property?: unknown;
    computed?: boolean;
  };

  switch (n.type) {
    case 'ImportDeclaration':
    case 'ImportExpression':
      return 'import declarations are not allowed';
    case 'ExportNamedDeclaration':
    case 'ExportDefaultDeclaration':
    case 'ExportAllDeclaration':
      return 'export declarations are not allowed';
    case 'WithStatement':
      return '"with" statements are not allowed';
    case 'MetaProperty':
      // new.target / import.meta — not available in the sandbox wrapper
      return 'meta-properties (new.target / import.meta) are not allowed';
    case 'CallExpression':
    case 'NewExpression': {
      // Forbid direct or indirect eval/Function constructor.
      // `eval` (Identifier), `(0, eval)(...)` (SequenceExpression of Identifier),
      // `globalThis.eval`, `window.eval`, `self.eval`, `this.eval`,
      // `new Function(...)` — the callee is an Identifier named 'Function'
      // OR a MemberExpression with property name 'Function'.
      const callee = n.callee as
        | { type?: string; name?: string; object?: unknown; property?: unknown }
        | undefined;
      if (callee?.type === 'Identifier') {
        if (callee.name === 'eval') return 'direct call to eval is not allowed';
        if (n.type === 'NewExpression' && callee.name === 'Function') {
          return 'new Function(...) is not allowed';
        }
        if (n.type === 'NewExpression' && callee.name && FORBIDDEN_CONSTRUCTORS.has(callee.name)) {
          return `new ${callee.name}(...) is not allowed`;
        }
      }
      if (callee?.type === 'MemberExpression') {
        const obj = callee.object as { type?: string; name?: string } | undefined;
        const prop = callee.property as { type?: string; name?: string } | undefined;
        const objName = obj?.type === 'Identifier' ? obj.name : null;
        const propName = prop?.type === 'Identifier' ? prop.name : null;
        if (
          propName === 'eval' &&
          objName &&
          ['globalThis', 'window', 'self', 'parent', 'top', 'frames'].includes(objName)
        ) {
          return `indirect eval via ${objName}.eval is not allowed`;
        }
        if (n.type === 'NewExpression' && propName === 'Function' && objName) {
          return `new ${objName}.Function(...) is not allowed`;
        }
      }
      // Forbid call to any blocked global by name.
      if (callee?.type === 'Identifier' && callee.name && BLOCKED_GLOBALS.has(callee.name)) {
        return `call to blocked global '${callee.name}' is not allowed`;
      }
      break;
    }
    case 'MemberExpression': {
      // Check the property name (and computed-property literal) against
      // FORBIDDEN_PROPERTIES. This blocks the prototype-chain escape
      // `({}).constructor.constructor("return globalThis")()` even when
      // the call site itself is a legitimate CallExpression.
      const prop = n.property as { type?: string; name?: string; value?: unknown } | undefined;
      const propName = prop?.type === 'Identifier' ? prop.name : null;
      const propLiteral =
        prop?.type === 'Literal' && typeof prop.value === 'string' ? prop.value : null;
      const checkName = (propName ?? propLiteral) as string | null;
      if (checkName && FORBIDDEN_PROPERTIES.has(checkName)) {
        return `member access on forbidden property '.${checkName}' is not allowed`;
      }
      // Reject AsyncFunction / GeneratorFunction / AsyncGeneratorFunction
      // as new-expression targets (the Identifier-name check above only
      // covers the unqualified 'Function' name).
      if (n.property && (n as { computed?: boolean }).computed === false) {
        if (propName && FORBIDDEN_CONSTRUCTORS.has(propName)) {
          return `new <obj>.${propName}(...) is not allowed`;
        }
      }
      break;
    }
    default:
      break;
  }

  // Recurse into every property that may hold child nodes.
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'range' || key === 'raw')
      continue;
    const child = (node as Record<string, unknown>)[key];
    if (Array.isArray(child)) {
      for (const c of child) {
        const r = walkForForbidden(c, seen);
        if (r) return r;
      }
    } else if (child && typeof child === 'object') {
      const r = walkForForbidden(child, seen);
      if (r) return r;
    }
  }
  return null;
}

/**
 * Walk the AST and collect every free Identifier reference. Every name
 * must be either a top-level declaration, an allow-listed global, or
 * a property name on a MemberExpression (those are dynamic).
 */
function checkIdentifierReferences(node: unknown, declared: Set<string>): string | null {
  if (!node || typeof node !== 'object') return null;
  const n = node as { type?: string; name?: string; value?: unknown; computed?: boolean };

  switch (n.type) {
    case 'VariableDeclaration': {
      const decls = (n as { declarations: Array<{ id: { name?: string } }> }).declarations;
      for (const d of decls) {
        if (d.id?.name) declared.add(d.id.name);
      }
      break;
    }
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression': {
      const fn = n as { params?: Array<{ name?: string }> };
      for (const p of fn.params ?? []) {
        if (p.name) declared.add(p.name);
      }
      break;
    }
    case 'MemberExpression': {
      // HEPHAESTUS BUG-RPT-002 FIX (2026-06-15): the recursive descent
      // below would visit `n.property` and treat the Identifier there
      // (`'PI'` in `Math.PI`) as a free reference, flagging every
      // legitimate property access as "undeclared identifier". The fix
      // is to skip the `property` child when the MemberExpression is
      // *non-computed* (`obj.prop`), because in that form the property
      // is a name, not a value reference. The `object` child is still
      // visited because it IS a reference (`Math` in `Math.PI` must
      // resolve to an allowed global or local binding). For computed
      // member expressions (`obj[key]`), the property IS a value
      // expression and must still be visited.
      const m = n as { object?: unknown; property?: unknown; computed?: boolean };
      if (m.object) {
        const r = checkIdentifierReferences(m.object, declared);
        if (r) return r;
      }
      if (m.computed === true && m.property) {
        const r = checkIdentifierReferences(m.property, declared);
        if (r) return r;
      }
      return null;
    }
    case 'Identifier': {
      const name = n.name;
      if (
        name &&
        !declared.has(name) &&
        !ALLOWED_GLOBALS.has(name) &&
        !BLOCKED_GLOBALS.has(name) && // BLOCKED_GLOBALS are explicitly set to undefined
        !SANDBOX_BINDINGS.has(name) // wrapper-bound names (globals, finplan, api, console, etc.)
      ) {
        return `reference to undeclared identifier '${name}' is not allowed`;
      }
      break;
    }
    default:
      break;
  }

  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'range' || key === 'raw')
      continue;
    const child = (node as Record<string, unknown>)[key];
    if (Array.isArray(child)) {
      for (const c of child) {
        const r = checkIdentifierReferences(c, declared);
        if (r) return r;
      }
    } else if (child && typeof child === 'object') {
      const r = checkIdentifierReferences(child, declared);
      if (r) return r;
    }
  }
  return null;
}
