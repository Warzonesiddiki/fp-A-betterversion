#!/usr/bin/env python3
"""
Auto-fix TypeScript noUncheckedIndexedAccess in engine files.
Pattern: array[index] -> array[index] ?? 0 (for numeric contexts)
"""

import re
from pathlib import Path

def fix_engine_file(filepath: Path) -> int:
    content = filepath.read_text(encoding='utf-8')
    original = content
    fixes = 0

    # Pattern 1: Double array access matrix[i][j] -> matrix[i][j] ?? 0
    pattern1 = r'(\w+)\[(\w+|[0-9]+)\]\[(\w+|[0-9]+)\]'
    def repl1(m):
        nonlocal fixes
        # Check if already has ??
        start = m.start()
        end = m.end()
        following = content[end:end+10]
        if '??' in following or '?\?' in following:
            return m.group(0)
        fixes += 1
        return f'{m.group(1)}[{m.group(2)}][{m.group(3)}] ?? 0'

    # Pattern 2: Single array access arr[i] -> arr[i] ?? 0
    # But only in calculation contexts (loops, math operations)
    pattern2 = r'(\w+)\[(\w+|[0-9]+)\]'
    def repl2(m):
        nonlocal fixes
        # Skip if already has ?? or optional chaining
        start = m.start()
        end = m.end()
        preceding = content[max(0,start-20):start]
        following = content[end:end+10]
        if '??' in following or '?\?' in following or '?.' in preceding:
            return m.group(0)
        # Only fix if in a math context (+=, -=, *=, /=, =, return, Math., sum, total)
        context = content[max(0,start-50):end+50]
        math_keywords = ['+=', '-=', '*=', '/=', '= ', 'return ', 'Math.', 'sum', 'total', 'acc', 'result', 'value', 'calc']
        if any(kw in context for kw in math_keywords):
            fixes += 1
            return f'{m.group(1)}[{m.group(2)}] ?? 0'
        return m.group(0)

    # Apply pattern 1 first (double access)
    content = re.sub(pattern1, repl1, content)
    # Apply pattern 2 (single access)
    content = re.sub(pattern2, repl2, content)

    if content != original:
        filepath.write_text(content, encoding='utf-8')
        print(f"  {filepath.name}: {fixes} fixes")
    return fixes

def main():
    root = Path(r'C:\Users\Tahir\Desktop\frontend that i want\fp&A')
    engines_dir = root / 'src' / 'engines'

    engine_files = [
        'SafeMathParser.ts',
        'ForecastMethodEngine.ts',
        'MonteCarloEngine.ts',
        'SolverEngine.ts',
        'ReportBuilderEngine.ts',
        'FormulaEngine.ts',
        'ValidationEngine.ts',
        'AllocationEngine.ts',
        'YieldCurveEngine.ts',
        'AnomalyDetectionEngine.ts',
        'CubeEngine.ts',
        'NLQEngine.ts',
        'FinancialInstrumentsEngine.ts',
    ]

    total_fixes = 0
    for fname in engine_files:
        fpath = engines_dir / fname
        if fpath.exists():
            total_fixes += fix_engine_file(fpath)
        else:
            print(f"  {fname}: NOT FOUND")

    print(f"\nTotal fixes: {total_fixes}")

if __name__ == '__main__':
    main()