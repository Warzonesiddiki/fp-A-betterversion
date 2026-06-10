#!/usr/bin/env python3
"""
Fix remaining SafeMathParser.ts errors:
1. const [a, b, c] = args -> const [a = 0, b = 0, c = 0] = args (default values)
2. args[[...]] double brackets
3. Remaining args[N] patterns with spaces
"""
import re

PATH = "C:\\Users\\Tahir\\Desktop\\frontend that i want\\fp&A\\src\\engines\\SafeMathParser.ts"

with open(PATH, 'r') as f:
    lines = f.readlines()

count = 0

new_lines = []
for line in lines:
    # Fix 1: const [a, b, c] = args  (no defaults, no type annotation)
    # -> const [a = 0, b = 0, c = 0] = args
    m = re.match(r'^(\s*const\s*\[)([a-zA-Z\s,]+)(\]\s*=\s*args\s*;\s*)$', line)
    if m:
        vars_list = [v.strip() for v in m.group(2).split(',')]
        vars_with_defaults = [f'{v} = 0' for v in vars_list]
        new_line = f"{m.group(1)}{', '.join(vars_with_defaults)}{m.group(3)}\n"
        new_lines.append(new_line)
        if new_line != line:
            count += 1
            if count <= 5:
                print(f"  {line.strip()} -> {new_line.strip()}")
        continue
    
    # Fix 2: args[argIdx] where argIdx is used as index - add !
    # Pattern: args[args[i]] or similar
    line = re.sub(r'args\[(\w+)\]', r'args[\1]!', line)
    
    # Fix 3: Remaining args[N] followed by space then operator
    # BUT NOT if already has !
    line = re.sub(r'(?<!\!)args\[(\w+)\](\s*[+\-*/%])', r'args[\1]!\2', line)
    line = re.sub(r'(?<!\!)args\[(\w+)\](\s*===\s)', r'args[\1]!\2', line)
    line = re.sub(r'(?<!\!)args\[(\w+)\](\s*!==\s)', r'args[\1]!\2', line)
    line = re.sub(r'(?<!\!)args\[(\w+)\](\s*<\s)', r'args[\1]!\2', line)
    line = re.sub(r'(?<!\!)args\[(\w+)\](\s*>\s)', r'args[\1]!\2', line)
    line = re.sub(r'(?<!\!)args\[(\w+)\](\s*<=\s)', r'args[\1]!\2', line)
    line = re.sub(r'(?<!\!)args\[(\w+)\](\s*>=\s)', r'args[\1]!\2', line)
    
    new_lines.append(line)

new_content = ''.join(new_lines)

with open(PATH, 'w') as f:
    f.write(new_content)

print(f"Total fixes: {count}")
