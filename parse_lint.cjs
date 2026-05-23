const d=JSON.parse(require('fs').readFileSync('lint_report.json','utf8'));
d.filter(f=>f.errorCount>0).forEach(f=>{
  const p=f.filePath.split('frontend that i want')[1]||f.filePath;
  console.log('\n'+p+': '+f.errorCount+' errors');
  f.messages.filter(m=>m.severity===2).forEach(m=>console.log('  L'+m.line+': ['+m.ruleId+'] '+m.message.substring(0,120)));
});
console.log('\n=== Total errors:',d.reduce((a,f)=>a+f.errorCount,0),'===');
