import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** One authored entrance moment: content rises and fades in on open, instead of a static snap-in. */
export function Entrance({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 420, delay, easing: EASE_OUT, useNativeDriver: true }).start();
  }, [progress, delay]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}
