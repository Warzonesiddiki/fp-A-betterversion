// Fix App.tsx lazy() pattern errors
const fs = require('fs');
const path = 'src/App.tsx';

const content = fs.readFileSync(path, 'utf-8');
console.log(`File size: ${content.length} chars`);
console.log(`Lazy count before: ${(content.match(/lazy\(\(\) =>/g) || []).length}`);
console.log(`Wrong pattern count before: ${(content.match(/as unknown as Promise/g) || []).length}`);

// Pattern to match: lazy(() => import('PATH' as unknown as Promise<{ default: any }>));
const wrongPattern = /lazy\(\(\) => import\('([^']+)' as unknown as Promise<\{ default: any \}\}>\)\);/g;

let count = 0;
const newContent = content.replace(wrongPattern, (match, p1) => {
  count++;
  return `lazy(() => import('${p1}') as any)`;
});

fs.writeFileSync(path, newContent);

console.log(`Replaced ${count} lazy() calls`);
console.log(`Wrong pattern count after: ${(newContent.match(/as unknown as Promise/g) || []).length}`);
console.log(`Correct pattern count after: ${(newContent.match(/as any\)/g) || []).length}`);
