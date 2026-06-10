#!/usr/bin/env python3
"""
Surgical fix for specific error lines in engine files.
Reads TypeScript errors and fixes only those specific lines.
"""

import re
from pathlib import Path

def fix_specific_errors():
    root = Path(r'C:\Users\Tahir\Desktop\frontend that i want\fp&A')

    # Get current errors
    result = __import__('subprocess').run(
        ['node', 'node_modules/typescript/bin/tsc', '--noEmit'],
        cwd=root, capture_output=True, text=True, timeout=180
    )
    errors_text = result.stdout + result.stderr

    # Parse engine errors only
    engine_errors = []
    for line in errors_text.strip().split('\n'):
        if 'error TS' in line and 'src/engines/' in line and '.test.' not in line:
            match = re.search(r'(src/engines/[^:]+):(\d+):(\d+): error (TS\d+): (.+)', line)
            if match:
                engine_errors.append({
                    'file': match.group(1),
                    'line': int(match.group(2)),
                    'col': int(match.group(3)),
                    'code': match.group(4),
                    'msg': match.group(5)
                })

    print(f"Engine errors: {len(engine_errors)}")

    # Group by file
    from collections import defaultdict
    by_file = defaultdict(list)
    for e in engine_errors:
        if e['code'] in ('TS2532', 'TS18048', 'TS2345', 'TS2322'):
            by_file[e['file']].append(e)

    # Fix each file
    for fpath_str, errs in by_file.items():
        fpath = root / fpath_str
        if not fpath.exists():
            continue

        content = fpath.read_text(encoding='utf-8')
        lines = content.split('\n')
        fixes = 0

        for err in errs:
            line_idx = err['line'] - 1
            if line_idx >= len(lines):
                continue
            line = lines[line_idx]

            # Skip if already fixed
            if '??' in line or '?.' in line:
                continue

            # Fix pattern: arr[i] -> arr[i] ?? 0 (but not arr[0], arr[1], etc.)
            # Only fix if index is a variable (letter), not a number
            new_line = re.sub(
                r'(\w+)\[([a-zA-Z_]\w*(?:\s*[+\-*/]\s*[a-zA-Z_]\w*)*)\]',
                lambda m: f'{m.group(1)}[{m.group(2)}] ?? 0' if '??' not in m.group(0) else m.group(0),
                line
            )

            # Also fix: obj[key] -> obj[key] ?? 0
            new_line = re.sub(
                r'(\w+)\[([a-zA-Z_]\w*)\]',
                lambda m: f'{m.group(1)}[{m.group(2)}] ?? 0' if '??' not in m.group(0) and not m.group(0).endswith(']') else m.group(0),
                new_line
            )

            if new_line != line:
                lines[line_idx] = new_line
                fixes += 1
                print(f"  {fpath.name}:{err['line']} {err['code']} -> fixed")

        if fixes > 0:
            fpath.write_text('\n'.join(lines), encoding='utf-8')
            print(f"  {fpath.name}: {fixes} fixes applied")

    print("Done")

if __name__ == '__main__':
    fix_specific_errors()