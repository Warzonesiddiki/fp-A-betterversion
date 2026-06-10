const fs = require('fs');
let content = fs.readFileSync('src/components/allocations/AllocationPreview.tsx', 'utf8');

content = content.replace(/text-slate-500/g, 'text-[var(--text-secondary)]');
content = content.replace(/text-slate-400/g, 'text-[var(--text-secondary)]');
content = content.replace(/text-yellow-400/g, 'text-yellow-700 dark:text-yellow-400');
content = content.replace(/text-red-400/g, 'text-red-600 dark:text-red-400');
content = content.replace(/text-blue-400/g, 'text-blue-600 dark:text-blue-400');
content = content.replace(/text-blue-500/g, 'text-blue-700 dark:text-blue-500');
content = content.replace(/text-green-400/g, 'text-green-600 dark:text-green-400');
content = content.replace(/text-green-500/g, 'text-green-700 dark:text-green-500');

content = content.replace(
  'aria-label="Allocation Preview"',
  'aria-labelledby="allocation-preview-heading"'
);
content = content.replace(
  '<h3 className="text-sm font-semibold text-[var(--text-primary)]">Allocation Preview</h3>',
  '<h3 id="allocation-preview-heading" className="text-sm font-semibold text-[var(--text-primary)]">Allocation Preview</h3>'
);

fs.writeFileSync('src/components/allocations/AllocationPreview.tsx', content);
