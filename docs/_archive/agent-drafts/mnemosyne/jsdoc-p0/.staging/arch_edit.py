path = 'docs/drafts/diagrams/ARCHITECTURE.md'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = '  MS <-.->|cross-tab<br/>storage event| TAB[Other Tabs]'
new_line = '  E -.->|test coverage<br/>8,334+ tests<br/>70 pre-existing fails<br/>(67 lucide mock + 3 real)| TC[Test Gate<br/>docs/drafts/athena/test-triage/]'

log_path = 'docs/drafts/mnemosyne/jsdoc-p0/.staging/arch_edit.log'
with open(log_path, 'w', encoding='utf-8') as f:
    f.write('found old: ' + str(old in content) + '\n')
    f.write('content len: ' + str(len(content)) + '\n')
    f.write('first 50 lines around tab:\n')
    idx = content.find('TAB[Other Tabs]')
    if idx > 0:
        f.write(repr(content[max(0,idx-100):idx+50]) + '\n')

if old in content:
    new_content = content.replace(old, old + '\n' + new_line, 1)
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(new_content)
    with open(log_path, 'a', encoding='utf-8') as f:
        f.write('INSERTED\n')
else:
    with open(log_path, 'a', encoding='utf-8') as f:
        f.write('NOT FOUND\n')
