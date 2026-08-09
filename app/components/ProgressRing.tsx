import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View as RNView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const MAX_OVERSHOOT = 0.6; // graduated widening caps out once you're ~160% of target

/** The shared instrument of this app's design language: an animated ring, not a bar.
 * Past 100%, the ring keeps reacting instead of just sitting there capped: the stroke
 * gets progressively thicker and the ring scales up slightly, both scaling with *how
 * far* over target you are (not a single fixed jump at the 100% line), so 110% and
 * 150% visibly read as different amounts of overshoot, not identically "full". */
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

  const overshoot = Math.min(Math.max(0, progress - 1), MAX_OVERSHOOT);
  const widenedStrokeWidth = strokeWidth * (1 + overshoot * 0.8); // up to +48% thicker
  const scaleTarget = 1 + overshoot * 0.13; // up to +7.8% bigger

  const strokeWidthAnim = useRef(new Animated.Value(widenedStrokeWidth)).current;
  const scaleAnim = useRef(new Animated.Value(scaleTarget)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: Math.min(progress, 1), duration: 500, easing: EASE_OUT, useNativeDriver: false }).start();
  }, [progress, anim]);

  useEffect(() => {
    Animated.timing(strokeWidthAnim, { toValue: widenedStrokeWidth, duration: 350, easing: EASE_OUT, useNativeDriver: false }).start();
    Animated.timing(scaleAnim, { toValue: scaleTarget, duration: 350, easing: EASE_OUT, useNativeDriver: true }).start();
  }, [widenedStrokeWidth, scaleTarget, strokeWidthAnim, scaleAnim]);

  const strokeDashoffset = anim.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ scale: scaleAnim }] }}>
      <Svg width={size} height={size}>
        <AnimatedCircle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={strokeWidthAnim} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidthAnim}
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
