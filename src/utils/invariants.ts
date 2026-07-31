/**
 * Formal invariant primitives (Omega Protocol §1).
 *
 * Executable pre/post-conditions for financial engines. `assertInvariant`
 * throws {@link InvariantViolationError} when a condition is false — except in
 * production builds, where Vite replaces `import.meta.env.PROD` with `true` and
 * the throw becomes dead code that is tree-shaken away (zero customer cost).
 *
 * In dev/test the check is live, so a violated invariant fails loudly at the
 * boundary rather than propagating silently through a calculation. The
 * `asserts condition` return type also narrows the value for callers.
 */

export class InvariantViolationError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(`[INVARIANT VIOLATION ${code}]: ${message}`);
    this.name = 'InvariantViolationError';
  }
}

export function assertInvariant(
  condition: boolean,
  code: string,
  message: string
): asserts condition {
  // No-op in production (zero runtime cost); the throw is dead code there.
  if (!import.meta.env.PROD && !condition) {
    throw new InvariantViolationError(code, message);
  }
}
