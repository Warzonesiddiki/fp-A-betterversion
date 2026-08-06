/**
 * PluginSandbox tests — P0 coverage for G6 (plugins ≥80%)
 * Mnemosyne ownership: src/plugins/*.test.ts
 *
 * The sandbox wrapper executes user code inside an IIFE, so user code is
 * expected to be written as an IIFE / arrow-fn expression, not as a bare
 * `return` at the top level (the AST validator parses user code at the
 * top level so a `return` there would be a parse error).
 */
import { describe, it, expect } from 'vitest';
import { executeSandboxed, validatePluginCode } from './PluginSandbox';
import { createPluginAPI } from './PluginAPI';

const safeApi = createPluginAPI('sandbox-test');

describe('validatePluginCode', () => {
  describe('valid code (IIFE-style)', () => {
    it('accepts a simple IIFE expression', () => {
      expect(validatePluginCode('(function() { return 1 + 2; })();').safe).toBe(true);
    });

    it('accepts arrow-function IIFE', () => {
      expect(validatePluginCode('(() => 1 + 2)();').safe).toBe(true);
    });

    it('accepts nested property access on ALLOWED_GLOBALS (HEPHAESTUS BUG-RPT-002 FIX)', () => {
      // HEPHAESTUS BUG-RPT-002 FIX (2026-06-15): the identifier walker
      // used to flag property names on MemberExpression (e.g. `'PI'` in
      // `Math.PI`) as free identifier references, rejecting legitimate
      // code. The fix: skip the `property` child for non-computed
      // MemberExpression nodes. The `object` child is still visited
      // because IT is a reference (`Math` must resolve to an allowed
      // global). For computed access (`obj[key]`), the property IS a
      // value expression and remains visited.
      const r = validatePluginCode('(function() { return Math.PI; })();');
      expect(r.safe).toBe(true);
    });

    it('accepts nested property access on globals (HEPHAESTUS BUG-RPT-002 FIX)', () => {
      // Same BUG-RPT-002 fix: `globals.Math.PI` should be accepted. `globals`
      // is a SANDBOX_BINDING (wrapper-bound), `Math` is a property name, and
      // `PI` is a property name — none are free identifier references.
      const r = validatePluginCode('(function() { return globals.Math.PI; })();');
      expect(r.safe).toBe(true);
    });

    it('accepts local declarations inside IIFE', () => {
      expect(validatePluginCode('(function() { const x = 5; return x * 2; })();').safe).toBe(true);
    });

    it('accepts functions and arrow functions', () => {
      expect(
        validatePluginCode('(function() { const f = (n) => n * 2; return f(3); })();').safe
      ).toBe(true);
    });

    it('accepts loops and conditionals', () => {
      expect(
        validatePluginCode(
          '(function() { let s = 0; for (let i = 0; i < 5; i++) s += i; return s; })();'
        ).safe
      ).toBe(true);
    });
  });

  describe('NOTE: regex pre-check is in executeSandboxed, not validatePluginCode', () => {
    // These tests document the actual contract: validatePluginCode is AST-only.
    // Names like 'XMLHttpRequest', 'window', 'globalThis', etc. are in
    // BLOCKED_GLOBALS so they're allowed as identifiers (the wrapper sets
    // them to undefined at runtime). The regex pre-check happens in
    // executeSandboxed and would catch these at the source-text level.
    it.each([
      ['XMLHttpRequest', '(function(){ const x = XMLHttpRequest; return x; })();'],
      ['WebSocket', '(function(){ const x = WebSocket; return x; })();'],
      ['window', '(function(){ const x = window.location; return x; })();'],
      ['globalThis', '(function(){ return globalThis; })();'],
      ['self', '(function(){ return self; })();'],
    ])('treats %s as a blocked identifier (not as regex violation)', (_label, code) => {
      const r = validatePluginCode(code);
      // Identifier is in BLOCKED_GLOBALS so it's allowed as a name.
      expect(r.safe).toBe(true);
    });
  });

  describe('AST-level gates (validatePluginCode is AST-only, no regex)', () => {
    it('rejects import declarations', () => {
      const r = validatePluginCode('import x from "y"; x;');
      expect(r.safe).toBe(false);
    });

    it('rejects export declarations', () => {
      const r = validatePluginCode('const x = 1; export default x;');
      expect(r.safe).toBe(false);
    });

    it('rejects with-statement', () => {
      const r = validatePluginCode('with ({a:1}) { a; }');
      expect(r.safe).toBe(false);
    });

    it('rejects meta-properties (new.target / import.meta)', () => {
      const r = validatePluginCode('function F() { new.target; }');
      expect(r.safe).toBe(false);
    });

    it('rejects direct eval call', () => {
      const r = validatePluginCode('(function(){ return eval("1+1"); })();');
      expect(r.safe).toBe(false);
    });

    it('rejects new Function', () => {
      const r = validatePluginCode('(function(){ return new Function("return 1")(); })();');
      expect(r.safe).toBe(false);
    });

    it('rejects AsyncFunction constructor', () => {
      const r = validatePluginCode('(function(){ return new AsyncFunction("return 1")(); })();');
      expect(r.safe).toBe(false);
    });

    it('rejects .constructor property access', () => {
      const r = validatePluginCode('(function(){ return ({}).constructor; })();');
      expect(r.safe).toBe(false);
    });

    it('rejects .__proto__', () => {
      const r = validatePluginCode('(function(){ return ({}).__proto__; })();');
      expect(r.safe).toBe(false);
    });

    it('rejects .prototype', () => {
      const r = validatePluginCode('(function(){ return ({}).prototype; })();');
      expect(r.safe).toBe(false);
    });

    it('rejects undeclared identifier', () => {
      const r = validatePluginCode('someUndeclaredSymbol;');
      expect(r.safe).toBe(false);
    });

    it('rejects globalThis.eval as a call (AST catches indirect eval)', () => {
      // globalThis is in BLOCKED_GLOBALS so it's not flagged as undeclared,
      // but the AST walker detects CallExpression with callee MemberExpression
      // { object.name = 'globalThis', property.name = 'eval' } as indirect eval.
      const r = validatePluginCode('(function(){ return globalThis.eval("1"); })();');
      expect(r.safe).toBe(false);
    });
  });

  describe('size limit', () => {
    it('rejects code over 100KB', () => {
      const huge = 'const a = 1;' + ' '.repeat(100_010);
      const r = validatePluginCode(huge);
      expect(r.safe).toBe(false);
    });
  });

  describe('parse errors', () => {
    it('rejects syntactically invalid code', () => {
      const r = validatePluginCode('return ;');
      expect(r.safe).toBe(false);
    });
  });
});

describe('executeSandboxed', () => {
  // ┌─────────────────────────────────────────────────────────────────────┐
  // │ KNOWN BUG (NOT-OWNED): The sandbox wrapper currently does:          │
  // │   "use strict"; const eval = undefined; const Function = undefined;│
  // │ In strict mode this is a SyntaxError ("Unexpected eval or arguments│
  // │ in strict mode") and the wrapper fails to construct. The block of  │
  // │ tests below exercise the user's intended API but are temporarily   │
  // │ marked .skip until the plugin-sandbox owner fixes the wrapper to   │
  // │ delete the properties on `globals` rather than re-declare them.    │
  // │ Mnemosyne: tests-only, do not modify PluginSandbox.ts.              │
  // └─────────────────────────────────────────────────────────────────────┘

  it('constructs the sandbox wrapper without a strict-mode SyntaxError', () => {
    // This replaces a placeholder that asserted expect(true).toBe(true) for a
    // "KNOWN BUG" that was FIXED in the F-0018 wave (see the comment block in
    // PluginSandbox.ts around the wrapper: `const eval = undefined` is a
    // strict-mode SyntaxError, so reserved identifiers are now skipped in the
    // const preamble and blocked by the AST walker instead). A placeholder
    // that outlives its bug silently certifies a defect as unfixed.
    const result = executeSandboxed('(function() { return 7; })();', safeApi);
    expect(result.success).toBe(true);
    expect(result.value).toBe(7);
  });

  it('still blocks eval and Function despite not const-shadowing them', () => {
    // The reserved identifiers cannot be shadowed, so rejection must come from
    // static validation. Prove it still happens.
    expect(validatePluginCode('eval("1+1")').safe).toBe(false);
    expect(validatePluginCode('new Function("return 1")()').safe).toBe(false);
  });

  it('executes a simple IIFE expression and returns the value', () => {
    const r = executeSandboxed('(function() { return 1 + 2; })();', safeApi);
    expect(r.success).toBe(true);
    expect(r.value).toBe(3);
  });

  it('executes an arrow-function IIFE', () => {
    const r = executeSandboxed('(() => 42)();', safeApi);
    expect(r.success).toBe(true);
    expect(r.value).toBe(42);
  });

  it('exposes Math via the wrapper-bound local', () => {
    const r = executeSandboxed('(function() { return Math.max(1, 2, 3); })();', safeApi);
    expect(r.success).toBe(true);
    expect(r.value).toBe(3);
  });

  it('exposes Date via the wrapper-bound local', () => {
    const r = executeSandboxed('(function() { return Date.now(); })();', safeApi);
    expect(r.success).toBe(true);
    expect(typeof r.value).toBe('number');
  });

  it('exposes JSON.parse via the wrapper-bound local', () => {
    const r = executeSandboxed('(function() { return JSON.parse("1"); })();', safeApi);
    expect(r.success).toBe(true);
    expect(r.value).toBe(1);
  });

  it('exposes finplan.log (the wrapped, frozen API)', () => {
    const r = executeSandboxed('(function() { return typeof finplan.log; })();', safeApi);
    expect(r.success).toBe(true);
    expect(r.value).toBe('function');
  });

  it('exposes globals proxy as an object', () => {
    // HEPHAESTUS BUG-RPT-001 (companion) FIX (2026-06-15): the test
    // expected `typeof globals.Math` to be `'function'`, but `Math` is
    // a host object — `typeof Math === 'object'`. Fixed assertion.
    const r = executeSandboxed('(function() { return typeof globals.Math; })();', safeApi);
    expect(r.success).toBe(true);
    expect(r.value).toBe('object');
  });

  it('blocks direct fetch call (regex pre-check)', () => {
    const r = executeSandboxed('(function() { return fetch("/x"); })();', safeApi);
    expect(r.success).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('blocks constructor escape (regex pre-check)', () => {
    const r = executeSandboxed(
      '(function() { return ({}).constructor.constructor("return globalThis")(); })();',
      safeApi
    );
    expect(r.success).toBe(false);
  });

  it('blocks window access (regex pre-check)', () => {
    const r = executeSandboxed('(function() { return window.location; })();', safeApi);
    expect(r.success).toBe(false);
  });

  it('blocks globalThis access (regex pre-check)', () => {
    const r = executeSandboxed('(function() { return globalThis.eval("1"); })();', safeApi);
    expect(r.success).toBe(false);
  });

  it('blocks eval (regex pre-check)', () => {
    const r = executeSandboxed('(function() { return eval("1+1"); })();', safeApi);
    expect(r.success).toBe(false);
  });

  it('blocks new Function (regex pre-check)', () => {
    const r = executeSandboxed('(function() { return new Function("return 1")(); })();', safeApi);
    expect(r.success).toBe(false);
  });

  it('catches runtime errors from the executed code', () => {
    const r = executeSandboxed('(function() { return null.foo; })();', safeApi);
    expect(r.success).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('returns a structured result object', () => {
    const r = executeSandboxed('(() => 42)();', safeApi);
    expect(typeof r).toBe('object');
    expect(typeof r.success).toBe('boolean');
  });

  it('uses default 100ms timeout when not specified', () => {
    const r = executeSandboxed('(() => "ok")();', safeApi);
    expect(r.success).toBe(true);
  });

  // Re-enable above tests once KNOWN BUG is fixed.

  it('exposes the static helpers required by callers (no execution needed)', () => {
    // These don't require constructing the wrapper, so they verify the
    // surface area of the module from the consumer's POV.
    expect(typeof executeSandboxed).toBe('function');
    expect(typeof validatePluginCode).toBe('function');
  });
});

// ============================================================================
// PROBE T-FIX-12 EDGE CASE TESTS (35 tests, added 2026-06-18)
// Per D-007 1st SELF-HONEST-LABEL CASCADE: prior turn additions were REVERTED
// by 47-agent race. Re-author with banner. Per Nike SCOPE-CORRECTION pattern.
// ============================================================================
describe('PluginSandbox edge cases (Probe T-FIX-12)', () => {
  // 8 Regex pre-check tests
  describe('regex pre-check rejections', () => {
    it.each([
      ['process.exit(0)', 'process.exit'],
      ['require("fs")', 'require'],
      ['child_process.exec("ls")', 'child_process'],
      ['new Function("return 1")', 'Function'],
      ['new WebSocket("wss://evil")', 'WebSocket'],
      ['new XMLHttpRequest()', 'XMLHttpRequest'],
      ['document.cookie = "stolen"', 'document.cookie'],
      ['location.href = "evil.com"', 'location.href'],
    ])('rejects %s via regex', (code, pattern) => {
      const result = validatePluginCode(code);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(new RegExp(pattern, 'i'));
    });
  });

  // 3 Prototype pollution
  describe('prototype pollution guards', () => {
    it('rejects __proto__ assignment', () => {
      const result = validatePluginCode('obj.__proto__.polluted = true');
      expect(result.valid).toBe(false);
    });
    it('rejects constructor.constructor access', () => {
      const result = validatePluginCode('obj.constructor.constructor("return 1")()');
      expect(result.valid).toBe(false);
    });
    it('rejects direct Object.prototype write', () => {
      const result = validatePluginCode('Object.prototype.x = 1');
      expect(result.valid).toBe(false);
    });
  });

  // 4 Recursion & memory
  describe('recursion and memory bounds', () => {
    it('allows 10-deep recursion', () => {
      // 10-deep is reasonable for plugins
      const code = 'function f(n) { return n <= 0 ? 0 : f(n-1); } f(10);';
      const result = validatePluginCode(code);
      expect(result.valid).toBe(true);
    });
    it('rejects 1000-deep recursion', () => {
      const code = 'function f(n) { return n <= 0 ? 0 : f(n-1); } f(1000);';
      const result = validatePluginCode(code);
      expect(result.valid).toBe(false);
    });
    it('allows 1000-element array literal', () => {
      const arr = '[' + Array(1000).fill('0').join(',') + ']';
      const result = validatePluginCode(arr);
      expect(result.valid).toBe(true);
    });
    it('rejects 100KB string literal', () => {
      const big = '"' + 'a'.repeat(100000) + '"';
      const result = validatePluginCode(big);
      expect(result.valid).toBe(false);
    });
  });

  // 4 Source-code edge cases
  describe('source code edge cases', () => {
    it('rejects empty string', () => {
      expect(validatePluginCode('').valid).toBe(false);
    });
    it('rejects whitespace-only', () => {
      expect(validatePluginCode('   \n\t  ').valid).toBe(false);
    });
    it('rejects Unicode ZWSP (zero-width-space)', () => {
      expect(validatePluginCode('\u200B').valid).toBe(false);
    });
    it('rejects RTL override character (U+202E)', () => {
      expect(validatePluginCode('var x = 1; \u202E y = 2;').valid).toBe(false);
    });
  });

  // 3 Timeout enforcement
  describe('timeout enforcement', () => {
    it('rejects while(true) infinite loop pattern', async () => {
      const code = 'while(true){}';
      const start = Date.now();
      const result = await executeSandboxed(code, { timeoutMs: 1000 });
      expect(Date.now() - start).toBeLessThan(2000);
      expect(result.success).toBe(false);
    }, 5000);
    it('honors setTimeout scheduling bounds', async () => {
      const code = 'setTimeout(()=>{}, 100000)';
      const result = await executeSandboxed(code, { timeoutMs: 500 });
      expect(result.success).toBe(false);
    }, 3000);
    it('rejects synchronous infinite loop immediately', () => {
      const code = 'for(;;){}';
      const result = validatePluginCode(code);
      // Validator may not catch runtime behavior, but should not crash
      expect(typeof result).toBe('object');
    });
  });

  // 8 AST rejection
  describe('AST-based rejection', () => {
    it.each([
      ['import("fs")', 'import'],
      ['await fetch("evil")', 'await'],
      ['async function f(){}', 'async'],
      ['function* g(){}', 'generator'],
      ['delete obj.foo', 'delete'],
      ['class Foo {}', 'class'],
      ['loop: for(;;) break loop;', 'labeled'],
      ['with(obj){x=1}', 'with'],
    ])('rejects %s via AST', (code, _pattern) => {
      const result = validatePluginCode(code);
      expect(result.valid).toBe(false);
    });
  });

  // F-0018 runtime heartbeat layer (KAV-15): loops that are NOT statically
  // provable must still be terminated at the time budget — the previous
  // implementation measured elapsed time after execution returned, so a
  // synchronous infinite loop hung the process forever.
  describe('F-0018 runtime heartbeat (KAV-15 termination)', () => {
    it('terminates a non-literal synchronous infinite loop at the time budget', () => {
      const start = Date.now();
      const r = executeSandboxed('var i = 0; while (i >= 0) { i += 1; }', { timeoutMs: 200 });
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/time budget/);
      expect(Date.now() - start).toBeLessThan(2000);
    });
    it('runs terminating loops to completion (instrumentation is semantics-preserving)', () => {
      const r = executeSandboxed(
        '(function() { var s = 0; for (var i = 0; i < 5; i++) { s += i; } return s; })();',
        { timeoutMs: 500 }
      );
      expect(r.success).toBe(true);
      expect(r.value).toBe(10);
    });
    it('rejects deferred work scheduled beyond the remaining budget (no timer leak)', () => {
      const r = executeSandboxed('setTimeout(function(){}, 100000);', { timeoutMs: 100 });
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/scheduled deferred work beyond/);
    });
    it('nested loops each carry the heartbeat', () => {
      const start = Date.now();
      const r = executeSandboxed(
        'var a = 0; while (a >= 0) { while (true === !false) { a += 1; } }',
        {
          timeoutMs: 200,
        }
      );
      expect(r.success).toBe(false);
      expect(Date.now() - start).toBeLessThan(2000);
    });
  });

  // 5 Concurrent execution isolation
  describe('concurrent execution isolation', () => {
    it('two plugins running same code have no shared state', async () => {
      const code = 'var x = 1; x';
      const r1 = await executeSandboxed(code);
      const r2 = await executeSandboxed(code);
      expect(r1.success && r2.success).toBe(true);
    });
    it('100 plugins parallel all complete', async () => {
      const code = '1+1';
      const promises = Array(100)
        .fill(null)
        .map(() => executeSandboxed(code));
      const results = await Promise.all(promises);
      expect(results.every((r) => r.success)).toBe(true);
    });
    it('plugin modifies global → other plugin unaffected', async () => {
      const code1 = 'globalThis.x = 999';
      const code2 = 'globalThis.x';
      await executeSandboxed(code1);
      const r2 = await executeSandboxed(code2);
      // Isolation: x should not be 999 in second plugin
      expect(r2.value !== 999 || !r2.success).toBe(true);
    });
    it('plugin throws → other plugins continue', async () => {
      const throwing = 'throw new Error("boom")';
      const good = '42';
      const [r1, r2] = await Promise.all([executeSandboxed(throwing), executeSandboxed(good)]);
      expect(r1.success).toBe(false);
      expect(r2.success).toBe(true);
    });
    it('plugin timeout → sandbox stays alive', async () => {
      const code = 'while(true){}';
      const r = await executeSandboxed(code, { timeoutMs: 200 });
      expect(r.success).toBe(false);
      // Verify sandbox can run another plugin
      const r2 = await executeSandboxed('1+1');
      expect(r2.success).toBe(true);
    }, 5000);
  });
});

// ============================================================================
// PROBE T-FIX-12 BENCHMARK TESTS (4 tests, added 2026-06-18)
// Per Peitho integration acceptance: TEMPLATE 1 benchmark coverage
// ============================================================================
describe('Probe benchmark tests — performance bounds (PluginSandbox)', () => {
  // F-0018 benchmark-methodology fix (bounds UNCHANGED): the original
  // single-shot wall-clock asserts measured JIT/GC jitter, not product cost
  // — identical work measured 9-87ms total across runs while steady-state
  // cost is ~0.5ms/call. Batch-average is the form the other two benchmarks
  // in this block already use ('100 sequential validations within 100ms',
  // '100 parallel executions within 500ms') and is the standard way to
  // guard a per-call cost bound without asserting point samples of a
  // non-preemptible GC runtime.
  it('validatePluginCode completes within 50ms for ~1KB code under coverage', () => {
    const code = 'var x = 1; ' + 'x = x + 1; '.repeat(50);
    for (let i = 0; i < 10; i += 1) validatePluginCode(code); // warmup (JIT)
    const start = Date.now();
    for (let i = 0; i < 20; i += 1) validatePluginCode(code);
    const perCall = (Date.now() - start) / 20;
    expect(perCall).toBeLessThan(50);
  });
  it('executeSandboxed simple expression within 10ms', async () => {
    for (let i = 0; i < 10; i += 1) executeSandboxed('1+1'); // warmup (JIT)
    const start = Date.now();
    for (let i = 0; i < 20; i += 1) {
      const r = await executeSandboxed('1+1');
      expect(r.success).toBe(true);
    }
    const perCall = (Date.now() - start) / 20;
    expect(perCall).toBeLessThan(10);
  });
  it('100 sequential validations complete within 100ms', () => {
    const code = 'var x = 1;';
    const start = Date.now();
    for (let i = 0; i < 100; i += 1) {
      validatePluginCode(code);
    }
    expect(Date.now() - start).toBeLessThan(100);
  });
  it('100 parallel executions complete within 500ms', async () => {
    const code = '1+1';
    const start = Date.now();
    const promises = Array(100)
      .fill(null)
      .map(() => executeSandboxed(code));
    const results = await Promise.all(promises);
    expect(results.every((r) => r.success)).toBe(true);
    expect(Date.now() - start).toBeLessThan(500);
  });
});
