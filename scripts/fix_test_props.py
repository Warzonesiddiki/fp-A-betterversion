#!/usr/bin/env python3
import os, re, json, subprocess, sys
from collections import defaultdict

def run_tsc():
    result = subprocess.run(['npx', 'tsc', '--noEmit'], capture_output=True, text=True, cwd=r'C:\Users\Tahir\Desktop\frontend that i want\fp&A')
    return result.stdout, result.stderr, result.returncode

def parse_errors(output):
    pattern = r'^(.*?)\((\d+),(\d+)\): error TS\d+: .*$'
    errors = []
    for line in output.split('\\n'):
        match = re.match(pattern, line)
        if match:
            file_path = match.group(1)
            line_num = int(match.group(2))
            col_num = int(match.group(3))
            message = line[match.end():].strip()
            errors.append({
                'file': file_path,
                'line': line_num,
                'col': col_num,
                'message': message,
                'raw': line
            })
    return errors

def guess_default(prop_name):
    lower = prop_name.lower()
    if any(k in lower for k in ['value', 'text', 'label', 'placeholder', 'title', 'name', 'id', 'key', 'url', 'src', 'href']):
        return '""'
    if any(k in lower for k in ['count', 'number', 'index', 'size', 'length', 'width', 'height', 'score', 'rating']):
        return '0'
    if any(k in lower for k in ['flag', 'enabled', 'visible', 'is', 'has', 'should', 'allow', 'require']):
        return 'false'
    if 'ref' in lower:
        return 'null'
    if any(k in lower for k in ['handler', 'callback', 'on', 'listener']):
        return '() => {}'
    if any(k in lower for k in ['list', 'array', 'items', 'collection']):
        return '[]'
    if any(k in lower for k in ['obj', 'object', 'map', 'dict', 'data', 'config', 'options', 'props']):
        return '{}'
    return 'undefined'

def main():
    if len(sys.argv) < 2:
        print("Usage: fix_test_props.py '<json array of file paths>'")
        sys.exit(1)
    files = json.loads(sys.argv[1])
    print(f"Fixing {len(files)} files")
    stdout, stderr, rc = run_tsc()
    if rc not in (0, 1):
        print("Error running tsc:", stderr)
        sys.exit(1)
    all_errors = parse_errors(stdout)
    target_errors = [e for e in all_errors if e['file'].endswith('.test.tsx') and ('TS2739' in e['raw'] or 'TS2741' in e['raw'])]
    file_errors = defaultdict(list)
    for err in target_errors:
        file_errors[err['file']].append(err)
    file_errors = {f: errs for f, errs in file_errors.items() if f in files}
    print(f"Found errors in {len(file_errors)} of the given files")
    for file_path, errs in file_errors.items():
        print(f"Processing {file_path} with {len(errs)} errors")
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        line_to_props = defaultdict(list)
        for err in errs:
            msg = err['message']
            if 'is missing the following properties from type' in msg and ':' in msg:
                props_part = msg.split(':', 1)[1].strip()
                missing_props = [p.strip() for p in props_part.split(',')]
                line_idx = err['line'] - 1
                line_to_props[line_idx].extend(missing_props)
        for line_idx in sorted(line_to_props.keys(), reverse=True):
            if line_idx < 0 or line_idx >= len(lines):
                continue
            line = lines[line_idx]
            match = re.search(r'<([A-Z][a-zA-Z0-9]*)(\s[^>]*)?(\s*/?>|>)', line)
            if not match:
                continue
            tag = match.group(1)
            attrs = match.group(2) or ''
            closing = match.group(3)
            is_self_closing = closing.strip() == '/>'
            new_attrs = attrs
            for prop in line_to_props[line_idx]:
                default = guess_default(prop)
                new_attrs += f' {prop}={{{default}}}'
            if is_self_closing:
                new_line = line[:match.start()] + f'<{tag}{new_attrs} />' + line[match.end():]
            else:
                new_line = line[:match.start()] + f'<{tag}{new_attrs}>' + line[match.end():]
            lines[line_idx] = new_line
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print(f"  Fixed {len(line_to_props)} lines in {file_path}")
    print("Done")

if __name__ == '__main__':
    main()