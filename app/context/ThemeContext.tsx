import { createContext, ReactNode, useContext, useState } from 'react';

type Scheme = 'light' | 'dark';
type ThemeContextValue = { scheme: Scheme; toggle: () => void };

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** App-controlled theme, not system-driven - the app defaults to (and mostly favors) dark. */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setScheme] = useState<Scheme>('dark');
  const toggle = () => setScheme((s) => (s === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ scheme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
}
