#!/usr/bin/env python3
"""
Auto-fix TypeScript noUncheckedIndexedAccess errors in financial calculation engines.
Patterns to fix:
1. array[i][j] -> array[i][j] ?? 0 (in calculation loops)
2. obj[key] -> obj[key] ?? defaultValue
3. map.get(key) -> map.get(key) ?? defaultValue
4. element?.property -> element?.property ?? defaultValue
"""

import re
from pathlib import Path

def fix_file(filepath: Path) -> int:
    content = filepath.read_text(encoding='utf-8')
    original = content
    fixes = 0

    # Pattern 1: Double array access in calculation engines
    # tableau[i][j] -> tableau[i][j] ?? 0
    # But only in specific contexts (math engines)
    
    # Pattern 2: Single array access
    # arr[i] -> arr[i] ?? 0
    
    # Pattern 3: Object key access
    # obj[key] -> obj[key] ?? default
    
    # Since we can't safely auto-fix all cases without semantic understanding,
    # we'll identify files that need manual review
    
    return 0

def main():
    root = Path(r'C:\Users\Tahir\Desktop\frontend that i want\fp&A')
    
    # Read current errors
    with open(root / 'tsc_errors.txt', 'r') as f:
        errors_text = f.read()
    
    # Parse non-test errors - handle both formats (with or without line numbers from read_file)
    non_test_errors = []
    for line in errors_text.strip().split('\n'):
        if 'error TS' in line and '.test.' not in line:
            # Try format: src/file.ts(123,45): error TS1234: message
            match = re.search(r'(src[^:]+)\(\d+,\d+\): error (TS\d+): (.+)', line)
            if not match:
                # Try format with line numbers prefix: 123|src/file.ts(123,45): error TS1234: message
                match = re.search(r'\d+\|(src[^:]+)\(\d+,\d+\): error (TS\d+): (.+)', line)
            if match:
                non_test_errors.append({
                    'file': match.group(1),
                    'line': 0,
                    'code': match.group(2),
                    'message': match.group(3)
                })
    
    print(f"Non-test errors: {len(non_test_errors)}")
    
    # Group by file
    from collections import defaultdict
    by_file = defaultdict(list)
    for e in non_test_errors:
        by_file[e['file']].append(e)
    
    # Show top files
    for f, errs in sorted(by_file.items(), key=lambda x: -len(x[1]))[:30]:
        codes = defaultdict(int)
        for e in errs:
            codes[e['code']] += 1
        code_str = ', '.join(f'{k}:{v}' for k,v in sorted(codes.items()))
        print(f"  {f}: {len(errs)} errors ({code_str})")

if __name__ == '__main__':
    main()