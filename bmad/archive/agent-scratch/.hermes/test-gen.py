#!/usr/bin/env python3
"""Auto test generator: create RTL/Vitest test files for components without tests.

Usage: python .hermes/test-gen.py ComponentName [ComponentName...]

Generates a basic test skeleton that renders the component, checks existence.
Skips if test file already exists.
"""

import os, re, sys, subprocess, json

ROOT = r'C:\Users\Tahir\Desktop\frontend that i want\fp&A'

def find_file(name):
    for dirpath, dirnames, fnames in os.walk(os.path.join(ROOT, 'src')):
        for f in fnames:
            if f == f'{name}.tsx' and 'test' not in f.lower() and 'stories' not in f.lower():
                return os.path.join(dirpath, f)
    return None

def generate_test(filepath):
    """Generate a basic RTL test file for the component."""
    dirpath = os.path.dirname(filepath)
    basename = os.path.basename(filepath)
    name = basename.replace('.tsx', '')
    test_path = os.path.join(dirpath, f'{name}.test.tsx')
    
    if os.path.exists(test_path):
        return "EXISTS", test_path
    
    # Read component to find exported name
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find exported component names
    exports = re.findall(r'export\s+(?:function|const)\s+(\w+)', content)
    if not exports:
        exports = re.findall(r'export\s+default\s+(\w+)', content)
    if not exports:
        exports = [name]
    
    # Check for props interface
    props_types = re.findall(r'interface\s+(\w+Props)\b', content)
    props_types += re.findall(r'type\s+(\w+Props)\s*=', content)
    
    test_content = f"""import {{ render, screen }} from '@testing-library/react';
import {{ describe, it, expect }} from 'vitest';
"""
    
    # Determine import style (named vs default)
    if re.search(r'export\s+default\s+', content):
        test_content += f"""import {exports[0]} from './{name}';
"""
    else:
        test_content += f"""import {{ {', '.join(exports)} }} from './{name}';
"""
    
    test_content += f"""
describe('{name}', () => {{
  it('renders without crashing', () => {{
    const {{ container }} = render(<{exports[0]} />);
    expect(container).toBeDefined();
  }});
}});
"""
    
    with open(test_path, 'w', encoding='utf-8') as f:
        f.write(test_content)
    
    return "GENERATED", test_path

def main():
    added = 0
    existed = 0
    not_found = 0
    
    for name in sys.argv[1:]:
        fp = find_file(name)
        if not fp:
            print(f"  {name}: NOT FOUND")
            not_found += 1
            continue
        
        status, path = generate_test(fp)
        if status == "GENERATED":
            print(f"  {name}: GENERATED -> {os.path.relpath(path, ROOT)}")
            added += 1
        elif status == "EXISTS":
            print(f"  {name}: EXISTS ({os.path.relpath(path, ROOT)})")
            existed += 1
    
    print(f"\nSUMMARY: {added} generated, {existed} existed, {not_found} not found")

if __name__ == '__main__':
    main()
