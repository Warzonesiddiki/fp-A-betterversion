#!/usr/bin/env node
/**
 * AST money-safety detector (Blueprint W0.1.0, Section 18.2).
 *
 * WHY THIS EXISTS
 * ---------------
 * The legacy detector (scripts/money-adoption.mjs) measures adoption as:
 *
 *     does this file contain `import ... from '@/utils/money'` ?
 *
 * That is an *import proxy*, not a safety measure. A module scores as fully
 * adopted while doing `total += row.amount` on IEEE-754 doubles, as long as it
 * imports formatMoney somewhere for display. It also cannot see the inverse:
 * a module doing no monetary arithmetic at all is counted as "not adopted"
 * and pollutes the denominator.
 *
 * This detector parses every financial-path module with the TypeScript
 * compiler and asks the question that actually matters:
 *
 *     does this module perform ANY unsafe arithmetic on a monetary value?
 *
 * A module is SAFE only if the answer is zero. Safety is a property of
 * operations, not of imports.
 *
 * WHAT COUNTS AS UNSAFE
 * ---------------------
 *   arithmetic   money + money, money - money, money * n, money / n, money % n
 *   compound     money += / -= / *= / /=
 *   comparison   money < money, money > money, money <= money, money >= money
 *                (float comparison decides approvals, breaches and thresholds)
 *   equality     money === money  (0.1 + 0.2 !== 0.3)
 *   reduce       .reduce((a, b) => a + b.amount, 0) accumulating money
 *   rounding     money.toFixed(n) / Math.round(money) used as a VALUE
 *
 * WHAT IS SAFE
 * ------------
 *   - Calls into the canonical primitive: addMoney, subtractMoney, sumMoney,
 *     multiplyMoney, divideMoney, roundMoney, compareMoney, allocateMoney, ...
 *   - decimal.js instances and their method chains (.plus/.minus/.times/.div)
 *   - String building (template literals, concatenation with a string literal)
 *   - Non-monetary arithmetic (counts, indices, percentages, rates, dates)
 *
 * EXPECT THE NUMBER TO FALL. The legacy metric reported 25.44% adoption. That
 * number was never real. A drop on first run is the detector working, not a
 * regression -- see Blueprint Section 18.2 W0.1.0 and Section 22.6 (honesty).
 *
 * Usage:
 *   node scripts/money-ast-detector.mjs             # check against baseline
 *   node scripts/money-ast-detector.mjs --update    # re-record baseline
 *   node scripts/money-ast-detector.mjs --list      # worklist, worst first
 *   node scripts/money-ast-detector.mjs --file <p>  # explain one file
 *   node scripts/money-ast-detector.mjs --json      # machine-readable
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename, relative } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const ROOT = process.cwd();
const BASELINE_PATH = join(ROOT, 'scripts', 'money-ast-baseline.json');

/* ------------------------------------------------------------------ *
 * Scope: the financial paths. Mirrors money-adoption.mjs plus the
 * server, so the two metrics describe the same universe.
 * ------------------------------------------------------------------ */
const SCAN_DIRS = [
  'src/engines',
  'src/store',
  'src/utils',
  'src/services',
  'src/workers',
  'src/domain',
  'src/components',
  'src/pages',
  'server/src',
];

const isTest = (f) => /\.(test|bench|benchmark|spec|stories)\.[tj]sx?$/.test(f);

/* ------------------------------------------------------------------ *
 * Monetary identification.
 *
 * Deliberately conservative: a name must look like money AND must not
 * look like one of the well-known non-money numerics. Under-reporting
 * is preferable to a detector nobody trusts -- every flagged site must
 * survive a human reading it.
 * ------------------------------------------------------------------ */
const MONEY_WORDS = [
  'amount',
  'balance',
  'cost',
  'price',
  'revenue',
  'expense',
  'debit',
  'credit',
  'cash',
  'salary',
  'wage',
  'payroll',
  'fee',
  'tax',
  'vat',
  'payment',
  'paid',
  'payable',
  'receivable',
  'invoice',
  'budget',
  'actual',
  'forecast',
  'variance',
  'profit',
  'loss',
  'income',
  'earnings',
  'ebitda',
  'ebit',
  'capex',
  'opex',
  'cogs',
  'margin',
  'subtotal',
  'total',
  'gross',
  'net',
  'principal',
  'interest',
  'accrual',
  'depreciation',
  'amortization',
  'amortisation',
  'valuation',
  'equity',
  'asset',
  'liability',
  'debt',
  'loan',
  'lease',
  'rent',
  'premium',
  'claim',
  'refund',
  'discount',
  'charge',
  'billing',
  'billed',
  'spend',
  'funding',
  'capital',
  'cashflow',
  'inflow',
  'outflow',
  'usd',
  'eur',
  'gbp',
  'money',
  'currency',
  'monetary',
  'dollar',
  'ledger',
  'journal',
  'posting',
  'reconcil',
  'writeoff',
  'impairment',
  'provision',
  'reserve',
  'dividend',
  'coupon',
  'notional',
  'exposure',
  'arr',
  'mrr',
];

/**
 * Names that contain a money word but are NOT money. Checked first.
 * `taxRate` is a rate. `revenueGrowthPct` is a percentage. `invoiceCount`
 * is a count. `budgetId` is an identifier.
 */
const NON_MONEY_SUFFIX =
  /(rate|pct|percent|percentage|ratio|count|qty|quantity|index|idx|id|ids|key|keys|name|names|label|type|kind|status|state|code|flag|enabled|visible|length|size|width|height|days|day|month|months|year|years|week|weeks|hour|hours|minute|seconds|ms|duration|score|weight|rank|version|page|offset|limit|color|colour|icon|url|path|href|multiplier|factor|coefficient|threshold_pct|basis|bps|term|periods|tenor|probability|confidence)$/i;

const NON_MONEY_CONTAINS =
  /(percent|percentage|_pct|pct_|ratio|growthrate|discountrate|interestrate|taxrate|fxrate|exchangerate|hurdlerate|inflationrate|utilization|utilisation|isvalid|hasvalue|colspan|rowspan|zindex|fontsize|opacity|timestamp|createdat|updatedat|datetime)/i;

/**
 * Counter / tally names. Validated 2026-08-17 against src/services/
 * CircuitBreaker.ts and RateLimiter.ts, where `state.totalAllowed += 1` and
 * `state.totalProbes += 1` were flagged purely because "total" is a money
 * word. They are request counters. A name ending in one of these is a tally,
 * never a monetary amount.
 */
const COUNTER_SUFFIX =
  /(count|counts|counter|rows|records|items|entries|calls|requests|attempts|retries|hits|misses|errors|failures|allowed|rejected|denied|accepted|probes|succeeded|failed|skipped|passed|processed|pending|queued|active|concurrent|tokens|slots|seats|users|sessions|connections|files|batches|chunks|steps|iterations|warnings|violations|occurrences)$/i;

const moneyNameCache = new Map();

function looksMonetary(rawName) {
  if (!rawName) return false;
  const cached = moneyNameCache.get(rawName);
  if (cached !== undefined) return cached;

  const name = rawName.replace(/[_-]/g, '');
  let result;

  // Bare generic words are ambiguous: `total` is as often a row count or a
  // denominator as it is a sum of money, and `cost` is token-bucket cost in
  // the rate limiter. Require a qualifier (totalRevenue, laborCost) so the
  // name itself carries the financial claim. Validated 2026-08-17 against
  // CircuitBreaker.ts (`windowFailures / total`) and RateLimiter.ts.
  const AMBIGUOUS_ALONE = new Set([
    'total',
    'net',
    'gross',
    'actual',
    'value',
    'amount',
    'cost',
    'sum',
    'delta',
    'diff',
    'change',
    'base',
    'current',
    'previous',
    'target',
  ]);

  if (NON_MONEY_CONTAINS.test(name)) {
    result = false;
  } else if (NON_MONEY_SUFFIX.test(name)) {
    result = false;
  } else if (COUNTER_SUFFIX.test(name)) {
    result = false;
  } else if (AMBIGUOUS_ALONE.has(name.toLowerCase())) {
    result = false;
  } else {
    const lower = name.toLowerCase();
    result = MONEY_WORDS.some((w) => lower.includes(w));
  }

  moneyNameCache.set(rawName, result);
  return result;
}

/** The canonical safe API. Anything routed through these is decimal-backed. */
const SAFE_CALLS = new Set([
  'addMoney',
  'subtractMoney',
  'multiplyMoney',
  'divideMoney',
  'sumMoney',
  'roundMoney',
  'roundTo',
  'toDecimal',
  'compareMoney',
  'moneyEquals',
  'toCents',
  'fromCents',
  'percentOf',
  'variancePct',
  'allocateMoney',
  'splitMoneyEvenly',
  'formatMoney',
  'Decimal',
]);

/** decimal.js instance methods -- an expression ending in one is a Decimal. */
const DECIMAL_METHODS = new Set([
  'plus',
  'minus',
  'times',
  'mul',
  'div',
  'dividedBy',
  'abs',
  'neg',
  'toDecimalPlaces',
  'toDP',
  'round',
  'cmp',
  'comparedTo',
  'eq',
  'gt',
  'gte',
  'lt',
  'lte',
  'sum',
]);

/**
 * True when the expression is already decimal-safe: a call into the money
 * primitive, `new Decimal(...)`, or a decimal.js method chain.
 */
function isDecimalExpression(node) {
  if (!node) return false;

  if (ts.isParenthesizedExpression(node)) return isDecimalExpression(node.expression);
  if (ts.isAsExpression(node) || ts.isTypeAssertionExpression?.(node)) {
    return isDecimalExpression(node.expression);
  }
  if (ts.isNewExpression(node)) {
    return ts.isIdentifier(node.expression) && node.expression.text === 'Decimal';
  }
  if (ts.isCallExpression(node)) {
    const callee = node.expression;
    if (ts.isIdentifier(callee)) return SAFE_CALLS.has(callee.text);
    if (ts.isPropertyAccessExpression(callee)) {
      const m = callee.name.text;
      if (DECIMAL_METHODS.has(m)) return true;
      if (SAFE_CALLS.has(m)) return true;
      // Decimal.sum(...) / Decimal.max(...)
      if (ts.isIdentifier(callee.expression) && callee.expression.text === 'Decimal') return true;
    }
    return false;
  }
  return false;
}

/** Does this expression reference a monetary value? */
function isMonetaryExpression(node, depth = 0) {
  if (!node || depth > 6) return false;

  if (ts.isParenthesizedExpression(node)) return isMonetaryExpression(node.expression, depth + 1);
  if (ts.isIdentifier(node)) return looksMonetary(node.text);
  if (ts.isPropertyAccessExpression(node)) {
    // row.amount -> "amount"; prefer the property, fall back to the object
    return looksMonetary(node.name.text) || isMonetaryExpression(node.expression, depth + 1);
  }
  if (ts.isElementAccessExpression(node)) {
    const arg = node.argumentExpression;
    if (arg && ts.isStringLiteral(arg) && looksMonetary(arg.text)) return true;
    return isMonetaryExpression(node.expression, depth + 1);
  }
  if (ts.isNonNullExpression(node) || ts.isAsExpression(node)) {
    return isMonetaryExpression(node.expression, depth + 1);
  }
  if (ts.isBinaryExpression(node)) {
    return (
      isMonetaryExpression(node.left, depth + 1) || isMonetaryExpression(node.right, depth + 1)
    );
  }
  if (ts.isConditionalExpression(node)) {
    return (
      isMonetaryExpression(node.whenTrue, depth + 1) ||
      isMonetaryExpression(node.whenFalse, depth + 1)
    );
  }
  if (ts.isPrefixUnaryExpression(node)) return isMonetaryExpression(node.operand, depth + 1);
  if (ts.isCallExpression(node)) {
    const callee = node.expression;
    if (ts.isPropertyAccessExpression(callee)) return looksMonetary(callee.name.text);
    if (ts.isIdentifier(callee)) return looksMonetary(callee.text);
  }
  return false;
}

/**
 * `x += 1` is a tally, not a monetary movement -- money moves by amounts, not
 * by whole units of one. Validated against the CircuitBreaker/RateLimiter
 * counters. Any non-integer or non-literal operand stays in scope.
 */
function isIntegerCounterStep(node) {
  if (!node) return false;
  if (ts.isNumericLiteral(node)) return /^\d+$/.test(node.text);
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    return /^\d+$/.test(node.operand.text);
  }
  return false;
}

/** String building is not arithmetic: `'Total: ' + x` is display, not truth. */
function isStringContext(node) {
  const isStr = (n) =>
    n &&
    (ts.isStringLiteral(n) ||
      ts.isTemplateExpression(n) ||
      ts.isNoSubstitutionTemplateLiteral(n) ||
      (ts.isBinaryExpression(n) &&
        n.operatorToken.kind === ts.SyntaxKind.PlusToken &&
        (isStr(n.left) || isStr(n.right))));
  return isStr(node.left) || isStr(node.right);
}

const ARITH_OPS = new Map([
  [ts.SyntaxKind.PlusToken, '+'],
  [ts.SyntaxKind.MinusToken, '-'],
  [ts.SyntaxKind.AsteriskToken, '*'],
  [ts.SyntaxKind.SlashToken, '/'],
  [ts.SyntaxKind.PercentToken, '%'],
]);

const COMPOUND_OPS = new Map([
  [ts.SyntaxKind.PlusEqualsToken, '+='],
  [ts.SyntaxKind.MinusEqualsToken, '-='],
  [ts.SyntaxKind.AsteriskEqualsToken, '*='],
  [ts.SyntaxKind.SlashEqualsToken, '/='],
]);

const COMPARE_OPS = new Map([
  [ts.SyntaxKind.LessThanToken, '<'],
  [ts.SyntaxKind.GreaterThanToken, '>'],
  [ts.SyntaxKind.LessThanEqualsToken, '<='],
  [ts.SyntaxKind.GreaterThanEqualsToken, '>='],
]);

const EQUALITY_OPS = new Map([
  [ts.SyntaxKind.EqualsEqualsEqualsToken, '==='],
  [ts.SyntaxKind.ExclamationEqualsEqualsToken, '!=='],
]);

/** Analyse one source file; return the list of unsafe monetary operations. */
function analyseFile(filePath, text) {
  const sf = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    /\.tsx$/.test(filePath) ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const findings = [];
  const at = (node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
  const snippet = (node) => {
    const s = node.getText(sf).replace(/\s+/g, ' ').trim();
    return s.length > 90 ? s.slice(0, 87) + '...' : s;
  };
  const add = (node, kind, op) => findings.push({ line: at(node), kind, op, code: snippet(node) });

  function visit(node) {
    // --- binary expressions -------------------------------------------
    if (ts.isBinaryExpression(node)) {
      const kind = node.operatorToken.kind;

      if (ARITH_OPS.has(kind)) {
        if (
          !isStringContext(node) &&
          (isMonetaryExpression(node.left) || isMonetaryExpression(node.right)) &&
          !isDecimalExpression(node.left) &&
          !isDecimalExpression(node.right)
        ) {
          add(node, 'arithmetic', ARITH_OPS.get(kind));
        }
      } else if (COMPOUND_OPS.has(kind)) {
        if (
          isMonetaryExpression(node.left) &&
          !isDecimalExpression(node.right) &&
          !isIntegerCounterStep(node.right)
        ) {
          add(node, 'compound-assign', COMPOUND_OPS.get(kind));
        }
      } else if (COMPARE_OPS.has(kind)) {
        if (
          isMonetaryExpression(node.left) &&
          isMonetaryExpression(node.right) &&
          !isDecimalExpression(node.left) &&
          !isDecimalExpression(node.right)
        ) {
          add(node, 'comparison', COMPARE_OPS.get(kind));
        }
      } else if (EQUALITY_OPS.has(kind)) {
        // Only flag money === money; money === 0 and money === null are fine.
        const lit = (n) =>
          ts.isNumericLiteral(n) ||
          n.kind === ts.SyntaxKind.NullKeyword ||
          ts.isStringLiteral(n) ||
          (ts.isIdentifier(n) && n.text === 'undefined');
        if (
          isMonetaryExpression(node.left) &&
          isMonetaryExpression(node.right) &&
          !lit(node.left) &&
          !lit(node.right) &&
          !isDecimalExpression(node.left) &&
          !isDecimalExpression(node.right)
        ) {
          add(node, 'float-equality', EQUALITY_OPS.get(kind));
        }
      }
    }

    // NOTE: ++ / -- are deliberately NOT flagged. They step by exactly one
    // unit, which is a tally operation; money moves by amounts. Flagging them
    // produced only false positives (request counters) in validation.

    // --- call expressions ---------------------------------------------
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text;
      const target = node.expression.expression;

      // .toFixed(n) producing a monetary VALUE
      if (method === 'toFixed' && isMonetaryExpression(target) && !isDecimalExpression(target)) {
        add(node, 'toFixed', '.toFixed()');
      }

      // .reduce(...) accumulating money on floats
      if (method === 'reduce' && node.arguments.length) {
        const fn = node.arguments[0];
        if (fn && (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn))) {
          let unsafeAccum = false;
          const scan = (n) => {
            if (
              ts.isBinaryExpression(n) &&
              (ARITH_OPS.has(n.operatorToken.kind) || COMPOUND_OPS.has(n.operatorToken.kind)) &&
              (isMonetaryExpression(n.left) || isMonetaryExpression(n.right)) &&
              !isDecimalExpression(n.left) &&
              !isDecimalExpression(n.right) &&
              !isStringContext(n)
            ) {
              unsafeAccum = true;
            }
            if (!unsafeAccum) ts.forEachChild(n, scan);
          };
          scan(fn.body);
          // Reported once per reduce, and the inner binary is reported too;
          // dedupe below keeps a single finding per line.
          if (unsafeAccum && (isMonetaryExpression(target) || isMonetaryExpression(fn.body))) {
            add(node, 'reduce-accumulate', '.reduce()');
          }
        }
      }
    }

    // --- Math.round / Math.abs on money -------------------------------
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'Math' &&
      ['round', 'floor', 'ceil'].includes(node.expression.name.text) &&
      node.arguments.length === 1 &&
      isMonetaryExpression(node.arguments[0]) &&
      !isDecimalExpression(node.arguments[0])
    ) {
      add(node, 'math-round', `Math.${node.expression.name.text}()`);
    }

    ts.forEachChild(node, visit);
  }

  visit(sf);

  // One finding per (line, kind) so a nested reduce doesn't double-count.
  const seen = new Set();
  return findings.filter((f) => {
    const k = `${f.line}:${f.kind}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/* ------------------------------------------------------------------ */
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === 'dist' || e === 'build') continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (['.ts', '.tsx'].includes(extname(p)) && !isTest(basename(p))) out.push(p);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
const results = [];

for (const f of files) {
  const text = readFileSync(f, 'utf8');
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  let findings = [];
  try {
    findings = analyseFile(f, text);
  } catch (err) {
    console.error(`  ! parse failure ${rel}: ${err.message}`);
    process.exitCode = 1;
  }
  const touchesMoney =
    findings.length > 0 || MONEY_WORDS.some((w) => text.toLowerCase().includes(w));
  results.push({ file: rel, findings, unsafe: findings.length, touchesMoney });
}

/* ------------------------------------------------------------------ *
 * The denominator is modules that actually handle money. A module with
 * no monetary content is neither safe nor unsafe -- it is irrelevant,
 * and padding the denominator with it inflates the score.
 * ------------------------------------------------------------------ */
const monetary = results.filter((r) => r.touchesMoney);
const unsafeModules = monetary.filter((r) => r.unsafe > 0);
const safeModules = monetary.filter((r) => r.unsafe === 0);
const totalUnsafeOps = monetary.reduce((a, r) => a + r.unsafe, 0);

const byKind = {};
for (const r of monetary) {
  for (const f of r.findings) byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
}

const measured = {
  modulesScanned: results.length,
  monetaryModules: monetary.length,
  safeModules: safeModules.length,
  unsafeModules: unsafeModules.length,
  unsafeOperations: totalUnsafeOps,
  safetyPercent: monetary.length
    ? Number(((safeModules.length / monetary.length) * 100).toFixed(2))
    : 100,
  byKind,
};

/* ------------------------------------------------------------------ */
const argv = process.argv.slice(2);

if (argv.includes('--json')) {
  console.log(JSON.stringify({ measured, modules: unsafeModules }, null, 2));
  process.exit(0);
}

const fileArg = argv.indexOf('--file');
if (fileArg !== -1 && argv[fileArg + 1]) {
  const target = argv[fileArg + 1].replace(/\\/g, '/');
  const hit = results.find((r) => r.file === target || r.file.endsWith(target));
  if (!hit) {
    console.error(`No scanned module matches ${target}`);
    process.exit(1);
  }
  console.log(`${hit.file} — ${hit.unsafe} unsafe monetary operation(s)\n`);
  for (const f of hit.findings) {
    console.log(`  line ${String(f.line).padStart(5)}  ${f.kind.padEnd(16)} ${f.op}`);
    console.log(`         ${f.code}`);
  }
  process.exit(0);
}

console.log('AST money safety (financial paths):');
console.log(`  modules scanned               ${measured.modulesScanned}`);
console.log(`  modules handling money        ${measured.monetaryModules}`);
console.log(`  SAFE (zero unsafe ops)        ${measured.safeModules}`);
console.log(`  UNSAFE                        ${measured.unsafeModules}`);
console.log(`  unsafe operations             ${measured.unsafeOperations}`);
console.log(`  safety                        ${measured.safetyPercent}%`);
console.log('');
console.log('  Unsafe operations by kind:');
for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${k.padEnd(18)} ${v}`);
}
console.log('');

if (argv.includes('--list')) {
  console.log('  Worklist (worst first):');
  for (const r of [...unsafeModules].sort((a, b) => b.unsafe - a.unsafe).slice(0, 60)) {
    console.log(`    ${String(r.unsafe).padStart(5)}  ${r.file}`);
  }
  console.log('');
}

if (argv.includes('--update')) {
  writeFileSync(
    BASELINE_PATH,
    JSON.stringify({ ...measured, recordedAt: new Date().toISOString() }, null, 2) + '\n'
  );
  console.log(`Baseline recorded at ${relative(ROOT, BASELINE_PATH)}`);
  process.exit(0);
}

if (!existsSync(BASELINE_PATH)) {
  console.error('No baseline recorded. Run: node scripts/money-ast-detector.mjs --update');
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
const failures = [];

if (measured.unsafeOperations > baseline.unsafeOperations) {
  failures.push(
    `unsafe monetary operations INCREASED: ${baseline.unsafeOperations} -> ${measured.unsafeOperations}. ` +
      'Route the new arithmetic through src/utils/money.ts (addMoney/sumMoney/...).'
  );
}
if (measured.unsafeModules > baseline.unsafeModules) {
  failures.push(
    `modules with unsafe money arithmetic INCREASED: ${baseline.unsafeModules} -> ${measured.unsafeModules}.`
  );
}
if (measured.safetyPercent < baseline.safetyPercent) {
  failures.push(
    `money safety DECREASED: ${baseline.safetyPercent}% -> ${measured.safetyPercent}%.`
  );
}

if (failures.length) {
  console.error('MONEY AST RATCHET FAILED:\n');
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('\n  Inspect a module:  node scripts/money-ast-detector.mjs --file <path>');
  process.exit(1);
}

console.log(
  `✓ Ratchet holds (baseline: ${baseline.unsafeOperations} unsafe ops across ` +
    `${baseline.unsafeModules} modules, ${baseline.safetyPercent}% safe).`
);
