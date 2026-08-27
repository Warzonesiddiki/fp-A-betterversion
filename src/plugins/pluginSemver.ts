/**
 * pluginSemver — dependency-free semver range checking for the plugin system
 * (Wave-7E marketplace-integrity lane).
 *
 * Supported range grammar (pragmatic node-semver subset):
 *   comparators  > >= < <= =
 *   caret        ^1.2.3 (leftmost non-zero element semantics)
 *   tilde        ~1.2.3 (patch-level drift)
 *   x-ranges     1.x / 1.2.x / * / x
 *   hyphen       1.2.3 - 2.3 (partial upper bound is exclusive)
 *   groups       space = AND, || = OR
 *
 * Fail-closed contract: any unparseable version or range yields false.
 * Documented limitation: prerelease/build suffixes are stripped before
 * comparison (compared at base-triple precedence).
 */

export type SemverTriple = readonly [number, number, number];

const PARTIAL_RE = /^v?(\d+|[xX*])(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(?:[-+][\w.-]*)?$/;
const WILDCARD_RE = /^[xX*]$/;

type PartialTriple = readonly (number | null)[];

function parsePartial(raw: string): PartialTriple | null {
  const m = PARTIAL_RE.exec(raw.trim());
  if (!m) return null;
  const num = (t: string | undefined): number | null =>
    t === undefined || t === '' || WILDCARD_RE.test(t) ? null : Number(t);
  return [num(m[1]), num(m[2]), num(m[3])];
}

function parseTriple(raw: string): SemverTriple | null {
  const p = parsePartial(raw);
  if (!p) return null;
  // Normalize (number | null)[] slots; undefined cannot occur for literal
  // indices 0-2 but noUncheckedIndexedAccess forces the explicit coercion.
  const a: number | null = p[0] ?? null;
  const b: number | null = p[1] ?? null;
  const c: number | null = p[2] ?? null;
  if (a === null || b === null || c === null) return null;
  return [a, b, c];
}

export function compareTriples(a: SemverTriple, b: SemverTriple): number {
  for (let i = 0; i < 3; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av < bv ? -1 : 1;
  }
  return 0;
}

interface Comparator {
  op: '>=' | '>' | '<' | '<=' | '=';
  ver: SemverTriple;
}

const padLower = (p: PartialTriple): SemverTriple => [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0];

/**
 * Exclusive upper bound implied by a partial version (`1.x` → `<2.0.0`,
 * `1.2.x` → `<1.3.0`). Returns null when the triple is complete or empty.
 */
function bumpUpper(p: PartialTriple): SemverTriple | null {
  if (p[0] === null) return null; // leading wildcard → no meaningful ceiling
  if (p[1] === null) return [(p[0] ?? 0) + 1, 0, 0];
  if (p[2] === null) return [p[0] ?? 0, (p[1] ?? 0) + 1, 0];
  return null;
}

function caret(p: PartialTriple): Comparator[] {
  if (p[0] === null && p[1] === null && p[2] === null) return [];
  const lower: Comparator = { op: '>=', ver: padLower(p) };
  // Leftmost non-zero element defines the exclusion ceiling; an all-zero or
  // partially-specified range bumps its last defined position instead.
  let idx = -1;
  for (let i = 0; i < 3; i++) {
    if ((p[i] ?? 0) > 0) {
      idx = i;
      break;
    }
  }
  let upper: SemverTriple;
  if (idx === 0) upper = [(p[0] ?? 0) + 1, 0, 0];
  else if (idx === 1) upper = [p[0] ?? 0, (p[1] ?? 0) + 1, 0];
  else if (idx === 2) upper = [p[0] ?? 0, p[1] ?? 0, (p[2] ?? 0) + 1];
  else {
    // No non-zero element found (^0.x, ^0.0.x, ^0.0.0 …)
    let last = 2;
    while (last >= 0 && p[last] === null) last--;
    if (last < 0) upper = [1, 0, 0];
    else if (last === 0) upper = [(p[0] ?? 0) + 1, 0, 0];
    else if (last === 1) upper = [p[0] ?? 0, (p[1] ?? 0) + 1, 0];
    else upper = [p[0] ?? 0, p[1] ?? 0, (p[2] ?? 0) + 1];
  }
  return [lower, { op: '<', ver: upper }];
}

function tilde(p: PartialTriple): Comparator[] {
  if (p[0] === null && p[1] === null && p[2] === null) return [];
  if (p[1] === null) {
    return [
      { op: '>=', ver: padLower(p) },
      { op: '<', ver: [(p[0] ?? 0) + 1, 0, 0] },
    ];
  }
  return [
    { op: '>=', ver: padLower(p) },
    { op: '<', ver: [p[0] ?? 0, (p[1] ?? 0) + 1, 0] },
  ];
}

/** Build comparators for one operator token; null means malformed (fail closed). */
function comparatorToken(op: string, rest: string): Comparator[] | null {
  if (rest.trim() === '') return null; // bare operator like ">=" → malformed
  const p = parsePartial(rest);
  if (!p) return null;
  if (p[0] === null && p[1] === null && p[2] === null) return []; // ">*" → any

  switch (op) {
    case '':
    case '=': {
      const up = bumpUpper(p);
      if (up)
        return [
          { op: '>=', ver: padLower(p) },
          { op: '<', ver: up },
        ];
      return [{ op: '=', ver: padLower(p) }];
    }
    case '^':
      return caret(p);
    case '~':
    case '~>':
      return tilde(p);
    case '>=':
      return [{ op: '>=', ver: padLower(p) }];
    case '>': {
      const up = bumpUpper(p); // >1.2 ≡ >=1.3.0 (npm partial semantics)
      if (up) return [{ op: '>=', ver: up }];
      return [{ op: '>', ver: padLower(p) }];
    }
    case '<':
      return [{ op: '<', ver: padLower(p) }];
    case '<=': {
      const up = bumpUpper(p); // <=1.2 ≡ <1.3.0 (includes the whole 1.2 line)
      if (up) return [{ op: '<', ver: up }];
      return [{ op: '<=', ver: padLower(p) }];
    }
    default:
      return null;
  }
}

const OP_RE = /^(>=|<=|>|<|=|\^|~(?:>)?)?([\s\S]*)$/;

function evalGroup(version: SemverTriple, group: string): boolean {
  const tokens = group.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const comparators: Comparator[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i] as string;
    const next = tokens[i + 1];

    if (next === '-') {
      const hiToken = tokens[i + 2];
      if (hiToken === undefined) return false; // dangling hyphen
      const lo = parsePartial(token);
      const hi = parsePartial(hiToken);
      if (!lo || !hi) return false;
      comparators.push({ op: '>=', ver: padLower(lo) });
      const hiUp = bumpUpper(hi);
      comparators.push(hiUp ? { op: '<', ver: hiUp } : { op: '<=', ver: padLower(hi) });
      i += 2;
      continue;
    }

    const m = OP_RE.exec(token);
    if (!m) return false;
    const built = comparatorToken(m[1] ?? '', m[2] ?? '');
    if (built === null) return false;
    comparators.push(...built);
  }

  return comparators.every((c) => {
    const r = compareTriples(version, c.ver);
    switch (c.op) {
      case '>=':
        return r >= 0;
      case '>':
        return r > 0;
      case '<':
        return r < 0;
      case '<=':
        return r <= 0;
      case '=':
        return r === 0;
    }
  });
}

/**
 * True when `version` lies inside `range`. Empty/whitespace range imposes no
 * constraint; any parse failure anywhere in the range fails closed.
 */
export function semverSatisfies(version: string, range: string): boolean {
  if (typeof version !== 'string' || typeof range !== 'string') return false;
  const v = parseTriple(version);
  if (!v) return false;
  const trimmed = range.trim();
  if (trimmed === '') return true;
  return trimmed.split('||').some((branch) => {
    const g = branch.trim();
    if (g === '') return false; // empty OR branch matches nothing
    return evalGroup(v, g);
  });
}
