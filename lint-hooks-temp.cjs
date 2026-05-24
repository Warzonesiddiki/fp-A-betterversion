const { ESLint } = require('eslint');

async function main() {
  const eslint = new ESLint({
    cwd: __dirname,
    overrideConfig: {
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
      },
    },
  });

  const results = await eslint.lintFiles(['src/**/*.{ts,tsx}']);

  const hookIssues = [];
  for (const result of results) {
    const filePath = result.filePath.replace(/.*\\src\\/, 'src\\');
    for (const msg of result.messages) {
      if (msg.ruleId && msg.ruleId.includes('react-hooks')) {
        hookIssues.push({
          file: filePath,
          line: msg.line,
          column: msg.column,
          severity: msg.severity === 2 ? 'error' : 'warn',
          message: msg.message,
          ruleId: msg.ruleId,
        });
      }
    }
  }

  hookIssues.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

  console.log(`Found ${hookIssues.length} react-hooks issues:\n`);
  for (const issue of hookIssues) {
    console.log(`${issue.file}:${issue.line}:${issue.column} [${issue.severity}] ${issue.message} (${issue.ruleId})`);
  }

  const byFile = {};
  for (const issue of hookIssues) {
    if (!byFile[issue.file]) byFile[issue.file] = { errors: 0, warnings: 0 };
    if (issue.severity === 'error') byFile[issue.file].errors++;
    else byFile[issue.file].warnings++;
  }

  console.log(`\n--- Summary (top 15 files) ---`);
  const sorted = Object.entries(byFile).sort((a, b) => (b[1].errors + b[1].warnings) - (a[1].errors + a[1].warnings));
  for (const [file, counts] of sorted.slice(0, 15)) {
    console.log(`${file}: ${counts.errors} error(s), ${counts.warnings} warning(s)`);
  }
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});
