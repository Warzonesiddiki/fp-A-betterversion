import re
import sys

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Match the wrong pattern: lazy(() => import('PATH' as unknown as Promise<{ default: any }>));
wrong = re.compile(r"lazy\(\(\) => import\('([^']+)' as unknown as Promise<\{ default: any \}\}>\)\);")

def replace(m):
    return f"lazy(() => import('{m.group(1)}') as any);"

new_content = wrong.sub(replace, content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Wrong pattern count after fix: {new_content.count('as unknown as Promise')}")
print(f"Correct pattern count: {new_content.count('as any);')}")
