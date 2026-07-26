#!/usr/bin/env python3
"""
Auto-fix SafeMathParser.ts - add ?? 0 to all args[n] accesses in FUNCTIONS registry.
"""

import re

def fix_safe_math_parser(filepath: str) -> int:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    fixes = 0
    
    # Pattern: args[n] where n is a number, in the FUNCTIONS registry
    # Replace args[n] with args[n] ?? 0
    # But be careful not to double-fix (already has ?? 0)
    
    # Find all args[n] patterns that don't already have ??
    # This regex matches args[0], args[1], etc. not followed by ??
    pattern = r'(args\[(\d+)\])(?!\s*\?\?)'
    
    def replace_args(match):
        nonlocal fixes
        fixes += 1
        return f'{match.group(1)} ?? 0'
    
    # Apply to FUNCTIONS registry section only (between FUNCTIONS: { and the next major section)
    # Find the FUNCTIONS object
    functions_start = content.find('const FUNCTIONS: Record<string, FuncImpl> = {')
    if functions_start == -1:
        print("FUNCTIONS registry not found")
        return 0
    
    # Find the end of FUNCTIONS object (next const/export/interface at same indent)
    # This is tricky - let's just process the whole file but be careful
    # Actually, let's only process lines that look like function implementations
    
    lines = content.split('\n')
    new_lines = []
    in_functions = False
    
    for line in lines:
        stripped = line.strip()
        # Detect start of FUNCTIONS
        if 'const FUNCTIONS:' in line:
            in_functions = True
        # Detect end of FUNCTIONS (next major declaration)
        elif in_functions and (stripped.startswith('const ') or stripped.startswith('export ') or stripped.startswith('interface ') or stripped.startswith('type ') or stripped.startswith('// ===')):
            # Check if this is the end of the FUNCTIONS object
            # The FUNCTIONS object ends with a closing brace at column 0
            if stripped == '};' or stripped.startswith('};'):
                in_functions = False
        
        if in_functions:
            # Replace args[n] with args[n] ?? 0
            new_line = re.sub(pattern, replace_args, line)
            new_lines.append(new_line)
        else:
            new_lines.append(line)
    
    new_content = '\n'.join(new_lines)
    
    if new_content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {fixes} args[n] accesses in SafeMathParser.ts")
    else:
        print("No changes made")
    
    return fixes

if __name__ == '__main__':
    fix_safe_math_parser(r'C:\Users\Tahir\Desktop\frontend that i want\fp&A\src\engines\SafeMathParser.ts')