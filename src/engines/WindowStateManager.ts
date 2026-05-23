// =============================================================================
// WINDOW STATE MANAGER — Remember window size, position, layout between sessions
// Persists window geometry and layout preferences
// Pure TypeScript, deterministic, testable
// =============================================================================

export interface WindowGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  maximized: boolean;
  minimized: boolean;
}

export interface LayoutState {
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  formulaBarVisible: boolean;
  statusBarVisible: boolean;
  propertyPanelVisible: boolean;
  propertyPanelWidth: number;
  activeTab: string;
  activePage: string;
}

export interface WindowState {
  geometry: WindowGeometry;
  layout: LayoutState;
  lastSaved: string;
  version: string;
}

const DEFAULT_GEOMETRY: WindowGeometry = {
  x: 100,
  y: 100,
  width: 1400,
  height: 900,
  maximized: false,
  minimized: false,
};

const DEFAULT_LAYOUT: LayoutState = {
  sidebarWidth: 240,
  sidebarCollapsed: false,
  formulaBarVisible: true,
  statusBarVisible: true,
  propertyPanelVisible: false,
  propertyPanelWidth: 300,
  activeTab: 'home',
  activePage: '/dashboard',
};

const STATE_VERSION = '1.0.0';

export class WindowStateManager {
  private state: WindowState;

  constructor() {
    this.state = this.createDefaultState();
  }

  // --- Geometry ---

  getGeometry(): WindowGeometry {
    return { ...this.state.geometry };
  }

  setGeometry(geometry: Partial<WindowGeometry>): void {
    this.state.geometry = { ...this.state.geometry, ...geometry };
    this.state.lastSaved = new Date().toISOString();
  }

  setPosition(x: number, y: number): void {
    this.state.geometry.x = x;
    this.state.geometry.y = y;
    this.state.lastSaved = new Date().toISOString();
  }

  setSize(width: number, height: number): void {
    this.state.geometry.width = Math.max(width, 800);
    this.state.geometry.height = Math.max(height, 600);
    this.state.lastSaved = new Date().toISOString();
  }

  setMaximized(maximized: boolean): void {
    this.state.geometry.maximized = maximized;
    this.state.lastSaved = new Date().toISOString();
  }

  // --- Layout ---

  getLayout(): LayoutState {
    return { ...this.state.layout };
  }

  setLayout(layout: Partial<LayoutState>): void {
    this.state.layout = { ...this.state.layout, ...layout };
    this.state.lastSaved = new Date().toISOString();
  }

  setSidebarWidth(width: number): void {
    this.state.layout.sidebarWidth = Math.max(150, Math.min(width, 500));
    this.state.lastSaved = new Date().toISOString();
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.state.layout.sidebarCollapsed = collapsed;
    this.state.lastSaved = new Date().toISOString();
  }

  setFormulaBarVisible(visible: boolean): void {
    this.state.layout.formulaBarVisible = visible;
    this.state.lastSaved = new Date().toISOString();
  }

  setStatusBarVisible(visible: boolean): void {
    this.state.layout.statusBarVisible = visible;
    this.state.lastSaved = new Date().toISOString();
  }

  setPropertyPanelVisible(visible: boolean): void {
    this.state.layout.propertyPanelVisible = visible;
    this.state.lastSaved = new Date().toISOString();
  }

  setPropertyPanelWidth(width: number): void {
    this.state.layout.propertyPanelWidth = Math.max(200, Math.min(width, 600));
    this.state.lastSaved = new Date().toISOString();
  }

  setActiveTab(tab: string): void {
    this.state.layout.activeTab = tab;
    this.state.lastSaved = new Date().toISOString();
  }

  setActivePage(page: string): void {
    this.state.layout.activePage = page;
    this.state.lastSaved = new Date().toISOString();
  }

  // --- State ---

  getState(): WindowState {
    return {
      geometry: { ...this.state.geometry },
      layout: { ...this.state.layout },
      lastSaved: this.state.lastSaved,
      version: this.state.version,
    };
  }

  setState(state: Partial<WindowState>): void {
    if (state.geometry) this.state.geometry = { ...this.state.geometry, ...state.geometry };
    if (state.layout) this.state.layout = { ...this.state.layout, ...state.layout };
    this.state.lastSaved = new Date().toISOString();
  }

  reset(): void {
    this.state = this.createDefaultState();
  }

  // --- Serialization ---

  serialize(): string {
    return JSON.stringify(this.state);
  }

  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data) as Partial<WindowState>;
      this.state = {
        geometry: { ...DEFAULT_GEOMETRY, ...(parsed.geometry ?? {}) },
        layout: { ...DEFAULT_LAYOUT, ...(parsed.layout ?? {}) },
        lastSaved: parsed.lastSaved ?? new Date().toISOString(),
        version: parsed.version ?? STATE_VERSION,
      };
    } catch {
      this.state = this.createDefaultState();
    }
  }

  // --- Private ---

  private createDefaultState(): WindowState {
    return {
      geometry: { ...DEFAULT_GEOMETRY },
      layout: { ...DEFAULT_LAYOUT },
      lastSaved: new Date().toISOString(),
      version: STATE_VERSION,
    };
  }
}
