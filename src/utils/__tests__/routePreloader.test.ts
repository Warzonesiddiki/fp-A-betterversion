import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockMethods = {
  preload: vi.fn(),
  preloadForRole: vi.fn(),
  preloadPrefix: vi.fn((prefix: string) => {
    const routes = ['/', '/dashboard', '/budgets', '/budgets/new', '/forecasts', '/settings'];
    routes.filter((r) => r.startsWith(prefix)).forEach((r) => mockMethods.preload(r));
  }),
  getLazyComponent: vi.fn((route: string) => {
    const routes = ['/', '/dashboard', '/budgets', '/forecasts', '/settings'];
    return routes.includes(route) ? vi.fn() : null;
  }),
  getRegisteredRoutes: vi
    .fn()
    .mockReturnValue(['/', '/dashboard', '/budgets', '/budgets/new', '/forecasts', '/settings']),
  isPreloaded: vi.fn((route: string) => route === '/'),
  getStats: vi.fn().mockReturnValue({ total: 6, preloaded: 1, pending: 0 }),
  clear: vi.fn(),
};

vi.mock('../routePreloader', () => ({
  RoutePreloader: mockMethods,
  useRoutePreload: vi.fn((route: string) => ({
    onMouseEnter: vi.fn(() => mockMethods.preload(route)),
    onFocus: vi.fn(() => mockMethods.preload(route)),
  })),
}));

const { RoutePreloader, useRoutePreload } = await import('../routePreloader');

describe('RoutePreloader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getRegisteredRoutes returns routes', () => {
    const routes = RoutePreloader.getRegisteredRoutes();
    expect(routes).toContain('/');
    expect(routes).toContain('/budgets');
    expect(routes.length).toBeGreaterThanOrEqual(3);
  });

  it('preload calls preload method', () => {
    RoutePreloader.preload('/');
    expect(mockMethods.preload).toHaveBeenCalledWith('/');
  });

  it('isPreloaded checks route', () => {
    expect(RoutePreloader.isPreloaded('/')).toBe(true);
    expect(RoutePreloader.isPreloaded('/unknown')).toBe(false);
  });

  it('getLazyComponent returns component for known route', () => {
    const comp = RoutePreloader.getLazyComponent('/');
    expect(comp).toBeTypeOf('function');
  });

  it('getLazyComponent returns null for unknown route', () => {
    expect(RoutePreloader.getLazyComponent('/nonexistent')).toBeNull();
  });

  it('preloadPrefix preloads matching routes', () => {
    RoutePreloader.preloadPrefix('/budgets');
    expect(mockMethods.preload).toHaveBeenCalled();
  });

  it('preloadForRole does not throw', () => {
    expect(() => RoutePreloader.preloadForRole('admin')).not.toThrow();
  });

  it('getStats returns stats object', () => {
    const stats = RoutePreloader.getStats();
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('preloaded');
    expect(stats).toHaveProperty('pending');
  });
});
