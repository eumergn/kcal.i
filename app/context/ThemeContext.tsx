import { createContext, ReactNode, useContext, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';

import Colors from '@/constants/Colors';

type Scheme = 'light' | 'dark';
type ThemeContextValue = { scheme: Scheme; toggle: () => void; toggleFrom: (x: number, y: number) => void };

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** App-controlled theme, not system-driven - defaults to light, switchable from Profile > Settings. */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setScheme] = useState<Scheme>('light');
  const [reveal, setReveal] = useState<{ x: number; y: number; radius: number; color: string } | null>(null);
  const scale = useRef(new Animated.Value(0)).current;

  const toggle = () => setScheme((s) => (s === 'dark' ? 'light' : 'dark'));

  // Circular reveal: a solid disc of the *next* theme's background grows from the
  // tapped icon until it covers the screen, then the real theme swap happens
  // underneath and the disc disappears - the swap itself is imperceptible since the
  // disc already matches the new background exactly.
  const toggleFrom = (x: number, y: number) => {
    const next: Scheme = scheme === 'dark' ? 'light' : 'dark';
    const { width, height } = Dimensions.get('window');
    const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
    setReveal({ x, y, radius, color: Colors[next].background });
    scale.setValue(0);
    Animated.timing(scale, { toValue: 1, duration: 480, useNativeDriver: true }).start(() => {
      setScheme(next);
      setReveal(null);
    });
  };

  const diameter = reveal ? reveal.radius * 2 : 0;

  return (
    <ThemeContext.Provider value={{ scheme, toggle, toggleFrom }}>
      {children}
      {reveal && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.reveal,
            {
              left: reveal.x - reveal.radius,
              top: reveal.y - reveal.radius,
              width: diameter,
              height: diameter,
              borderRadius: reveal.radius,
              backgroundColor: reveal.color,
              transform: [{ scale }],
            },
          ]}
        />
      )}
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  reveal: { position: 'absolute', zIndex: 9999, elevation: 9999 },
});

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
}
