const fs = require('fs');
const ts = require('typescript');
const path = require('path');

function fixProject() {
  const projectDir = path.resolve('C:\\\\Users\\\\Tahir\\\\Desktop\\\\frontend that i want\\\\fp&A');
  const configPath = ts.findConfigFile(
    projectDir,
    ts.sys.fileExists,
    'tsconfig.json'
  );
  
  if (!configPath) {
    throw new Error('Could not find a valid tsconfig.json.');
  }

  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    projectDir
  );

  console.log('Compiling project to find exact error spans...');
  const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
  const diagnostics = ts.getPreEmitDiagnostics(program);

  const errorsByFile = {};
  for (const diag of diagnostics) {
    if (diag.code === 2532 || diag.code === 18048) {
      if (diag.file) {
        const fileName = diag.file.fileName;
        if (!errorsByFile[fileName]) errorsByFile[fileName] = [];
        errorsByFile[fileName].push({
          start: diag.start,
          length: diag.length
        });
      }
    }
  }

  let totalFixes = 0;
  for (const [file, errors] of Object.entries(errorsByFile)) {
    if (!fs.existsSync(file)) continue;
    
    let code = fs.readFileSync(file, 'utf8');
    
    // Sort descending to not shift indices
    errors.sort((a, b) => b.start - a.start);
    
    let fixed = 0;
    for (const err of errors) {
      const endPos = err.start + err.length;
      const nextChars = code.substr(endPos, 2);
      
      if (!nextChars.startsWith('!') && !nextChars.startsWith('?.')) {
        code = code.substring(0, endPos) + '!' + code.substring(endPos);
        fixed++;
      }
    }
    
    if (fixed > 0) {
      fs.writeFileSync(file, code);
      totalFixes += fixed;
      console.log(`Fixed ${fixed} errors in ${file}`);
    }
  }
  
  console.log('Total TS2532/TS18048 fixes applied: ' + totalFixes);
}

fixProject();
