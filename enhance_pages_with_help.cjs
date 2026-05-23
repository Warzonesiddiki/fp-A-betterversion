const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join('src', 'pages');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(PAGES_DIR).filter(f => f.endsWith('.tsx'));

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('HelpPanel')) return; // Already processed
  
  const fileName = path.basename(filePath, '.tsx');
  const dirName = path.basename(path.dirname(filePath));
  
  // Heuristic title
  let title = fileName.replace(/Page$/, '').replace(/([A-Z])/g, ' $1').trim();
  if (title === 'Dashboard') title = 'Financial Dashboard';
  
  // Imports
  let imports = `import { HelpPanel } from '@/components/ui/HelpPanel';\nimport { PAGE_HELP } from './_docs';\nimport { useLocation } from 'react-router-dom';`;
  // Clean up relative path for PAGE_HELP if in subdirectory
  const depth = filePath.split(path.sep).length - 3; // src/pages = 0, src/pages/auth = 1
  const dots = depth > 0 ? '../'.repeat(depth) : './';
  imports = `import { HelpPanel } from '@/components/ui/HelpPanel';\nimport { PAGE_HELP } from '${dots}_docs';\nimport { useLocation } from 'react-router-dom';`;

  if (!content.includes('import React')) {
    content = "import React, { useState, useEffect } from 'react';\n" + content;
  } else {
    content = content.replace(/import React, {([^}]+)}/, (match, group) => {
      if (!group.includes('useState')) group += ', useState';
      if (!group.includes('useEffect')) group += ', useEffect';
      return `import React, {${group}}`;
    });
  }

  content = imports + '\n' + content;

  // Injection
  const componentName = fileName;
  const injection = `
  const { pathname } = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — ${title}';
  }, []);
`;

  // Find the start of the function body
  const functionRegex = /export default function \w+\(\) {/;
  content = content.replace(functionRegex, (match) => match + injection);

  // Find where to put the help button. 
  // Look for <h1> or first <div> with class starting with p- or space-
  const headerRegex = /<h1[^>]*>([^<]+)<\/h1>/;
  if (content.match(headerRegex)) {
    content = content.replace(headerRegex, (match, h1Content) => {
      return `<div className="flex items-center justify-between mb-6">
        ${match}
        <button 
          onClick={() => setHelpOpen(true)} 
          className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
          aria-label="Help"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>`;
    });
  }

  // Add the HelpPanel before the last closing brace of the component (heuristic)
  const lastIndex = content.lastIndexOf(');');
  if (lastIndex !== -1) {
    const helpPanelComp = `
      <HelpPanel 
        title={PAGE_HELP[pathname]?.title || '${title} Help'} 
        sections={PAGE_HELP[pathname]?.sections || []} 
        isOpen={helpOpen} 
        onClose={() => setHelpOpen(false)} 
      />`;
    content = content.slice(0, lastIndex) + helpPanelComp + '\n    ' + content.slice(lastIndex);
  }

  fs.writeFileSync(filePath, content);
  console.log('Processed:', filePath);
});
