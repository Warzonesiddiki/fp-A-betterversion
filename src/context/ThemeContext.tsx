import { createContext, type ReactNode, useContext, useEffect, useCallback, useState } from 'react';
import { useUIStore } from '../store/uiStore';

type Theme = 'dark' | 'light' | 'system';
type ResolvedTheme = 'dark' | 'light';

interface ThemeContextValue {
  /** Current theme preference: 'dark', 'light', or 'system' (follows OS). */
  theme: Theme;
  /** The actual applied theme after resolving 'system' to OS preference. */
  resolvedTheme: ResolvedTheme;
  /** OS-level color scheme preference. */
  systemPreference: ResolvedTheme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Read system color scheme preference. */
function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Apply the resolved theme class to the document root. */
function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.classList.toggle('light', resolved === 'light');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useUIStore((s) => s.theme) as Theme;
  const setStoreTheme = useUIStore((s) => s.setTheme);
  const [systemPreference, setSystemPreference] = useState<ResolvedTheme>(getSystemPreference);

  // Resolve theme: 'system' resolves to OS preference.
  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? systemPreference : theme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Listen for OS-level color scheme changes.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTheme = useCallback((t: Theme) => setStoreTheme(t as 'dark' | 'light'), [setStoreTheme]);

  const toggleTheme = useCallback(
    () => setStoreTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
    [resolvedTheme, setStoreTheme]
  );

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, systemPreference, toggleTheme, setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
