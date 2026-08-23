/**
 * CSP-safe arithmetic expression evaluator for worker formulas.
 *
 * W6-P0-01: the shipped Tauri CSP (script-src 'self' 'wasm-unsafe-eval') blocks
 * `new Function`, which silently zeroed every batch-calc formula result via a
 * catch-all. This module replaces that evaluator with an explicit tokenizer +
 * shunting-yard parser: NO eval, NO Function constructor, NO code injection.
 * Grammar: numbers, + - * / % (parens), unary +/-.
 */

export class SafeExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafeExpressionError';
  }
}

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'op'; op: string }
  | { kind: 'lparen' }
  | { kind: 'rparen' };

const BINARY_PREC: Record<string, number> = {
  '+': 2,
  '-': 2,
  '*': 3,
  '/': 3,
  '%': 3,
};
const UNARY_PREC = 4;

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i]!;
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1;
      continue;
    }
    if (ch >= '0' && ch <= '9') {
      let j = i + 1;
      while (j < input.length && ((input[j]! >= '0' && input[j]! <= '9') || input[j] === '.')) {
        j += 1;
      }
      const num = Number(input.slice(i, j));
      if (!Number.isFinite(num)) {
        throw new SafeExpressionError(`Invalid numeric literal at ${i}`);
      }
      tokens.push({ kind: 'num', value: num });
      i = j;
      continue;
    }
    if (ch === '(') {
      tokens.push({ kind: 'lparen' });
      i += 1;
      continue;
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen' });
      i += 1;
      continue;
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '%') {
      tokens.push({ kind: 'op', op: ch });
      i += 1;
      continue;
    }
    throw new SafeExpressionError(`Illegal character "${ch}" at position ${i}`);
  }
  return tokens;
}

function applyOp(ops: string[], values: number[]): void {
  const op = ops.pop()!;
  if (op === 'u-' || op === 'u+') {
    const v = values.pop();
    if (v === undefined) throw new SafeExpressionError('Missing operand for unary operator');
    values.push(op === 'u-' ? -v : v);
    return;
  }
  const b = values.pop();
  const a = values.pop();
  if (a === undefined || b === undefined) throw new SafeExpressionError('Missing operand');
  switch (op) {
    case '+':
      values.push(a + b);
      break;
    case '-':
      values.push(a - b);
      break;
    case '*':
      values.push(a * b);
      break;
    case '/':
      values.push(a / b);
      break;
    case '%':
      values.push(a % b);
      break;
    default:
      throw new SafeExpressionError(`Unknown operator "${op}"`);
  }
}

/** Evaluates an arithmetic-only expression; throws SafeExpressionError on anything malformed or non-finite. */
export function evaluateExpression(input: string): number {
  const tokens = tokenize(input);
  const values: number[] = [];
  const ops: string[] = [];
  let prev: Token | undefined;

  for (const tok of tokens) {
    if (tok.kind === 'num') {
      values.push(tok.value);
    } else if (tok.kind === 'op') {
      const unary =
        tok.op === '+' || tok.op === '-'
          ? prev === undefined || prev.kind === 'op' || prev.kind === 'lparen'
          : false;
      const cur = unary ? 'u' + tok.op : tok.op;
      const curPrec = unary ? UNARY_PREC : BINARY_PREC[tok.op]!;
      while (
        ops.length > 0 &&
        ops[ops.length - 1] !== 'u-' &&
        ops[ops.length - 1] !== 'u+' &&
        ops[ops.length - 1] !== '(' &&
        BINARY_PREC[ops[ops.length - 1]!]! >= curPrec
      ) {
        applyOp(ops, values);
      }
      // Unary operators simply stack: they are drained by applyOp when the
      // next binary operator, a closing parenthesis, or end-of-input arrives.
      ops.push(cur);
    } else if (tok.kind === 'lparen') {
      ops.push('(');
    } else {
      let matched = false;
      while (ops.length > 0 && ops[ops.length - 1] !== '(') {
        applyOp(ops, values);
        matched = true;
      }
      if (ops.length === 0) throw new SafeExpressionError('Unbalanced closing parenthesis');
      ops.pop(); // discard '('
      void matched;
    }
    prev = tok;
  }

  while (ops.length > 0) {
    const top = ops[ops.length - 1]!;
    if (top === '(') throw new SafeExpressionError('Unbalanced opening parenthesis');
    applyOp(ops, values);
  }

  if (values.length !== 1 || Number.isNaN(values[0]) || !Number.isFinite(values[0]!)) {
    throw new SafeExpressionError('Expression did not evaluate to a finite number');
  }
  return values[0]!;
}
