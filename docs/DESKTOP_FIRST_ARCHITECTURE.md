# FinPlan Pro — Desktop-First Architecture Plan

> **Philosophy**: This is NOT a web app wrapped in Electron. This is a native desktop application that happens to use web technologies for its UI layer. Every decision should favor desktop-native patterns over browser patterns.

---

## Current State Assessment

### What Exists (Good)
- Tauri 2 with SQLite plugin (29 tables, 88+ indexes)
- masterStorage abstraction (IndexedDB web / SQLite desktop)
- File drop enabled in window config
- NSIS + WiX installer targets
- CSP configured for IPC

### What's Missing (Browser-Like)
- No native menu bar (File, Edit, View, Help)
- No system tray integration
- No file associations (.finplan, .xlsx, .csv)
- No native dialogs (uses browser confirm/alert)
- No global keyboard shortcuts
- No auto-update mechanism
- No native notifications
- No multi-window support
- No deep linking (finplan:// protocol)
- No status bar
- No toolbar ribbon
- No print preview
- No find & replace dialog
- No go-to-cell dialog
- No format cells dialog
- No property panel
- Sidebar navigation (browser pattern, not desktop)

---

## Architecture: Desktop-Native Patterns

### 1. Native Menu Bar (Tauri Menu API)

Replace hamburger/sidebar-only navigation with a proper menu bar:

```
File    Edit    View    Data    Analysis    Reports    Window    Help
├─ New          ├─ Undo         ├─ Sidebar      ├─ Import GL     ├─ Scenarios    ├─ Income Stmt  ├─ New Window   ├─ User Guide
├─ Open...      ├─ Redo         ├─ Toolbar      ├─ Import CSV    ├─ Consolidate  ├─ Balance Sheet├─ Close Window ├─ Keyboard Ref
├─ Save         ├─ Cut          ├─ Formula Bar  ├─ Import Excel  ├─ Variance     ├─ Cash Flow    ├─ Cascade      ├─ Release Notes
├─ Save As...   ├─ Copy         ├─ Status Bar   ├─ Export...     ├─ Monte Carlo  ├─ Board Pack   ├─ Tile         ├─ Check Updates
├──────────     ├─ Paste        ├──────────     ├──────────      ├──────────     ├──────────     ├──────────     ├──────────
├─ Properties   ├─ Find...      ├─ Zoom In      ├─ Chart of Accts├─ Goal Seek    ├─ Custom Rpt   ├─ FinPlan Pro  ├─ About
├──────────     ├─ Replace...   ├─ Zoom Out     ├─ GL Explorer   ├─ Sensitivity  │               │               ├─ Diagnostics
├─ Print...     ├─ Go To Cell...├─ Reset Zoom   ├─ Trial Balance │               │               │               │
├─ Print Preview├─ Select All   ├──────────     ├─ Journals      │               │               │               │
├──────────     ├──────────     ├─ Dark Mode    ├──────────      │               │               │               │
├─ Recent Files ├─ Fill Down    ├─ Full Screen  ├─ FX Rates      │               │               │               │
├──────────     ├─ Fill Right   │               ├─ Consolidation │               │               │               │
├─ Exit         │               │               │               │               │               │               │
```

**Implementation**: Use `tauri::menu` API in Rust, emit events to frontend.

### 2. Toolbar Ribbon (Excel-Like)

Replace the current navbar with a contextual ribbon toolbar:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Home] [Insert] [Data] [Formulas] [Review] [View]                          │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [📋 Paste] [✂️ Cut] [📄 Copy] │ [B] [I] [U] │ $ % , .0 │ [↔️ Align]  │ │
│ │ [Undo ↩️] [Redo ↪️]          │ [Font ▾]    │ [Border] │ [Color 🎨]  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ fx [________________________] │ A1 ▾ │ [Name Box]                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Implementation**: React component, toggles visibility per context (grid, report, dashboard).

### 3. Status Bar (Bottom)

Replace floating toasts with a persistent status bar:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Ready │ Sum: $1,234,567 │ Avg: $45,678 │ Count: 27 │ Zoom: 100% │ [🔍]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

Shows: calculation status, selection statistics, zoom level, connection status.

### 4. MDI / Tabbed Interface (Not Sidebar Routes)

Replace route-based navigation with a tabbed document interface:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [📊 Budget FY2026] [📈 Forecast Q1] [📋 P&L Report] [+]                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    (active document content here)                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Each budget, forecast, report, or scenario opens in its own tab. Multiple documents can be open simultaneously.

### 5. Native Dialogs (Tauri Dialog Plugin)

Replace all browser dialogs with native OS dialogs:

| Browser Pattern | Desktop Pattern |
|----------------|-----------------|
| `window.confirm()` | `tauri::dialog::MessageDialogBuilder` |
| `window.alert()` | `tauri::dialog::MessageDialogBuilder` |
| `<input type="file">` | `tauri::dialog::FileDialogBuilder` |
| `window.prompt()` | Custom dialog component |
| Browser print | Native print dialog via `tauri-plugin-printer` |

### 6. File Associations & .finplan Format

Register file types so double-click opens the app:

```
.finplan  → Opens FinPlan Pro with that model
.xlsx     → Opens import wizard
.csv      → Opens import wizard
.finrpt   → Opens report viewer
.fintpl   → Opens template installer
```

**.finplan file format**: ZIP archive containing:
- `model.json` — cube data, dimensions, measures
- `metadata.json` — version, created date, entity info
- `audit.json` — change history
- `attachments/` — linked documents

### 7. System Tray

Minimize to tray with quick actions:

```
┌──────────────────────┐
│ FinPlan Pro          │
│ ─────────────────── │
│ 📊 Open FinPlan Pro  │
│ 📋 Quick Budget      │
│ 📈 Flash Report      │
│ ─────────────────── │
│ ⚙️ Settings          │
│ 🚪 Quit              │
└──────────────────────┘
```

### 8. Global Keyboard Shortcuts

System-wide hotkeys that work even when app is minimized:

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+F` | Quick-find in FinPlan |
| `Ctrl+Shift+B` | Quick budget entry |
| `Ctrl+Shift+R` | Generate flash report |
| `Ctrl+Shift+N` | New notification |

### 9. Native Notifications (OS-Level)

Replace in-app toasts with OS notifications for:
- Budget approval requests
- Period close reminders
- Data import completion
- Error alerts

### 10. Multi-Window Support

Open multiple windows for:
- Main application window
- Report viewer (separate window)
- Formula helper (floating)
- Properties panel (floating)
- Print preview

### 11. Auto-Update (Tauri Updater)

Built-in update mechanism:
- Check for updates on startup
- Download in background
- Prompt user to restart
- Delta updates (only changed files)

### 12. Deep Linking

Register `finplan://` protocol:
- `finplan://open?file=path` — Open a model
- `finplan://entity/ACME` — Navigate to entity
- `finplan://budget/FY2026` — Open budget
- `finplan://report/pl-q1` — Generate report

---

## Data Layer: Native SQLite (Not IndexedDB)

### Current: Dual Storage (IndexedDB + SQLite)
The `masterStorage` abstracts both, but IndexedDB is a browser limitation.

### Target: SQLite-Only (Desktop-Native)

**Remove IndexedDB dependency entirely for desktop builds.** SQLite provides:
- No storage limits (IndexedDB: ~50MB-500MB depending on browser)
- Full SQL queries (JOIN, GROUP BY, window functions)
- Transactions with ACID guarantees
- Better performance for large datasets
- Direct file access (backup by copying .db file)
- Encryption via SQLCipher

**Migration path**: SQLite schema already has 29 tables. Expand to cover all engine data.

### New SQLite Tables Needed

```sql
-- 13. Formula Cache
CREATE TABLE IF NOT EXISTS formula_cache (
    cell_key TEXT PRIMARY KEY,
    formula TEXT NOT NULL,
    result TEXT NOT NULL,
    dependencies TEXT,          -- JSON array of dependent cell keys
    computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_dirty INTEGER DEFAULT 0
);

-- 14. Driver Cascade Rules
CREATE TABLE IF NOT EXISTS driver_cascade_rules (
    id TEXT PRIMARY KEY,
    driver_id TEXT NOT NULL,
    target_account_id TEXT NOT NULL,
    cascade_type TEXT NOT NULL,
    impact_type TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    formula TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. Allocation Rules
CREATE TABLE IF NOT EXISTS allocation_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('direct', 'driver', 'step_down', 'reciprocal')),
    source_account_ids TEXT NOT NULL,   -- JSON array
    driver_id TEXT,
    target_account_ids TEXT NOT NULL,   -- JSON array
    weights TEXT,                        -- JSON map
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. Version Control (Git-like)
CREATE TABLE IF NOT EXISTS vc_branches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_branch_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vc_commits (
    id TEXT PRIMARY KEY,
    branch_id TEXT NOT NULL,
    message TEXT NOT NULL,
    snapshot_id TEXT,
    parent_commit_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES vc_branches(id)
);

-- 17. Period Close Tasks
CREATE TABLE IF NOT EXISTS period_close_tasks (
    id TEXT PRIMARY KEY,
    period_id TEXT NOT NULL,
    task_name TEXT NOT NULL,
    assigned_to TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    depends_on TEXT,            -- JSON array of task IDs
    due_date DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 18. Print Templates
CREATE TABLE IF NOT EXISTS print_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    template_type TEXT NOT NULL,
    config TEXT NOT NULL,       -- JSON layout config
    is_system INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Rendering: Desktop-Optimized

### Grid Rendering Strategy

| Approach | Pros | Cons | Use Case |
|----------|------|------|----------|
| **AG Grid (current)** | Feature-rich, accessible | DOM-heavy, 1.1MB | Budget grids, data tables |
| **Canvas grid** | 100K+ rows, fast | No accessibility, complex | Large datasets (future) |
| **Virtual DOM + AG Grid** | Best balance | Current approach | Primary grid |

**Decision**: Keep AG Grid for now, but optimize with virtual scrolling and lazy loading. Canvas grid is a future optimization for 1M+ cell models.

### Chart Rendering

| Approach | Pros | Cons | Use Case |
|----------|------|------|----------|
| **Recharts (current)** | React-native, declarative | SVG-heavy, 420KB | Dashboards, reports |
| **Canvas charts** | Fast for large data | Custom code needed | Future optimization |
| **WebGL charts** | GPU-accelerated | Complex, overkill | Not needed yet |

**Decision**: Keep Recharts. Optimize with code splitting and lazy loading.

### PDF Generation

| Approach | Pros | Cons | Use Case |
|----------|------|------|----------|
| **jsPDF (current)** | Client-side, no server | Limited formatting | Basic exports |
| **Tauri + wkhtmltopdf** | Native quality, fast | Requires native binary | Desktop builds |
| **Tauri + headless Chrome** | Pixel-perfect | Heavy (150MB+) | Not ideal |

**Decision**: Use jsPDF for web, add Tauri-native PDF generation for desktop using `tauri-plugin-shell` to call `wkhtmltopdf` or similar.

---

## UX Patterns: Desktop-Native

### Keyboard-First Design

Every action must be accessible via keyboard. Desktop users expect:

| Category | Standard | FinPlan Target |
|----------|----------|----------------|
| Navigation | Arrow keys, Tab, Enter | Full grid navigation |
| Editing | F2, Escape, Delete | Cell editing |
| Formatting | Ctrl+B/I/U | Text formatting |
| Clipboard | Ctrl+C/V/X | Copy/paste with formulas |
| Find | Ctrl+F, Ctrl+H | Find & replace |
| Go To | Ctrl+G | Go to cell |
| Print | Ctrl+P | Print preview |
| Save | Ctrl+S | Save model |
| Undo | Ctrl+Z/Y | Undo/redo |
| Sheets | Ctrl+Page Up/Down | Tab navigation |

### Dialog Patterns (Not Modals)

| Browser Pattern | Desktop Pattern |
|----------------|-----------------|
| Full-screen modal | Floating dialog (resizable, movable) |
| Confirmation popup | Native OS message box |
| Form in modal | Properties panel (side panel) |
| Toast notification | Status bar + OS notification |
| Loading spinner | Progress bar in status bar |

### Property Panel (Right Side)

Instead of modals for editing properties:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    (main content)                            │
│                                                              │
├──────────────────────────────────────┬───────────────────────┤
│                                      │ Properties            │
│                                      │ ─────────────         │
│                                      │ Name: [Budget FY2026] │
│                                      │ Status: [Draft ▾]     │
│                                      │ Currency: [USD ▾]     │
│                                      │ Year: [2026]          │
│                                      │ ─────────────         │
│                                      │ [Apply] [Cancel]      │
└──────────────────────────────────────┴───────────────────────┘
```

---

## Implementation Phases

### Phase 1: Native Menu Bar + Status Bar
- Add Tauri menu (File, Edit, View, Data, Analysis, Reports, Window, Help)
- Add status bar component (bottom of screen)
- Wire menu events to frontend actions

### Phase 2: Toolbar Ribbon
- Contextual toolbar (Home, Insert, Data, Formulas, Review, View)
- Formula bar with cell reference + autocomplete
- Format controls (bold, italic, currency, percentage)

### Phase 3: Tabbed Document Interface
- Replace route-based navigation with tabs
- Each budget/forecast/report opens in a tab
- Tab persistence (remember open tabs)

### Phase 4: Native Dialogs + File Associations
- Replace all browser dialogs with Tauri native
- Register .finplan, .xlsx, .csv file types
- Implement .finplan file format (ZIP archive)

### Phase 5: System Tray + Global Shortcuts
- Minimize to tray
- Quick actions menu
- System-wide keyboard shortcuts

### Phase 6: Auto-Update + Deep Linking
- Tauri updater integration
- finplan:// protocol registration
- Update notification UI

### Phase 7: Multi-Window + Print Preview
- Report viewer in separate window
- Properties panel as floating window
- Native print preview

### Phase 8: Native Notifications + Crash Reporting
- OS-level notifications
- Crash report collection
- Performance monitoring

---

## Key Files to Modify

| File | Change |
|------|--------|
| `src-tauri/src/lib.rs` | Add menu, tray, global shortcuts, updater |
| `src-tauri/tauri.conf.json` | Add updater, tray, protocol config |
| `src-tauri/Cargo.toml` | Add tauri-plugin-updater, tauri-plugin-notification |
| `src/components/layout/AppLayout.tsx` | Add status bar, tab bar, toolbar ribbon |
| `src/components/layout/Sidebar.tsx` | Reduce to optional panel (not primary nav) |
| `src/components/layout/Navbar.tsx` | Replace with toolbar ribbon |
| `src/store/uiStore.ts` | Add tab state, panel state, toolbar state |
| `src/utils/masterStorage.ts` | SQLite-only for desktop (remove IndexedDB) |
| `src/utils/tauriSqlStorage.ts` | Expand with all new tables |

---

## Competitive Advantage

| Feature | Anaplan | Pigment | Vena | FinPlan Pro |
|---------|---------|---------|------|-------------|
| Native desktop app | ❌ | ❌ | ❌ | ✅ |
| Offline-first | ❌ | ❌ | ❌ | ✅ |
| File associations | ❌ | ❌ | ❌ | ✅ |
| System tray | ❌ | ❌ | ❌ | ✅ |
| Global shortcuts | ❌ | ❌ | ❌ | ✅ |
| Auto-update | ❌ | ❌ | ❌ | ✅ |
| Native menus | ❌ | ❌ | ❌ | ✅ |
| .finplan format | ❌ | ❌ | ❌ | ✅ |
| SQLite storage | ❌ | ❌ | ❌ | ✅ |
| No browser dependency | ❌ | ❌ | ❌ | ✅ |
| Price | $600K+/yr | $120K+/yr | $180K+/yr | **FREE** |
