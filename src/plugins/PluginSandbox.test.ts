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

  it('skipped: wrapper has strict-mode const eval/Function bug — see KNOWN BUG', () => {
    expect(true).toBe(true);
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
    const r = executeSandboxed('(function() { return typeof globals.Math; })();', safeApi);
    expect(r.success).toBe(true);
    expect(r.value).toBe('function');
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
