#!/usr/bin/env python3
"""Safer memoizer v2: ADDITIVE only. Never modifies function body.

Strategy: add `export const Foo = memo(Foo)` after original definition.
Handles: export const, export function, export default function.

Usage: python .hermes/memoize-v2.py ComponentName [ComponentName...]
"""

import os, re, sys, subprocess

ROOT = r'C:\Users\Tahir\Desktop\frontend that i want\fp&A'

def find_file(name):
    for dirpath, dirnames, fnames in os.walk(os.path.join(ROOT, 'src')):
        for f in fnames:
            if f == f'{name}.tsx' and '.test.' not in f and '.stories.' not in f:
                return os.path.join(dirpath, f)
    return None

def memoize(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # Already memoized?
    if re.search(r'\bmemo\s*\(', content):
        return "NO CHANGES (already memoized)"

    # 1. Add memo import
    if 'memo' not in content:
        if 'import React' in content:
            content = content.replace("import React from 'react'", "import React, { memo } from 'react'")
        elif "import React from \"react\"" in content:
            content = content.replace('import React from "react"', 'import React, { memo } from "react"')
        else:
            # Add after last import
            imports = re.findall(r'^import\s+.*?["\'].*?;?\s*$', content, re.MULTILINE)
            if imports:
                last = imports[-1]
                idx = content.find(last) + len(last)
                content = content[:idx] + "\nimport { memo } from 'react';" + content[idx:]
            else:
                content = "import { memo } from 'react';\n" + content

    # 2. Find exported component names
    exports = []

    # export const Foo = (...)
    for m in re.finditer(r'export\s+const\s+(\w+)\s*[=:]', content):
        name = m.group(1)
        if not name.startswith('_') and name[0].isupper():
            exports.append(('named', name, m.start()))

    # export function Foo(...)
    for m in re.finditer(r'export\s+function\s+(\w+)\s*\(', content):
        name = m.group(1)
        if name[0].isupper():
            exports.append(('named', name, m.start()))

    # export default function Foo(...)
    for m in re.finditer(r'export\s+default\s+function\s+(\w+)\s*\(', content):
        name = m.group(1)
        exports.append(('default', name, m.start()))

    # export default (...)=> or export default ComponentName
    for m in re.finditer(r'export\s+default\s+(\w+)', content):
        name = m.group(1)
        if name != 'function' and name[0].isupper() and name not in [e[1] for e in exports]:
            exports.append(('default', name, m.start()))

    if not exports:
        return "NO CHANGES (no export found)"

    # 3. Add memo wrapping after original definition
    additions = []
    for etype, name, pos in exports:
        if etype == 'named':
            # Remove export keyword, keep definition, add memo export at end
            src_name = f"export const {name}"
            if src_name in content:
                content = content.replace(src_name, f"const {name}", 1)
                additions.append(f"\nexport const {name} = memo({name});")
        elif etype == 'default':
            src = f"export default function {name}"
            if src in content:
                content = content.replace(src, f"function {name}", 1)
                additions.append(f"\nexport default memo({name});")
            else:
                # export default Foo (where Foo is defined above)
                # Add memo wrapper
                content = content.replace(f"export default {name}", "", 1)
                additions.append(f"\nexport default memo({name});")

    if additions:
        content += ''.join(additions)

    if content == original:
        return "NO CHANGES"

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    return f"MEMOIZED: {', '.join(name for _, name, _ in exports)}"

def main():
    changed = 0
    skips = 0
    nf = 0
    for name in sys.argv[1:]:
        fp = find_file(name)
        if not fp:
            print(f"  {name}: NOT FOUND")
            nf += 1
            continue
        result = memoize(fp)
        if 'MEMOIZED' in result:
            print(f"  {name}: {result}")
            changed += 1
        else:
            skips += 1
    
    print(f"\nSUMMARY: {changed} memoized, {skips} skipped, {nf} not found")
    
    print("\n--- BUILD VERIFY ---")
    r = subprocess.run(['node', './node_modules/vite/bin/vite.js', 'build'], cwd=ROOT, capture_output=True, text=True, timeout=300)
    errors = [l for l in (r.stdout + r.stderr).split('\n') if 'error' in l.lower() and 'warn' not in l.lower()]
    if errors:
        for e in errors[:5]:
            print(f"  BUILD: {e[:150]}")
    else:
        print("  BUILD OK")

if __name__ == '__main__':
    main()
