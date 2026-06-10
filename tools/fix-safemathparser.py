#!/usr/bin/env python3
"""
Safe fix for SafeMathParser.ts — add ! after args[N] array accesses.
AVOIDS: ?? operator, ?., and already-fixed patterns.
"""
import re

PATH = "C:\\Users\\Tahir\\Desktop\\frontend that i want\\fp&A\\src\\engines\\SafeMathParser.ts"

with open(PATH, 'r') as f:
    content = f.read()

# Patterns: add ! after args[N] when followed by a "follow" character
# CRITICAL: negative lookbehind for existing !, negative lookahead for ?? and ?.
patterns = [
    # args[0].member  — NOT already having ! before .
    (r'args\[(\d+)\](?!\!)\.', lambda m: f'args[{m.group(1)}]!.'),

    # args[0])  at close paren
    (r'args\[(\d+)\](?!\!)\)', lambda m: f'args[{m.group(1)}]!)'),

    # args[0],  at comma
    (r'args\[(\d+)\](?!\!)\,', lambda m: f'args[{m.group(1)}]!,'),

    # args[0] followed by operator (+ - * / % < > = ! & | ^)
    # BUT NOT followed by ? (which would be ?? or ?.)
    (r'args\[(\d+)\](?!\!)(\s+[+\-*/%<>=!&|^])', lambda m: f'args[{m.group(1)}]!{m.group(2)}'),

    # args[0]; at end of statement (assignment)
    (r'=\s*args\[(\d+)\](?!\!)\s*;?\s*$', lambda m: f'= args[{m.group(1)}]!;'),

    # args[0]; before closing brace or comma (const x = args[0];,...)
    (r'=\s*args\[(\d+)\](?!\!)\s*;', lambda m: f'= args[{m.group(1)}]!;'),

    # args[0] : (ternary)
    (r'args\[(\d+)\](?!\!)(\s*:\s)', lambda m: f'args[{m.group(1)}]!{m.group(2)}'),

    # args[0] (end of ternary or expression)
    (r'args\[(\d+)\](?!\!)(\s*\?\s)', lambda m: f'args[{m.group(1)}]!{m.group(2)}'),
]

count = 0
for p, repl in patterns:
    new_content, n = re.subn(p, repl, content)
    count += n
    content = new_content

with open(PATH, 'w') as f:
    f.write(content)

print(f'Total: {count} fixes')
