const fs = require('fs');
const path = require('path');

const storeDir = path.join(__dirname, 'src', 'store');
const files = fs.readdirSync(storeDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(storeDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes("import { produce } from 'immer';")) {
    content = content.replace(/import \{ produce \} from 'immer';\n?/g, '');
    
    // We'll replace common `produce((state: SomeState) => { ... })` with manual mapping.
    // It's safer to just do it manually for 8 files. Let's just output the files that need manual editing.
    console.log(`Needs manual edit: ${file}`);
  }
}
