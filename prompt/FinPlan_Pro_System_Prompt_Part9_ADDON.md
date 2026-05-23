# FINPLAN PRO — AI FLEET SYSTEM PROMPT
## Part 9 of 10 (ADDON): User Experience Excellence & Delight Engineering
## Version 5.0.0 | Generated 2026-05-18 | UX PATTERNS FOR WORLD-CLASS FINANCIAL SOFTWARE

---

## 0. WHY THIS PART EXISTS

FinPlan Pro must be SO GOOD that CFOs PREFER it over tools costing $500K/year.
The UX must pass two critical tests:

  THE INTERN TEST: A finance intern figures out how to use any feature
  in 60 seconds without training.

  THE FRIDAY 5PM TEST: A tired CFO opens the app at 5PM on Friday and
  can generate a board pack without thinking about the interface.

This part defines HOW to achieve that level of UX excellence.

---

## 1. MOTION DESIGN FOR FINANCIAL SOFTWARE

### 1.1 When to Animate

```
ALWAYS ANIMATE:
  - Page transitions: fade + slide (200ms ease-out)
  - Modal/dialog open: scale from 0.95 + fade (150ms)
  - Modal/dialog close: fade out (100ms)
  - Sidebar expand/collapse: width transition (200ms)
  - Tab switching: underline slide (150ms)
  - Tooltip appear: fade + translateY (100ms)
  - Toast notifications: slide in from right (200ms)
  - Loading skeleton: pulse animation (1.5s infinite)
  - Drag-and-drop: follow cursor + drop animation (150ms)
  - Accordion expand: height transition (200ms)

NEVER ANIMATE:
  - Number changes in cells (instant update)
  - Grid data loading (show skeleton, not spinner)
  - Formula recalculation (instant, no feedback needed <100ms)
  - Bulk operations (show progress bar, not individual animations)
  - Search results (instant filter, no stagger animation)
  - Financial calculations (accuracy > animation)
```

### 1.2 Framer Motion Patterns

```typescript
// Page transition wrapper:
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// Modal animation:
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// Toast notification:
const toastVariants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100, transition: { duration: 0.1 } },
};

// Stagger children (for lists, not data grids):
const containerVariants = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};
```

### 1.3 Performance Rules

```
RULE 1: Use CSS transitions for simple animations (opacity, transform)
  CSS is GPU-accelerated. Framer Motion is CPU-bound.

RULE 2: Use will-change: transform for animated elements
  Tells browser to promote to GPU layer.

RULE 3: Never animate layout properties (width, height, top, left)
  Always animate transform and opacity instead.

RULE 4: Respect prefers-reduced-motion
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; }
  }

RULE 5: Test with 1000+ rows visible
  Animations must not drop below 60fps even with heavy data.
```

### 1.4 Reduced Motion Pattern

```typescript
import { useEffect, useState } from 'react';

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

// Usage:
const reducedMotion = useReducedMotion();
const transition = reducedMotion ? { duration: 0 } : { duration: 0.2 };
```

---

## 2. KEYBOARD-FIRST DESIGN

### 2.1 Command Palette (Ctrl+K)

```typescript
// The command palette is the SINGLE MOST IMPORTANT UX feature.
// It lets users do ANYTHING without knowing where it is in the menu.

// Command categories:
const commands = [
  // Navigation
  { id: 'nav-dashboard', label: 'Go to Dashboard', shortcut: 'Ctrl+D', action: () => navigate('/dashboard') },
  { id: 'nav-budget', label: 'Go to Budgets', shortcut: 'Ctrl+B', action: () => navigate('/budgets') },
  { id: 'nav-reports', label: 'Go to Reports', shortcut: 'Ctrl+R', action: () => navigate('/reports') },

  // Actions
  { id: 'act-new-budget', label: 'Create New Budget', shortcut: 'Ctrl+N', action: () => createBudget() },
  { id: 'act-import', label: 'Import Data', shortcut: 'Ctrl+I', action: () => openImport() },
  { id: 'act-export-pdf', label: 'Export as PDF', shortcut: 'Ctrl+Shift+E', action: () => exportPDF() },
  { id: 'act-save', label: 'Save', shortcut: 'Ctrl+S', action: () => save() },
  { id: 'act-undo', label: 'Undo', shortcut: 'Ctrl+Z', action: () => undo() },
  { id: 'act-redo', label: 'Redo', shortcut: 'Ctrl+Shift+Z', action: () => redo() },

  // Search
  { id: 'search-cells', label: 'Search Cells...', shortcut: 'Ctrl+F', action: () => openCellSearch() },
  { id: 'search-formulas', label: 'Search Formulas...', shortcut: 'Ctrl+Shift+F', action: () => openFormulaSearch() },
  { id: 'search-reports', label: 'Search Reports...', action: () => openReportSearch() },

  // Settings
  { id: 'set-theme', label: 'Toggle Dark Mode', shortcut: 'Ctrl+Shift+D', action: () => toggleTheme() },
  { id: 'set-density', label: 'Toggle Dense Mode', action: () => toggleDensity() },
  { id: 'set-shortcuts', label: 'Keyboard Shortcuts', shortcut: 'Ctrl+/', action: () => openShortcuts() },
];

// Implementation:
// 1. Ctrl+K opens palette
// 2. Type to filter commands (fuzzy search)
// 3. Arrow keys to navigate
// 4. Enter to execute
// 5. Escape to close
// 6. Show shortcut next to each command
```

### 2.2 Excel-Compatible Shortcuts

```
MUST SUPPORT (non-negotiable for finance users):
  Ctrl+C          Copy cell/selection
  Ctrl+V          Paste
  Ctrl+X          Cut
  Ctrl+Z          Undo
  Ctrl+Shift+Z    Redo
  Ctrl+S          Save
  Ctrl+F          Find in cells
  Ctrl+H          Find and replace
  Ctrl+A          Select all
  Ctrl+B          Bold
  Ctrl+I          Italic
  F2              Edit cell
  Enter           Confirm edit, move down
  Tab             Confirm edit, move right
  Escape          Cancel edit
  Delete          Clear cell
  Ctrl+Home       Go to A1
  Ctrl+End        Go to last used cell
  Ctrl+Arrow      Jump to edge of data region
  Shift+Arrow     Extend selection
  Ctrl+Shift+End  Select to last used cell

FINPLAN-SPECIFIC SHORTCUTS:
  Ctrl+K          Command palette
  Ctrl+N          New budget
  Ctrl+D          Go to dashboard
  Ctrl+R          Go to reports
  Ctrl+Shift+E    Export PDF
  Ctrl+Shift+D    Toggle dark mode
  Ctrl+/          Show keyboard shortcuts
  Ctrl+Shift+P    Toggle preview mode
  Alt+1-9         Switch to tab 1-9
```

### 2.3 Shortcut Discovery

```typescript
// Show shortcut on hover for ALL interactive elements:
<Tooltip content="Save (Ctrl+S)">
  <Button onClick={save}>Save</Button>
</Tooltip>

// Shortcut reference panel (Ctrl+/):
// Shows ALL shortcuts in a searchable, categorized list
// Users can also REMAP shortcuts in Settings
```

---

## 3. INFORMATION ARCHITECTURE FOR FINANCE

### 3.1 CFO Mental Model

```
CFOs think in this order:
  1. WHAT HAPPENED?   → Dashboard, actuals, reports
  2. WHY?             → Variance analysis, drill-down
  3. WHAT NEXT?       → Forecasts, scenarios, planning

Navigation should follow this mental model:
  Dashboard → Analysis → Planning → Reporting

NOT this (which is how most tools organize):
  Settings → Data → Models → Reports → Dashboard
```

### 3.2 Navigation Structure

```
PRIMARY NAVIGATION (always visible, left sidebar):
  📊 Dashboard      — What happened (KPIs, trends, alerts)
  📈 Analysis        — Why (variance, drill-down, comparisons)
  📋 Planning        — What next (budgets, forecasts, scenarios)
  📄 Reports         — Output (board packs, exports, templates)
  ⚙️ Settings        — Configuration (entities, users, preferences)

SECONDARY NAVIGATION (contextual, top bar):
  Entity selector    — Switch between companies/entities
  Period selector    — Switch between months/quarters/years
  Scenario selector  — Switch between base/bull/bear
  Search             — Global search (Ctrl+F)

TERTIARY NAVIGATION (breadcrumbs):
  Dashboard > Revenue > Q1 2026 > Variance
  Shows where you are, click to go back
```

### 3.3 Progressive Disclosure

```
RULE: Show summary FIRST, details on demand.

EXAMPLE — Revenue Page:
  Level 1: Total Revenue $10M (big number, trend arrow)
  Level 2: Revenue by product line (bar chart)
  Level 3: Revenue by customer (table, expandable)
  Level 4: Individual transactions (drill-through)

EXAMPLE — Budget Page:
  Level 1: Total Budget $50M, Status: In Review
  Level 2: Budget by department (summary table)
  Level 3: Budget by account (detailed grid)
  Level 4: Individual line items with notes

IMPLEMENTATION:
  - Summary cards at top (always visible)
  - Charts below (scroll to see)
  - Detailed grids below charts (expandable)
  - Drill-through on click (opens detail view)
```

---

## 4. EMPTY STATE DESIGN

### 4.1 First Launch

```typescript
// NEVER show a blank screen on first launch.
// Show a welcoming onboarding with clear next steps.

function FirstLaunchEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <WelcomeIcon className="w-16 h-16 text-blue-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Welcome to FinPlan Pro</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        Build budgets, forecasts, and board-ready reports — all offline,
        all on your machine. Let's get started.
      </p>
      <div className="flex gap-4">
        <Button onClick={startOnboarding}>Quick Tour (2 min)</Button>
        <Button variant="outline" onClick={openTemplateGallery}>
          Start from Template
        </Button>
        <Button variant="outline" onClick={openImport}>
          Import from Excel
        </Button>
      </div>
    </div>
  );
}
```

### 4.2 No Data State

```typescript
function NoDataState({ entity, period }: { entity: string; period: string }) {
  return (
    <div className="flex flex-col items-center p-8 text-center">
      <EmptyChartIcon className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold mb-2">No data for {period}</h3>
      <p className="text-gray-500 mb-4">
        Import actuals or create a budget to see data here.
      </p>
      <div className="flex gap-3">
        <Button size="sm" onClick={openImport}>Import Data</Button>
        <Button size="sm" variant="outline" onClick={createBudget}>Create Budget</Button>
      </div>
    </div>
  );
}
```

### 4.3 No Search Results

```typescript
function NoSearchResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center p-8 text-center">
      <SearchIcon className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold mb-2">No results for "{query}"</h3>
      <p className="text-gray-500 mb-4">
        Try a broader search or clear filters.
      </p>
      <div className="flex gap-3">
        <Button size="sm" onClick={clearFilters}>Clear Filters</Button>
        <Button size="sm" variant="outline" onClick={broadenSearch}>Search All</Button>
      </div>
    </div>
  );
}
```

---

## 5. TOAST & NOTIFICATION DESIGN

### 5.1 Toast Types

```typescript
// SUCCESS — auto-dismiss 3s
toast.success('Budget saved', { duration: 3000 });

// WARNING — persistent until action
toast.warning('Unsaved changes. Save before leaving?', {
  duration: Infinity,
  action: { label: 'Save', onClick: () => save() },
});

// ERROR — persistent, clickable to fix
toast.error('Formula error in B5: Circular reference', {
  duration: Infinity,
  action: { label: 'Fix', onClick: () => focusCell('B5') },
});

// INFO — auto-dismiss 5s
toast.info('Calculation complete in 47ms', { duration: 5000 });
```

### 5.2 Toast Position & Stacking

```
POSITION: bottom-right corner
STACKING: max 3 visible, older toasts collapse
ANIMATION: slide in from right (200ms), slide out (100ms)
ACCESSIBILITY: aria-live="polite" for success/info, aria-live="assertive" for error
```

---

## 6. DENSE MODE VS COMFORTABLE MODE

### 6.1 Mode Definitions

```
DENSE MODE (power users):
  - Font size: 12px for data, 14px for headers
  - Cell padding: 4px vertical, 8px horizontal
  - Row height: 28px in AG Grid
  - Sidebar: collapsed by default
  - More data visible on screen
  - Compact charts with smaller margins

COMFORTABLE MODE (new users):
  - Font size: 14px for data, 16px for headers
  - Cell padding: 8px vertical, 12px horizontal
  - Row height: 36px in AG Grid
  - Sidebar: expanded by default
  - Less data, more whitespace
  - Charts with generous margins

TOGGLE: Ctrl+Shift+D or toolbar button
PERSISTENCE: Save preference in settingsStore
```

### 6.2 Implementation Pattern

```typescript
// In settingsStore:
densityMode: 'comfortable' as 'dense' | 'comfortable',
toggleDensity: () => set(state => {
  state.densityMode = state.densityMode === 'dense' ? 'comfortable' : 'dense';
}),

// In components:
const density = useSettingsStore(s => s.densityMode);
const cellPadding = density === 'dense' ? 'py-1 px-2' : 'py-2 px-3';
const fontSize = density === 'dense' ? 'text-xs' : 'text-sm';
```

---

## 7. DARK MODE EXCELLENCE

### 7.1 Color Palette

```
LIGHT MODE:
  Background:    #FFFFFF
  Surface:       #F8FAFC
  Border:        #E2E8F0
  Text Primary:  #0F172A
  Text Secondary:#64748B
  Accent:        #3B82F6
  Success:       #16A34A
  Error:         #DC2626
  Warning:       #D97706

DARK MODE:
  Background:    #0F172A
  Surface:       #1E293B
  Border:        #334155
  Text Primary:  #F8FAFC
  Text Secondary:#94A3B8
  Accent:        #60A5FA
  Success:       #4ADE80
  Error:         #F87171
  Warning:       #FBBF24

FINANCIAL DATA COLORS (work in both modes):
  Positive:      Light: #16A34A  Dark: #4ADE80
  Negative:      Light: #DC2626  Dark: #F87171
  Neutral:       Light: #64748B  Dark: #94A3B8
  Budget:        Light: #94A3B8  Dark: #64748B
  Actual:        Light: #3B82F6  Dark: #60A5FA
  Forecast:      Light: #8B5CF6  Dark: #A78BFA
```

### 7.2 AG Grid Dark Theme

```typescript
// AG Grid dark theme must be applied:
const darkTheme = {
  '--ag-background-color': '#1E293B',
  '--ag-header-background-color': '#0F172A',
  '--ag-odd-row-background-color': '#1E293B',
  '--ag-row-hover-color': '#334155',
  '--ag-selected-row-background-color': '#1E3A5F',
  '--ag-border-color': '#334155',
  '--ag-header-foreground-color': '#F8FAFC',
  '--ag-foreground-color': '#F8FAFC',
  '--ag-secondary-foreground-color': '#94A3B8',
};
```

---

## 8. ONBOARDING FLOW

### 8.1 Five-Step Onboarding

```
STEP 1: WELCOME (30 seconds)
  "Welcome to FinPlan Pro. Build budgets, forecasts, and
  board-ready reports — all offline, all on your machine."
  [Get Started] [Skip Tour]

STEP 2: CHOOSE INDUSTRY (30 seconds)
  Select your industry to pre-fill templates:
  [Technology] [Healthcare] [Manufacturing] [Retail] ...
  → Pre-fills KPIs, account structures, report templates

STEP 3: IMPORT DATA (2 minutes)
  "Have existing data? Import it now."
  [Import from Excel] [Import from CSV] [Start Fresh]
  → Shows import preview, column mapping

STEP 4: INTERACTIVE TOUR (3 minutes)
  Highlights key features with tooltips:
  1. Dashboard — "See your numbers at a glance"
  2. Budget — "Create and manage budgets"
  3. Reports — "Generate board-ready reports"
  4. Scenarios — "Plan for the future"
  Each step: tooltip + highlight + "Next" button

STEP 5: FIRST ACTION (1 minute)
  "Let's create your first budget."
  → Pre-fills a simple budget template
  → User modifies one number → sees instant recalculation
  → "Congratulations! You just created your first budget."
```

### 8.2 Skip Option

```
Always show: "I know what I'm doing" → jumps to dashboard
Saves preference: skipOnboarding: true in settingsStore
Can restart tour from Help menu
```

---

## 9. MICRO-INTERACTIONS THAT DELIGHT

### 9.1 Cell Edit

```typescript
// Subtle highlight on change:
const cellHighlight = {
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  transition: 'background-color 0.3s ease',
};
// Fade out after 2 seconds
```

### 9.2 Save Confirmation

```typescript
// Checkmark animation on save:
<motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  exit={{ scale: 0, opacity: 0 }}
  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
>
  <CheckCircleIcon className="w-6 h-6 text-green-500" />
</motion.div>
```

### 9.3 Calculation Progress

```typescript
// Show progress for calculations >100ms:
{calculationTime > 100 && (
  <motion.div
    initial={{ width: 0 }}
    animate={{ width: '100%' }}
    transition={{ duration: calculationTime / 1000 }}
    className="h-1 bg-blue-500 rounded"
  />
)}
```

### 9.4 Drag-and-Drop Feedback

```typescript
// Visual feedback on drag:
const dragPreview = {
  scale: 1.05,
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  cursor: 'grabbing',
};

// Drop animation:
const dropAnimation = {
  scale: 1,
  boxShadow: '0 0 0 rgba(0,0,0,0)',
  transition: { type: 'spring', stiffness: 300, damping: 20 },
};
```

### 9.5 Undo Animation

```typescript
// Subtle "undoing" feedback:
// 1. Brief flash on the cell that was undone
// 2. Value transitions from old to new (100ms)
// 3. Toast: "Undo: Changed B5 from $1,234 to $5,678"
```

---

## 10. UX QUALITY CHECKLIST

```
EVERY FEATURE MUST PASS:

  ACCESSIBILITY:
    □ Keyboard navigable (Tab, Enter, Escape, Arrow keys)
    □ Screen reader compatible (ARIA labels)
    □ Color contrast 4.5:1 minimum
    □ Focus visible on all interactive elements

  PERFORMANCE:
    □ Page load < 2 seconds
    □ Interaction response < 100ms
    □ No layout shift during loading
    □ Smooth scrolling (60fps)

  RESPONSIVENESS:
    □ Works on 1080p screens
    □ Works on 4K screens
    □ Works on ultrawide screens
    □ Sidebar collapses on narrow screens

  ERROR HANDLING:
    □ Loading state shown while fetching
    □ Error state with actionable message
    □ Empty state with next steps
    □ Offline indicator when disconnected

  CONSISTENCY:
    □ Follows design system (colors, fonts, spacing)
    □ Follows interaction patterns (click, hover, focus)
    □ Follows naming conventions (labels, tooltips)
    □ Follows keyboard shortcuts
```

---

╔══════════════════════════════════════════════════════════════════════════════╗
║  END OF PART 9                                                              ║
║                                                                             ║
║  This part defines HOW FinPlan Pro should FEEL to use.                      ║
║  Every animation, every shortcut, every empty state,                        ║
║  every micro-interaction is specified here.                                  ║
║                                                                             ║
║  The goal: Make Anaplan feel like 2005 software.                            ║
║  Make Excel feel clunky. Make every cloud tool feel slow.                   ║
║  FinPlan Pro should feel like the FUTURE of financial software.             ║
╚══════════════════════════════════════════════════════════════════════════════╝
