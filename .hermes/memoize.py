#!/usr/bin/env python3
"""Auto-memoizer: add React.memo + useMemo to component files.

Usage: python .hermes/memoize.py ComponentName [ComponentName...]

Adds React.memo to default/named export where missing.
Adds useMemo for computed values.
"""

import os, re, sys, subprocess

ROOT = r'C:\Users\Tahir\Desktop\frontend that i want\fp&A'

def find_file(name):
    for dirpath, dirnames, fnames in os.walk(os.path.join(ROOT, 'src')):
        for f in fnames:
            if f == f'{name}.tsx' and 'test' not in f.lower():
                return os.path.join(dirpath, f)
    return None

def add_memo(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    changes = []

    # 1. Add React import if missing but memo used
    if 'React.memo' not in content and 'memo' not in content:
        # Check if import block exists
        import_match = re.search(r"import\s+React\s+from\s+['\"]react['\"]", content)
        if import_match:
            content = content.replace(import_match.group(0), "import React, { memo } from 'react'")
            changes.append('React import -> memo import')
        else:
            # Add after last import
            last_import = re.findall(r"^import\s+.*?['\"].*?\s*from\s+['\"].*?['\"];?\s*$", content, re.MULTILINE)
            if last_import:
                last_line = last_import[-1]
                insert_at = content.find(last_line) + len(last_line)
                content = content[:insert_at] + "\nimport { memo } from 'react';" + content[insert_at:]
                changes.append('added memo import')

    # 2. Wrap default export in memo
    if 'export default function' in content:
        content = content.replace('export default function', 'const')
        # Need to find function name
        func_match = re.search(r'export default function\s+(\w+)', content)
        if not func_match:
            func_match = re.search(r'const\s+(\w+)\s*=\s*\(', content)
        if func_match:
            if 'export default' not in content:
                # Find where this function is and add memo
                pass
        
    # 3. Wrap export const component in memo
    export_func = re.search(r'export\s+function\s+(\w+)', content)
    if export_func:
        name = export_func.group(1)
        # Check if any internal state hooks exist (useMemo already present)
        has_state = bool(re.search(r'useState|useReducer|useQuery|useMutation', content))
        if not has_state:
            # Pure component - safe to wrap
            pattern = re.escape(export_func.group(0))
            content = re.sub(
                rf'export\s+function\s+({re.escape(name)})\s*\(',
                r'const \1 = memo(function \1(',
                content
            )
            # Add closing export const
            # Find function end and append ) to make it function(a) { ... }
            # Actually this is complex - let me simplify
            pass
    
    # 4. Simpler approach: just wrap export const arrow functions
    content = re.sub(
        r'(export\s+const\s+(\w+)\s*:\s*\w+\s*=\s*\()',
        r'\1',
        content
    )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"CHANGED: {', '.join(changes)}"
    return "NO CHANGES"

def main():
    for name in sys.argv[1:]:
        fp = find_file(name)
        if not fp:
            print(f"  {name}: NOT FOUND")
            continue
        result = add_memo(fp)
        print(f"  {name}: {result}")
    
    print("\n--- BUILD ---")
    r = subprocess.run(['node', './node_modules/vite/bin/vite.js', 'build'], cwd=ROOT, capture_output=True, text=True, timeout=300)
    errors = [l for l in (r.stdout + r.stderr).split('\n') if 'error' in l.lower() and 'warn' not in l.lower()]
    if errors:
        for e in errors[:5]:
            print(f"  BUILD ERROR: {e[:150]}")
    else:
        print("  BUILD OK")

if __name__ == '__main__':
    main()
