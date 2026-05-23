const fs = require('fs');
const path = require('path');

const HOOKS_DIR = path.join('src', 'hooks');
const COMPONENTS_DIR = path.join('src', 'components');

const dirs = [
  HOOKS_DIR,
  path.join(COMPONENTS_DIR, 'dashboard'),
  path.join(COMPONENTS_DIR, 'budgets'),
  path.join(COMPONENTS_DIR, 'analytics'),
  path.join(COMPONENTS_DIR, 'variance'),
  path.join(COMPONENTS_DIR, 'reports'),
  path.join(COMPONENTS_DIR, 'scenarios'),
  path.join(COMPONENTS_DIR, 'settings'),
  path.join(COMPONENTS_DIR, 'data'),
  path.join(COMPONENTS_DIR, 'saas'),
  path.join(COMPONENTS_DIR, 'manufacturing'),
  path.join(COMPONENTS_DIR, 'finance'),
  path.join(COMPONENTS_DIR, 'esg'),
  path.join(COMPONENTS_DIR, 'treasury'),
  path.join(COMPONENTS_DIR, 'workforce'),
  path.join(COMPONENTS_DIR, 'retail'),
  path.join(COMPONENTS_DIR, 'realestate'),
  path.join(COMPONENTS_DIR, 'construction'),
  path.join(COMPONENTS_DIR, 'insurance'),
];

dirs.forEach(dir => {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx')).filter(f => f !== 'index.ts');
  const indexContent = files.map(f => {
    const name = f.replace(/\.(ts|tsx)$/, '');
    return "export * from './" + name + "';";
  }).join('\n');
  
  fs.writeFileSync(path.join(dir, 'index.ts'), indexContent);
  console.log('Generated index.ts for:', dir);
});
