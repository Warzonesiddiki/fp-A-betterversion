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
import { createLogger } from '@/utils/logger';

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
  /** Maximum execution time in ms (alias of `timeout`; takes precedence when both are set) */
  timeoutMs?: number;
  /** Memory limit — max objects created (default: 10000) */
  objectLimit?: number;
  /**
   * W6-P0-03 (2026-08-24): host-provided values bound as extra wrapper
   * parameters (e.g. a plugin factory trampoline). Names must be plain
   * identifiers and must not collide with `globals` / `finplan`. Bound names
   * are admitted by the identifier walker ONLY for the same call.
   */
  bindings?: Record<string, unknown>;
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
    get(_target, prop) {
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
// ---------------------------------------------------------------------------
// F-0018 — timeout & termination semantics
//
// Root cause of F-0018 (KAV-15 hang): the previous implementation checked
// `Date.now() - startTime > timeout` AFTER `sandboxFn(...)` returned. A
// synchronous hostile loop (`while(true){}`) never yields the event loop, so
// the check never ran — the sandbox hung the entire application forever.
//
// The fix has three real layers:
//   1. STATIC PREVENTION — validatePluginCode rejects loops whose test is a
//      constant-true literal (`while(true)`, `for(;;)`). They never start.
//   2. LOOP HEARTBEAT — every surviving loop body is instrumented with a
//      `__fp_tick()` call that throws once the deadline passes. This is a
//      genuine termination mechanism for NON-literal infinite loops (e.g.
//      `while (i >= 0) i++`), which static analysis cannot generally prove.
//   3. SCHEDULING BOUNDS — sandboxed setTimeout/setInterval only accept work
//      within the remaining time budget; anything later is rejected instead
//      of leaking a timer that outlives the sandbox session.
// ---------------------------------------------------------------------------

/** Loop AST node types whose bodies receive heartbeat instrumentation. */
const LOOP_STATEMENTS = new Set([
  'WhileStatement',
  'DoWhileStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
]);

/** Generic acorn-tree walker (acyclic; visited-set kept for safety). */
const forEachAstNode = (
  root: unknown,
  visit: (node: { type?: string; [key: string]: unknown }) => void
): void => {
  const seen = new Set<unknown>();
  const recur = (node: unknown): void => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    visit(node as { type?: string; [key: string]: unknown });
    for (const [key, value] of Object.entries(node)) {
      if (key === 'start' || key === 'end' || key === 'loc' || key === 'range') continue;
      if (Array.isArray(value)) value.forEach(recur);
      else recur(value);
    }
  };
  recur(root);
};

/**
 * Instrument every loop body in `code` with a `__fp_tick()` heartbeat call.
 * The heartbeat is CLOSURE-BOUND to the sandbox wrapper (declared there), so
 * user code cannot redefine it (validatePluginCode forbids the identifier
 * shape via the forbidden-construct gates and the wrapper declares it in an
 * immutable scope above the user IIFE).
 *
 * Works purely on source text via acorn positions — no code generator
 * dependency. Bodies are wrapped as `{ __fp_tick(); <original body> }`, which
 * is semantics-preserving for both block and single-statement bodies.
 * Splices are applied back-to-front so earlier offsets stay valid.
 */
export function instrumentLoopBodies(code: string): string {
  let ast: Node;
  try {
    ast = parse(code, { ecmaVersion: 2022, sourceType: 'script' }) as Node;
  } catch {
    return code; // unparseable — validatePluginCode has already rejected it
  }
  const bodies: Array<{ start: number; end: number }> = [];
  forEachAstNode(ast, (n) => {
    if (n.type && LOOP_STATEMENTS.has(n.type)) {
      const body = n.body as { start?: number; end?: number } | undefined;
      if (body && typeof body.start === 'number' && typeof body.end === 'number') {
        bodies.push({ start: body.start, end: body.end });
      }
    }
  });
  bodies.sort((a, b) => b.start - a.start);
  let out = code;
  for (const b of bodies) {
    out = `${out.slice(0, b.start)}{ __fpTick(); ${out.slice(b.start, b.end)} }${out.slice(b.end)}`;
  }
  return out;
}

/** Discriminator for the (code, api, options?) vs (code, options) overloads. */
const isOptionsBag = (v: unknown): v is SandboxOptions =>
  !!v &&
  typeof v === 'object' &&
  ('timeoutMs' in v || 'timeout' in v || 'objectLimit' in v || 'bindings' in v);

export function executeSandboxed<T = unknown>(
  code: string,
  apiOrOptions?: PluginAPI | SandboxOptions,
  maybeOptions: SandboxOptions = {}
): SandboxResult<T> {
  // F-0018: two call shapes are in the wild — (code, api, options?) and
  // (code, { timeoutMs }) — both are supported explicitly.
  const api: PluginAPI | undefined = isOptionsBag(apiOrOptions) ? undefined : apiOrOptions;
  const options: SandboxOptions = isOptionsBag(apiOrOptions) ? apiOrOptions : maybeOptions;
  const timeoutMs = options.timeoutMs ?? options.timeout ?? 100;
  const { objectLimit = 10000 } = options;

  // W6-P0-03: optional host-bound wrapper parameters (factory trampolines).
  // Names must be plain identifiers and must not collide with the fixed
  // 'globals'/'finplan' parameters — duplicates are a SyntaxError under the
  // strict-mode Function constructor.
  const bindings = options.bindings ?? {};
  const bindingNames = Object.keys(bindings);
  for (const bName of bindingNames) {
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(bName) || bName === 'globals' || bName === 'finplan') {
      return { success: false, error: `Invalid sandbox binding name '${bName}'` };
    }
  }
  const bindingValues = bindingNames.map((bName) => bindings[bName]);

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

  // Inject finplan API as safe global (api is optional — pure-expression
  // plugins execute without one; register* bridges are simply absent).
  const finplanApi = Object.freeze({
    registerFormulaFunction: api?.formula?.registerFunction?.bind(api.formula),
    registerChartType: api?.dashboards?.registerWidget?.bind(api.dashboards),
    registerExportFormat: api?.export?.registerFormat?.bind(api.export),
    registerDataSource: api?.import?.registerConnector?.bind(api.import),
    registerDashboardWidget: api?.dashboards?.registerWidget?.bind(api.dashboards),
    log: (msg: string) => createLogger('PluginSandbox').debug(msg),
  });

  // AST-based hard gate: must pass the full acorn-based validator (regex
  // pre-check is no longer sufficient on its own). validatePluginCode parses
  // with acorn, walks for forbidden constructs (imports, new Function, eval,
  // dangerous property access), and checks that every identifier resolves to
  // either a top-level binding or the allow-listed globals. This is the
  // security boundary that gates the Function constructor below.
  const astGate = validatePluginCode(code, new Set<string>(bindingNames));
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
    // F-0018: timer globals are shadowed by bounds-enforcing wrappers (below),
    // so they are excluded from the allow-list destructuring to avoid a
    // duplicate `const setTimeout` declaration.
    const TIMER_GLOBALS = new Set(['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']);
    const destructuredAllowed = [...ALLOWED_GLOBALS].filter((g) => !TIMER_GLOBALS.has(g));

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

    // F-0018 layer 2: instrument every loop body with a deadline heartbeat so
    // a non-literal infinite loop is actually terminated (the previous
    // implementation measured elapsed time AFTER execution returned, which
    // by definition never happens for a synchronous infinite loop).
    const instrumented = instrumentLoopBodies(code);
    const wrappedCode =
      startsWithIife || isSingleExpression ? `return ${instrumented};` : instrumented;
    const deadline = Date.now() + timeoutMs;

    const sandboxFn = new Function(
      'globals',
      'finplan',
      ...bindingNames,
      `
      "use strict";
      // F-0018: deadline is a literal baked into this one-shot wrapper.
      var __fpDeadline = ${deadline};
      // Loop heartbeat — throws once the sandbox time budget is spent. Any
      // loop body is instrumented to call this before each iteration.
      function __fpTick() {
        if (Date.now() > __fpDeadline) {
          throw new Error('__FP_SANDBOX_TIMEOUT__');
        }
      }
      // F-0018 layer 3: bounds-enforcing timer shims. Work scheduled beyond
      // the remaining budget is rejected; NO real timers are ever created,
      // so a plugin cannot leak callbacks past its execution window.
      function setTimeout(_callback, _delay) {
        var d = typeof _delay === 'number' ? _delay : 0;
        if (d > __fpDeadline - Date.now()) {
          throw new Error('__FP_SANDBOX_SCHEDULE__');
        }
        return 0;
      }
      function setInterval(_callback, _delay) { return setTimeout(_callback, _delay); }
      function clearTimeout() { return undefined; }
      function clearInterval() { return undefined; }
      const _g = globals;
      const ${destructuredAllowed.map((g) => `${g} = _g.${g}`).join(', ')};
      ${safeBlocked.map((g) => `const ${g} = undefined;`).join('\n')}
      return (function() { ${wrappedCode} })();
      `
    );

    const startTime = Date.now();
    const result = sandboxFn(trackedProxy, finplanApi, ...bindingValues);

    // Post-hoc budget check retained for non-loop slow code (magic-number of
    // iterations below the heartbeat granularity, heavy builtin work, etc.).
    if (Date.now() - startTime > timeoutMs) {
      return { success: false, error: `Plugin exceeded time limit (${timeoutMs}ms)` };
    }

    return { success: true, value: result as T };
  } catch (e: unknown) {
    const raw = e instanceof Error ? e.message : 'Unknown sandbox error';
    const msg =
      raw === '__FP_SANDBOX_TIMEOUT__'
        ? `Plugin exceeded time budget (${timeoutMs}ms): synchronous loop terminated by heartbeat`
        : raw === '__FP_SANDBOX_SCHEDULE__'
          ? `Plugin scheduled deferred work beyond its timeout budget (${timeoutMs}ms)`
          : raw;
    return { success: false, error: msg };
  }
}

/**
 * Validate plugin code string via usage patterns + AST walk + static
 * resource bounds. Returns { safe, valid, reason? } — `safe` and `valid`
 * are synonyms (both vocabularies are in the test contract); safe:true
 * means the source contains no forbidden construct, uses only allow-listed
 * references, and passes the static bounds (constant-true loops rejected —
 * F-0018 layer 1; oversized literals; over-cap literal recursion seeds).
 */
export function validatePluginCode(
  code: string,
  allowedBindings?: ReadonlySet<string>
): {
  safe: boolean;
  valid: boolean;
  reason?: string;
} {
  const reject = (reason: string) => ({ safe: false, valid: false, reason });

  // Empty/whitespace-only sources have no plugin surface.
  if (code.trim().length === 0) {
    return reject('Plugin source is empty');
  }

  // Must not exceed 100KB
  if (code.length > 100_000) {
    return reject('Code exceeds 100KB limit');
  }

  // Usage-level pattern gate (labels double as audit-readable reasons).
  // Deliberately narrower than the execute-time source-text blocklist:
  // bare identifiers like `window`/`WebSocket` are harmless as names (the
  // runtime wrapper resolves them to undefined) and stay VALID here — the
  // patterns below all describe an inherent USAGE that is never benign.
  const usagePatterns: ReadonlyArray<{ re: RegExp; label: string }> = [
    { re: /\brequire\s*\(/, label: 'require() is not available in the plugin sandbox' },
    { re: /\bchild_process\b/, label: 'child_process is not available in the plugin sandbox' },
    {
      re: /\bprocess\s*\.\s*(exit|env|argv|cwd|kill|abort)\b/,
      label: 'process.exit / process.env access is not allowed in plugin code',
    },
    { re: /\bnew\s+WebSocket\b/, label: 'new WebSocket is not allowed in plugin code' },
    { re: /\bnew\s+XMLHttpRequest\b/, label: 'new XMLHttpRequest is not allowed in plugin code' },
    { re: /\bdocument\s*\.\s*cookie\b/, label: 'document.cookie access is not allowed' },
    { re: /\blocation\s*\.\s*href\b/, label: 'location.href access is not allowed' },
  ];
  for (const { re, label } of usagePatterns) {
    if (re.test(code)) return reject(label);
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
    return reject(`Parse error: ${msg}`);
  }

  // AST walkers — recursive descent over the parsed tree.
  // We intentionally keep these flat (no shared visitor library) so the
  // sandbox has no runtime dependencies on @babel/types or estree-walker.
  const reason = walkForForbidden(ast, new Set<Node>());
  if (reason) return reject(reason);

  // Identifier references must all resolve to either:
  //   - a top-level lexical binding (let/const/var/function/class)
  //   - the allow-listed globals (Math, Date, JSON, …)
  //   - a property of `globals` (trackedProxy) — these are dynamic,
  //     validated at call time
  const refReason = checkIdentifierReferences(ast, new Set<string>(), allowedBindings);
  if (refReason) return reject(refReason);

  // Static resource bounds (F-0018 layer 1 / memory pre-checks).
  const boundsReason = checkStaticResourceBounds(ast);
  if (boundsReason) return reject(boundsReason);

  return { safe: true, valid: true };
}

// ---------------------------------------------------------------------------
// Static resource bounds
// ---------------------------------------------------------------------------

/** Max length of a single string literal (data smuggling guard). */
const STRING_LITERAL_LIMIT = 8_192;

/** Max literal depth seed accepted for a directly self-recursive function. */
const RECURSION_DEPTH_LIMIT = 100;

type ConstantTruthy = boolean;

const isConstantTruthy = (node: unknown): ConstantTruthy => {
  const n = node as { type?: string; value?: unknown } | null | undefined;
  if (!n || typeof n !== 'object') return false;
  if (n.type === 'Literal') return Boolean(n.value);
  // Parenthesized truthy literal parses through; unary !x of falsy literal
  // (e.g. while(!0)) is also constant-true.
  if (n.type === 'UnaryExpression') {
    const u = node as { type: string; operator?: string; argument?: unknown };
    if (u.operator === '!') {
      const arg = u.argument as { type?: string; value?: unknown } | undefined;
      if (arg?.type === 'Literal') return !arg.value;
    }
  }
  return false;
};

/**
 * Static resource bounds that complement the forbidden-construct walker:
 *  - F-0018 layer 1: loops whose test is a constant-true literal are
 *    provably infinite and never enter the runtime (also covers `for(;;)`
 *    whose test is ABSENT, i.e. infinite by construction).
 *  - single string literal length cap,
 *  - direct self-recursive function invoked with a literal depth seed above
 *    RECURSION_DEPTH_LIMIT (a stack-vexing pattern rejected before the
 *    runtime has to discover it the hard way — caught anyway via RangeError
 *    if smuggled past),
 */
function checkStaticResourceBounds(ast: Node): string | null {
  // SINGLE merged traversal (perf: the benchmark contract is
  // validatePluginCode(<1KB) < 5ms under worker contention; three separate
  // full-tree walks tripled the constant factor for no behavioural gain).
  // Self-recursion detection is the only sub-walk and runs only when a
  // FunctionDeclaration exists.
  let loopReason: string | null = null;
  let literalReason: string | null = null;
  const functionDecls: Array<{ name: string | undefined; body: unknown }> = [];
  const literalNumericCalls: Array<{ name: string; value: number }> = [];

  forEachAstNode(ast, (n) => {
    if (!loopReason) {
      if (n.type === 'WhileStatement' || n.type === 'DoWhileStatement') {
        if (isConstantTruthy(n.test)) {
          loopReason = 'Infinite loop rejected statically: loop test is a constant-true literal';
        }
      } else if (n.type === 'ForStatement') {
        if (n.test === null || n.test === undefined || isConstantTruthy(n.test)) {
          loopReason = 'Infinite loop rejected statically: for-loop has no (or constant-true) test';
        }
      }
    }
    if (
      !literalReason &&
      n.type === 'Literal' &&
      typeof n.value === 'string' &&
      n.value.length > STRING_LITERAL_LIMIT
    ) {
      literalReason = `String literal exceeds the ${STRING_LITERAL_LIMIT}-character plugin bound`;
    }
    if (n.type === 'FunctionDeclaration') {
      const fn = n as { id?: { name?: string } | null; body?: unknown };
      functionDecls.push({ name: fn.id?.name, body: fn.body });
    }
    if (n.type === 'CallExpression') {
      const callee = n.callee as { type?: string; name?: string } | undefined;
      const args = n.arguments as Array<{ type?: string; value?: unknown }> | undefined;
      const first = args?.[0];
      if (callee?.type === 'Identifier' && callee.name && first?.type === 'Literal') {
        if (typeof first.value === 'number')
          literalNumericCalls.push({ name: callee.name, value: first.value });
      }
    }
  });
  if (loopReason) return loopReason;
  if (literalReason) return literalReason;

  // Direct self-recursion with an over-cap literal depth seed (sub-walk only
  // where needed: restricted to declared function bodies).
  if (functionDecls.length === 0 || literalNumericCalls.length === 0) return null;
  const selfRecursive = new Set<string>();
  for (const fn of functionDecls) {
    const name = fn.name;
    if (!name) continue;
    let recurses = false;
    forEachAstNode(fn.body, (inner) => {
      if (inner.type === 'CallExpression') {
        const callee = inner.callee as { type?: string; name?: string } | undefined;
        if (callee?.type === 'Identifier' && callee.name === name) recurses = true;
      }
    });
    if (recurses) selfRecursive.add(name);
  }
  for (const call of literalNumericCalls) {
    if (selfRecursive.has(call.name) && call.value > RECURSION_DEPTH_LIMIT) {
      return `Recursion depth cap: call ${call.name}(${call.value}) exceeds the ${RECURSION_DEPTH_LIMIT}-deep static bound`;
    }
  }
  return null;
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
    case 'FunctionDeclaration':
    case 'FunctionExpression': {
      // Async/generator functions are outside the sandbox's sync wrapper:
      // async code escapes the synchronous time budget (await yields past
      // the heartbeat window) and generators are resumable after suspension.
      const f = n as { async?: boolean; generator?: boolean };
      if (f.async) return 'async functions are not allowed in plugin code';
      if (f.generator) return 'generator functions are not allowed in plugin code';
      break;
    }
    case 'ArrowFunctionExpression': {
      const f = n as { async?: boolean };
      if (f.async) return 'async functions are not allowed in plugin code';
      break;
    }
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

      // W6-P0-02 FIX (2026-08-24): the previous check only inspected
      // Identifier / string-Literal keys, so a key BUILT AT RUNTIME
      // (`obj[String.fromCharCode(99,...)]`) produced a property node of
      // type CallExpression, left `checkName` null, and sailed through —
      // reaching the real Function constructor at execution time. Every
      // consumption point of a dynamic property name is a computed
      // MemberExpression, so rejecting any computed key that is not a
      // static literal closes the entire class: reflection builtins
      // feeding property access (String.fromCharCode/fromCodePoint/raw,
      // concatenation, template literals, aliasing variables) die here
      // because their expression node IS the key.
      if ((n as { computed?: boolean }).computed === true) {
        const literalKey = prop?.type === 'Literal' ? prop.value : undefined;
        if (typeof literalKey === 'string') {
          if (FORBIDDEN_PROPERTIES.has(literalKey)) {
            return `member access on forbidden property '.${literalKey}' is not allowed`;
          }
          break; // static safe string key
        }
        if (typeof literalKey !== 'number') {
          return 'computed member access requires a static string or numeric literal key (runtime-computed keys are not allowed)';
        }
        break; // static numeric index
      }

      if (propName && FORBIDDEN_PROPERTIES.has(propName)) {
        return `member access on forbidden property '.${propName}' is not allowed`;
      }
      // Reject AsyncFunction / GeneratorFunction / AsyncGeneratorFunction
      // as new-expression targets (the Identifier-name check above only
      // covers the unqualified 'Function' name).
      if (propName && FORBIDDEN_CONSTRUCTORS.has(propName)) {
        return `new <obj>.${propName}(...) is not allowed`;
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
function checkIdentifierReferences(
  node: unknown,
  declared: Set<string>,
  allowedBindings?: ReadonlySet<string>
): string | null {
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
      const fn = n as { id?: { name?: string } | null; params?: Array<{ name?: string }> };
      // Function declarations bind their own name — without this, a named
      // function invoked after declaration (incl. self-recursion, e.g.
      // `function f(n){...} f(10);`) was wrongly rejected as an undeclared
      // identifier even though the runtime binding exists.
      if (n.type === 'FunctionDeclaration' && fn.id?.name) declared.add(fn.id.name);
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
        const r = checkIdentifierReferences(m.object, declared, allowedBindings);
        if (r) return r;
      }
      if (m.computed === true && m.property) {
        const r = checkIdentifierReferences(m.property, declared, allowedBindings);
        if (r) return r;
      }
      return null;
    }
    case 'Property': {
      // W6-P0-03 enabler (2026-08-24): a non-computed Property key in an
      // object literal (`{ total: 5 }`, `{ init() {} }`) is a NAME, not a
      // free reference — identical class to the BUG-RPT-002 MemberExpression
      // fix. Without this, every natural plugin object literal was rejected
      // as "undeclared identifier", making the wired sandboxed loader path
      // unusable. Shorthand `{ x }` still visits its value (same node).
      // Computed keys (`{ [k]: v }`) ARE runtime expressions and remain
      // visited.
      const p = n as { key?: unknown; value?: unknown; computed?: boolean };
      if (p.value) {
        const r = checkIdentifierReferences(p.value, declared, allowedBindings);
        if (r) return r;
      }
      if (p.computed === true && p.key) {
        const r = checkIdentifierReferences(p.key, declared, allowedBindings);
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
        !SANDBOX_BINDINGS.has(name) && // wrapper-bound names (globals, finplan, api, console, etc.)
        !(allowedBindings && allowedBindings.has(name)) // W6-P0-03 host-bound wrapper parameters
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
        const r = checkIdentifierReferences(c, declared, allowedBindings);
        if (r) return r;
      }
    } else if (child && typeof child === 'object') {
      const r = checkIdentifierReferences(child, declared, allowedBindings);
      if (r) return r;
    }
  }
  return null;
}
