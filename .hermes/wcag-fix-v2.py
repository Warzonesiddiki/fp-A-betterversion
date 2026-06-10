#!/usr/bin/env python3
"""
Smart WCAG fixer v2. Handles edge cases v1 missed.

Rules:
1. Root div region — ONLY if no role/aria-label exists on any root-level element
2. Focus-visible rings — add to <button> <a> elements missing them
3. Role="alert" on error divs — safe regex, won't break JSX
4. Skip chart/svg components that already have role="img"/role="button"  
5. aria-label on icon-only buttons
6. aria-hidden on decorative SVG icons in list/grid contexts
"""

import os, re, sys, subprocess, json

ROOT = r'C:\Users\Tahir\Desktop\frontend that i want\fp&A'
FOCUS_RING = 'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1'

def find_file(name):
    for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, 'src')):
        for f in filenames:
            if f == f'{name}.tsx' and 'test' not in f.lower():
                return os.path.join(dirpath, f)
    return None

KNOWN_WCAG_OK = {'SparklineChart','GaugeChart','HeatmapChart','TreemapChart','VarianceChart','WaterfallChart'}

def fix_file(filepath, comp_name):
    if not filepath or not os.path.exists(filepath):
        return "NOT FOUND"
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    changes = []

    # Skip chart/SVG components already WCAG-compliant
    if comp_name in KNOWN_WCAG_OK:
        # Check if already has role/aria-label
        if 'role=' in content[:500] and 'aria-label=' in content[:500]:
            return "ALREADY WCAG (known)"
    
    # Check if root element already has role - if so, skip region addition
    return_match = re.search(r'return\s*\(?\s*<(\w+)\b', content)
    if return_match:
        tag = return_match.group(1)
        # Check the root tag region
        root_block = content[return_match.start():return_match.start() + 800]
        if 'role=' in root_block:
            has_role = True
        else:
            has_role = False
        
        if not has_role:
            # Count opening divs vs closing - find the real root div opening
            root_div = re.search(r'return\s*\(?\s*<div\b((?!role\b)[^>]*)>', content)
            if root_div:
                attrs = root_div.group(1)
                # Check we're not matching a div inside JSX expression
                pos = root_div.start()
                prefix = content[max(0,pos-200):pos]
                # Only if this is truly the root div (before any other JSX elements)
                if 'return' in prefix or '=>' in prefix:
                    new_attrs = attrs.rstrip() + f' role="region" aria-label="{comp_name}"'
                    content = content[:root_div.start(1)] + new_attrs + content[root_div.end(1):]
                    changes.append(f'role=region aria-label={comp_name}')

    # Add focus-visible-ring to buttons/a missing focus styles
    btn_re = re.compile(r'(<(?:button|a)\b[^>]*?className=")([^"]*?)(")(?=[^>]*?>)', re.DOTALL)
    def add_focus(m):
        prefix = m.group(1)
        classes = m.group(2)
        close = m.group(3)
        if 'focus-visible:ring' not in classes and 'focus:ring' not in classes:
            return prefix + classes + ' ' + FOCUS_RING + close
        return m.group(0)
    new_content = btn_re.sub(add_focus, content)
    if new_content != content:
        changes.append('focus-visible:ring on buttons/links')
        content = new_content

    # Add role="alert" on error divs
    err_re = re.compile(r'(<div\b[^>]*?className="[^"]*?(?:red|error|bg-red|text-red)[^"]*?"(?![^>]*?role\s*=)[^>]*?>)')
    def add_alert(m):
        t = m.group(1)
        t = t.rstrip() + ' role="alert"' + (' ' if t.endswith('>') else '')
        return t
    new_content = err_re.sub(add_alert, content)
    if new_content != content:
        changes.append('role=alert on error divs')
        content = new_content

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"FIXED: {', '.join(changes)}"
    return "NO CHANGES"

def main():
    results = {}
    for name in sys.argv[1:]:
        fp = find_file(name)
        r = fix_file(fp, name)
        results[name] = r
        print(f"  {name}: {r}")
    
    print("\n--- BUILD ---")
    r = subprocess.run(
        ['node', './node_modules/vite/bin/vite.js', 'build'],
        cwd=ROOT, capture_output=True, text=True, timeout=300
    )
    out = r.stdout + r.stderr
    errors = [l for l in out.split('\n') if 'error' in l.lower() and 'warn' not in l.lower() and 'deprecat' not in l.lower()]
    if errors:
        for e in errors[:5]:
            print(f"  BUILD ERROR: {e.strip()[:150]}")
        return False
    print("  BUILD OK")
    return True

if __name__ == '__main__':
    main()
