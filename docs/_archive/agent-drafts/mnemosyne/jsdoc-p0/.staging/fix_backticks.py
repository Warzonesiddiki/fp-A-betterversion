import re

path = 'docs/drafts/CHANGELOG.md'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the triple-backtick rendering issue - replace '```text```' with '`text`'
new_content = re.sub(r'```([^\n`]+?)```', r'`\1`', content)
count = (content.count('```') - new_content.count('```')) // 2
print('replaced:', count, 'triple-backtick pairs')
with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(new_content)
