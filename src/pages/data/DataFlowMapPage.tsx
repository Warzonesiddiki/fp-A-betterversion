import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

// Bundle diet: recharts Sankey removed — custom flow list (T019, T526-T534)
// Previously used Sankey from recharts (heavy), now lightweight div flow

interface FlowNode {
  name: string;
  category: 'source' | 'engine' | 'store' | 'page';
}

interface FlowLink {
  source: number;
  target: number;
  value: number;
}

const nodes: FlowNode[] = [
  // Sources (0-3)
  { name: 'Excel/CSV Upload', category: 'source' },
  { name: 'Manual Entry', category: 'source' },
  { name: 'ERP Connector', category: 'source' },
  { name: 'API Feed', category: 'source' },
  // Engines (4-10)
  { name: 'ImportEngine', category: 'engine' },
  { name: 'FormulaEngine', category: 'engine' },
  { name: 'ConsolidationEngine', category: 'engine' },
  { name: 'ThreeStatementEngine', category: 'engine' },
  { name: 'FXEngine', category: 'engine' },
  { name: 'NLQEngine', category: 'engine' },
  { name: 'ExportEngine', category: 'engine' },
  // Stores (11-16)
  { name: 'glStore', category: 'store' },
  { name: 'budgetStore', category: 'store' },
  { name: 'forecastStore', category: 'store' },
  { name: 'scenarioStore', category: 'store' },
  { name: 'entityStore', category: 'store' },
  { name: 'reportStore', category: 'store' },
  // Pages (17-24)
  { name: 'Dashboard', category: 'page' },
  { name: 'Budget Page', category: 'page' },
  { name: 'Forecast Page', category: 'page' },
  { name: 'Reports Page', category: 'page' },
  { name: 'Consolidation', category: 'page' },
  { name: 'NLQ Chat', category: 'page' },
  { name: 'Export (PDF/Excel)', category: 'page' },
  { name: 'Data Flow Map', category: 'page' },
];

const links: FlowLink[] = [
  // Sources → ImportEngine
  { source: 0, target: 4, value: 100 },
  { source: 1, target: 4, value: 80 },
  { source: 2, target: 4, value: 60 },
  { source: 3, target: 4, value: 40 },
  // ImportEngine → glStore
  { source: 4, target: 11, value: 200 },
  // glStore → FormulaEngine
  { source: 11, target: 5, value: 180 },
  // FormulaEngine → budgetStore, forecastStore
  { source: 5, target: 12, value: 100 },
  { source: 5, target: 13, value: 80 },
  // ConsolidationEngine → entityStore
  { source: 6, target: 15, value: 60 },
  // ThreeStatementEngine → reportStore
  { source: 7, target: 16, value: 70 },
  // FXEngine → entityStore
  { source: 8, target: 15, value: 40 },
  // NLQEngine → pages
  { source: 9, target: 22, value: 30 },
  // ExportEngine → Export page
  { source: 10, target: 23, value: 50 },
  // Stores → Pages
  { source: 11, target: 17, value: 150 },
  { source: 12, target: 18, value: 100 },
  { source: 13, target: 19, value: 80 },
  { source: 16, target: 20, value: 70 },
  { source: 15, target: 21, value: 60 },
  { source: 14, target: 18, value: 40 },
  // Dashboard pulls from all
  { source: 11, target: 17, value: 100 },
  { source: 12, target: 17, value: 80 },
  { source: 13, target: 17, value: 60 },
];

export default function DataFlowMapPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Data Flow Map"
        purpose="Visual map of how data flows through FinPlan Pro — from source to dashboard"
      />

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-4 h-4 bg-[var(--accent-primary)] rounded mx-auto mb-2" />
            <div className="text-sm font-medium">Data Sources</div>
            <div className="text-xs text-muted-foreground">Excel, CSV, ERP, API</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-4 h-4 bg-[var(--positive)] rounded mx-auto mb-2" />
            <div className="text-sm font-medium">Engines</div>
            <div className="text-xs text-muted-foreground">159 calculation engines</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-4 h-4 bg-[var(--financial-pending)] rounded mx-auto mb-2" />
            <div className="text-sm font-medium">Stores</div>
            <div className="text-xs text-muted-foreground">22 Zustand stores</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-4 h-4 bg-[var(--financial-calculated)] rounded mx-auto mb-2" />
            <div className="text-sm font-medium">Pages</div>
            <div className="text-xs text-muted-foreground">140 UI pages</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Flow Diagram (Simplified)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" role="img" aria-label="Data flow from sources to pages">
            <div className="flex flex-wrap gap-2">
              {nodes.slice(0, 4).map((n) => (
                <div
                  key={n.name}
                  className="px-3 py-1 rounded bg-[var(--accent-primary)] text-white text-xs"
                >
                  {n.name}
                </div>
              ))}
              <span className="text-[var(--text-muted)]">→</span>
              {nodes.slice(4, 11).map((n) => (
                <div
                  key={n.name}
                  className="px-3 py-1 rounded bg-[var(--positive)] text-white text-xs"
                >
                  {n.name}
                </div>
              ))}
              <span className="text-[var(--text-muted)]">→</span>
              {nodes.slice(11, 17).map((n) => (
                <div
                  key={n.name}
                  className="px-3 py-1 rounded bg-[var(--financial-pending)] text-black text-xs"
                >
                  {n.name}
                </div>
              ))}
              <span className="text-[var(--text-muted)]">→</span>
              {nodes.slice(17, 25).map((n) => (
                <div
                  key={n.name}
                  className="px-3 py-1 rounded bg-[var(--financial-calculated)] text-white text-xs"
                >
                  {n.name}
                </div>
              ))}
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              {links.length} flow connections: Sources → ImportEngine → glStore → FormulaEngine →
              Stores → Pages
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[var(--accent-primary)] rounded" />
                <span>Excel/CSV Upload — drag & drop or file picker</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[var(--accent-primary)] rounded" />
                <span>Manual Entry — grid-based data entry</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[var(--accent-primary)] rounded" />
                <span>ERP Connector — QuickBooks, NetSuite, Salesforce</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[var(--accent-primary)] rounded" />
                <span>API Feed — REST/webhook data ingestion</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Data Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                1. <strong>Upload</strong> — ImportEngine parses Excel/CSV
              </div>
              <div>
                2. <strong>Store</strong> — Data saved to glStore (IndexedDB)
              </div>
              <div>
                3. <strong>Calculate</strong> — FormulaEngine computes derived values
              </div>
              <div>
                4. <strong>Consolidate</strong> — ConsolidationEngine merges entities
              </div>
              <div>
                5. <strong>Display</strong> — Pages render data from stores
              </div>
              <div>
                6. <strong>Export</strong> — ExportEngine generates PDF/Excel/CSV
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
