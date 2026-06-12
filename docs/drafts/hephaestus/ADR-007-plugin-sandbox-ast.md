<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-12 -->

# ADR-007: Plugin Sandbox AST Allowlist (Property-Scope + Identifier-Scope + NewExpression-Reject)

> **Status:** Proposed
> **Date:** 2026-06-12
> **Author:** Hephaestus (aionrs/MiniMax-M3)
> **Deciders:** Apollo (security MUSE) + Strategos (architectural) + Founder (sign-off)
> **Reviewers:** Athena, Hera, Mnemosyne, Prometheus
> **Replaces:** Implicit regex denylist in `src/plugins/PluginSandbox.ts:198` (the `new Function(...)` P0 #2)

---

## Context

The current plugin sandbox at `src/plugins/PluginSandbox.ts:198` loads plugin code via the `new Function(...)` constructor with a regex denylist. The denylist blocks literal substrings (`eval`, `Function`, `fetch`, `XMLHttpRequest`, etc.) but is bypassable by:

- **String escaping:** `\\x65val`, `\\u0065val`, hex/unicode escapes
- **Bracket access:** `window['ev'+'al']`
- **Prototype chain traversal:** `({}).constructor.constructor("return globalThis")()`
- **Computed member access:** `obj['cons'+'tructor']`

A static linter cannot catch these because the bypasses use only "safe" JavaScript syntax. The regex denylist is brittle and the bypasses are well-documented (MDN, OWASP, every JavaScript sandbox-escape blog post).

**P0 finding:** Hephaestus audit 2026-06-12 (originally P0 #2). Cross-checked by Athena the same day: even the textbook acorn AST node-type allowlist is bypassable by `({}).constructor.constructor("return globalThis")()` because all four nodes (ObjectExpression, MemberExpression, MemberExpression, CallExpression + Literal) are in the standard "safe" allowlist.

## Decision

We will replace the regex denylist with an **AST-based sandbox that enforces THREE independent constraints**, not one:

### Constraint 1 — Node-type allowlist

Permit only these AST node types (acorn):

```
Identifier, Literal, CallExpression, MemberExpression, BinaryExpression,
LogicalExpression, ObjectExpression, ArrayExpression, ReturnStatement,
VariableDeclaration, FunctionDeclaration, ArrowFunctionExpression,
BlockStatement, ExpressionStatement, ConditionalExpression, TemplateLiteral,
SpreadElement, AssignmentExpression, UpdateExpression, UnaryExpression,
IfStatement, ForStatement, WhileStatement, DoWhileStatement, ForInStatement,
ForOfStatement, BreakStatement, ContinueStatement, SwitchStatement,
SwitchCase, TryStatement, CatchClause, ThrowStatement
```

### Constraint 2 — Property-allowlist on MemberExpression (KEY FIX)

Reject these property names **anywhere** in the AST as a non-computed MemberExpression property:

```
constructor, __proto__, prototype, __defineGetter__, __defineSetter__,
__lookupGetter__, __lookupSetter__, valueOf
```

Computed member access (`obj[key]`) where `key` is a non-literal is rejected because the indexer value is unknowable at parse time.

### Constraint 3 — NewExpression reject

Block **all** `new <expr>(...)` expressions. This kills `new Function(...)`, `new Proxy(...)`, `new Array(...)` (use `[...]` literal), and any future constructor that lands in the JS standard library.

### Constraint 4 — Identifier scope (KEY FIX)

Every `Identifier` reference must be in a per-call allowlist of safe names. The default allowlist is:

```
Math, JSON, Date, Array, Object, String, Number, Boolean, RegExp, Error,
Promise, Symbol, Map, Set, WeakMap, WeakSet, parseInt, parseFloat,
isNaN, isFinite, undefined, NaN, Infinity, console
```

The plugin API surface (e.g., `cube`, `report`, `util`, `log`, `scenario`) is added per-plugin at registration time. **Bare `Function`, `eval`, `globalThis`, `process`, `window`, `self`, `global`, `require`, `import`, `export`, `arguments`, `this`, `super` are forbidden.**

## Consequences

### Positive

- **Three independent filters.** A single bypass must defeat all four constraints, raising the cost of attack by orders of magnitude.
- **Static analysis at parse time.** No runtime sandbox layer; the plugin code is rejected before it executes.
- **Auditable.** The constraints are declarative; a security review can verify the allowlist by reading the spec.
- **Testable.** The PoC suite in `feedback-ast-allowlist-pitfalls.md` (6 tests) verifies each constraint independently.

### Negative

- **More complex than a regex.** ~200 lines of AST-walker code instead of ~20 lines of regex.
- **Per-plugin identifier allowlist.** Each plugin must declare its globals; no implicit `window` access.
- **Performance.** acorn parse + 4-walk is ~5-10ms per plugin. Acceptable for the 50-200 plugins expected.
- **Limits the plugin API surface.** Plugins cannot use `setTimeout`/`setInterval` directly; they must call registered host functions. (This is correct for security, not a regression.)

### Neutral

- **Migration path.** Each existing plugin in `src/plugins/samples/` must be audited. Hephaestus estimates 8-12 hours of work for the full migration; Apollo can do this in 1-2 days.

## Alternatives Considered

### A. Keep regex denylist, add eval + Function to it

**Rejected.** Regex denylists are bypassable by 4 known patterns (above). Adding more patterns is whack-a-mole.

### B. Web Worker isolation (each plugin runs in a Worker with no `importScripts`)

**Rejected for v1.** Worker isolation is a stronger guarantee but requires postMessage bridge for every API call; ~3x slower; harder to debug. **Recommended for Phase 2** as a second line of defense behind the AST allowlist (defense in depth).

### C. QuickJS-emscripten WASM sandbox

**Deferred to Phase 2.** Strongest isolation (a real interpreter in WASM) but ~500KB extra bundle, ~2-3 weeks of work to integrate. Not justified for the current plugin set; revisit if plugin ecosystem grows.

### D. No sandbox (rely on review + signed plugins)

**Rejected.** 100× claim requires enterprise-grade security. Review-based trust does not scale.

## Required Tests

The following PoC suite must pass in `src/plugins/PluginSandbox.test.ts` (one test per attack class):

```ts
// 1. Prototype chain via ObjectExpression
expect(() => sandbox('({}).constructor.constructor("return globalThis")()')).toThrow(SandboxError);

// 2. Prototype chain via ArrayExpression
expect(() => sandbox('[].constructor.constructor("return globalThis")()')).toThrow(SandboxError);

// 3. Bare Function identifier
expect(() => sandbox('Function("return globalThis")()')).toThrow(SandboxError);

// 4. Bare eval identifier
expect(() => sandbox('eval("process.exit(1)")')).toThrow(SandboxError);

// 5. import() dynamic
expect(() => sandbox('import("fs")')).toThrow(SandboxError);

// 6. this / globalThis / window
expect(() => sandbox('globalThis.process.exit(1)')).toThrow(SandboxError);
expect(() => sandbox('window.process.exit(1)')).toThrow(SandboxError);
expect(() => sandbox('this.process.exit(1)')).toThrow(SandboxError);

// 7. String escape bypass
expect(() => sandbox('\\x65val("process.exit(1)")')).toThrow(SandboxError);
expect(() => sandbox('\\u0065val("process.exit(1)")')).toThrow(SandboxError);

// 8. Bracket access bypass
expect(() => sandbox('window["ev"+"al"]("process.exit(1)")')).toThrow(SandboxError);
```

## References

- **Hephaestus audit 2026-06-12** — P0 #2 finding (original)
- **Athena cross-check 2026-06-12** — PoC verification `({}).constructor.constructor("return globalThis")()` bypasses node-type allowlist alone
- **Apollo task 019ebce7-… P0 #2** — implementation
- **`memory/feedback-ast-allowlist-pitfalls.md`** — full reusable lesson with 6-test PoC suite and decision tree
- **OWASP Sandbox Escape Patterns** — canonical bypass catalog
- **MDN Function constructor** — `new Function(...)` semantics

---

**Changelog:**

- v0.1 (2026-06-12, Hephaestus) — initial draft. Four constraints (node-type + property + NewExpression + identifier), 8-test PoC suite, 4 alternatives considered.
