const { execSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname);
process.chdir(projectRoot);
console.log('CWD:', process.cwd());

// Try build
try {
  const out = execSync('node node_modules/vite/bin/vite.js build 2>&1', {
    cwd: projectRoot,
    shell: true,
    timeout: 120000,
    maxBuffer: 10 * 1024 * 1024
  });
  console.log('=== BUILD OUTPUT ===');
  console.log(out.toString());
  console.log('=== BUILD EXIT: 0 ===');
} catch (e) {
  console.log('=== BUILD OUTPUT ===');
  console.log(e.stdout?.toString() || '');
  console.log(e.stderr?.toString() || '');
  console.log('=== BUILD EXIT:', e.status, '===');
}
