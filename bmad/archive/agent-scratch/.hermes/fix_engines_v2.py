#!/usr/bin/env python3
"""
Smart auto-fix TypeScript noUncheckedIndexedAccess.
Only fix: arr[variable] -> arr[variable] ?? 0
Skip: arr[0], arr[1], arr[constant] (numeric literals)
"""

import re
from pathlib import Path

def fix_file(filepath: Path) -> int:
    content = filepath.read_text(encoding='utf-8')
    original = content
    fixes = 0

    # Pattern: array[variable] where variable is NOT a numeric literal
    # Match: identifier[identifier] or identifier[expression]
    # Skip: identifier[0], identifier[1], identifier[123]
    pattern = r'(\b\w+)\[(\s*(?![0-9]+\s*\])\w+(?:\s*[+\-*/]\s*\w+)*\s*)\]'

    def repl(m):
        nonlocal fixes
        full = m.group(0)
        arr = m.group(1)
        idx = m.group(2).strip()

        # Check context around match
        start = m.start()
        end = m.end()

        # Skip if already has ?? or ?. or is in a string/comment
        preceding = content[max(0, start-30):start]
        following = content[end:end+30]

        if '??' in following or '??' in preceding[-10:]:
            return full
        if '?.' in preceding[-10:]:
            return full

        # Check if in math context
        context = content[max(0, start-60):end+60]
        math_context = any(kw in context for kw in [
            '+=', '-=', '*=', '/=', '= ', 'return ', 'Math.',
            'sum', 'total', 'acc', 'result', 'value', 'calc',
            'reduce', 'map', 'forEach', 'filter', 'min', 'max'
        ])

        if not math_context:
            return full

        # Skip if idx is a simple property access like .length
        if '.' in idx:
            return full

        fixes += 1
        return f'{arr}[{idx}] ?? 0'

    content = re.sub(pattern, repl, content)

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
            total_fixes += fix_file(fpath)
        else:
            print(f"  {fname}: NOT FOUND")

    print(f"\nTotal fixes: {total_fixes}")

if __name__ == '__main__':
    main()