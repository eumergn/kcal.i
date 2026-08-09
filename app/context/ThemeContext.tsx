import { createContext, ReactNode, useContext, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import Colors from '@/constants/Colors';

type Scheme = 'light' | 'dark';
type ThemeContextValue = { scheme: Scheme; toggle: () => void };

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** App-controlled theme, not system-driven - defaults to light, switchable from Profile > Settings. */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setScheme] = useState<Scheme>('light');
  const [fadeColor, setFadeColor] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // A plain full-screen cross-fade instead of a tap-position reveal - the toggle now
  // lives in a Settings row, not a header icon, so an effect anchored to "where you
  // tapped" no longer makes sense. The old theme's background fades out over the new
  // one, which is swapped in immediately underneath.
  const toggle = () => {
    const next: Scheme = scheme === 'dark' ? 'light' : 'dark';
    setFadeColor(Colors[scheme].background);
    setScheme(next);
    fadeAnim.setValue(1);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 350,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => setFadeColor(null));
  };

  return (
    <ThemeContext.Provider value={{ scheme, toggle }}>
      {children}
      {fadeColor && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.fade, { backgroundColor: fadeColor, opacity: fadeAnim }]}
        />
      )}
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  fade: { zIndex: 9999, elevation: 9999 },
});

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
}
