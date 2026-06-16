import re
import sys

with open('src/App.tsx', 'rb') as f:
    raw = f.read()

with open('/tmp/app_diag.txt', 'w') as f:
    f.write(f"File size: {len(raw)}\n")
    f.write(f"CRLF count: {raw.count(b'\\r\\n')}\n")
    f.write(f"Has wrong pattern: {b'as unknown as Promise' in raw}\n")
    f.write(f"Has correct pattern: {b'as any);' in raw}\n")
    f.write(f"Lazy count: {raw.count(b'lazy(() =>')}\n")
    f.write(f"Bytes around lazy: {raw[raw.find(b'lazy'):raw.find(b'lazy')+200]}\n")
