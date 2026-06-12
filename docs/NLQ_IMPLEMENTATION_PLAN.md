# NLQ (Natural Language Query) Implementation Plan

## Executive Summary

NLQ is the #1 feature for 1000x competitive advantage. 5 competitors have it (Vena Copilot, Cube AI, Oracle GenAI, SAP SAC, Mosaic Arc AI). FinPlan Pro has the AI engine (@huggingface/transformers) and formula engine (245+ functions) — only the NLQ layer is missing.

## Architecture

```
User Input ("show Q3 revenue by region")
    ↓
[NLQ Parser] — tokenize, normalize, correct typos
    ↓
[Intent Classifier] — chart | table | kpi | comparison | trend | formula
    ↓
[Entity Extractor] — metric, time period, dimension, filter, aggregation
    ↓
[Query Builder] — map entities to store queries
    ↓
[Query Executor] — fetch data from Zustand stores
    ↓
[Result Renderer] — render as chart/table/KPI card
```

## Components to Build

### 1. NLQ Parser (`src/engines/nlq/NLQParser.ts`)

**Purpose:** Parse natural language into structured tokens

```typescript
interface NLQToken {
  type: 'metric' | 'time' | 'dimension' | 'filter' | 'action' | 'aggregation' | 'comparison';
  value: string;
  normalized: string;
  confidence: number;
}

interface NLQParseResult {
  tokens: NLQToken[];
  rawQuery: string;
  correctedQuery?: string; // typo correction
}
```

**Implementation:**

- Dictionary-based tokenization (financial terms → normalized forms)
- Typo correction using Levenshtein distance
- Synonym mapping (e.g., "revenue" → "revenue", "sales" → "revenue", "income" → "revenue")
- Stop word filtering
- Multi-word entity detection (e.g., "gross margin" → single metric)

**Effort:** 2 hours
**Dependencies:** None

### 2. Intent Classifier (`src/engines/nlq/IntentClassifier.ts`)

**Purpose:** Classify user intent from parsed tokens

```typescript
type NLQIntent = 'chart' | 'table' | 'kpi' | 'comparison' | 'trend' | 'formula' | 'help';

interface IntentResult {
  intent: NLQIntent;
  confidence: number;
  subIntent?: string; // e.g., 'chart:bar', 'chart:line', 'table:pivot'
}
```

**Implementation:**

- Rule-based classification (pattern matching)
- Keyword → intent mapping:
  - "show", "display", "chart", "graph" → chart
  - "list", "table", "details" → table
  - "total", "sum", "kpi", "metric" → kpi
  - "compare", "vs", "versus", "difference" → comparison
  - "trend", "over time", "growth" → trend
  - "calculate", "formula", "compute" → formula
- Chart type inference from context:
  - "by region" → bar chart
  - "over time" → line chart
  - "breakdown" → pie chart
  - "waterfall" → waterfall chart
- Confidence scoring based on keyword density

**Effort:** 1 hour
**Dependencies:** NLQ Parser

### 3. Entity Extractor (`src/engines/nlq/EntityExtractor.ts`)

**Purpose:** Extract structured entities from parsed tokens

```typescript
interface NLQEntities {
  metrics: string[]; // ["revenue", "expenses"]
  timePeriod?: {
    // Q3 2024, FY2023, Jan-Dec
    type: 'quarter' | 'year' | 'month' | 'range';
    start?: string;
    end?: string;
    value: string;
  };
  dimensions?: string[]; // ["region", "department", "product"]
  filters?: Array<{
    // where revenue > 1000
    field: string;
    operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
    value: string | number;
  }>;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'growth';
  comparison?: {
    // vs last year, vs budget
    type: 'period' | 'budget' | 'scenario';
    value: string;
  };
}
```

**Implementation:**

- Time period parser (fiscal year, quarter, month, date range)
- Metric dictionary (245+ formula functions as metric names)
- Dimension detection from sector configs (16 industries)
- Filter extraction ("where", "with", "above", "below")
- Aggregation detection ("total", "average", "growth rate")
- Comparison detection ("vs", "compared to", "versus")

**Effort:** 2 hours
**Dependencies:** NLQ Parser

### 4. Query Builder (`src/engines/nlq/QueryBuilder.ts`)

**Purpose:** Map extracted entities to store queries

```typescript
interface NLQQuery {
  store: string; // 'gl' | 'budget' | 'forecast' | 'scenario'
  action: 'fetch' | 'aggregate' | 'compare' | 'filter';
  fields: string[];
  filters: Record<string, unknown>;
  groupBy?: string;
  sortBy?: string;
  limit?: number;
}
```

**Implementation:**

- Metric → store mapping:
  - Revenue, expenses, P&L → glStore
  - Budget, variance → budgetStore
  - Forecast, projection → forecastStore
  - Scenario, what-if → scenarioStore
- Dimension → groupBy mapping
- Time period → filter mapping
- Aggregation → action mapping
- Build query objects for store consumption

**Effort:** 2 hours
**Dependencies:** Entity Extractor

### 5. Query Executor (`src/engines/nlq/QueryExecutor.ts`)

**Purpose:** Execute queries against Zustand stores

```typescript
interface NLQResult {
  data: Array<Record<string, unknown>>;
  metadata: {
    rowCount: number;
    columns: string[];
    aggregation?: string;
    timePeriod?: string;
  };
}
```

**Implementation:**

- Direct store access via getState()
- Data transformation (group by, aggregate, filter)
- Time period filtering
- Dimension slicing
- Comparison calculation (variance, % change)
- Error handling for missing data

**Effort:** 2 hours
**Dependencies:** Query Builder

### 6. Result Renderer (`src/components/nlq/NLQResultRenderer.tsx`)

**Purpose:** Render query results as appropriate visualization

```typescript
interface NLQRenderProps {
  result: NLQResult;
  intent: IntentResult;
  onDrillDown?: (dimension: string, value: string) => void;
}
```

**Implementation:**

- Chart rendering using existing chart components:
  - Bar chart → WaterfallChart
  - Line chart → Recharts LineChart
  - Pie chart → Recharts PieChart
  - Variance → VarianceChart
  - Sparkline → SparklineChart
- Table rendering using DataTable component
- KPI card rendering using KPIValue component
- Comparison rendering (side-by-side)
- Drill-down support (click dimension → filter)
- Export support (PNG, CSV, PDF)

**Effort:** 3 hours
**Dependencies:** Query Executor, Chart Components

### 7. Chat Interface (`src/components/nlq/ChatPanel.tsx`)

**Purpose:** Conversational NLQ interface

```typescript
interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  result?: NLQResult;
  intent?: IntentResult;
}
```

**Implementation:**

- Chat message list with user/assistant bubbles
- Input field with autocomplete suggestions
- Query history (last 10 queries)
- Follow-up context ("now show by department" → uses previous context)
- Suggested queries ("Try asking: 'Show revenue by region'")
- Keyboard shortcuts (Enter to send, Escape to clear)
- Responsive layout (sidebar on desktop, bottom sheet on mobile)

**Effort:** 3 hours
**Dependencies:** All above components

### 8. NLQ Engine (`src/engines/NLQEngine.ts`)

**Purpose:** Orchestrate the full NLQ pipeline

```typescript
export class NLQEngine {
  static async query(input: string, context?: NLQContext): Promise<NLQResponse> {
    const tokens = NLQParser.parse(input);
    const intent = IntentClassifier.classify(tokens);
    const entities = EntityExtractor.extract(tokens);
    const query = QueryBuilder.build(entities, intent);
    const result = await QueryExecutor.execute(query);
    return { result, intent, entities, tokens };
  }
}
```

**Effort:** 1 hour
**Dependencies:** All above components

## File Structure

```
src/engines/nlq/
├── NLQParser.ts          — Tokenize and normalize natural language
├── IntentClassifier.ts   — Classify user intent
├── EntityExtractor.ts    — Extract structured entities
├── QueryBuilder.ts       — Build store queries
├── QueryExecutor.ts      — Execute against stores
├── NLQEngine.ts          — Orchestrate pipeline
├── dictionaries.ts       — Financial term dictionaries
├── synonyms.ts           — Synonym mappings
├── types.ts              — TypeScript interfaces
└── NLQEngine.test.ts     — Tests

src/components/nlq/
├── ChatPanel.tsx         — Chat interface
├── ChatMessage.tsx       — Individual message
├── NLQResultRenderer.tsx — Render results
├── QuerySuggestion.tsx   — Autocomplete suggestions
└── index.ts              — Barrel export
```

## Integration Points

### With Existing Systems

1. **FormulaEngine** — Use formula functions as metric names
2. **AIEngine** — Use embeddings for semantic similarity (optional, for advanced matching)
3. **Chart Components** — Use WaterfallChart, VarianceChart, SparklineChart
4. **DataTable** — Use for table results
5. **KPIValue** — Use for KPI results
6. **Sector Configs** — Use for dimension names
7. **Stores** — Direct access via getState()

### Command Palette Integration

- Add NLQ to CommandPalette (Ctrl+K)
- Type natural language in command palette
- Results appear inline

### Dashboard Integration

- Add NLQ widget to DashboardPage
- Quick queries without leaving dashboard

## Implementation Phases

### Phase 1: Core Parser (2 hours)

- NLQParser.ts
- dictionaries.ts
- synonyms.ts
- types.ts

### Phase 2: Intent & Entity Extraction (3 hours)

- IntentClassifier.ts
- EntityExtractor.ts

### Phase 3: Query Execution (2 hours)

- QueryBuilder.ts
- QueryExecutor.ts

### Phase 4: Result Rendering (3 hours)

- NLQResultRenderer.tsx
- Integration with chart components

### Phase 5: Chat Interface (3 hours)

- ChatPanel.tsx
- ChatMessage.tsx
- QuerySuggestion.tsx

### Phase 6: Orchestration & Testing (2 hours)

- NLQEngine.ts
- Integration tests
- Performance optimization

**Total: 15 hours**

## Success Metrics

| Metric                | Target | How to Measure               |
| --------------------- | ------ | ---------------------------- |
| Query accuracy        | >80%   | Test with 100 sample queries |
| Response time         | <500ms | Performance benchmark        |
| Intent classification | >90%   | Test with labeled dataset    |
| Entity extraction     | >85%   | Test with labeled dataset    |
| User satisfaction     | >4/5   | User testing                 |

## Competitive Comparison

| Feature          | FinPlan NLQ   | Vena Copilot | Cube AI    | Mosaic Arc AI |
| ---------------- | ------------- | ------------ | ---------- | ------------- |
| Offline          | ✅ YES        | ❌ Cloud     | ❌ Cloud   | ❌ Cloud      |
| Privacy          | ✅ Local      | ❌ Cloud     | ❌ Cloud   | ❌ Cloud      |
| Speed            | ✅ <500ms     | ⚠️ 1-3s      | ⚠️ 1-2s    | ⚠️ 1-2s       |
| Custom functions | ✅ 245+       | ❌ Limited   | ❌ Limited | ❌ Limited    |
| Chart types      | ✅ 6 advanced | ⚠️ 3 basic   | ⚠️ 4 basic | ⚠️ 3 basic    |
| Offline-first    | ✅ Unique     | ❌           | ❌         | ❌            |

## Key Advantages

1. **Offline-first** — No cloud dependency, no data leaks, works anywhere
2. **Privacy** — All processing happens locally in browser/desktop
3. **Speed** — No network latency, <500ms response
4. **245+ functions** — More formula functions than any competitor
5. **6 chart types** — More visualization options
6. **Plugin extensible** — Custom NLQ rules via plugin system
