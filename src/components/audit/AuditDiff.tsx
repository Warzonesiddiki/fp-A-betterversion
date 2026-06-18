// src/components/audit/AuditDiff.tsx
// Clio (Audit Muse) — Part 141 P0A-17 Audit Trail UI
// Word-level LCS diff + numeric Δ + boolean toggle + WCAG AA 4.5:1 contrast

import { memo } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute longest common subsequence (LCS) of two word arrays */
function lcsWords(a: string[], b: string[]): string[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }
  const result: string[][] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift([a[i - 1]!, b[j - 1]!]);
      i--;
      j--;
    } else if (dp[i - 1]![j]! >= dp[i]![j - 1]!) {
      result.unshift([a[i - 1]!, '']);
      i--;
    } else {
      result.unshift(['', b[j - 1]!]);
      j--;
    }
  }
  while (i > 0) {
    result.unshift([a[i - 1]!, '']);
    i--;
  }
  while (j > 0) {
    result.unshift(['', b[j - 1]!]);
    j--;
  }
  return result;
}

const formatNumber = (n: number): string => {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
};

const formatDate = (ms: number): string => {
  try {
    return new Date(ms).toISOString().slice(0, 10);
  } catch {
    return String(ms);
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface AuditDiffProps {
  previousValue: unknown;
  newValue: unknown;
  dataType?: 'number' | 'string' | 'boolean' | 'date' | 'object' | 'array';
  /** Truncate very long string diffs to first N words for performance (default 50) */
  maxWords?: number;
}

const WINDOW = 50;

function AuditDiffBase({
  previousValue,
  newValue,
  dataType,
  maxWords = WINDOW,
}: AuditDiffProps): JSX.Element {
  // Numeric diff
  if (
    (dataType === 'number' || typeof previousValue === 'number' || typeof newValue === 'number') &&
    typeof previousValue === 'number' &&
    typeof newValue === 'number'
  ) {
    const delta = newValue - previousValue;
    const pct = previousValue !== 0 ? (delta / previousValue) * 100 : 0;
    const sign = delta > 0 ? '+' : delta < 0 ? '' : '±';
    const isIncrease = delta > 0;
    return (
      <span className="font-mono text-sm">
        <span className="text-gray-500 line-through mr-2">{formatNumber(previousValue)}</span>
        <span
          className={
            isIncrease
              ? 'text-green-700 font-semibold dark:text-green-300'
              : delta < 0
                ? 'text-red-700 font-semibold dark:text-red-300'
                : 'text-gray-700 dark:text-gray-300'
          }
        >
          {formatNumber(newValue)}
        </span>
        <span
          className={
            isIncrease
              ? 'ml-2 text-xs text-green-600 dark:text-green-400'
              : delta < 0
                ? 'ml-2 text-xs text-red-600 dark:text-red-400'
                : 'ml-2 text-xs text-gray-500'
          }
        >
          ({sign}
          {formatNumber(delta)} / {pct > 0 ? '+' : ''}
          {pct.toFixed(1)}%)
        </span>
      </span>
    );
  }

  // Boolean toggle
  if (typeof previousValue === 'boolean' || typeof newValue === 'boolean') {
    return (
      <span className="text-sm">
        <span className="text-gray-500 line-through mr-2">{String(previousValue)}</span>
        <span
          className={
            newValue
              ? 'text-green-700 font-semibold dark:text-green-300'
              : 'text-red-700 font-semibold dark:text-red-300'
          }
        >
          {String(newValue)}
        </span>
      </span>
    );
  }

  // Date diff
  if (
    (dataType === 'date' || (typeof previousValue === 'number' && typeof newValue === 'number')) &&
    dataType === 'date'
  ) {
    return (
      <span className="font-mono text-sm">
        <span className="text-gray-500 line-through mr-2">{formatDate(previousValue as number)}</span>
        <span className="text-blue-700 font-semibold dark:text-blue-300">
          {formatDate(newValue as number)}
        </span>
      </span>
    );
  }

  // String/array/object word-level diff
  const prevStr = (() => {
    if (previousValue == null) return '';
    if (typeof previousValue === 'string') return previousValue;
    try {
      return JSON.stringify(previousValue);
    } catch {
      return String(previousValue);
    }
  })();

  const newStr = (() => {
    if (newValue == null) return '';
    if (typeof newValue === 'string') return newValue;
    try {
      return JSON.stringify(newValue);
    } catch {
      return String(newValue);
    }
  })();

  const prevWords = prevStr.split(/\s+/).filter(Boolean).slice(0, maxWords);
  const newWords = newStr.split(/\s+/).filter(Boolean).slice(0, maxWords);

  if (prevWords.length === 0 && newWords.length === 0) {
    return <span className="text-gray-400 italic text-sm">(empty)</span>;
  }
  if (prevWords.length === 0) {
    return (
      <span className="text-sm">
        <span className="bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100 px-0.5 rounded">
          {newWords.join(' ')}
        </span>
      </span>
    );
  }
  if (newWords.length === 0) {
    return (
      <span className="text-sm">
        <span className="bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100 px-0.5 rounded line-through">
          {prevWords.join(' ')}
        </span>
      </span>
    );
  }

  const lcs = lcsWords(prevWords, newWords);
  return (
    <span className="text-sm leading-relaxed">
      {lcs.map(([a, b], i) => {
        if (a && b) {
          return (
            <span key={i} className="text-gray-700 dark:text-gray-300">
              {a}
              {i < lcs.length - 1 ? ' ' : ''}
            </span>
          );
        }
        if (a && !b) {
          return (
            <span
              key={i}
              className="bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100 px-0.5 rounded line-through"
            >
              {a}
              {i < lcs.length - 1 ? ' ' : ''}
            </span>
          );
        }
        return (
          <span
            key={i}
            className="bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100 px-0.5 rounded"
          >
            {b}
            {i < lcs.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </span>
  );
}

export const AuditDiff = memo(AuditDiffBase);
AuditDiff.displayName = 'AuditDiff';