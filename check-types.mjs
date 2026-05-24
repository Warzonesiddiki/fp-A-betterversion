import ts from 'typescript';

const program = ts.createProgram({
  rootNames: ['src/utils/tokenRotation.test.ts'],
  options: {
    strict: true,
    noEmit: true,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.ReactJsx,
    baseUrl: '.',
    paths: { '@/*': ['src/*'] },
    allowImportingTsExtensions: true,
    skipLibCheck: true,
    resolveJsonModule: true,
    isolatedModules: true,
    lib: ['lib.es2020.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  },
});

const diagnostics = ts.getPreEmitDiagnostics(program);
for (const d of diagnostics) {
  if (d.file && d.file.fileName.includes('tokenRotation.test')) {
    const pos = d.file.getLineAndCharacterOfPosition(d.start);
    console.log(`Line ${pos.line + 1}: ${ts.flattenDiagnosticMessageText(d.messageText)}`);
  }
}
console.log(`Total: ${diagnostics.filter(d => d.file?.fileName.includes('tokenRotation.test')).length} errors`);
