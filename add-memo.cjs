// Script to add React.memo() wrapper to components using safe additive pattern
// Usage: node add-memo.cjs [--batch=N]
// --batch=N: only process the Nth batch of ~20 components

const fs = require('fs');
const path = require('path');

const COMPONENTS = [
  'AllocationPreview', 'AllocationRuleBuilder', 'ReciprocalConfigPanel', 'StepDownConfigPanel',
  'BenchmarkRadar', 'ChartWrapper', 'DataLineageViewer', 'ProtectedRoute', 'BudgetGrid',
  'ChartExportButton', 'ChartShowcasePage', 'GaugeChart', 'HeatmapChart', 'SparklineChart',
  'TreemapChart', 'VarianceChart', 'WaterfallChart', 'CommentaryPanel', 'ConsolidationWorksheet',
  'EntityHierarchy', 'ICMatchingPanel', 'ICReconciliation', 'JobCostDashboard', 'CurrencyTranslation',
  'FXRateManager', 'HedgeManager', 'ActivityFeed', 'ComboChart', 'DashboardTemplate', 'HeatmapGrid',
  'KPICard', 'KPICardEnhanced', 'SankeyDiagram', 'TornadoChart', 'TrafficLightIndicator', 'WidgetLibrary',
  'ColumnMapper', 'FileUploader', 'FindReplaceDialog', 'ImportPreview', 'EngineErrorBoundary',
  'GridErrorBoundary', 'PluginErrorBoundary', 'CarbonFootprintTracker', 'CSRDReportGenerator',
  'ESGDashboard', 'ESGMetricsDashboard', 'CascadeRuleBuilder', 'ConsolidationTree', 'DepreciationProjection',
  'DriverPanel', 'FXPositionGrid', 'LeaseSchedule', 'RevRecSchedule', 'GenerativeDashboard',
  'UnderwritingDashboard', 'AboutDialog', 'AppLayout', 'Navbar', 'Sidebar', 'ProductionDashboard',
  'MigrationWizard', 'PluginCard', 'PluginDetail', 'PropertyDashboard', 'BoardPackBuilder',
  'BoardPackGenerator', 'BoardPackTemplate', 'BookBurstBuilder', 'BookBurstConfig', 'BookBurstSubs',
  'DesignerSidebar', 'FilterPanel', 'PeriodPromptBar', 'ReportDesigner', 'TemplateModal',
  'ExecutiveSummary', 'ExportDialog', 'ReportBuilder', 'ReportGenerator', 'ReportGrid',
  'ReportLayoutEditor', 'ReportLeftPanel', 'ReportLivePreview', 'ReportProgress', 'ReportResultsPanel',
  'ReportScheduler', 'ReportTemplateLibrary', 'ReportToolbar', 'TemplateDesigner', 'StoreDashboard',
  'ChurnWaterfall', 'MRRBreakdown', 'SaaSCohortTable', 'DriverTreeView', 'ImpactAnalysis',
  'ScenarioComparison', 'ScenarioMerge', 'SectorDashboard', 'SectorKPIs', 'SectorSelector',
  'TemplateMarketplace'
];

const SRC_DIR = path.resolve(__dirname, 'src');

function findComponentFile(name) {
  const walkSync = (dir) => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const result = walkSync(fullPath);
          if (result) return result;
        } else if (entry.isFile() && (entry.name === `${name}.tsx` || entry.name === `${name}.ts`)) {
          return fullPath;
        }
      }
    } catch (e) {
      // skip dirs we can't read
    }
    return null;
  };
  return walkSync(SRC_DIR);
}

// Components known to already have memo (skip these)
const ALREADY_MEMOED = new Set([
  'ChartWrapper', 'DataLineageViewer', 'ChartExportButton', 'HedgeManager',
  'ActivityFeed', 'ComboChart', 'HeatmapGrid', 'KPICard', 'KPICardEnhanced',
  'SankeyDiagram', 'TornadoChart', 'TrafficLightIndicator',
  'Navbar', 'Sidebar', 'BookBurstBuilder', 'SectorKPIs'
]);

/**
 * Find the last import line index in a file.
 */
function findLastImportLine(lines) {
  let lastImportLine = -1;
  let inImport = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*import\s/.test(line)) {
      inImport = true;
      lastImportLine = i;
    } else if (inImport && line.includes('from')) {
      lastImportLine = i;
      inImport = false;
    } else if (inImport && /^\s*\{/.test(line)) {
      lastImportLine = i;
    } else if (inImport) {
      lastImportLine = i;
    } else {
      inImport = false;
    }
  }
  return lastImportLine;
}

/**
 * Check if a react import already has { memo } in it
 */
function hasMemoInReactImport(content) {
  return /import\s*\{[^}]*\bmemo\b[^}]*\}\s*from\s*['"]react['"]/.test(content) ||
         /import\s+\w+\s*,\s*\{[^}]*\bmemo\b[^}]*\}\s*from\s*['"]react['"]/.test(content);
}

/**
 * Add memo to the react import. Returns modified lines or null on failure.
 */
function addMemoToImport(lines, name) {
  // Find the react import line(s)
  let reactImportIdx = -1;
  let reactImportEndIdx = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Single-line react import
    if (/^\s*import\s/.test(line) && /from\s*['"]react['"]/.test(line)) {
      reactImportIdx = i;
      reactImportEndIdx = i;
      break;
    }
    // Multi-line react import
    if (/^\s*import\s/.test(line) && !line.includes('from') && !line.includes(';')) {
      let j = i + 1;
      while (j < lines.length) {
        if (/\}\s*from\s*['"]react['"]/.test(lines[j])) {
          reactImportIdx = i;
          reactImportEndIdx = j;
          break;
        }
        if (/\}\s*from\s/.test(lines[j])) break; // some other import
        j++;
      }
      if (reactImportIdx >= 0) break;
    }
  }

  if (reactImportIdx >= 0) {
    const importLine = lines[reactImportIdx];
    
    // Default only: import React from 'react'
    if (/^\s*import\s+\w+\s+from\s*['"]react['"]/.test(importLine) && !importLine.includes(',')) {
      lines[reactImportIdx] = importLine.replace(
        /(import\s+\w+)(\s+from\s*['"]react['"])/,
        '$1, { memo }$2'
      );
      console.log(`  IMPORT: added { memo } to default import in ${name}`);
      return true;
    }
    
    // Default + named: import React, { useState } from 'react'
    if (/^\s*import\s+\w+\s*,\s*/.test(importLine) && /from\s*['"]react['"]/.test(importLine)) {
      lines[reactImportIdx] = importLine.replace(
        /(import\s+\w+\s*,\s*\{)([^}]*)(\}\s*from\s*['"]react['"])/,
        (match, p1, p2, p3) => {
          const existing = p2.trim();
          return existing ? `${p1} ${existing}, memo ${p3}` : `${p1} memo ${p3}`;
        }
      );
      console.log(`  IMPORT: added memo to default+named import in ${name}`);
      return true;
    }
    
    // Named only (single line): import { useState } from 'react'
    if (/^\s*import\s*\{/.test(importLine) && /from\s*['"]react['"]/.test(importLine)) {
      lines[reactImportIdx] = importLine.replace(
        /(import\s*\{)([^}]*)(\}\s*from\s*['"]react['"])/,
        (match, p1, p2, p3) => {
          const existing = p2.trim();
          return existing ? `${p1} ${existing}, memo ${p3}` : `${p1} memo ${p3}`;
        }
      );
      console.log(`  IMPORT: added memo to named import in ${name}`);
      return true;
    }
    
    // Multi-line named import
    if (/^\s*import\s*\{/.test(importLine)) {
      for (let i = reactImportIdx + 1; i <= reactImportEndIdx; i++) {
        if (/\}\s*from\s*['"]react['"]/.test(lines[i])) {
          lines[i] = lines[i].replace(/\}\s*(from\s*['"]react['"])/, 'memo } $1');
          console.log(`  IMPORT: added memo to multi-line named import in ${name}`);
          return true;
        }
      }
    }
  }
  
  return false; // No react import found
}

function addMemo(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const name = path.basename(filePath, path.extname(filePath));
  
  // Skip if already uses memo for this component
  if (content.includes(`memo(${name})`) || content.includes(`memo(${name} `) || ALREADY_MEMOED.has(name)) {
    console.log(`  SKIP: ${name} - already uses memo`);
    return false;
  }

  // Skip if already has export const Foo = memo(Foo) pattern
  if (new RegExp(`export\\s+(const|var|let)\\s+${name}\\s*=\\s*memo\\(`).test(content)) {
    console.log(`  SKIP: ${name} - already memo-wrapped in export`);
    return false;
  }

  const lines = content.split('\n');
  
  // ---- Phase 1: Add memo to import ----
  if (!hasMemoInReactImport(content)) {
    const importAdded = addMemoToImport(lines, name);
    if (!importAdded) {
      // No react import found - add one after the last import
      const lastImportIdx = findLastImportLine(lines);
      if (lastImportIdx >= 0) {
        lines.splice(lastImportIdx + 1, 0, `import { memo } from 'react';`);
      } else {
        lines.unshift(`import { memo } from 'react';`);
      }
      console.log(`  IMPORT: added new import line for memo in ${name}`);
    }
  }

  // ---- Phase 2: Wrap component with memo ----
  // Find the export declaration for this component and remove the export keyword
  // We need to handle: export function Foo, export const Foo, export class Foo
  
  const patterns = [
    // export function Foo(...)
    { regex: new RegExp(`^(export\\s+)(function\\s+${name}\\b)`), replace: (m, exp, rest) => rest },
    // export const Foo = (arrow or function)
    { regex: new RegExp(`^(export\\s+)(const\\s+${name}\\s*=)`), replace: (m, exp, rest) => rest },
    // export const Foo: React.FC<...> = 
    { regex: new RegExp(`^(export\\s+)(const\\s+${name}\\s*:)`), replace: (m, exp, rest) => rest },
    // export class Foo
    { regex: new RegExp(`^(export\\s+)(class\\s+${name}\\b)`), replace: (m, exp, rest) => rest },
  ];

  let exportRemoved = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        lines[i] = line.replace(pattern.regex, pattern.replace);
        exportRemoved = true;
        console.log(`  EXPORT: removed 'export' keyword from ${name} declaration (line ${i + 1})`);
        break;
      }
    }
    if (exportRemoved) break;
  }

  if (!exportRemoved) {
    console.log(`  WARN: Could not find export declaration for ${name}, adding memo export anyway`);
  }

  // ---- Phase 3: Add export const Foo = memo(Foo) at end ----
  let result = lines.join('\n');
  result = result.replace(/\n+$/, '\n');
  result += `export const ${name} = memo(${name});\n`;

  fs.writeFileSync(filePath, result, 'utf-8');
  console.log(`  WRAPPED: ${name} with React.memo`);
  return true;
}

// Parse batch argument
const args = process.argv.slice(2);
let batchFilter = null;
let dryRun = false;

for (const arg of args) {
  if (arg.startsWith('--batch=')) {
    batchFilter = parseInt(arg.split('=')[1], 10);
  }
  if (arg === '--dry-run') {
    dryRun = true;
  }
}

// Filter components that don't already have memo
const toProcess = COMPONENTS.filter(name => !ALREADY_MEMOED.has(name));

// Apply batch filter
const BATCH_SIZE = 20;
let batchStart = 0;
let batchEnd = toProcess.length;

if (batchFilter !== null) {
  batchStart = (batchFilter - 1) * BATCH_SIZE;
  batchEnd = Math.min(batchFilter * BATCH_SIZE, toProcess.length);
}

const batchToProcess = toProcess.slice(batchStart, batchEnd);

console.log(`Components to process in this batch: ${batchToProcess.length}`);
console.log(`Batch: ${batchFilter || 'all'} (indices ${batchStart}-${batchEnd})`);

let wrapped = 0;
let skipped = 0;
let errors = 0;

for (const name of batchToProcess) {
  const filePath = findComponentFile(name);
  if (!filePath) {
    console.log(`  ERROR: Cannot find file for ${name}`);
    errors++;
    continue;
  }
  console.log(`Processing: ${name} (${filePath})`);
  if (!dryRun) {
    const result = addMemo(filePath);
    if (result) wrapped++;
    else skipped++;
  } else {
    console.log(`  DRY RUN: would process ${name}`);
  }
}

console.log(`\n=== Summary ===`);
console.log(`Wrapped: ${wrapped}`);
console.log(`Skipped: ${skipped}`);
console.log(`Errors: ${errors}`);
console.log(`Batch: ${batchFilter || 'all'}`);
