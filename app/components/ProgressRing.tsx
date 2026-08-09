import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View as RNView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** The shared instrument of this app's design language: an animated ring, not a bar. */
export function ProgressRing({
  size,
  strokeWidth,
  progress,
  color,
  track,
  children,
}: {
  size: number;
  strokeWidth: number;
  progress: number;
  color: string;
  track: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const anim = useRef(new Animated.Value(Math.min(progress, 1))).current;
  // Grows slightly past 100% instead of just capping the fill - a visible "you went
  // over" cue for calories/macros/water/budget alike, since they all share this ring.
  const overshoot = progress > 1;
  const scaleAnim = useRef(new Animated.Value(overshoot ? 1.08 : 1)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: Math.min(progress, 1), duration: 500, easing: EASE_OUT, useNativeDriver: false }).start();
  }, [progress, anim]);

  useEffect(() => {
    Animated.timing(scaleAnim, { toValue: overshoot ? 1.08 : 1, duration: 320, easing: EASE_OUT, useNativeDriver: true }).start();
  }, [overshoot, scaleAnim]);

  const strokeDashoffset = anim.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ scale: scaleAnim }] }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <RNView style={StyleSheet.absoluteFillObject}>
        <RNView style={styles.center}>{children}</RNView>
      </RNView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
