import os
import re

def fix_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match common patterns of duplicate React imports
    pattern = r"import React, \{ (.*?) \} from 'react';\nimport \{ (.*?) \} from 'react';"
    
    def merge_matches(match):
        items1 = [x.strip() for x in match.group(1).split(',')]
        items2 = [x.strip() for x in match.group(2).split(',')]
        all_items = sorted(list(set(items1 + items2)))
        return f"import React, {{ {', '.join(all_items)} }} from 'react';"

    new_content = re.sub(pattern, merge_matches, content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

root_dir = r"C:\Users\Tahir\Desktop\frontend that i want\src"
fixed_count = 0
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            if fix_imports(os.path.join(root, file)):
                fixed_count += 1
                print(f"Fixed: {file}")

print(f"Total fixed: {fixed_count}")
